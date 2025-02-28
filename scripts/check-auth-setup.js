const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kkaefpvlkmlyzzhymnrw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYWVmcHZsa21seXp6aHltbnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY0MTg5MCwiZXhwIjoyMDU2MjE3ODkwfQ.ypIWxmxqOjOMwY8mZtFVq_3ktk9SEGGa7Vzb9gu6Mq0";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthSetup() {
  try {
    console.log("Checking Supabase auth setup...");
    
    // 1. Check if auth is enabled
    console.log("Checking auth settings...");
    const { data: authSettings, error: authError } = await supabase.rpc('get_auth_settings');
    
    if (authError) {
      console.log("Could not get auth settings directly. This is normal.");
    } else {
      console.log("Auth settings:", authSettings);
    }
    
    // 2. List users
    console.log("\nListing users...");
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error listing users:", usersError);
      return;
    }
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.id})`);
    });
    
    // 3. Check profiles table
    console.log("\nChecking profiles table...");
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error("Error checking profiles table:", profilesError);
      
      // Try to create the profiles table
      console.log("Attempting to create profiles table...");
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            username TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
          );
        `
      });
      
      if (createTableError) {
        console.error("Error creating profiles table:", createTableError);
      } else {
        console.log("Profiles table created successfully");
      }
    } else {
      console.log(`Found ${profilesData.length} profiles:`);
      profilesData.forEach(profile => {
        console.log(`- ${profile.id} (${profile.username}, ${profile.role})`);
      });
      
      // 4. Check for users without profiles
      const userIds = users.map(u => u.id);
      const profileIds = profilesData.map(p => p.id);
      const usersWithoutProfiles = users.filter(u => !profileIds.includes(u.id));
      
      if (usersWithoutProfiles.length > 0) {
        console.log("\nFound users without profiles. Creating profiles for them...");
        
        for (const user of usersWithoutProfiles) {
          console.log(`Creating profile for ${user.email}...`);
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.email.split('@')[0],
              role: 'admin',
              created_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error(`Error creating profile for ${user.email}:`, insertError);
          } else {
            console.log(`Profile created successfully for ${user.email}`);
          }
        }
      } else {
        console.log("\nAll users have profiles");
      }
    }
    
    // 5. Check RLS policies
    console.log("\nChecking RLS policies...");
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles';
      `
    });
    
    if (policiesError) {
      console.error("Error checking RLS policies:", policiesError);
    } else if (policies && policies.length > 0) {
      console.log("RLS policies for profiles table:");
      policies.forEach(policy => {
        console.log(`- ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log("No RLS policies found for profiles table. Creating default policies...");
      
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Enable RLS
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
      
      if (rlsError) {
        console.error("Error creating RLS policies:", rlsError);
      } else {
        console.log("RLS policies created successfully");
      }
    }
    
    console.log("\nAuth setup check completed");
  } catch (error) {
    console.error("Exception during auth setup check:", error);
  }
}

checkAuthSetup(); 