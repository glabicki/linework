# Linework

Every ride, drawn. Log your NYC subway rides; each day becomes a print drawn from the real routes.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Add `?demo` to the URL to fill October to today with sample rides (on the live site it only does this on a phone with no rides yet). Open http://localhost:3000/phone to see it in an iPhone-sized frame.

## Test

```bash
npm test
```

## How it's put together

- `app/` – Next.js App Router. The app is one screen (`/`), plus `/privacy`, `/terms`, `/phone` (the desktop phone frame) and a 404 page.
- `components/` – one file per screen: Today, RideSheet, Prints, DayPage, MakePrint, AddRide, Recaps, YearSoFar, YearStory, Account, Onboarding, Intro. `art.tsx` draws prints, cards and line marks.
- `lib/lines.ts` – line colors, names, stations, service notes, ride times.
- `lib/art.ts` – the plotter line, the stretch of a line you rode, and print framing.
- `lib/usual.ts` – your usual stretch on a line and your usual ride around now, learned from your own rides.
- `lib/poster.ts` – the saved poster (SVG and PNG at 150 dpi).
- `lib/rides.ts` – rides and settings, kept on the phone (localStorage), plus the backup file.
- `lib/recaps.ts` – which recap cards show on Today, and the year grid size.
- `lib/data/` – routes, stations and station positions built from the MTA GTFS feed. `scripts/refresh_gtfs.py` rebuilds routes and stations; `scripts/station_pos.py` then places each station along its route (`stops.json`).
- `public/sw.js` – opens the app from cache when there's no signal.
- Colors and type come from the Figma file's variables and text styles (`app/globals.css`).

## Not built yet

- Accounts and syncing (Supabase, email code sign-in). For now, backup is a file you save from Account.
- The Share today screen and push notifications (reminders need a server).
