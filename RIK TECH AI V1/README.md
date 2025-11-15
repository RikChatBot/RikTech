# RikTech AI — Vercel-ready (self-contained)

This project contains a self-contained AI engine (lightweight rule-based + TF-IDF retrieval)
and a frontend SPA. It's configured to deploy on Vercel using serverless functions in /api.

IMPORTANT: Vercel serverless functions have an ephemeral filesystem. The included file-based
storage (data/*.json) will not persist reliably on Vercel. For production, replace utils/db.js
with a proper external database (MongoDB, Supabase, etc.).

To run locally:
1. Install dependencies: `npm install`
2. Install Vercel CLI and run `vercel dev` or deploy to Vercel dashboard.

