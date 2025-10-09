# I18N Migration Plan — Convert hardcoded UI text to i18n keys

## Purpose
Make the client-side UI fully localizable by replacing hardcoded English/French text with i18n calls (react-i18next). This reduces visual inconsistencies and ensures the translator JSON files are authoritative.

## Scope
- Primary focus: user-facing pages/components used in the client flow (Booking, Form, Contact, Reservation confirmation, Admin waiver viewer).
- Secondary: example/inspired components in `frontend/src/components/archive/jotform-old/` (archive first, localize only if restored).
- Locales: `frontend/src/locales/en/translation.json` and `frontend/src/locales/fr/translation.json` will be updated.

## Contract (inputs / outputs / success criteria)
- Input: source files containing hardcoded strings (JSX text, button labels, placeholders).
- Output: same UI behavior but strings loaded through `t('namespace.key')` from locales files.
- Success: No user-visible, hardcoded UI text remains in high-priority pages; the app displays correct english/fr translations when switching languages.

## Edge cases
- HTML content returned from backend (server-side templates) that contains raw strings — leave backend changes for a separate pass.
- Strings that are purely developer comments or non-UI logs should not be i18n'd.
- Pluralization / interpolation: add keys that use i18next interpolation and plural forms where needed.

## Files targeted (high priority first)
- frontend/src/components/CompleteJotForm.jsx
- frontend/src/components/CompleteJotForm.css (only reference strings removed from JS; CSS unaffected)
- frontend/src/components/WaiverModal.jsx
- frontend/src/pages/client/ContactPage.jsx
- frontend/src/pages/client/ReservationConfirmation.jsx
- frontend/src/components/JotformSubmissionView.jsx
- frontend/src/components/JotformCard.jsx
- frontend/src/pages/client/ResetPassword.jsx (if placeholders/labels are hardcoded)

Secondary / archive (optional)
- frontend/src/components/archive/jotform-old/*

Locale files to update
- frontend/src/locales/fr/translation.json
- frontend/src/locales/en/translation.json

## Implementation steps (detailed)
1. Add patterns & helpers
   - Use `useTranslation()` from `react-i18next` in each file that will call `t()`.
   - Add a short helper file if necessary for common keys (not mandatory).

2. Convert UI strings in `CompleteJotForm.jsx` (one page at a time)
   - Replace button labels "Suivant", "Précédent", page headings and section labels with `t('form.next')`, `t('form.previous')`, `t('form.practitionerInfo')`, etc.
   - Replace all placeholder text (`placeholder="Type here..."`) with `placeholder={t('form.placeholder')}`.
   - For radio/checkbox option labels, either use existing keys or add option keys like `t('form.option.vagin')`.
   - Add the new keys to `en` and `fr` locale files.
   - Test page by page (navigate pages, see keys render correctly).

3. Convert `WaiverModal.jsx`
   - Replace modal title, fallback text `Non fourni`, and any labels with `t(...)` calls.
   - Add keys like `waiver.title`, `waiver.noData`.

4. Convert `ContactPage.jsx` and `ReservationConfirmation.jsx`
   - Replace buttons and actionable copy.

5. Convert Jotform admin view components
   - `JotformSubmissionView.jsx`, `JotformCard.jsx` — replace any hardcoded labels used in the admin UI.

6. Add/Update locale files
   - Add `form.*`, `waiver.*`, `contact.*`, `reservation.*` keys to both `en` and `fr` JSON files.
   - Keep keys short and hierarchical, e.g.:
     ```json
     {
       "form": {
         "next": "Next",
         "previous": "Previous",
         "submit": "Submit",
         "sendToPractitioner": "Send to Practitioner",
         "placeholder": "Type here...",
         "practitionerInfo": "Practitioner information"
       },
       "waiver": {
         "title": "Postpartum Waiver Form",
         "noData": "Not provided"
       }
     }
     ```

7. Sanity checks and grep sweep
   - After each file conversion, run a targeted search for remaining literal strings in those files.
   - Suggested quick checks (CMD):
     ```cmd
     findstr /s /n /c:"Suivant" frontend\src\components\*.jsx
     findstr /s /n /c:"Type here" frontend\src\components\*.jsx
     ```

8. Test
   - Start the frontend dev server and verify language switching shows translated strings:
     ```cmd
     npm run dev
     ```
   - Check: Booking flow (open the booking modal and walk the form), Admin - view waiver, Contact page flows.

## Example key names
- form.next
- form.previous
- form.submit
- form.sendToPractitioner
- form.placeholder
- form.section.practitionerInfo
- waiver.title
- waiver.noData
- contact.sendMessage

## Safety & rollbacks
- Work branch: create a short-lived feature branch `i18n/jotform-form` and commit changes incrementally.
- Tests: manual QA for both `en` and `fr` locales; unit tests optional.

## Timeline & milestones (very small)
- Day 0: Create branch, update `CompleteJotForm.jsx` and `WaiverModal.jsx` keys, update locale files.
- Day 1: Convert `ContactPage` & `ReservationConfirmation`, test booking flow.
- Day 2: Convert admin components and sweep archived files (optional).

## Checklist
```markdown
- [ ] Create feature branch `i18n/jotform-form`
- [ ] Replace strings in `CompleteJotForm.jsx` (page-by-page)
- [ ] Replace strings in `WaiverModal.jsx`
- [ ] Replace strings in `ContactPage.jsx` and `ReservationConfirmation.jsx`
- [ ] Update `frontend/src/locales/en/translation.json` and `fr/translation.json` with new keys
- [ ] Run dev server and perform manual QA (en/fr every page)
- [ ] Sweep codebase for remaining hardcoded strings and fix or document exceptions
- [ ] Merge to `master` after review
```

---

## Next steps I can run for you (pick 1)
- A: Implement changes automatically for `CompleteJotForm.jsx` + add keys to `fr/en` locale files and run a quick grep check.
- B: Produce a line-by-line list of literal strings in each target file for manual review before changes.

Tell me which of the two you want and I will proceed.