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
  console.log("Querying function schema...");
  const { data, error } = await supabase.rpc("validate_admin_signup_code", {
    p_code: "foo"
  }).catch(e => ({ error: e }));

  // Let's run a raw sql query via standard endpoints if possible, or check extension schema
  const { data: funcData, error: funcErr } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  console.log("Connection check:", { data: !!funcData, error: funcErr });

  // Let's execute some simple queries using postgres catalog if possible, via RPC?
  // Since we don't have a direct SQL runner RPC, we can look at pg_proc
}

test();
