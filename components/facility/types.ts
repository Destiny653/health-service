// -------------------- TYPES --------------------
export interface FacilityPayload {
  name: string;
  email: string[];
  phone: string[];
  facility_type: "health_center" | "health_area" | "district";
  address: FacilityLocation;
  parent_id: string;
}

export interface Facility {
  _id: string;
  name: string;
  email: string[];
  phone: string[];
  parent_id?: string;
  facility_type: string;
  location: FacilityLocation;
  code: string;
  submission_status: any;
}

export interface FacilityLocation {
  country: string;
  city: string;
  address: string;
  longitude: number;
  latitude: number;
}

// export interface FacilityPayload {
//   name: string;
//   email: string[];
//   phone: string[];
//   facility_type: "health_center" | "health_area" | "district";
//   parent_id: string;
//   location: FacilityLocation;
// }

export interface FacilityResponse {
  count: number;
  limit: number;
  page: number;
  results: Facility[];
}