# RikTech AI
Simple Next.js app + API that implements a local rule-based "AI" (no external integrations). Ready for Vercel.

## How to run locally
1. Install dependencies:
   ```
   npm install
   ```
2. Run dev:
   ```
   npm run dev
   ```
3. Open http://localhost:3000

## Deploy to Vercel
1. Create a new project on Vercel and link this repository or upload the project.
2. Vercel will detect Next.js and deploy automatically.

## Notes
- The API stores session histories in `/data` folder (server-side). On Vercel serverless functions, ephemeral filesystem may not persist across invocations. For persistent storage, use a database (not included per request).
- This project intentionally avoids third-party AI integrations and uses a rule-based fallback reply generator.


## Engine update
- Engine improved to TF-IDF similarity + rules (local-only). Version 1.1.
