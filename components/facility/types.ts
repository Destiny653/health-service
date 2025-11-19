// -------------------- TYPES --------------------
export interface FacilityPayload {
  name: string;
  email: string[];
  phone: string[];
  facility_type: "health_center" | "health_area" | "district";
  address: string;
  parent_id: string;
}

export interface Facility {
  _id: string;
  name: string;
  email: string[];
  phone: string[];
  parent_id?: string;
  facility_type: string;
  address: string;
  code: string;
}

export interface FacilityResponse {
  count: number;
  results: Facility[];
}