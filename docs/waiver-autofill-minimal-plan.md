# Waiver Autofill (Minimal) — Plan

This document describes the minimal implementation to let logged-in clients reuse a previously-submitted JotForm waiver and autofill their static personal details when making a new reservation.

Goal: fast, low-risk addition so clients can reuse an existing waiver without re-submitting JotForm; the server will attach the stored JotForm submission ID to new reservations.

---

## 1) Summary

- Approach: Minimal schema change on `clients` table to add a nullable `last_jotform_submission_id` column. Frontend adds a toggle/button to autofill profile fields and attach the stored waiver when creating a reservation.
- No complex new tables or UI required initially. This is quick to implement and easy to roll back.

---

## 2) Contract (inputs / outputs / success criteria)

- Inputs:
  - Authenticated client (server-side `client_id` verified)
  - Reservation details (services, date, time, notes)
  - Client chooses "Use saved waiver" control in the booking UI
- Outputs:
  - New reservation row has `client_id` and `jotform_submission_id` populated with saved value
  - Frontend fields (name / email / phone / birthdate / address) are autofilled from `clients` data
  - UI shows an indicator that a saved waiver is attached and a link to view it
- Success criteria:
  - Logged-in clients can create reservations attaching an existing waiver without re-submitting to JotForm
  - Admin and client "Voir Décharge" modal works using saved `jotform_submission_id`

---

## 3) Database change (minimal)

Add a single nullable column to `clients`:

- Column name: `last_jotform_submission_id`
- Type: `VARCHAR(80)` (or similar) NULL

Example migration SQL (MySQL):

```sql
ALTER TABLE clients
  ADD COLUMN last_jotform_submission_id VARCHAR(80) DEFAULT NULL;
```

Notes:
- This stores the most recent submission ID the client used/created. It is intentionally minimal — one saved waiver per client (the "last" one).
- If you later need multiple saved waivers, migrate to a `client_waivers` table (described in plan appendix).

---

## 4) Frontend UX (high-level)

Where: `BookingPage.jsx` and related client booking components.

Controls & behavior:
- Display a small control near the personal info block for authenticated users, e.g.:
  - A checkbox or button labeled: "Réutiliser ma décharge enregistrée et remplir mes infos"
  - If client has no saved waiver (`last_jotform_submission_id` = null), show: "Aucune décharge enregistrée" and permit the default flow
- When user toggles ON:
  - Autofill name / email / phone / birthdate / address from `clients` (client profile API or already-available client context)
  - Display a badge: "Décharge attachée (ID: 6366...)" with a small "Voir" link that opens `WaiverModal` with that ID
  - Disable or visually separate the waiver submission UI (to avoid confusion) but allow user to still edit personal fields for this reservation only
- On submit:
  - If control is ON, include `jotform_submission_id: client.last_jotform_submission_id` in the reservation payload
  - If OFF and waiverData present, continue the existing behavior (submit waiver to JotForm first, then create reservation with returned submission id)

UI considerations:
- Clearly indicate that autofill does not update their saved waiver (unless they explicitly choose to save a newer waiver)
- Allow a link "Remplacer la décharge enregistrée" on the client profile or during booking (opt-in)

---

## 5) Backend behavior & API contract

Minimal changes required.

Reservation creation (`POST /api/reservations`):
- Existing payload already accepts `jotform_submission_id` — continue to accept and store it.
- When authenticated client requests reuse, frontend will supply that `jotform_submission_id` in the payload.
- Server must verify that, when the client is authenticated, any `jotform_submission_id` being attached corresponds to that client's saved `last_jotform_submission_id` (or was submitted in the same session) — do not accept arbitrary IDs from the client payload without server-side check.

Updating client's saved waiver:
- Option A (minimal): server-side logic to set `clients.last_jotform_submission_id` after a successful waiver submission by that authenticated client. This can be automatic or gated behind an opt-in flag in the booking form (recommended opt-in).

Admin flows:
- Admin endpoints that update reservations should remain unchanged. Admin UI can keep the existing "Voir Décharge" functionality.

Security checks:
- Always ensure authenticated `client_id` == owner of saved waiver before permitting reuse.
- Server-side: when reservation creation includes a `jotform_submission_id` value and the user is authenticated and chosen to reuse saved waiver, verify match with `clients.last_jotform_submission_id`.

---

## 6) Edge cases and handling

1. Stored ID invalid / deleted at JotForm:
   - When user clicks "Voir Décharge", if backend JotForm fetch returns error (404 / 410 / API error), display a clear message: "La décharge enregistrée n'est plus disponible. Veuillez soumettre une nouvelle décharge." Optionally clear the saved ID server-side or mark it as invalid.

2. Stale waiver (age / outdated answers):
   - Optional: if the saved waiver is older than threshold (e.g., 6 or 12 months), show a warning: "Votre décharge date de plus de X mois — merci de vérifier vos réponses." Let user continue but display prominent notice.

3. Client edits autofilled fields for a specific reservation:
   - Editing autofill should only modify the reservation payload, not overwrite the client's profile unless they explicitly choose "Save to my profile".

4. Privacy / GDPR / deletion requests:
   - If storing only the submission ID, privacy exposure is minimal; however, if you later add raw JSON of waiver answers, you must treat it as PII and provide deletion endpoints and processes. For the minimal approach, provide an endpoint for a client to clear their saved submission ID.

5. Multi-account / shared email:
   - Use `client_id` from authentication, not email, to determine ownership of saved waiver.

---

## 7) Acceptance criteria & tests

Manual tests:
- Client with saved waiver can toggle reuse, autofill fields, and create a reservation with `jotform_submission_id` set to that ID. "Voir Décharge" displays the waiver.
- Client without saved waiver sees the control disabled and can follow existing waiver submission flow.
- If saved waiver is invalid, attempt to view shows a friendly recovery message.

Automated tests (suggested):
- Unit test: reservation create path accepts `jotform_submission_id` only when it matches `clients.last_jotform_submission_id` for the authenticated client.
- Integration test: simulate authenticated client with `last_jotform_submission_id` set; create reservation with reuse flag; verify DB reservation row has correct `jotform_submission_id` and client table unchanged.

---

## 8) Migration & rollout steps

1. Create DB migration to add `last_jotform_submission_id` column to `clients` (see SQL above). Deploy migration.
2. Backend: add server-side logic to optionally set this column after a successful waiver submission (opt-in checkbox recommended). Add an API or ensure profile API returns the new column.
3. Frontend: add the small toggle/button + UI indicators on `BookingPage.jsx` to autofill the profile and attach waiver ID. Ensure frontend only uses stored value for authenticated users.
4. QA: perform manual and automated tests described above.
5. Monitor logs and user feedback. If users need multiple saved waivers, plan migration to `client_waivers` table.

---

## 9) Audit & logging

- Log events for traceability:
  - `client X reused saved waiver Y for reservation Z`
  - `client X saved waiver Y` (if opt-in)
  - `client X cleared saved waiver Y`

This helps debug and trace PII usage.

---

## 10) Appendix — future upgrade: `client_waivers` table (optional)

If you need multi-waiver support, store waivers in a dedicated table with parsed/summary fields and raw JSON for offline rendering:

- `client_waivers`:
  - `id` INT PK
  - `client_id` INT FK
  - `jotform_submission_id` VARCHAR(80)
  - `summary` TEXT
  - `raw_json` LONGTEXT NULL
  - `is_active` TINYINT DEFAULT 1
  - `created_at`, `updated_at`

This allows listing, selecting and managing multiple saved waivers per client.

---

## 11) Next actions (I can implement these for you)

- Create DB migration SQL and run it (Option A).  
- Add backend enforcement to verify ownership and optionally auto-save the last submission ID (opt-in or automatic).  
- Add frontend toggle in `BookingPage.jsx` to autofill and attach waiver ID.  

Tell me which of the following you want next:
1. I create the DB migration and server-side enforcement (backend changes).  
2. I implement the frontend UI changes (autofill toggle & indicator).  
3. Both (full end-to-end implementation).  

---

*Document created on 2025-10-19.*
