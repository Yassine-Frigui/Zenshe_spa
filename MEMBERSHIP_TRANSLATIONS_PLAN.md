# Membership Translations — Implementation Plan (updated to match DB dump)

Goal: Enable multilingual membership content (name, description, advantages/avantages) end-to-end. This document was updated to reflect the actual database schema found in the repository SQL dump: the project already contains a `memberships_translations` table with `language_code`, `nom`, `description` and `avantages` columns and seeded data for `fr`, `en`, `ar`.

IMPORTANT: no DB changes in this plan

You explicitly requested that we do not perform database schema changes, and you do not want views or stored procedures added to the database. The plan below follows that constraint: we will NOT create new tables, views, or stored procedures. Instead the backend will perform runtime LEFT JOIN + COALESCE queries against the existing `memberships_translations` table to provide localized fields with fallback. Any backfill/maintenance of the translations table will be handled manually outside this implementation (content team or DB scripts run separately) and is not part of these tasks.

## Summary of changes (high level)
- Database: add `memberships_translations` table and optional localized view(s). Update indices and FK.
- Backend: update public and client membership endpoints to accept `lang` param and return localized fields (fallback to default language). Update stored procedures/views that reference membership names if needed.
- Admin: add translations CRUD in `AdminMemberships` UI and backend endpoints to manage translations.
- Frontend: adjust `publicAPI.getMemberships` to request `lang` param (already present), map API response to UI shapes, update Booking and Services pages to use localized `nom` and `description` fields. Add admin translation editor UI.
- Tests: add unit/integration tests for localized membership listing and admin translation management.

---


## 1) Database status (no DB changes planned)

Current state (from the SQL dump):
- Table `memberships` exists with columns: `id`, `nom`, `prix_mensuel`, `prix_3_mois`, `services_par_mois`, `description`, `avantages`, `actif`, `date_creation`.
- Table `memberships_translations` already exists. Columns are: `id`, `membership_id`, `language_code`, `nom`, `description`, `avantages`, `date_creation`, `date_modification`.
- A UNIQUE index on `(membership_id, language_code)` and FK -> `memberships(id)` are already present.
- Seed data for `fr`, `en`, and `ar` is already present for the current memberships.

Because you requested no DB schema changes and no views or stored procedures, we will not create any database objects. Instead, the backend will use in-query LEFT JOINs to read localized strings from the existing `memberships_translations` table and fall back to `fr` or the base `memberships` fields when needed. Any manual backfill or additional language seeding is out-of-scope for this work and should be performed by DB/content operators independently.

Example backend SQL pattern (runtime JOIN in code — no view/proc creation):

```sql
SELECT m.id,
       COALESCE(mt_lang.nom, mt_default.nom, m.nom) AS nom,
       COALESCE(mt_lang.description, mt_default.description, m.description) AS description,
       COALESCE(mt_lang.avantages, mt_default.avantages, m.avantages) AS avantages,
       m.prix_mensuel,
       m.prix_3_mois,
       m.services_par_mois,
       m.actif
FROM memberships m
LEFT JOIN memberships_translations mt_lang ON mt_lang.membership_id = m.id AND mt_lang.language_code = ?
LEFT JOIN memberships_translations mt_default ON mt_default.membership_id = m.id AND mt_default.language_code = 'fr'
WHERE m.actif = 1
```

Use this JOIN pattern in queries inside backend route handlers or DB helper functions. This preserves your requirement to avoid new DB objects while enabling localized output via existing tables.

---



## 2) Backend changes (no DB objects)

Key backend work (all code-only):
- Use the runtime LEFT JOIN + COALESCE pattern (example above) in route handlers or DB helpers. Do NOT create stored procedures or views — keep queries in the app code.
- Ensure client endpoints that return membership metadata (active/pending) include localized `membership_nom`, `description`, and `avantages` when `lang` is provided by the request.

Files to update (concrete paths in repo):
- `backend/src/routes/publicServices.js` — implement a LEFT JOIN query that uses `language_code = ?` and fallback to `fr` / base values; return the same JSON shape.
- `backend/src/routes/clientMemberships.js` — ensure `GET available` and `GET active` accept `lang` and return localized fields.
- `backend/src/routes/adminClientMemberships.js` or `backend/src/routes/adminMemberships.js` — implement admin CRUD for `memberships_translations` (INSERT/UPDATE/DELETE) but do not create DB objects beyond that.

API contract notes:
- `GET /api/public/services/memberships/list?lang=en` returns the same structure but localized strings in `nom`, `description`, `avantages` if available.

Implementation detail: keep field names unchanged (`nom`, `description`, `avantages`) to minimize frontend changes. The API must accept `lang` and pass it to app-level SQL queries.

---


## 3) Frontend changes (minimal because DB already contains translations)

Primary frontend tasks:
- Ensure `frontend/src/services/api.js` continues to pass `lang` to public calls. For client-authenticated endpoints (e.g., `/api/client/memberships/available`, `/api/client/memberships/active`) also pass current language.
- Use localized fields returned by the API without renaming: `nom`, `description`, `avantages`.
- Update `frontend/src/pages/client/BookingPage.jsx`, `frontend/src/pages/client/ServicesPage.jsx` to render the `nom` and `description` fields returned by the backend.
- Add translation editor UI in `frontend/src/pages/admin/AdminMemberships.jsx` to call the admin CRUD endpoints.

Example API usage (already present in the repo but ensure `lang` is forwarded):

```js
// in frontend/services/api.js
const lang = getCurrentLanguage();
return axios.get('/api/public/services/memberships/list', { params: { lang } });
```

Because the DB table is already structured and seeded, most frontend work is wiring and small tweaks — not a large migration.

---


## 4) Admin UI for translations

Admin features to add:
- A small translations panel inside `AdminMemberships.jsx` showing existing rows from `memberships_translations` where `membership_id = :id`.
- CRUD endpoints (see checklist) that accept `language_code` and fields `nom`, `description`, `avantages`.

API endpoints (recommended names and shapes):
- `GET /api/admin/memberships/:id/translations` -> [{ language_code, nom, description, avantages, date_modification }]
- `POST /api/admin/memberships/:id/translations` -> body { language_code, nom, description, avantages }
- `PUT /api/admin/memberships/:id/translations/:language_code` -> body { nom, description, avantages }
- `DELETE /api/admin/memberships/:id/translations/:language_code`

UX notes:
- Use the project's i18n language list (fr,en,ar). Mark `fr` as default and show a clear confirmation before deleting the default translation.

---

## 5) i18n and locale files

- Localized membership content will come from DB, not the static i18n JSON files. Keep static labels (UI text) in `frontend/src/locales/*/translation.json`.
- Update docs or admin guides to explain that membership values must be localized via admin UI.

---


## 6) Tests

Backend tests (jest):
- Unit: verify that localized fetch (proc or SQL helper) returns `nom`, `description`, `avantages` for `lang=en` and falls back to `fr`/base if missing.
- Integration: run the stored-proc against a test DB (seeded from the dump) and assert correct fallback behavior.

Frontend tests (RTL/Jest):
- BookingPage renders localized `nom` when backend returns translation.
- AdminMemberships: translation editor calls CRUD endpoints and displays results.

Migration/backfill tests:
- A script that inserts missing `fr` rows (if any) should be tested by asserting the number of memberships with a `fr` translation equals the number of memberships after backfill.

---

## 7) Migration plan & rollout

1. Add stored procedure / view `sp_get_membership_localized` or `v_memberships_localized` that returns localized membership rows with fallback.
2. Run a small backfill script that ensures every membership has at least a `fr` row in `memberships_translations` (copy base `memberships` values when missing).
3. Deploy backend changes that call the proc or view and accept `lang` param; maintain backward compatibility by falling back to base values.
4. Deploy frontend changes to consume localized fields (can be rolled out quickly since field names are unchanged).
5. Add admin translation UI and allow content team to add/edit translations.
6. Run tests and manual QA per test plan.

Note: ensure your CIs and staging environments have the new migration applied before the admin UI is used.

---

## 8) Backwards compatibility & safety

-- Always implement fallback logic: requested language -> `fr` (default) -> base `memberships` table.
-- Keep the API response field names unchanged (`nom`, `description`, `avantages`) to minimize frontend changes.

---

## 9) Concrete repo file checklist (what to edit)

- DB migration/backfill/proc: `zenshe_db_flow/add_membership_localization_proc_and_backfill.sql` (creates `sp_get_membership_localized`, and optional backfill statements)
- Backend:
  - `backend/src/routes/publicServices.js` — call proc / LEFT JOIN on `memberships_translations` using `language_code`
  - `backend/src/routes/clientMemberships.js` — ensure available/active endpoints accept and forward `lang`
  - `backend/src/routes/adminClientMemberships.js` or `backend/src/routes/adminMemberships.js` — implement admin CRUD for `memberships_translations`
  - `backend/src/db/helpers.js` (or similar) — add `getLocalizedMemberships(lang)` helper that uses the proc/view
- Frontend:
  - `frontend/src/services/api.js` — ensure `lang` param is passed for public and client membership calls
  - `frontend/src/pages/client/BookingPage.jsx` — render `nom`, `description`, `avantages`
  - `frontend/src/pages/client/ServicesPage.jsx` — render localized fields
  - `frontend/src/pages/admin/AdminMemberships.jsx` — translation editor UI
  - `frontend/src/contexts/MembershipContext.jsx` — map localized fields into active membership state
- Tests:
  - `backend/tests/memberships_localization.test.js`
  - `frontend/tests/BookingPage.localization.test.js`
- Docs:
  - Update `IMPLEMENTATION_SUMMARY.md` or `README-LOCAL-SETUP.md` with migration and proc usage notes

---

Example backend pseudocode using existing column names (`language_code`, `avantages`):

```js
// In backend DB helper
async function getPublicMemberships(lang = 'fr') {
  const sql = `
    SELECT m.id,
           COALESCE(mt_lang.nom, mt_default.nom, m.nom) AS nom,
           COALESCE(mt_lang.description, mt_default.description, m.description) AS description,
           COALESCE(mt_lang.avantages, mt_default.avantages, m.avantages) AS avantages,
           m.prix_mensuel,
           m.prix_3_mois,
           m.services_par_mois,
           m.actif
    FROM memberships m
    LEFT JOIN memberships_translations mt_lang ON mt_lang.membership_id = m.id AND mt_lang.language_code = ?
    LEFT JOIN memberships_translations mt_default ON mt_default.membership_id = m.id AND mt_default.language_code = 'fr'
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


A. [SKIPPED — NO DB OBJECTS] We will NOT create stored procedures or views. Any backfill or DB-side scripts are out-of-scope and should be run manually by DB operators if desired.

B. Implement backend public/client endpoints to perform runtime LEFT JOIN + COALESCE and return localized fields; keep field names unchanged.

C. Add admin translation CRUD routes and a minimal editor in `AdminMemberships.jsx` to manage rows in the existing `memberships_translations` table.

D. Wire frontend to pass `lang` and render `nom`, `description`, `avantages` returned by the API.

Preferred next step: B (backend runtime query changes) — I can implement that first since it does not modify the database schema or add views/procs.