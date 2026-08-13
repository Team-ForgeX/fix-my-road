export type UserRole = "client" | "admin";

export type UserProfile = {
  id: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  identity_verified?: boolean;
  avatar_url?: string | null;
};

