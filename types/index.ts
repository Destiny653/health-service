// types/index.ts

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  // ... other user fields
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
}

export interface Member {
  userId: string;
  role: string;
  user: User;
}

// DTOs for API requests
export interface InviteMemberDto {
  email: string;
  organizationId: string;
  role: string;
  teamId?: string;
}

export interface CreateOrganizationDto {
  name: string;
  logo?: string;
}

// ... add all other DTOs and response types

// types/index.ts

// API Response Objects
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: any;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  image?: string;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
}

export interface Member {
  organizationId: string;
  userId: string;
  role: string;
  user: User; // Assuming the API returns the nested user object
}

export interface Role {
  id: string;
  name: string;
  organizationId: string;
  permissions: Record<string, string[]>;
}

// Data Transfer Objects (DTOs)
export interface SigninDto {
  username: string;
  password?: string;
  redirectUrl?: string;
}

export interface CreateUserDto extends SigninDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email: string;
  gender?: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface PersonalityData {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female";
  email: string[];
  phone: string[];
  role: Role;
  facility_type: "health_center";
  facility_id: string;
}


export interface CreateOrganizationDto {
  name: string;
  logo?: string;
}

export interface InviteMemberDto {
  email: string;
  organizationId: string;
  role: string;
  teamId?: string;
}

export interface UpdateMemberRoleDto {
  organizationId: string;
  userId: string;
  role: string;
}

export interface UpdateOrganizationDto {
  name: string;
  slug: string;
}

export interface Role {
  id: string;
  name: string;
  organizationId: string;
  description?: string; // Add description
  permissions: Record<string, string[]>;
  // For UI display from dummy data
  memberCount?: number;
  status?: "Active" | "Paused";
}



// Define the structure of permissions:
// Record<AppName, Record<ResourceName, Action[]>>
// Example: { "potta": { "Customers": ["create", "read"] }, "ads": { "Campaigns": ["read"] } }
export type PermissionsMap = Record<string, Record<string, string[]>>;

// DTO for creating a new role

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: PermissionsMap;
}

// DTO for updating an existing role
export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: PermissionsMap;
}

// DTO for assigning a role to a user
export interface AssignUserRoleDto {
  roleId: string;
}

// DTO for updating a member's role (if a member can have multiple roles or their role is updated)
export interface UpdateMemberRoleDto {
  organizationId: string; // Assuming organization context is needed
  userId: string;
  role: string; // The role ID or name
}

// Interface for a Role as returned by the API
export interface Role {
  id: string;
  name: string;
  organizationId: string; // Assuming roles are tied to an organization
  description?: string;
  permissions: Record<string, string[]>;
  // Additional fields for UI display (might not come directly from API)
  memberCount?: number;
  status?: "Active" | "Paused"; // Example statuses
}

// DTO for API response when fetching a list of roles
export interface RoleResponseDto {
  id: string;
  name: string;
  organizationId: string;
  permissions: Record<string, string[]>;
  // Add other fields as per your API response for a single role
}

// DTO for sign-in (assuming you have one, just for context)
export interface SigninDto {
  email: string;
  password?: string;
}

// You might also need a general API response structure if your backend wraps responses
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
