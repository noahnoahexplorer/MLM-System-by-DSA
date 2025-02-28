// IMPORTANT: Only use this script for development
// Run with: node scripts/reset-password.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kkaefpvlkmlyzzhymnrw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYWVmcHZsa21seXp6aHltbnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY0MTg5MCwiZXhwIjoyMDU2MjE3ODkwfQ.ypIWxmxqOjOMwY8mZtFVq_3ktk9SEGGa7Vzb9gu6Mq0"; // Get this from Supabase dashboard > Settings > API

// WARNING: Never commit your service role key to git
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const email = "noahgoh1022@gmail.com";
  const newPassword = "asdf1234";
  
  try {
    // First, get the user by email
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error listing users:", usersError);
      return;
    }
    
    // Find the user with the matching email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error("User not found with email:", email);
      return;
    }
    
    console.log("Found user:", user.id);
    
    // Update the user's password
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (error) {
      console.error("Error updating password:", error);
    } else {
      console.log("Password updated successfully for", email);
    }
  } catch (error) {
    console.error("Exception:", error);
  }
}

resetPassword(); 