// Supabase project credentials — both values are safe to ship in the client
// bundle (the anon key is public by design; Row Level Security protects data).
//
// Setup: create a free project at https://supabase.com/dashboard, run
// supabase/schema.sql in its SQL Editor, then paste the values from
// Project Settings → API here. While these are empty, the app runs in
// local-only mode (accounts and data stay on the device).

export const SUPABASE_URL = ''
export const SUPABASE_ANON_KEY = ''

export const isCloudConfigured = /^https:\/\/.+\.supabase\.co$/.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20
