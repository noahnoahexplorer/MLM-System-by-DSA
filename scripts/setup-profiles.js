// Run with: node scripts/setup-profiles.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kkaefpvlkmlyzzhymnrw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYWVmcHZsa21seXp6aHltbnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY0MTg5MCwiZXhwIjoyMDU2MjE3ODkwfQ.ypIWxmxqOjOMwY8mZtFVq_3ktk9SEGGa7Vzb9gu6Mq0";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupProfiles() {
  try {
    // 1. Check if profiles table exists
    console.log("Checking if profiles table exists...");
    const { data: tableExists, error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .maybeSingle();
    
    // If we get a "relation does not exist" error, create the table
    if (tableError && tableError.code === '42P01') {
      console.log("Profiles table doesn't exist. Creating it...");
      
      // Create the profiles table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            username TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
          );
          
          -- Set up RLS
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Users can view their own profile" 
            ON public.profiles 
            FOR SELECT 
            USING (auth.uid() = id);
          
          CREATE POLICY "Users can update their own profile" 
            ON public.profiles 
            FOR UPDATE 
            USING (auth.uid() = id);
            
          CREATE POLICY "Admins can view all profiles" 
            ON public.profiles 
            FOR SELECT 
            USING (
              auth.uid() IN (
                SELECT id FROM public.profiles WHERE role = 'admin'
              )
            );
            
          CREATE POLICY "Admins can update all profiles" 
            ON public.profiles 
            FOR UPDATE 
            USING (
              auth.uid() IN (
                SELECT id FROM public.profiles WHERE role = 'admin'
              )
            );
        `
      });
      
      if (createError) {
        // Try a simpler approach if the RPC fails
        console.error("Error creating profiles table with RPC:", createError);
        
        const { error: simpleCreateError } = await supabase
          .from('profiles')
          .insert({ id: '00000000-0000-0000-0000-000000000000', username: 'temp', role: 'user' })
          .select();
          
        if (simpleCreateError && simpleCreateError.code !== '23505') { // Ignore duplicate key errors
          console.error("Error creating profiles table:", simpleCreateError);
          return;
        }
      }
      
      console.log("Profiles table created successfully");
    } else if (tableError) {
      console.error("Error checking profiles table:", tableError);
      return;
    } else {
      console.log("Profiles table already exists");
    }
    
    // 2. Get all users without profiles
    console.log("Getting users...");
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error listing users:", usersError);
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    // 3. For each user, check if they have a profile and create one if not
    for (const user of users) {
      console.log(`Checking profile for user: ${user.email}`);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error(`Error checking profile for user ${user.email}:`, profileError);
        continue;
      }
      
      if (!profile) {
        console.log(`Creating profile for user: ${user.email}`);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email.split('@')[0],
            role: 'admin', // Set all users as admin for now
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`Error creating profile for user ${user.email}:`, insertError);
        } else {
          console.log(`Profile created successfully for user: ${user.email}`);
        }
      } else {
        console.log(`Profile already exists for user: ${user.email}`);
        
        // Update the role to admin
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`Error updating role for user ${user.email}:`, updateError);
        } else {
          console.log(`Role updated to admin for user: ${user.email}`);
        }
      }
    }
    
    console.log("Setup completed successfully");
  } catch (error) {
    console.error("Exception during setup:", error);
  }
}

setupProfiles(); 