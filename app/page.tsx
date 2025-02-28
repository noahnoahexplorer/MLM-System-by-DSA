import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // This is a server component, we don't set cookies here
        },
        remove(name: string, options: any) {
          // This is a server component, we don't remove cookies here
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  } else {
    redirect("/weekly-commission");
  }
}