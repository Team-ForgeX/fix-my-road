export type UserProfile = {
  id: string;
  full_name: string;
  role: "citizen" | "admin" | "moderator";
  avatar_url?: string;
};
