# Suno Master Studio 2.0 — Implementation To-Do

Legacy prototype is complete; the app is now being rebuilt around the actual workflow.

## Phase 0 · Foundations
1. ✅ Define new data model & store
   - `lib/types.ts` defines Album/Song/Version structures
   - `state/workspaceStore.tsx` exposes context-backed provider
   - `sampleData.ts` seeds the workspace for onboarding

## Phase 1 · Application Shell
2. ✅ Base layout and navigation
   - Sidebar with Albums → Songs lists and selection state
   - Top stepper tabs wired to placeholder workspace area
   - Assistant drawer scaffolded with process checklist

## Phase 2 · Prompt Workspace
3. ✅ Prompt tab redesign (foundation)
   - Tag selectors & style prompt preview with copy support
   - Snapshot button appends to prompt history
   - Final prompt textarea persists merged ChatGPT output

## Phase 3 · Generation Timeline
4. ✅ Generation tab (foundation)
   - Suno take logger with keeper toggle and Suno links
   - Iteration timeline form logs prompt tweaks / seeds / notes
   - Displays history stack for quick regeneration context

## Phase 4 · Mastering Control Room
5. ✅ Mastering tab (foundation)
   - BandLab preset + Expose metric forms committed to state
   - QA checklist editable alongside mastering notes/log

## Phase 5 · Release Console
6. ✅ Release tab (foundation)
   - Final URL/share/Suno link forms wired to version state
   - Release plan board with add/edit/remove + status updates
   - Export bundle placeholder button ready for wiring

## Phase 6 · Dashboard & Reminders
7. ✅ Dashboard overhaul (foundation)
   - Summary cards, reminders, upcoming releases rendered above workspace
   - Quick navigation shortcuts wired to workflow tabs

## Phase 7 · Polish & Migration
8. ☐ Data migration / cleanup
   - Remove legacy monolithic `SunoApp.tsx`
   - Migrate localStorage keys to new schema with upgrade script
