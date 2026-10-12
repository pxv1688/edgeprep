/* Site settings. Everything here is safe to be public.

   Accounts: paste your Supabase project's URL and anon (public) key to switch on sign-up, sync and leaderboards.
   Find them in Supabase: Project Settings > API. Row level security in supabase/schema.sql protects each user's data.
   Leave them empty and Edge runs in local mode: no accounts, progress saved in the browser.

   googleSignIn: set to true after enabling the Google provider in Supabase (SETUP.md, "Google sign-in").

   goatcounter: your GoatCounter site code (the "edge" in edge.goatcounter.com) for cookie-free visitor stats.
   Leave empty to turn analytics off. See SETUP.md, "Visitor stats". */
window.EDGE_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  googleSignIn: false,
  goatcounter: ""
};
