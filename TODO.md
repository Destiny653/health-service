# TODO: Implement Patient Details Modal

## Approved Plan
- Add state in DataEntriesContent.tsx: selectedPatient (Patient | null), modalOpen (boolean), activeTab ('details' | 'history').
- Modify PatientsTable.tsx to accept an onRowClick prop and make table rows clickable.
- Create a custom Modal component in DataEntriesContent.tsx that slides from bottom (using CSS animations), full width, height 2/3 (leaving 1/3 top space).
- Modal content: Header with switcher buttons for "Patient Details" and "Visit History".
- "Patient Details" tab: Form with input fields for fullname, age, sex, marital status, is pregnant, profession, residence, etc.
- "Visit History" tab: DataTable showing filtered data (by patientName) with columns: Date, patient name, sex, age, marital status, is pregnant, profession, residence, contact, history.
- Bottom buttons: "Deceased" (red bg) and "Update Record".
- Style modal to overflow and slide up.

## Dependent Files
- components/sections/DataEntriesContent.tsx: Add modal, state, and logic.
- components/PatientsTable.tsx: Add onRowClick prop to DataTable.

## Steps
- [x] Modify PatientsTable.tsx to add onRowClick prop
- [x] Add state and modal logic to DataEntriesContent.tsx
- [x] Create custom Modal component with sliding animation
- [x] Implement "Patient Details" tab with form inputs
- [x] Implement "Visit History" tab with DataTable
- [x] Add bottom buttons: Deceased and Update Record
- [x] Test modal opening on row click
- [x] Verify sliding animation and positioning
- [x] Check form inputs and table in tabs
