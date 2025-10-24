// types/user.ts
// Defines TypeScript interfaces for user data, authentication payloads, and API responses.

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  isVerified: boolean;
  // Add other user fields as needed
}

export interface LoginPayload {
  email: string;
  password?: string; // Password might be optional if using OTP login
}

export interface RegisterPayload {
  country: string;
  email: string;
  password?: string;
  receiveEmailUpdates: boolean;
  agreeToTerms: boolean;
}

export interface BusinessInfoPayload {
  businessLegalName: string;
  industry: string;
  description: string;
  employees: string; // e.g., "5 - 10"
  website: string;
}

export interface AddressInfoPayload {
  country: string;
  address: string;
  state: string;
  city: string;
  postalCode: string;
  businessPhoneNumber: string;
  businessEmail: string;
}

export interface IdentityVerificationPayload {
  businessType: string;
  incorporationDocument: File | null; // For file upload, will be mocked
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}