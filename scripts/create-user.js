// IMPORTANT: Only use this script for development
// Run with: node scripts/create-user.js

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

async function createUser() {
  const email = "noahgoh1022@gmail.com";
  const password = "asdf1234";
  
  try {
    // Create a new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Skip email confirmation
    });
    
    if (error) {
      console.error("Error creating user:", error);
    } else {
      console.log("User created successfully:", data.user);
      
      // Create a profile for the user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: email.split('@')[0],
          role: 'admin', // Set the role as needed
          created_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error("Error creating profile:", profileError);
      } else {
        console.log("Profile created successfully for user:", data.user.id);
      }
    }
  } catch (error) {
    console.error("Exception:", error);
  }
}

createUser(); 