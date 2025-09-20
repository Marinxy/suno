# Master Implementation To-Do

## Roadmap Overview
1. ✅ Data foundation & storage migration
   - Converted legacy projects → album/song workflow (`convertLegacyProjectsToAlbums`).
   - Synced back to `projects_v2` via bidirectional converters.

2. ✅ UI scaffolding for song-centric workflow
   - Added album navigator, workflow tabs, and placeholder panels.

3. ✅ Prompt workflow redesign (presets + GPT handoff)
   - Brief tab supports presets, tag editing, GPT lyric brief, prompt snapshots.

4. ✅ Generation log & iteration tracker
   - Version timeline view, prompt history, iteration logging with Suno links.

5. ✅ Mastering module with BandLab + metrics
   - Editable BandLab chain, LUFS/TP targets, EXPOSE metrics, mastering notes.

6. ✅ Release tracker & album dashboard
   - Final URL, share links, release plan editor, album readiness badges.

7. ✅ Analytics surface (Expose-style)
   - QA toggles, spectrum helper, expose log review, outstanding-task alerts.

8. ✅ Export automation bundles
   - Bundle schema for PROMPT/LYRICS/META/NOTES implemented with text downloads.
   - Export card in Release tab selects version and downloads files.
   - Uses bidirectional sync, so legacy projects remain consistent.

## Upcoming After Bundles
- ✅ Library health overview badges (album-level rollups) — albums now inherit readiness badges with song status breakdowns.
- ☐ Optional spectrum visualization hooks (placeholder for EXPOSE import).
- ☐ Automated reminders / notifications (stretch goal).
