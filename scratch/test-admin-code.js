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

if (!supabaseUrl || !serviceKey) {
  console.error("Missing credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  console.log("Checking admin_access_codes table...");
  const { data: codes, error: err } = await supabase
    .from("admin_access_codes")
    .select("*");
  
  if (err) {
    console.error("Error fetching codes:", err);
  } else {
    console.log("Active codes:", codes);
  }

  // Check validate_admin_signup_code RPC
  const testCode = "ADMIN2024FIX";
  console.log(`Testing RPC validate_admin_signup_code with '${testCode}'...`);
  const { data: isValid, error: rpcErr } = await supabase.rpc("validate_admin_signup_code", {
    p_code: testCode
  });

  if (rpcErr) {
    console.error("RPC Error:", rpcErr);
  } else {
    console.log(`Is '${testCode}' valid?`, isValid);
  }
}

test();
