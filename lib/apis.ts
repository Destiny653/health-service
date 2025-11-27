// src/lib/api.ts
import Cookies from "js-cookie";
import { PersonalityData } from "@/types";

// 1. Get User Personality / Profile
export const getPersonality = async () => {
  const token = Cookies.get("authToken");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/personality/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch personality");
  return res.json();
};