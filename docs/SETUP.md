# Setup Guide

Complete these steps in order. This is **HUMAN GATE 0** — the system cannot proceed until these are done.

## 1. Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/) and create or configure an app with the **Manage messaging & content on Instagram** use case.
2. Under **Use cases > Customize > Instagram API > API setup with Unified Login**, create or select a Facebook Login for Business configuration. For continuous access, use a system-user token with **Never** expiration, require an Instagram account asset, and select the Instagram permissions the product uses.
3. Register each app origin's callback in the Unified Login setup. For local development, use `http://localhost:3000/api/auth/instagram/callback`; for deployment, use `<your-app-origin>/api/auth/instagram/callback`. Select the matching registered URL when testing each origin.
4. Copy the Meta App ID and App Secret from **App Settings > Basic** into `META_APP_ID` and `META_APP_SECRET`. Copy the selected login configuration's ID into `IG_CONFIG_ID`, and set `IG_AUTH_MODE=facebook_login`.
5. During development, add the Instagram account as an **Instagram Tester** and accept the invitation. App Review and Advanced Access are required before other businesses can connect.

Older apps that still expose direct Instagram Login can instead use `IG_AUTH_MODE=instagram_login` with `IG_CLIENT_ID` and `IG_CLIENT_SECRET` from that product's setup page.

## 2. Instagram Account Setup

1. Ensure your Instagram account is a **Professional** account (Business or Creator).
   - Go to Instagram > Settings > Account > Switch to Professional Account.
2. In the Meta Developer App:
   - Go to **Instagram > API setup with Instagram Login**
   - Add your Instagram account as an **Instagram Tester**.
   - Open the Instagram app on your phone and accept the tester invite:
     **Settings > Website permissions > tester invites**.
3. The app requests these permissions during Instagram Login:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
   - `instagram_business_manage_insights`

## 3. Publishing Setup

The Unified Login configuration must include the Instagram professional account as a required asset. The product uses the granted system-user token for the selected Instagram account.

## 4. Supabase Project

1. Create a free project at [supabase.com](https://supabase.com/).
2. Note your **Project URL**, **Anon Key**, and **Service Role Key** (Settings > API).
3. Run every migration in `supabase/migrations` in filename order, including `00003_account_scoped_content.sql`:
   - Option A: Copy each migration into the SQL Editor in filename order.
   - Option B: Use the Supabase CLI: `npx supabase db push`
4. Create storage buckets:
   - `media-public`: Public read, service role writes only.
   - `library`: Private, owner-only read/write.
5. Create an owner user:
   - Sign up via email/password in your app OR create one in the Supabase Auth dashboard.
   - Run: `pnpm --filter @ig-auto/worker tsx src/scripts/claim-owner.ts`
   - Then **disable public signups** in Authentication > Settings.

## 5. Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram.
2. Create a new bot with `/newbot`.
3. Note the **Bot Token**.
4. Send a message to the bot from your account, then call:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
   Find your `chat.id` — this is your **Owner Chat ID**.

## 6. API Keys

1. **Gemini**: Get a free API key at [aistudio.google.com](https://aistudio.google.com/).
2. **Pexels**: Register at [pexels.com/api](https://www.pexels.com/api/) for a free key.
3. **Unsplash**: Register at [unsplash.com/developers](https://unsplash.com/developers/) for a demo app.

## 7. GitHub Setup

1. Ensure this repo is **public** (free Actions minutes).
2. Create a **fine-grained personal access token**:
   - Repository: this repo only
   - Permissions: **Actions: write**
3. Add the token as a Supabase Edge Function secret named `GITHUB_TOKEN`:
   ```
   npx supabase secrets set GITHUB_TOKEN=ghp_...
   ```
4. Add all other secrets to **GitHub repo Settings > Secrets and variables > Actions**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `META_APP_ID`, `META_APP_SECRET`, `IG_CONFIG_ID`, and `IG_AUTH_MODE=facebook_login` (Unified Login)
   - `IG_CLIENT_ID` and `IG_CLIENT_SECRET` (older direct Instagram Login apps only)
   - `IG_AUTH_MODE`
   - `IG_SESSION_SECRET` (optional; defaults to a server-side signing key)
   - `IG_GRAPH_API_VERSION` (defaults to the Graph version pinned in the project)
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `PEXELS_API_KEY`
   - `UNSPLASH_ACCESS_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_OWNER_CHAT_ID`

## 8. Local Development

1. Copy `.env.example` to `.env` and fill in your values.
2. Install dependencies: `pnpm install`
3. Run tests: `pnpm test`
4. Typecheck: `pnpm typecheck`

## 9. Proceed

Once all the above is complete, report back at **HUMAN GATE 0** with:

- [ ] Meta app created and Instagram product added
- [ ] Instagram professional account (Business or Creator — which one?)
- [ ] Tester invite accepted
- [ ] Short-lived token generated
- [ ] Supabase project created, migration applied, buckets created
- [ ] Owner user created and signups disabled
- [ ] Telegram bot created, owner chat ID obtained
- [ ] All API keys obtained
- [ ] GitHub secrets configured
