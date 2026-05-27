import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️  Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env'
  );
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const WATCHLIST_TABLE = process.env.SUPABASE_WATCHLIST_TABLE || 'watchlist';
