# Membership Translations — Implementation Plan

Goal: Add multilingual support for memberships (name, description, labels where needed) and wire it end-to-end: database, stored procedures/views, backend endpoints, admin UI, public API, and frontend consumers (booking/services) with graceful fallback.

This document lists the concrete files to change, migration SQL, query examples, API contract changes, frontend updates, admin UI changes, tests, and rollout plan.

## Summary of changes (high level)
- Database: add `memberships_translations` table and optional localized view(s). Update indices and FK.
- Backend: update public and client membership endpoints to accept `lang` param and return localized fields (fallback to default language). Update stored procedures/views that reference membership names if needed.
- Admin: add translations CRUD in `AdminMemberships` UI and backend endpoints to manage translations.
- Frontend: adjust `publicAPI.getMemberships` to request `lang` param (already present), map API response to UI shapes, update Booking and Services pages to use localized `nom` and `description` fields. Add admin translation editor UI.
- Tests: add unit/integration tests for localized membership listing and admin translation management.

---

## 1) Database changes

Add a translations table to hold per-language strings for memberships.

Suggested schema (MySQL):

- Table name: `membership_translations` (or `memberships_translations` to match plural naming)
- Columns:
  - `id` INT AUTO_INCREMENT PRIMARY KEY
  - `membership_id` INT NOT NULL -- FK to `memberships(id)`
  - `lang` VARCHAR(8) NOT NULL -- e.g., 'fr', 'en', 'ar'
  - `nom` VARCHAR(255) NULL
  - `description` TEXT NULL
  - `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

Constraints:
- UNIQUE INDEX on (`membership_id`, `lang`) to avoid duplicates.
- FK `membership_id` -> `memberships(id)` ON DELETE CASCADE.

Example SQL (migration):

```sql
ALTER TABLE `memberships` ENGINE=InnoDB; -- ensure engine

CREATE TABLE IF NOT EXISTS `memberships_translations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `membership_id` INT NOT NULL,
  `lang` VARCHAR(8) NOT NULL,
  `nom` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_membership_lang` (`membership_id`,`lang`),
  CONSTRAINT `fk_membership_translations_membership` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

Data migration: when you seed translations, copy `memberships.nom` and `memberships.description` into the default language (e.g., 'fr') rows to ensure no empty fallback.

Alternative approach: Add JSON column `translations` in `memberships` (less normalized). I recommend normalized `memberships_translations` for manageability.

### Views (optional)
Create a view `v_memberships_localized` or a stored procedure to fetch localized membership rows with fallback logic (preferred in backend queries):

Example logic (SQL snippet using LEFT JOIN and COALESCE fallback):

```sql
SELECT
  m.id,
  COALESCE(mt_lang.nom, mt_default.nom, m.nom) AS nom,
  COALESCE(mt_lang.description, mt_default.description, m.description) AS description,
  m.prix_mensuel,
  m.prix_3_mois,
  m.services_par_mois,
  m.actif
FROM memberships m
LEFT JOIN memberships_translations mt_lang ON mt_lang.membership_id = m.id AND mt_lang.lang = ?
LEFT JOIN memberships_translations mt_default ON mt_default.membership_id = m.id AND mt_default.lang = 'fr'
WHERE m.actif = 1
```

Pass the requested `lang` as the parameter; fallback order: requested language -> default language ('fr') -> base table values.

Add an index on (`membership_id`, `lang`) to speed lookups.

---

## 2) Backend changes

Files to update (concrete paths in repo):
- `backend/src/routes/publicServices.js` (public memberships endpoint)
- `backend/src/routes/clientMemberships.js` (client-facing membership endpoints)
- `backend/src/routes/adminClientMemberships.js` (admin endpoints that return membership names)
- `backend/src/models/*` or helper DB query files if present (centralize the membership fetch there)
- Stored procedures under `zenshe_db_flow/*` if they rely on membership names

### Public endpoint (`/api/public/services/memberships/list`)
- Currently this route selects `id, nom, description, prix_mensuel, prix_3_mois, services_par_mois, actif` and accepts `lang` param.
- Update the query to LEFT JOIN `memberships_translations` (as shown above) and select localized `nom` and `description`.
- Keep returning the same JSON structure but with localized fields.

Example change in `publicServices.js`:
- Replace raw `SELECT ... FROM memberships` with the multi-join query (use the `executeQuery` helper and pass `lang`).
- Log when a translation fallback is used for easier debugging.

### Client endpoints
- `GET /api/client/memberships/available` (client API) should also support `lang` and return localized strings for purchases (client may be authenticated). Update the route to use the same localized query.
- `GET /api/client/memberships/active` returns the client's active membership — if the API returns membership metadata include localized `membership_nom` where previously the code used `m.nom`.
- Ensure admin activation endpoints that return `membership_nom` use the localized field for the admin's UI (admin likely uses default language; optional to include translations per-admin language settings).

### Admin endpoints
- `AdminMemberships` UI needs routes to manage translations (CRUD):
  - `GET /api/admin/memberships/:id/translations` — list translations for a membership
  - `POST /api/admin/memberships/:id/translations` — add/update a translation (body: lang, nom, description)
  - `DELETE /api/admin/memberships/:id/translations/:lang` — delete translation for language

Implement these routes in `backend/src/routes/adminMemberships.js` or extend `adminClientMemberships.js`.

### Stored procedures / views
- If you have SPs or views that join on memberships and return `nom`, update them to return localized names or add corresponding localized variants.
- Create a helper stored procedure `sp_get_membership_localized(p_id INT, p_lang VARCHAR(8))` that returns the membership row with localized strings and fallback. Use it where needed.

---

## 3) Frontend changes

Files to update (concrete paths):
- `frontend/src/services/api.js` — public and client API methods already accept a `lang` param for public endpoints. Ensure the client API methods pass current language when calling client endpoints that return localized content.
- `frontend/src/pages/client/BookingPage.jsx` — use `membership.nom` and `membership.description` (localized) when rendering.
- `frontend/src/pages/client/ServicesPage.jsx` — if services page lists memberships, ensure it uses localized fields.
- `frontend/src/pages/admin/AdminMemberships.jsx` — add UI to manage translations (form to add/edit `nom` and `description` per language).
- `frontend/src/contexts/MembershipContext.jsx` — when fetching active membership, map membership naming to localized fields if backend returns them.
- `frontend/src/i18n` (if you keep translation keys for static labels related to membership) — add keys for membership UI strings if not present.

### API usage and language parameter
- `publicAPI.getMemberships()` already uses `lang` query param in `api.js` (good). Ensure that any call to the client or admin endpoints that should return localized fields also passes the current language. For example:

```js
// in frontend/services/api.js
getMemberships: () => {
  const lang = getCurrentLanguage();
  return axios.get('/api/public/services/memberships/list', { params: { lang } });
}

// For client-authenticated membership list (if any)
getAvailableMembershipsForPurchase: () => {
  const lang = getCurrentLanguage();
  return axios.get('/api/client/memberships/available', { params: { lang } });
}
```

### Booking & Services UI
- When rendering membership option labels or details, prefer `membership.nom` and `membership.description` as returned by the API.
- If the frontend previously used `membership.nom` for French, that will now be localized.
- Ensure that form values for scheduling/purchasing still submit `membership_id` (numeric ID) — server will map to localized display only.

---

## 4) Admin UI for translations

Add a translations tab/section to `AdminMemberships.jsx` where admins can:
- View existing translations (lang, nom, description)
- Add/edit a translation (select language and provide localized strings)
- Delete a translation

Backend endpoints (repeated):
- `GET /api/admin/memberships/:id/translations`
- `POST /api/admin/memberships/:id/translations` { lang, nom, description }
- `PUT /api/admin/memberships/:id/translations/:lang` { nom, description }
- `DELETE /api/admin/memberships/:id/translations/:lang`

UI details:
- Use the same language code list used elsewhere in the app (i18n config). Validate language codes client-side.
- Mark the default language (e.g., 'fr') and prevent deletion of the default translation unless admin confirms.

---

## 5) i18n and locale files

- Localized membership content will come from DB, not the static i18n JSON files. Keep static labels (UI text) in `frontend/src/locales/*/translation.json`.
- Update docs or admin guides to explain that membership values must be localized via admin UI.

---

## 6) Tests

Add tests in both backend and frontend:
- Backend (jest/mocha):
  - Unit: `publicServices` memberships list returns localized `nom` when `lang` param provided.
  - Integration: seed `memberships_translations` with two languages, call endpoint with `lang=en` and `lang=ar` and check results.
  - Admin endpoints: CRUD translations operations.
- Frontend (Jest + React Testing Library):
  - BookingPage: when `publicAPI.getMemberships()` returns localized names, the dropdown shows them.
  - AdminMemberships: translation editor shows saved translations after save.

Add a small migration test: run migration SQL in a test database and assert constraints.

---

## 7) Migration plan & rollout
1. Add `memberships_translations` table (migration script) and index/constraints.
2. Seed translations for default language (FR) by copying `memberships.nom` and `memberships.description` into `memberships_translations` where `lang = 'fr'`.
3. Deploy backend changes that read translations: these must be backward compatible — if translations table empty, code MUST fallback to base `memberships` table values.
4. Deploy frontend changes (can be done concurrently as long as backend maintains old shape for a short time). Prefer feature-flagging if needed.
5. Add admin translation UI and allow content team to add translations.
6. Run tests and manual QA per test plan.

Note: ensure your CIs and staging environments have the new migration applied before the admin UI is used.

---

## 8) Backwards compatibility & safety
- Always implement fallback logic: requested language -> default language -> base table.
- Keep existing API response shape (field names) so frontend code does not break. Only the strings should be localized.
- If adding a new field name (e.g., `membership_nom_localized`), keep `nom` for compatibility and add the new field optionally.

---

## 9) Concrete repo file checklist (what to edit)
- DB migrations: `zenshe_db_flow/update_XX_add_membership_translations.sql` (create table and seed default language)
- Backend:
  - `backend/src/routes/publicServices.js` — update memberships list query
  - `backend/src/routes/clientMemberships.js` — ensure available/active endpoints accept `lang`
  - `backend/src/routes/adminClientMemberships.js` or `backend/src/routes/adminMemberships.js` — admin translation CRUD endpoints
  - `backend/config/database.js` or DB helper modules — add helper to fetch localized membership rows (DRY)
  - Stored procedures in `zenshe_db_flow` as needed (e.g., `sp_get_membership_localized`)
- Frontend:
  - `frontend/src/services/api.js` — ensure `lang` param is passed for client APIs that should be localized
  - `frontend/src/pages/client/BookingPage.jsx` — use localized `nom` and `description`
  - `frontend/src/pages/client/ServicesPage.jsx` — same
  - `frontend/src/pages/admin/AdminMemberships.jsx` — add translation management UI and call admin endpoints
  - `frontend/src/contexts/MembershipContext.jsx` — ensure it maps localized fields to `activeMembership`
- Tests:
  - `backend/tests/*` and `frontend/tests/*` add coverage for localization
- Docs:
  - Add this file `MEMBERSHIP_TRANSLATIONS_PLAN.md` (this file)
  - Update `IMPLEMENTATION_SUMMARY.md` or `README-LOCAL-SETUP.md` with migration instructions

---

## 10) Example backend query function (pseudocode)

```js
// In a DB helper file
async function getPublicMemberships(lang = 'fr') {
  const sql = `
    SELECT m.id,
           COALESCE(mt_lang.nom, mt_default.nom, m.nom) AS nom,
           COALESCE(mt_lang.description, mt_default.description, m.description) AS description,
           m.prix_mensuel,
           m.prix_3_mois,
           m.services_par_mois,
           m.actif
    FROM memberships m
    LEFT JOIN memberships_translations mt_lang ON mt_lang.membership_id = m.id AND mt_lang.lang = ?
    LEFT JOIN memberships_translations mt_default ON mt_default.membership_id = m.id AND mt_default.lang = 'fr'
    WHERE m.actif = 1
    ORDER BY m.prix_mensuel ASC
  `;
  return await executeQuery(sql, [lang]);
}
```

---

## 11) Time estimate & risks
- DB migration and basic backend query changes: 1–2 days
- Admin UI to manage translations: 1–2 days (depends on UX complexity)
- Frontend wiring and QA: 1 day
- Tests + staging deploy: 1 day

Risks:
- Missing translations leading to poor UX — mitigate by seeding default language and adding admin warnings.
- Stored procedures or other backend code depending on `m.nom` might need more updates — search project for `membership_nom` or direct references.

---

## 12) Next steps I can take (pick one)
- A. Implement the DB migration SQL file (`zenshe_db_flow/update_XX_membership_translations.sql`) and create a `sp_get_membership_localized` helper.
- B. Implement backend public and client endpoints to return localized fields (I will update `publicServices.js` and `clientMemberships.js`).
- C. Add admin translation CRUD routes and a minimal admin UI in `AdminMemberships.jsx`.
- D. Implement frontend changes in `BookingPage.jsx` and `ServicesPage.jsx` to consume localized fields and update the `api.js` client methods to pass `lang`.

Tell me which step (A/B/C/D) you want me to implement now and I will proceed and run quick local checks where possible.