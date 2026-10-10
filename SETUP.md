# Turning on accounts for Edge

Edge works without this setup: everyone can practice, and progress saves in their browser. These steps switch on sign-up, login, sync and the leaderboard. They take about 10 minutes and use Supabase's free tier.

## 1. Create a Supabase project
1. Go to https://supabase.com and sign up (free).
2. Click **New project**, name it `edge`, set a database password (save it somewhere safe), and pick a region near your users.

## 2. Create the database tables
1. In your project, open **SQL Editor**, then **New query**.
2. Paste everything from `supabase/schema.sql` and click **Run**. You should see "Success".
   It's safe to run again later. It also sets up the weekly leagues (weekly XP columns and the `league` function).

## 3. Connect the website
1. Open **Project Settings > API**.
2. Copy the **Project URL** and the **anon public** key.
3. Paste them into `assets/config.js`:
   ```js
   window.EDGE_CONFIG = {
     supabaseUrl: "https://YOUR-PROJECT.supabase.co",
     supabaseAnonKey: "YOUR-ANON-KEY"
   };
   ```
   The anon key is meant to be public. The database rules in `schema.sql` make sure each user can only read and change their own data. **Never** paste the `service_role` key into the website.

## 4. Set the login redirect addresses
In **Authentication > URL Configuration**:
- **Site URL**: your live site address, for example `https://yourname.github.io/edge/`
- **Redirect URLs**: add `https://yourname.github.io/edge/account.html` and `https://yourname.github.io/edge/reset.html`
  (add `http://127.0.0.1:8123/account.html` and `http://127.0.0.1:8123/reset.html` too if you test locally).

## 5. Before launch
- Replace every **[add your contact email]** in `privacy.html`, `terms.html` and `about.html`. They're generated from `.impeccable/tpl/*.body.html`, so edit those too, or just edit the HTML pages directly.
- Supabase's built-in email sender is rate-limited and meant for testing. For real users, set up custom SMTP under **Authentication > Emails** (for example with Resend or Postmark).
- Have someone you trust read the Privacy Policy and Terms. They're solid templates, not legal advice.

## Known limits
- Scores are calculated in the browser, so a determined user could fake their leaderboard XP. That's fine for a practice site. Server-side scoring is the fix if it ever matters.
- Progress syncs about 1.5 seconds after each change. If two devices are used at the same time, solved problems and streak days are combined, and ratings follow whichever device has more XP.
