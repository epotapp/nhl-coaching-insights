# Visual QA — NHL Coaching Insights v0.2

The UI was reviewed in Chromium at the target **1194 × 834 landscape viewport**, representing the 11-inch iPad composition used for the approved design.

## Pages reviewed in dark and light themes

- Dashboard
- Featured Insights
- Player Insights
- Video
- Stats
- Notes
- Calendar
- Preferences

The review confirmed no horizontal document overflow, no placeholder copy, no empty panel shells, and no browser runtime errors across these pages.

## Interaction states reviewed

- AI Insights compact rail → expanded right-side workspace.
- Both related stat miniatures and both related video miniatures are visible in the expanded workspace.
- Related AI items open dedicated full-screen views and return to the expanded insight.
- Featured Insights default composition, first-stage reflow, and second-stage full-screen Head-to-Head Faceoffs.
- Stats expansion for Cumulative Points and Season Trends: selected widget becomes a full-width row, the paired neighbor moves below and also becomes full width, and remaining widgets repack without an empty half-column.
- Player Insights default layout, full-screen metric expansion, and visibility-control repacking after multiple widgets are disabled.
- Onboarding Step 2 at the target viewport: all 20 statistics and the Continue button remain visible; selected cards use a 4 px white stroke.
- Onboarding Step 4: the density preview uses the approved dashboard composition and the Continue button remains visible.
- Demo controls: Start Demo reveals Restart, skip 30 sec, skip 5 min, and Pause/Resume. Skip actions immediately advance the destination game clock.

## Layout rules verified

- 40 px screen margins and 20–24 px composition gaps are preserved at the target viewport.
- Widget surfaces use 20 px corner radii, no decorative strokes, and no drop shadows.
- SF-system font stacks are used throughout the hockey dashboard.
- Dark and light themes preserve identical geometry.
- Time values and counters update without pulse, scale, or interpolation animations.
- Scroll is retained only on information-dense pages where the approved content exceeds one viewport; internal rows continue to use the complete available width.
