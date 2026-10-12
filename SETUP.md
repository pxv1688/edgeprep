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

## Google sign-in (optional, recommended)
One-click sign-in gets far more sign-ups than email and password.
1. Go to https://console.cloud.google.com, create a project (e.g. "Edge"), then open **APIs & Services > OAuth consent screen**. Choose **External**, enter the app name "Edge", your support email and your domain, and save. Add the scopes `email`, `profile` and `openid` (they're the defaults).
2. Open **Credentials > Create credentials > OAuth client ID**. Type: **Web application**.
   - **Authorized JavaScript origins:** `https://yourdomain.com`
   - **Authorized redirect URIs:** `https://YOUR-PROJECT.supabase.co/auth/v1/callback` (Supabase shows this exact URL on its Google provider page).
3. Copy the **Client ID** and **Client secret**.
4. In Supabase: **Authentication > Providers > Google**, switch it on and paste both values. Save.
5. In `assets/config.js`, set `googleSignIn: true`. The "Continue with Google" button appears on the sign-in page.
6. Back in Google Cloud, click **Publish app** on the consent screen, so people outside your test-user list can sign in.

## Visitor stats (optional)
Edge uses GoatCounter: free for non-commercial sites, no cookies, no consent banner needed.
1. Sign up at https://www.goatcounter.com and pick a site code, e.g. `edge` (your dashboard becomes `edge.goatcounter.com`).
2. Put the code in `assets/config.js`: `goatcounter: "edge"`.
3. Push the change. Visits show up in the dashboard within a minute. Each app screen is counted as its own page (e.g. `/app/bank`, `/app/rush`), so you can see which games people actually play.

## Where your data shows up
In the Supabase dashboard, open **Table Editor**:
- **feedback:** problem reports ("The answer is wrong", "Unclear", "Typo") with the problem key, plus messages from the About page form. Sort by `created_at` to see the newest.
- **subscribers:** the weekly-puzzle email list. Export it as CSV from the table's menu.
- **profiles / progress:** each account's profile and synced practice.

Reports people sent before you connected Supabase were saved in their browsers. They arrive automatically the next time those people open the site.

## Sending the weekly puzzle email
Edge collects subscribers but doesn't send email by itself. Pick a newsletter service (Buttondown, Beehiiv and Mailchimp all have free tiers), import the CSV from **subscribers**, and post one puzzle a week. Remove anyone who unsubscribes there from the table too (set `unsubscribed_at`).

## Backups
Supabase's free plan doesn't include automatic backups you can restore. Once a week, export **profiles**, **progress**, **feedback** and **subscribers** as CSV from the Table Editor, or upgrade to a paid plan for daily backups.

## Known limits
- Scores are calculated in the browser, so a determined user could fake their leaderboard XP. That's fine for a practice site. Server-side scoring is the fix if it ever matters.
- Progress syncs about 1.5 seconds after each change. If two devices are used at the same time, solved problems and streak days are combined, and ratings follow whichever device has more XP.
