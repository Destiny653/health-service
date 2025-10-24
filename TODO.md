# TODO: Implement Real Imports and Data for Patient Table

## Approved Plan
- Update `components/PatientsTable.tsx` to use the `Patient` interface from `hooks/usePatients.ts` and define columns matching the data fields (case, patientName, sex, age, maritalStatus, isPregnant, profession, residence, contact, history).
- Update `components/sections/DataEntriesContent.tsx` to remove all mocks, import `Patient` from `hooks/usePatients.ts`, import `data` from `data.ts`, import `DataTable` from `components/PatientsTable.tsx`, and use real `useQuery` from `@tanstack/react-query` with a queryFn that returns the imported data.

## Steps
- [x] Update components/PatientsTable.tsx: Import Patient from hooks/usePatients.ts, update columns array to match Patient fields.
- [x] Update components/sections/DataEntriesContent.tsx: Remove all mock code, add proper imports, use real useQuery with queryFn returning data from data.ts.
- [x] Test the changes: Run dev server, navigate to the DataEntriesContent page, verify table displays data correctly with pagination.
