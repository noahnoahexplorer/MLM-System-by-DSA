import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Add debugging to check if environment variables are loaded correctly
console.log("Supabase URL:", supabaseUrl ? "Loaded" : "Missing");
console.log("Supabase Anon Key:", supabaseAnonKey ? "Loaded" : "Missing");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing!");
}

// Create a standard Supabase client for direct usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a browser client for client components
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

// Create a server client for server components
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { path: string; maxAge: number; domain?: string; sameSite?: string; secure?: boolean }) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: { path: string; domain?: string; sameSite?: string; secure?: boolean }) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );
} 