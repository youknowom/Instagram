# Setup Guide

Complete these steps in order. This is **HUMAN GATE 0** — the system cannot proceed until these are done.

## 1. Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/) and create a new app (type: **Consumer** or **None**).
2. Add the **Instagram** product to the app.
3. In **App Settings > Basic**, note your **App ID** and **App Secret**.

## 2. Instagram Account Setup

1. Ensure your Instagram account is a **Professional** account (Business or Creator).
   - Go to Instagram > Settings > Account > Switch to Professional Account.
   - The spec says Creator _may_ work; try Creator first and report back at Gate 2.
2. In the Meta Developer App:
   - Go to **Instagram > API setup with Instagram Login**
   - Add your Instagram account as an **Instagram Tester**.
   - Open the Instagram app on your phone and accept the tester invite:
     **Settings > Website permissions > tester invites**.
3. Generate a **short-lived access token** from the API setup page.
4. Required permissions:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
   - `instagram_business_manage_insights`

## 3. Page Publishing Authorization

If your Instagram account is linked to a Facebook Page, complete **Page Publishing Authorization** for that page. Without this, publishing will fail.

## 4. Supabase Project

1. Create a free project at [supabase.com](https://supabase.com/).
2. Note your **Project URL**, **Anon Key**, and **Service Role Key** (Settings > API).
3. Run the initial migration:
   - Option A: Copy `supabase/migrations/00001_initial_schema.sql` and run it in the SQL Editor.
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
   - `IG_APP_SECRET`
   - `IG_USER_ID`
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
