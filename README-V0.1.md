# NHL Coaching Insights — v0.1

Interactive iPad-first demonstration of the NHL Coaching Insights application.

## Run locally

1. Install Node.js 20 or newer and pnpm.
2. From the project root run `pnpm install`.
3. Run `pnpm --filter @workspace/mockup-sandbox dev`.
4. Open the local URL shown by Vite.

## Direct preview routes

Append one of these query strings to the preview URL:

- `?screen=dashboard`
- `?screen=featured`
- `?screen=players`
- `?screen=video`
- `?screen=stats`
- `?screen=onboarding2`
- `?screen=onboarding4`

## Demo controls

Press **Start Demo** to begin the Game 4 timeline. The toolbar then exposes **Restart**, **skip 30 sec**, **skip 5 min**, and **Pause/Resume**. Skip controls jump the game clock immediately and recompute score, shots, penalties, strength state, six-player TOI/on-ice status, faceoff display, and AI insight state at the destination timestamp.

## Design target

The interface is optimized for an 11-inch iPad landscape viewport and follows the approved dark Figma system: SF system font stack, screen margin 40, element gap 24, widget padding 12, widget gap 20, radius 20, no widget stroke, and no drop shadow.
