

//const SUPABASE_URL  "https://csjjfgklyzvnjdemdcrl.supabase.co";
//const SUPABASE_PUBLISHABLE_KEY  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzampmZ2tseXp2bmpkZW1kY3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzE0MDcsImV4cCI6MjA2NzcwNzQwN30.iWm4I_jm0di-XstiXKbIqlYLX5kVIXfI09r0nq8Ee68";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// integrations/supabase/client.ts
//  Automatically initializes the Supabase client with proper types and auth config.
// integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // remove this line if no `types.ts` exists

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    },
  }
);
