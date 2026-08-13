import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("🔍 Admin client init - Service Role Key loaded:", !!serviceRoleKey);
  console.log("🔍 URL:", supabaseUrl);

  if (!serviceRoleKey) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key (will hit RLS)");
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }

  console.log("✅ Using service role key (should bypass RLS)");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
