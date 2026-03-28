import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client using the service role key, bypassing RLS.
 * For server-side use only — never expose this client to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
