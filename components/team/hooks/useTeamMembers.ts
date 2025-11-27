"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { toast } from "sonner";

/* ——— TYPES ——— */

export interface UserMetadata {
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
}

export interface TeamMember {
  _id: string;
  username: string;
  first_name: string;
  code: string;
  last_name: string;
  gender: string;
  metadata: UserMetadata;
  email: string[];
  phone: string[];
  role: { id: string; name: string };
}

export interface TeamMembersResponse {
  count: number;
  page: number;
  limit: number;
  results: TeamMember[];
}

export interface CreateUserPayload {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female";
  email: string[];
  phone: string[];
  role_id: string;
  facility_type: string;
  facility_id: string;
}

/* ——— API FUNCTIONS ——— */

const API_BASE =  process.env.NEXT_PUBLIC_API_URL || "http://173.249.30.54/dappa";

async function fetchFacilityPersonalities(facilityId: string): Promise<TeamMembersResponse> {
  const token = Cookies.get("authToken");
  if (!token) throw new Error("Authentication token missing");

  const res = await fetch(
    `${API_BASE}/${facilityId}/personalities?page=1&limit=100`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch team members" }));
    throw new Error(error.message || "Failed to load team members");
  }

  return res.json();
}

async function fetchTeamMembers(): Promise<TeamMembersResponse> {
  const token = Cookies.get("authToken");

  const res = await fetch(`${API_BASE}/facility/personalities`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load team members");
  return res.json();
}

async function createUser(payload: CreateUserPayload) {
  const token = Cookies.get("authToken");

  const res = await fetch(`${API_BASE}/auth/create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create user");
  return data;
}

/* ——— HOOKS ——— */

export function useFacilityPersonalities(facilityId: string) {
  return useQuery({
    queryKey: ["facility-personalities", facilityId],
    queryFn: () => fetchFacilityPersonalities(facilityId),
    enabled: !!facilityId, // only run if facilityId exists
    select: (data) => data?.results,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: fetchTeamMembers,
    select: (data) => data?.results,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully!");

      // refresh list
      queryClient.invalidateQueries({
        queryKey: ["team-members"],
      });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });
}
