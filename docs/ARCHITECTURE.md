# Architecture

See CLAUDE.md section 5 for the full architecture diagram.

```
Owner browser (React SPA on Cloudflare Pages)
   | Supabase Auth (single owner) + Realtime + RLS
   v
Supabase: Postgres (queue, runs, insights cache) | Storage | Edge Functions
   ^                         | dispatch-run: verify JWT -> GitHub workflow_dispatch
   |                         v
GitHub Actions (cron + dispatch): ingest | generate | publish | sync-insights
   |            |              |                     |
Telegram     Gemini     Instagram Graph API    Pexels / Unsplash
```

## Key Principles

- Browser never sees Instagram token, Gemini key, or GitHub token
- Heavy work runs in GitHub Actions
- Workspace UI driven by Supabase Realtime subscriptions to runs / run_steps
- Dry-run by default: nothing publishes without explicit opt-in
