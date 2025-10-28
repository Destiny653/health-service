import { useFetch } from "./useFetch";
import { useMutationRequest } from "./useMutationRequest";

export interface Patient {
  case: number;
  patientName: string;
  sex: "M" | "F";  // Limited to male/female if that's consistent
  age: number;
  maritalStatus: "SI" | "MA" | "WI" | "DI" | "MP" | "MM" | "CE"; // Based on your dataset
  isPregnant: 0 | 1 | 2; // could also be boolean if you prefer (true/false)
  profession: string;
  residence: string;
  contact: string;
  history: string;
  createdAt: Date; // Added timestamp for time-based filtering
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
