const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Manually parse .env file
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  console.log("Fetching a profile to test update...");
  const { data: profiles, error: getErr } = await supabase
    .from("profiles")
    .select("id, role")
    .limit(1);

  if (getErr) {
    console.error("Error fetching profiles:", getErr);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("No profiles found in database.");
    return;
  }

  const targetProfile = profiles[0];
  console.log("Target profile found:", targetProfile);

  console.log("Testing role update to the same value...");
  const { data: updated, error: updateErr } = await supabase
    .from("profiles")
    .update({ role: targetProfile.role })
    .eq("id", targetProfile.id)
    .select();

  if (updateErr) {
    console.error("Error updating profile role:", updateErr);
  } else {
    console.log("Profile updated successfully:", updated);
  }
}

test();
