# RikTech AI (Next.js) - Enhanced
Project siap deploy ke Vercel. Versi ini menambahkan fitur AI yang lebih kompleks (NLU sederhana, intent detection, session-based history in-memory), export/import history, dan perbaikan UI.

Cara pakai:
1. `npm install`
2. `npm run dev`
3. Buka http://localhost:3000

Catatan:
- Session history disimpan lokal di browser dan di memory runtime pada serverless function (ephemeral).
- Untuk produksi yang tahan restart, tambahkan penyimpanan permanen (database) — saya bisa bantu jika mau.
