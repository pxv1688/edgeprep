/* Site settings. Everything here is safe to be public.

   Accounts: paste your Supabase project's URL and anon (public) key to switch on sign-up, sync and leaderboards.
   Find them in Supabase: Project Settings > API. Row level security in supabase/schema.sql protects each user's data.
   Leave them empty and Edge runs in local mode: no accounts, progress saved in the browser.

   googleSignIn: set to true after enabling the Google provider in Supabase (SETUP.md, "Google sign-in").
   googleClientId: the Web client ID from Google Cloud. With it, sign-in happens on this site in a Google popup,
   so people see your domain instead of the supabase.co address.

   goatcounter: your GoatCounter site code (the "edge" in edge.goatcounter.com) for cookie-free visitor stats.
   Leave empty to turn analytics off. See SETUP.md, "Visitor stats". */
window.EDGE_CONFIG = {
  supabaseUrl: "https://qabnryplxriirciusydx.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYm5yeXBseHJpaXJjaXVzeWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDQ1ODYsImV4cCI6MjEwNzQyMDU4Nn0.bwcFpEP1MtvK3YgNpo2HGUb-DYxZIy-DGeyu3bXP8iw",
  googleSignIn: true,
  googleClientId: "682512300052-g0tldultuluidg9pmp1notcj2n3p5p1g.apps.googleusercontent.com",
  goatcounter: "edgeprep"
};
