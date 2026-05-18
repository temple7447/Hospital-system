# CareFlow — Full Page Build List

All data via **localStorage** for now. Work through these one at a time.
Mark each with ✅ when done, 🔄 when in progress, ❌ if skipped.

---

## LEGEND
- 🟢 Already exists (needs review/upgrade)
- 🔵 New page to build
- Role tags: [A] = Admin, [D] = Doctor, [R] = Receptionist, [P] = Patient

---

## 1. AUTH & PUBLIC

| # | Status | Page | File | Roles | Notes |
|---|--------|------|------|-------|-------|
| 1.1 | 🟢 ✅ | Landing Page | `LandingPage.tsx` | Public | Not wired to router yet. Hero, features, CTA |
| 1.2 | 🟢 ✅ | Login | `Login.tsx` | Public | Role selector + validation + real auth against localStorage |
| 1.3 | 🔵 ✅ | Patient Register | `Register.tsx` | Public | Self-registration for patients |
| 1.4 | 🔵 ✅ | Forgot Password | `ForgotPassword.tsx` | Public | Mock reset flow using localStorage |

---

## 2. SHARED / SYSTEM PAGES

| # | Status | Page | File | Roles | Notes |
|---|--------|------|------|-------|-------|
| 2.1 | 🟢 ✅ | 404 Not Found | `NotFound.tsx` | All | Animated 404 with heartbeat line, back + home buttons |
| 2.2 | 🟢 ✅ | Unauthorized | `Unauthorized.tsx` | All | 403 page, shows user role, back + dashboard buttons |
| 2.3 | 🟢 ✅ | Profile / My Account | `Profile.tsx` | All | Role-aware view/edit — staff shows schedule & dept, patient shows medical info |
| 2.4 | 🔵 ✅ | Notifications Center | `Notifications.tsx` | All | All alerts, appointment reminders, system msgs |

---

## 3. ADMIN PAGES [A]

| # | Status | Page | File | Notes |
|---|--------|------|------|-------|
| 3.1 | 🟢 ✅ | Admin Dashboard | `AdminDashboard.tsx` | Stats, charts, capacity — exists, review quality |
| 3.2 | 🟢 ✅ | Staff Management | `admin/Staff.tsx` | Search/filter table, add/edit modal, toggle active/inactive/on-leave |
| 3.3 | — | Staff Detail | — | Merged into Staff modal (no separate page needed) |
| 3.4 | 🟢 ✅ | Department Management | `admin/Departments.tsx` | Cards with capacity bars, overall hospital capacity chart, edit modal |
| 3.5 | 🟢 ✅ | Room & Bed Management | `admin/Rooms.tsx` | Grouped by floor, filter by type/status/dept, edit modal with bed tracking |
| 3.6 | 🔵 ✅ | Inventory Management | `admin/Inventory.tsx` | Medicines, equipment — stock levels, low-stock alerts |
| 3.7 | 🔵 ✅ | Billing Management | `admin/Billing.tsx` | View all invoices, filter by status (paid/pending/overdue) |
| 3.8 | 🟢 ✅ | Reports & Analytics | `Reports.tsx` | Exists but basic — charts for revenue, patient trends, dept stats |
| 3.9 | 🟢 ✅ | System Settings | `Settings.tsx` | Exists — hospital info, working hours, system config |
| 3.10 | 🔵 ✅ | Audit Logs | `admin/AuditLogs.tsx` | Log of all key actions (logins, record edits, billing changes) |

---

## 4. DOCTOR PAGES [D]

| # | Status | Page | File | Notes |
|---|--------|------|------|-------|
| 4.1 | 🟢 ✅ | Doctor Dashboard | `DoctorDashboard.tsx` | Today's appointments, stats — exists, review quality |
| 4.2 | 🔵 ✅ | My Schedule | `doctor/Schedule.tsx` | Weekly grid calendar, appointment blocks, status updates, working hours highlight |
| 4.3 | 🔵 ✅ | My Patients | `doctor/MyPatients.tsx` | List of all assigned/past patients with search & filter |
| 4.4 | 🔵 ✅ | Patient Medical Record | `doctor/PatientRecord.tsx` | Tabs: Overview, Vitals (chart+table), Prescriptions, SOAP Notes; add vitals/note modals |
| 4.5 | 🔵 ✅ | Write Prescription | `doctor/Prescription.tsx` | Multi-medicine form with autocomplete, dosage/freq/duration, diagnosis, expiry |
| 4.6 | 🔵 ✅ | Lab Test Orders | `doctor/LabOrders.tsx` | Order tests, view results when ready |
| 4.7 | 🔵 ✅ | Consultation Notes | `doctor/ConsultationNotes.tsx` | SOAP notes editor per appointment/visit |
| 4.8 | 🔵 ✅ | Doctor Availability | `doctor/Availability.tsx` | Set weekly working hours and leave days |

---

## 5. RECEPTIONIST PAGES [R]

| # | Status | Page | File | Notes |
|---|--------|------|------|-------|
| 5.1 | 🟢 ✅ | Receptionist Dashboard | `ReceptionistDashboard.tsx` | Queue, today's appointments — exists, review |
| 5.2 | 🟢 ✅ | All Appointments | `Appointments.tsx` | Role-aware rebuild — book, cancel, status management, real db |
| 5.3 | 🔵 ✅ | Patient Check-In | `receptionist/CheckIn.tsx` | Walk-in registration, assign to queue, print token |
| 5.4 | 🔵 ✅ | Arrival Queue | `receptionist/Queue.tsx` | Live queue view — waiting, in-progress, done. Drag to reorder |
| 5.5 | 🔵 ✅ | Patient Registration | `receptionist/RegisterPatient.tsx` | Multi-step wizard — personal, medical, emergency, success |
| 5.6 | 🔵 ✅ | Billing & Payment | `receptionist/Payment.tsx` | Generate invoice for a visit, mark as paid (cash/card/insurance) |
| 5.7 | 🟢 ✅ | Patient List | `Patients.tsx` | Exists — search, view, filter all patients |

---

## 6. NURSE PAGES [N]

| # | Status | Page | File | Notes |
|---|--------|------|------|-------|
| N.1 | 🔵 ✅ | Nurse Dashboard | `NurseDashboard.tsx` | Tasks, vitals stats, pending list |
| N.2 | 🔵 ✅ | My Patients | `nurse/MyPatients.tsx` | Patients in nurse's dept with allergy/vitals quick view |
| N.3 | 🔵 ✅ | Record Vitals | `nurse/VitalEntry.tsx` | Patient search + 8-field vital entry form |
| N.4 | 🔵 ✅ | Nursing Tasks | `nurse/Tasks.tsx` | Medication/vitals/wound care tasks with start/complete flow |

---

## 7. PHARMACIST PAGES [PH]

| # | Status | Page | File | Notes |
|---|--------|------|------|-------|
| PH.1 | 🔵 ✅ | Pharmacist Dashboard | `PharmacistDashboard.tsx` | Pending Rx, dispensed today, low stock |
| PH.2 | 🔵 ✅ | Prescription Queue | `pharmacist/PrescriptionQueue.tsx` | Active Rx list with allergy warnings, mark as dispensed |
| PH.3 | 🔵 ✅ | Drug Inventory | `pharmacist/DrugInventory.tsx` | Medicine stock with restock action |
| PH.4 | 🔵 ✅ | Dispense History | `pharmacist/DispenseHistory.tsx` | All dispensed Rx with my/all filter |

---

## 8. LAB TECHNICIAN PAGES [LT]

| # | Status | Page | File | Notes |
|---|--------|------|------|-------|
| LT.1 | 🔵 ✅ | Lab Tech Dashboard | `LabTechDashboard.tsx` | Pending/processing/completed stats, priority sorted queue |
| LT.2 | 🔵 ✅ | Order Queue | `lab_tech/OrderQueue.tsx` | Pathology orders, advance through ordered → collected → processing |
| LT.3 | 🔵 ✅ | Enter Results | `lab_tech/EnterResults.tsx` | Per-test value/unit/range entry with normal/abnormal/critical flag |
| LT.4 | 🔵 ✅ | Completed Orders | `lab_tech/CompletedOrders.tsx` | History with expandable result rows |

---

## 9. RADIOLOGIST PAGES [RD]

| # | Status | Page | File | Notes |
|---|--------|------|------|-------|
| RD.1 | 🔵 ✅ | Radiologist Dashboard | `RadiologistDashboard.tsx` | Pending imaging, in-progress, urgent stats |
| RD.2 | 🔵 ✅ | Imaging Queue | `radiologist/ImagingQueue.tsx` | MRI/CT/X-Ray/Ultrasound queue with status advancement |
| RD.3 | 🔵 ✅ | Enter Report | `radiologist/EnterReport.tsx` | Findings textarea per study + impression + flag |
| RD.4 | 🔵 ✅ | Report History | `radiologist/ReportHistory.tsx` | Past reports with expandable findings |

---

## 6. PATIENT PAGES [P]

| # | Status | Page | File | Notes |
|---|--------|------|------|-------|
| 6.1 | 🟢 ✅ | Patient Dashboard | `PatientDashboard.tsx` | Upcoming appointments, vitals summary — exists, review |
| 6.2 | 🔵 ✅ | Book Appointment | `patient/BookAppointment.tsx` | 4-step wizard — dept → doctor → calendar + slots → details + confirm |
| 6.3 | 🔵 ✅ | My Appointments | `patient/MyAppointments.tsx` | View upcoming & past appointments, cancel/reschedule |
| 6.4 | 🔵 ✅ | My Medical Records | `patient/MedicalRecords.tsx` | Tabs: Overview (vitals chart, active Rx, upcoming apts), Prescriptions, Visits, Notes |
| 6.5 | 🔵 ✅ | My Prescriptions | `patient/Prescriptions.tsx` | All active and past prescriptions |
| 6.6 | 🔵 ✅ | Lab Results | `patient/LabResults.tsx` | View completed test results |
| 6.7 | 🔵 ✅ | My Bills | `patient/Bills.tsx` | View invoices, payment status, download receipt |
| 6.8 | 🔵 ✅ | Health Summary | `patient/HealthSummary.tsx` | Vitals chart over time (BP, weight, temp), risk indicators |

---

## SUMMARY

| Section | Total Pages | Built | Remaining |
|---------|------------|-------|-----------|
| Auth & Public | 4 | 4 | 0 |
| Shared | 4 | 4 | 0 |
| Admin | 10 | 10 | 0 |
| Doctor | 8 | 8 | 0 |
| Receptionist | 7 | 7 | 0 |
| Patient | 8 | 8 | 0 |
| **Total** | **41** | **41** | **0** |

---

## DATA MODELS (localStorage keys)

These are the data structures we need in localStorage:

```
hospital_user          → current logged-in user
hospital_patients      → Patient[]
hospital_staff         → Staff[] (doctors, receptionists, nurses)
hospital_departments   → Department[]
hospital_appointments  → Appointment[]
hospital_rooms         → Room[]
hospital_prescriptions → Prescription[]
hospital_lab_orders    → LabOrder[]
hospital_invoices      → Invoice[]
hospital_inventory     → InventoryItem[]
hospital_notifications → Notification[]
hospital_audit_logs    → AuditLog[]
hospital_queue         → QueueEntry[]
```

---

## BUILD ORDER (recommended)

Start with the foundation pages that everything else depends on:

1. ✅ **Data layer** — shared localStorage utils + seed data (`src/lib/storage.ts`, `src/lib/db.ts`, `src/lib/seed.ts`, `src/types/index.ts`)
2. ✅ **Auth fix + Login rebuild** — login now looks up real staff/patient by email
3. ✅ **2.1, 2.2, 2.3** — 404, Unauthorized, Profile pages
4. ✅ **3.2 Staff Management** — add/edit/toggle status, full CRUD
5. ✅ **3.4 Departments** — capacity visualization, edit modal
6. ✅ **3.5 Rooms & Beds** — floor-grouped grid, status management
7. **5.5 Patient Registration** — before patient pages
8. **6.2 Book Appointment** → **5.2 Appointments** → **4.2 Schedule**
9. **4.4 Patient Medical Record** → **4.5 Prescription** → **6.4 My Records**
10. **5.6 Billing** → **6.7 My Bills** → **3.7 Admin Billing**
11. **4.6 Lab Orders** → **6.6 Lab Results**
12. **3.6 Inventory** → **3.10 Audit Logs**
13. **1.1 Landing** → **1.3 Register** → **1.4 Forgot Password**
