// user signin
export type currentUser = {
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

