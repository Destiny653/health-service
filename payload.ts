// user signin
export type UserData = {
    _id: string;
    username: string;
    metadata: {
        created_at: string; // ISO date string
        modified_at: string; // ISO date string
        created_by: string;
        modified_by: string;
    };
    first_name: string;
    last_name: string;
    gender: "male" | "female";
    facility_type: string;
    code: string;
    email: string[];
    phone: string[];
    role: {
        id: string;
        name: string;
    };
    facility: {
        id: string;
        name: string;
        code: string;
        facility_type: string;
    };
};


// facility payload

export interface FacilityPayload {
  count: number;
  results: Facility[];
}

export interface Facility {
  _id: string;
  name: string;
  email: string[];
  phone: string[];
  parent_id: string;
  facility_type: "health_area" | "health_center" | "district";
  metadata: Metadata;
  address: string;
  code: string;
}

export interface Metadata {
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
}
