import { useFetch } from "./useFetch";
import { useMutationRequest } from "./useMutationRequest";

// hooks/usePatients.ts (or types.ts)
interface History {
  updatedBy:string,
  updatedAt: string
}
export interface Patient {
  id: string;
  case: number;
  patientName: string;
  sex: "M" | "F";
  age: number;
  maritalStatus: "SI" | "MA" | "WI" | "DI" | "MP" | "MM" | "CE";  // Married, Single, Divorced, Widowed, MM (custom)
  isPregnant: 0 | 1;
  profession: string;
  residence: string;
  contact: string;
  patientCode?: string;
  history: string;
  symptoms?: string[];
  diagnosisPrescribing?: string;
  testsRequested?: string[];
  confirmedResults?: string[];
  confirmatoryDiagnosis?: string;
  treatment?: string[];
  careLevel?: "Ambulatory" | "Observation" | "Hospitalization";
  receiptNumber?: string;
  referenceHospital?: string;
  observations?: string;
  createdAt: Date;
  updatedAt?: Date;
  isRareCase?: boolean;
  dataIssues?: string[];
  role?: string;
}


interface PatientResult {
  data: Patient[] | undefined;
  isLoading: boolean;
  error: unknown;
}

export const useGetPatients = (): PatientResult => {
  const { data, isLoading, error } = useFetch<Patient[]>("patients", "/patients");
  return { data, isLoading, error };
};

// Mutations (POST, PUT, DELETE)
export const usePostPatients = () =>
  useMutationRequest<Patient, Partial<Patient>>("post", "/patients");

export const useUpdatePatients = () =>
  useMutationRequest<Patient, Partial<Patient>>("put", "/patients");

export const useDeletePatients = () =>
  useMutationRequest<Patient, { id: string }>("delete", "/patients");
