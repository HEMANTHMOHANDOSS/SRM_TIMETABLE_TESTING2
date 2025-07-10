import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://csjjfgklyzvnjdemdcrl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzampmZ2tseXp2bmpkZW1kY3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzE0MDcsImV4cCI6MjA2NzcwNzQwN30.iWm4I_jm0di-XstiXKbIqlYLX5kVIXfI09r0nq8Ee68';

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