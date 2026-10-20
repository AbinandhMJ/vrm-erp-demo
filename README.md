# VRM IAS Academy ERP: Demo

A front-end-only demo of an academy ERP: enquiries → admissions → fees → classes → tests → reports.
There is no backend: everything you enter is saved in the browser's `localStorage`.

The app **starts empty**: only logins, staff, courses, batches, the timetable and the question bank exist.
Enroll students and capture leads yourself, or use **Load sample data** (login page, or the ↺ menu in the
header for Office/Management) to fill it with a sample academy of about 200 students. *Clear all data* in the
same menu returns to the empty state.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build in dist/
```

Deploys to Vercel as a static Vite app (build command `npm run build`, output `dist`).

## Demo logins

| Role | Username | Password |
| --- | --- | --- |
| Management | `director@vrmiasacademy.com` | `admin123` |
| Office / Finance | `registrar@vrmiasacademy.com` | `office123` |
| Faculty | `ramanathan.polity@vrmiasacademy.com` | `faculty123` |
| Counselor / Field agent | `deepa.outreach@vrmiasacademy.com` | `agent123` |
| Student | `VRM-2026-089` (after loading sample data) | `student123` |

The login screen also has one-click persona cards.

Students you enroll log in with their roll number (first one is `VRM-2026-001`) and `VRM@` + the last
4 digits of their phone. With sample data loaded, every sample student can log in with their roll number and `VRM@` + the last 4 digits of their phone
(shown to office/management in the Student Directory). Other seeded staff use `staff123`.

## Demo script (end-to-end flow)

1. **Counselor** → Admissions & CRM → *Field Agent Quick Mode* → add a lead. It is auto-assigned to the
   least-busy counselor for that course; duplicate phone numbers are blocked.
2. **Office** → *Enroll Student* (or *Admit* on a lead) → fill VRM's admission form (same fields and order as the
   printed form, with photo and the three declarations) → scholarship, payment plan and advance → confirm.
   *Print Admission Form* produces the academy's form, filled in, ready for signatures. Installment invoices, a receipt, a roster seat and a portal login are created.
3. Sign out and log in **as that student** with the credentials shown → see course, timetable, fees, receipts,
   upcoming payment; pay the next installment online (simulated gateway).
4. **Faculty** → mark attendance for a batch → the student's attendance history updates.
5. **Office** → Fee Management → *Overdue* → collect a part payment; the balance and status update.
6. **Management** → Executive Dashboard: collections, admissions, attendance, test trends, counselor efficiency.

**Online application:** applicants fill the same admission form at `/#/apply` (no login; linked from the login
page, and Office can copy the link to put on the academy website). Each application gets a number (APP-2026-0001),
lands in the CRM as a lead assigned to a counselor, and shows up in **Admission Forms**, where Office admits it with
everything pre-filled. Admission Forms also lists every admitted student's form to view, print or correct.

Students also get a **daily 2-question quiz** on their dashboard (same questions for everyone, rotating daily
from the question bank); faculty see how many in each batch answered today.

**Online classes** (YouTube Live, Google Meet or Zoom): staff schedule a one-time or repeating class (every day, or chosen
weekdays until a last date) for all students or chosen batches. Before every session, the link goes to those students
automatically (in-app, plus simulated SMS/WhatsApp) at the chosen time (15 min to 1 day before), and staff can also
send it by hand. Students see upcoming classes and join links on their dashboard and in notifications; after a class,
staff add the recording link. In this front-end demo the automatic sending runs while the app is open; in production it
runs on the server.

**Faculty with several subjects** pick a subject in their portal to see only that subject's classes and batches,
attendance for that subject's classes, scores on that subject's test questions, and the students who need attention.
Attendance records which subject was taught.

**Leave & Holidays**: staff apply for casual, sick, earned or loss-of-pay leave (Sundays and holidays are not counted);
management/office approve or reject with a note; approved leave appears on the month calendar and is marked on the staff
attendance register (and not counted against attendance). Holidays are editable.

**Learning materials**: authorised staff upload many files at once (PDF, Word, slides, images, video) and share them with
all students, chosen batches or one student. Files are stored in the browser's IndexedDB for this demo (cloud storage in
production); students open or download what is shared with them.

**Question bank bulk import**: Excel/CSV (downloadable template), Word (.docx), PDF, a photo of a printed page (text is
read on the device with Tesseract OCR, served from `public/ocr`, copied by `scripts/copy-ocr.mjs` before dev/build), or
pasted text. Every question is shown for review and correction before it is added; duplicates are flagged.

Use the ↺ menu in the header to load sample data or clear everything.

## How the data works

- `src/data/mockData.ts`: hand-written reference data (courses, batches, timetable, staff, question bank, alerts).
- `src/data/seed.ts`: `buildBaseData()` is the empty starting state; `buildSeed()` is the optional sample
  academy, a deterministic generator for ~200 students with fee plans, invoices, receipts,
  class attendance, test attempts, leads, staff attendance and payroll, all dated relative to today.
- `src/context/AppContext.tsx`: state + actions. Attendance %, fee balances, test averages, seat counts and
  counselor KPIs are **derived** from the records, never stored, so every screen stays consistent.
- `public/vrm-logo.jpg`, `public/vrm-wordmark.jpg`: VRM's logo and badge (also used on printed documents).
- `src/components/admissions/AdmissionFormFields.tsx`: the admission form used by the admission popup, the online
  application page and the edit screen; `AdmissionFormPrint.tsx` prints it on VRM's letterhead.
- `src/config/academy.ts`: academy name, address, phone, email and declaration text (from VRM's admission form);
  used on receipts, statements, reports and the printed admission form.
- `src/config/access.ts`: which role can open which module (used by both the sidebar and the router).
- `src/components/common/Modal.tsx`: every popup uses this (fixed header with close button, Esc/backdrop close,
  bottom sheet on phones). `src/components/charts/Charts.tsx`: chart kit (Recharts) used by dashboards and reports.
- `src/lib/questionImport.ts`: question parsers; `src/lib/onlineClasses.ts`: class occurrences; `src/lib/leave.ts`:
  working days and balances; `src/lib/fileStore.ts`: uploaded files in IndexedDB.
- Storage keys are prefixed `vrm_erp_v3_`.

Passwords are stored in plain text in `localStorage`. This is acceptable for a demo only.
