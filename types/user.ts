export type UserRole = "citizen" | "officer" | "admin";

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  email?: string;
  phone?: string;
  verified?: boolean;
  identity_verified?: boolean;
};
