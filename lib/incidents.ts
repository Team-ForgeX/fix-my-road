import { createClient } from "./supabase/server";

export async function getIncidents() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching incidents:", error);
    throw new Error(error.message);
  }

  return data;
}