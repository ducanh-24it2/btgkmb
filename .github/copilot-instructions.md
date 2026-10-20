# BIT230216_FoodManager Workspace Notes

- Application: React Native with Expo and TypeScript.
- Student: Trần Đăng Khôi, BIT230216.
- Keep every local SQLite table and column name prefixed with `BIT230216_`.
- Keep every application-owned API data field prefixed with `BIT230216_`.
- SQLite is the source of truth. Preserve local-first writes and queue failed API mutations for retry.
- Keep user-visible strings in `localization/i18n.ts` for both English and Vietnamese.
- Use the existing screen, database, model, and service boundaries when extending features.

## Setup Checklist

- [x] Clarify requirements: Expo, TypeScript, SQLite, CRUD, bilingual UI, offline sync.
- [x] Scaffold project as `BIT230216_FoodManager`.
- [x] Implement the requested food management flows.
- [x] Add README and MockAPI environment example.
- [x] Required extensions: none for this project.
- [x] VS Code TypeScript diagnostics: no errors reported.
- [ ] Install dependencies and run Expo typecheck/build: blocked because Node.js/npm are unavailable in the current terminal.
- [ ] Launch the app: requires dependency installation and user confirmation before launch.