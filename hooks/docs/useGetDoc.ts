"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";

// -------------------- TYPES --------------------
export interface Facility {
  _id: string;
  name: string;
  email: string[];
  phone: string[];
  parent_id?: string;
  facility_type: string;
  address: string;
  code: string;
  submission_status: any;
}

export interface FacilityResponse {
  count: number;
  limit: number;
  page: number;
  results: Facility[];
}

// Document types (as you provided)
export interface ExtractedField {
  value: string;
  extracted_value: string;
  extracted_score: number;
  corrected_score: number;
  was_corrected: boolean;
  corrected_at: string;
}

export interface ResultsField {
  value: string;
  extracted_value: string;
  extraction_score: number;
  corrected_score: number;
  was_corrected: boolean;
  verified_at: string;
  disease_id?: string;
  was_processed?: boolean;
}

export interface RowMetadata {
  is_dead: boolean;
  is_latest: boolean;
  version: number;
  reference: string | null;
  doc_code: string;
  row_code: string;
  image_urls: []
  created_at: string;
  modified_at: string;
  verified_at: string | null;
  verified_by: string | null;
  facility_id: string;
  created_by: string;
  modified_by: string;
}

export interface PatientDocument {
  doc_code?: string;
  _id: string;
  date: ExtractedField;
  month_number: ExtractedField;
  case: ExtractedField;
  names: ExtractedField;
  sex: ExtractedField;
  age: ExtractedField;
  status: ExtractedField;
  pregnant: ExtractedField;
  patient_code: ExtractedField;
  occupation: ExtractedField;
  residence: ExtractedField;
  contact: ExtractedField;
  past_history: ExtractedField;
  signs_symptoms: ExtractedField;
  diagnosis: ExtractedField;
  investigations: ExtractedField;
  results: ResultsField;
  treatment: ExtractedField;
  confirmatory_diagnosis: ExtractedField;
  hospitalisation: ExtractedField;
  receipt_no: ExtractedField;
  referral: ExtractedField;
  observations: ExtractedField;
  metadata: RowMetadata;
}

export type FieldCorrection = {
  extracted_value: string;
  was_corrected: boolean;
  corrected_at: any;
};

export type EditRowPayload = {
  _id?: string;
  date?: FieldCorrection;
  month_number?: FieldCorrection;
  case?: FieldCorrection;
  names?: FieldCorrection;
  sex?: FieldCorrection;
  age?: FieldCorrection;
  status?: FieldCorrection;
  pregnant?: FieldCorrection;
  patient_code?: FieldCorrection;
  occupation?: FieldCorrection;
  residence?: FieldCorrection;
  contact?: FieldCorrection;
  past_history?: FieldCorrection;
  signs_symptoms?: FieldCorrection;
  diagnosis?: FieldCorrection;
  investigations?: FieldCorrection;
  results?: ResultsField;
  treatment?: FieldCorrection;
  confirmatory_diagnosis?: FieldCorrection;
  hospitalisation?: FieldCorrection;
  receipt_no?: FieldCorrection;
  referral?: FieldCorrection;
  observations?: FieldCorrection;
};

export interface FieldScore {
  score?: number;
  extraction_score?: number;
  corrected_score?: number;
}

export interface Scores {
  date?: FieldScore;
  month_number?: FieldScore;
  case?: FieldScore;
  names?: FieldScore;
  sex?: FieldScore;
  age?: FieldScore;
  status?: FieldScore;
  pregnant?: FieldScore;
  patient_code?: FieldScore;
  occupation?: FieldScore;
  residence?: FieldScore;
  contact?: FieldScore;
  past_history?: FieldScore;
  signs_symptoms?: FieldScore;
  diagnosis?: FieldScore;
  investigations?: FieldScore;

  // results is special because it has extraction_score + corrected_score
  results?: FieldScore;

  treatment?: FieldScore;
  confirmatory_diagnosis?: FieldScore;
  hospitalisation?: FieldScore;
  receipt_no?: FieldScore;
  referral?: FieldScore;
  observations?: FieldScore;
}


export interface DocumentGroup {
  image_urls: string[];
  rows: PatientDocument[];
}

export interface DocumentList {
  total_rows: number;
  page: number;
  limit: number;
  documents: {
    [docCode: string]: DocumentGroup;
  };
}


// -------------------- API BASE --------------------
const API_BASE =  process.env.NEXT_PUBLIC_API_URL || "http://173.249.30.54/dappa";

// Helper to get auth token
const getAuthHeader = () => {
  const token = Cookies.get("authToken");
  if (!token) throw new Error("No auth token found");
  return { Authorization: `Bearer ${token}` };
};

// -------------------- API FUNCTIONS --------------------

// 1. Get child facilities
async function fetchChildFacilities(parentId: string): Promise<FacilityResponse> {
  const res = await fetch(
    `${API_BASE}/facility/children/${parentId}?page=1&limit=100`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        ...getAuthHeader(),
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to load child facilities");
  }

  return res.json();
}

// 2. Get documents for a selected facility
async function fetchDocumentsByFacility({
  facilityId,
  page = 1,
  limit = 20,
}: {
  facilityId: string;
  page?: number;
  limit?: number;
}): Promise<DocumentList> {
  const res = await fetch(
    `${API_BASE}/document/facility/${facilityId}?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        ...getAuthHeader(),
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to load documents");
  }

  return res.json();
}

// 3. Edit a single row
async function editDocumentRow({
  doc_code,
  row_id,
  payload,
}: {
  doc_code: string;
  row_id: any;
  payload: EditRowPayload;
}) {
  const res = await fetch(
    `${API_BASE}/document/${doc_code}/${row_id}/edit`,
    {
      method: "PUT", // or "PUT" – change if your API uses PUT
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.detail || "Failed to update row");
  }

  return data;
}

// -------------------- REACT QUERY HOOKS --------------------

// Hook: Get child facilities (under a parent)
export function useGetChildFacilities(parentId: string | undefined) {
  return useQuery<FacilityResponse, Error>({
    queryKey: ["facilities", "children", parentId],
    queryFn: () => fetchChildFacilities(parentId!),
    enabled: !!parentId,
  });
}

// Hook: Get documents for the selected facility
export function useGetDocumentsByFacility(
  selectedFacilityId: string | null,
  options?: { page?: number; limit?: number }
) {
  return useQuery<DocumentList, Error>({
    queryKey: ["documents", "facility", selectedFacilityId, options],
    queryFn: () =>
      fetchDocumentsByFacility({
        facilityId: selectedFacilityId!,
        page: options?.page ?? 1,
        limit: options?.limit ?? 20,
      }),
    enabled: !!selectedFacilityId,
  });
}

// Hook: Edit a document row + invalidate cache properly
export function useEditDocumentRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ doc_code, row_id, payload }: { doc_code: any; row_id: string; payload: EditRowPayload }) =>
      editDocumentRow({ doc_code, row_id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}