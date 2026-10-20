# VRM IAS Academy ERP: Demo

A front-end-only demo of an academy ERP: enquiries → admissions → fees → classes → tests → reports.
All data is mock data generated in the browser and saved to `localStorage`. There is no backend.

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
| Management | `director@vrmiasacademy.in` | `admin123` |
| Office / Finance | `registrar@vrmiasacademy.in` | `office123` |
| Faculty | `ramanathan.polity@vrmiasacademy.in` | `faculty123` |
| Counselor / Field agent | `deepa.outreach@vrmiasacademy.in` | `agent123` |
| Student | `VRM-2026-089` | `student123` |

The login screen also has one-click persona cards.

Every other seeded student can log in with their roll number and `VRM@` + the last 4 digits of their phone
(shown to office/management in the Student Directory). Other seeded staff use `staff123`.

## Demo script (end-to-end flow)

1. **Counselor** → Admissions & CRM → *Field Agent Quick Mode* → add a lead. It is auto-assigned to the
   least-busy counselor for that course; duplicate phone numbers are blocked.
2. **Office** → *Enroll Student* (or *Admit* on a lead) → pick course/batch (full batches are blocked), scholarship,
   payment plan and advance → confirm. Installment invoices, a receipt, a roster seat and a portal login are created.
3. Sign out and log in **as that student** with the credentials shown → see course, timetable, fees, receipts,
   upcoming payment; pay the next installment online (simulated gateway).
4. **Faculty** → mark attendance for a batch → the student's attendance history updates.
5. **Office** → Fee Management → *Overdue* → collect a part payment; the balance and status update.
6. **Management** → Executive Dashboard: collections, admissions, attendance, test trends, counselor efficiency.

Use the ↺ button in the header to reset all demo data.

## How the data works

- `src/data/mockData.ts`: hand-written reference data (courses, batches, timetable, staff, question bank, alerts).
- `src/data/seed.ts`: deterministic generator for ~200 students with fee plans, invoices, receipts,
  class attendance, test attempts, leads, staff attendance and payroll, all dated relative to today.
- `src/context/AppContext.tsx`: state + actions. Attendance %, fee balances, test averages, seat counts and
  counselor KPIs are **derived** from the records, never stored, so every screen stays consistent.
- `src/config/access.ts`: which role can open which module (used by both the sidebar and the router).
- Storage keys are prefixed `vrm_erp_v2_`.

Passwords are stored in plain text in `localStorage`. This is acceptable for a demo only.
