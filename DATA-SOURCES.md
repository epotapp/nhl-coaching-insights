# Game 4 data provenance

Version 0.1 uses Carolina Hurricanes at Vegas Golden Knights, Stanley Cup Final Game 4, June 9, 2026 (NHL game 2025030414), final score Carolina 5–3 Vegas.

Primary official NHL reports:

- Play-by-Play: `https://www.nhl.com/scores/htmlreports/20252026/PL030414.HTM`
- Event Summary: `https://www.nhl.com/scores/htmlreports/20252026/ES030414.HTM`
- Faceoff Summary: `https://www.nhl.com/scores/htmlreports/20252026/FS030414.HTM`
- Away Team Time On Ice: `https://www.nhl.com/scores/htmlreports/20252026/TV030414.HTM`

Exact timestamp-bound data in the demo includes goals, Carolina shots on goal, identified Vegas shots, penalties/strength windows, period clock, score, and exact shift intervals for the six players shown in the primary TOI widget. Official final team totals and player totals are used throughout the static and final-state views.

Where the public reports do not expose a compact timestamp series already used by a widget, interim ancillary counters progress deterministically toward their official final totals. These derived counters do not change the official score, goal timing, shot timing, penalty timing, player totals, or final team totals.
