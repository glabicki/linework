# Linework

Every ride, drawn. Log your NYC subway rides; each day becomes a print drawn from the real routes.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Add `?demo` to the URL to fill October to today with sample rides.

## How it's put together

- `app/` – Next.js App Router. One screen (`/`) plus `/privacy`.
- `components/` – one file per screen: Today, RideSheet, Prints, DayPage, MakePrint, AddRide, Recaps, Account. `art.tsx` draws prints, cards and line marks.
- `lib/lines.ts` – line colors, names, service notes, ride times.
- `lib/art.ts` – the plotter line and print framing.
- `lib/poster.ts` – the saved poster (SVG, PNG at 150 dpi, and print).
- `lib/rides.ts` – rides and settings, kept on the phone (localStorage).
- `lib/data/` – routes and stations built from the MTA GTFS feed. `scripts/refresh_gtfs.py` rebuilds them.
- Colors and type come from the Figma file's variables and text styles (`app/globals.css`).

## Not built yet

- Accounts and backup (Supabase, email code sign-in) and syncing.
- Onboarding, the 2026, Drawn. replay, recap notifications, share images.
- Deploy to Vercel.
