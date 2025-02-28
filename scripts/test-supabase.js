// Run this with: node scripts/test-supabase-direct.js
const { createClient } = require('@supabase/supabase-js');

// Directly use the values from your .env file
const supabaseUrl = "https://kkaefpvlkmlyzzhymnrw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYWVmcHZsa21seXp6aHltbnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NDE4OTAsImV4cCI6MjA1NjIxNzg5MH0.o06jOLLziaGTNNtqXWHRXnkDZNp353ehNy25kRaWUC0";

console.log("Testing Supabase connection with hardcoded values");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error connecting to Supabase:", error);
    } else {
      console.log("Successfully connected to Supabase!");
      console.log("Session data:", data);
    }
  } catch (err) {
    console.error("Exception during Supabase connection test:", err);
  }
}

testConnection(); 