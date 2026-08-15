import { redirect } from "next/navigation";

export async function requireAuth() {
  const { createClient } = await import("./supabase/server");
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return data.user;
}

export async function requireVerifiedUser() {
  const user = await requireAuth();

  if (!user.email_confirmed_at) {
    redirect("/verify");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireVerifiedUser();

  const { createClient } = await import("./supabase/server");
  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}
