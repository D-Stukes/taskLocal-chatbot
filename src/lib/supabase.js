import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Deliberately never throws: an earlier version of this module threw at
// import time when either env var was missing, which crashed the whole app
// on load instead of just the Supabase-backed features. `supabase` is null
// when unconfigured, and every call site below falls back to the bundled
// CSV demo data instead.
export const supabase =
  supabaseUrl && supabasePublishableKey ? createClient(supabaseUrl, supabasePublishableKey) : null;
