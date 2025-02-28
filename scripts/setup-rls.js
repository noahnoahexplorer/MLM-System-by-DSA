// Run with: node scripts/setup-rls.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kkaefpvlkmlyzzhymnrw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYWVmcHZsa21seXp6aHltbnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY0MTg5MCwiZXhwIjoyMDU2MjE3ODkwfQ.ypIWxmxqOjOMwY8mZtFVq_3ktk9SEGGa7Vzb9gu6Mq0";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRLS() {
  try {
    console.log("Setting up RLS policies...");
    
    // Enable RLS on profiles table
    const { error: enableRLSError } = await supabase.rpc('enable_rls_on_profiles');
    
    if (enableRLSError) {
      console.log("Could not enable RLS via RPC (this is normal if the function doesn't exist)");
      console.log("You'll need to enable RLS manually in the Supabase dashboard:");
      console.log("1. Go to https://app.supabase.com/project/kkaefpvlkmlyzzhymnrw/editor");
      console.log("2. Select the 'profiles' table");
      console.log("3. Go to 'Policies' tab");
      console.log("4. Click 'Enable RLS'");
      console.log("5. Add the following policies:");
      console.log("   - Users can view their own profile");
      console.log("   - Users can update their own profile");
      console.log("   - Admins can view all profiles");
      console.log("   - Admins can update all profiles");
    }
    
    console.log("\nSetup completed. Please check your Supabase dashboard to verify RLS settings.");
  } catch (error) {
    console.error("Exception during RLS setup:", error);
  }
}

setupRLS(); 