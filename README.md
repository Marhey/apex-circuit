# Apex Circuit

An original browser arcade game by Marcus Heygster, exported from the source used on his personal website.

**[Play Apex Circuit on Marcus’s website](https://marcusheygster.com/apex-circuit)**

## Play locally

Install Node.js 22.13 or newer, then run:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

The `dist/` folder can be served by a static web host. Relative asset paths support deployment under a subdirectory. This repository does not automatically redeploy Marcus’s website.

## Controls and scoring

Use Left/Right or A/D to steer, Up/W to accelerate, Down/S or Space to brake, and P to pause. Touch controls and drag steering are included. Auto throttle starts on. Finish three laps within 180 seconds; cleaner and faster races earn more points.

Optional synthesized sound, pause and resume, responsive artwork, and personal records are included. Personal records and the standalone top 20 nickname leaderboard use browser localStorage.

## Source

The `src/game/` files contain the original gameplay component, TypeScript engine, canvas artwork, and styles without changes. Their hashes are recorded in `source-provenance.json`. The game uses React and Vite; artwork and sound are produced in code, with no external game assets required.

The website page shell is adapted for standalone rendering. Navigation links lead back to the live website. The standalone leaderboard saves locally and sends no scores to the production service. Clearing browser storage removes these local records.

`website-integration/` preserves the original website page and shared leaderboard component for reference. That integration depends on the website’s session endpoint, ranked run endpoints, server validation, and database; those services are not part of this standalone repository. Play the live edition for the shared leaderboard.

## Attribution

Created by Marcus Heygster with AI assistance. Original artwork and game code. No license grant is added by this export.
