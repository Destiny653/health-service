"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { FacilityPayload, FacilityResponse } from "../types";

// -------------------- API --------------------
const API_BASE = "http://173.249.30.54/dappa";

// GET children facilities
async function fetchFacilities(parentId: string): Promise<FacilityResponse> {
  const token = Cookies.get("authToken");

  const res = await fetch(
    `${API_BASE}/facility/children/${parentId}?page=1&limit=100`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to load facilities");
  }

  return res.json();
}

// POST create facility
async function createFacility(payload: FacilityPayload) {
  const token = Cookies.get("authToken");

  const res = await fetch(`${API_BASE}/facility/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.detail || "Failed to create facility");
  }

  return data;
}

// -------------------- HOOKS --------------------

// GET hook
export function useGetFacilities(parentId: string) {
  return useQuery<FacilityResponse>({
    queryKey: ["facilities", parentId],
    queryFn: () => fetchFacilities(parentId),
  });
}

// POST hook
export function useCreateFacility() {
  return useMutation({
    mutationFn: (payload: FacilityPayload) => createFacility(payload),
  });
}
