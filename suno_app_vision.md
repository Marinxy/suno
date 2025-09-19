# Create a comprehensive Vision document for the app as a Markdown file
vision_md = r"""
# Suno Catalogue & Workflow — Product Vision (Master)

> This document defines the **product vision, scope, user stories, architecture, UX, data contracts, and test plan** for the Suno Catalogue & Workflow app. It complements the existing JSX/TSX code and guides the completion to a robust v1.0.

---

## 1) Why this exists (North Star)

Suno often produces **many similar versions** of a track. Without structure, it’s hard to know **which version was selected, mastered, and published**.  
This app is **not for generating songs**; it **organizes and tracks** everything that comes out of Suno prompts across the full lifecycle: **Generated → Selected → Mastered → Published**, with links (Suno/BandLab/SoundCloud), snapshots (prompts/lyrics/tags), and per‑project history.

**North Star metric:** time to locate the correct, final version with all metadata ≤ 10 seconds.

### Key outcomes
- Every track/version has **clear status** and **canonical links**.
- **Playlists and Albums** help you bundle and ship releases.
- Prompts/tags/lyrics are **captured as snapshots** at the point of creation.
- **Import by URL** lowers friction; editing is immediate (“Edit & Attach” modal).

---

## 2) Target users & use cases

- **Solo producers / duos** who iterate rapidly in Suno and master externally (BandLab) and publish (SoundCloud).
- **Small labels** managing multiple projects and releases.

**Primary use cases**
1. **Capture a Suno or SoundCloud URL** → auto-create a track with metadata → edit quickly → attach to playlist/album.
2. **Filter & audit catalogue** by project, artist, year, style, status → jump to external links.
3. **Build releases** (albums/EPs, playlists) from selected tracks.
4. **Reference creative intent** (style prompt, lyrics, remaster tags, exclude) for future iterations.
5. **Export/import** the whole workspace or single collections as JSON for backup and collaboration.

---

## 3) Scope (v1.0)

### In scope
- Library (Magix-like): filters, table, quick playlist, playlists & albums.
- URL ingestion (Suno/SoundCloud) + post‑paste **Edit & Attach** modal.
- Tag Builder (styles, mood, tempo, instruments, vocals, sections, harmony).
- Snapshots output: **Style Prompt, Lyrics, Remaster tags, Exclude**.
- Local persistence (localStorage).
- Import/Export of workspace JSON.

### Out of scope (future)
- Direct Suno/BandLab/SoundCloud API auth & sync.
- Waveform preview and in-app audio player.
- Multi-user realtime collaboration.
- Rich artwork management and asset uploads.

---

## 4) User stories (acceptance oriented)

1. **Ingest by URL**  
   - As a user, when I paste a Suno/SoundCloud URL, the app creates a Track with parsed metadata and opens **Edit & Attach** so I can fill in missing fields and attach it to playlists or albums.  
   - *AC:* Successful ingest adds a Track; modal appears; saving persists to localStorage; filter table shows it.

2. **Track statuses**  
   - As a user, I can set a version status (generated/selected/mastered/published).  
   - *AC:* Table reflects status; filters work; status change persists.

3. **Organize into collections**  
   - As a user, I can create playlists/albums and add/remove tracks.  
   - *AC:* Counts are correct; removing a track from a collection doesn’t delete it from Library.

4. **Find anything fast**  
   - As a user, I can filter by Project/Artist/Year/Style/Status and search across basic fields.  
   - *AC:* Filtered table updates in < 150 ms for 1k items on a modern laptop.

5. **Capture creative intent**  
   - As a user, I can generate Style Prompt, Lyrics, Remaster Tags, Exclude in Tag Builder and copy them reliably (clipboard fallback).  
   - *AC:* Clicking Copy succeeds or selects text if Clipboard is blocked.

6. **Save & migrate**  
   - As a user, I can export/import the entire workspace to JSON.  
   - *AC:* Round‑trip import reproduces the exact state (idempotent).

---

## 5) Information architecture

- **Workspace**
  - **Library**
    - Filters (Search, Project, Artist, Year, Style, Status)
    - Tracks Table (Project, Song, Version, Styles, Status, Len, Links, Add, Actions)
    - **Collections**
      - Playlists: [id, name, notes?, itemIds[]]
      - Albums: [id, name, year?, coverUrl?, notes?, itemIds[]]
  - **Tag Builder**
    - Style selection (max 3)
    - Mood & Tempo
    - Instruments & Vocals
    - Structure & Harmony
    - Notes
    - Outputs (Style Prompt, Lyrics, Remaster tags, Exclude)

---

## 6) Data model (storage contract)

```ts
type VersionStatus = "generated" | "selected" | "mastered" | "published";

type Track = {
  id: string;
  project: string;
  song: string;
  version: string;
  artist?: string;
  styles: string[];
  status: VersionStatus;
  year?: string;
  duration?: string;
  sunoLink?: string;
  bandlabLink?: string;
  soundcloudLink?: string;
  coverUrl?: string;
  prompt?: string;
  lyrics?: string;
  remasterTags?: string;
  exclude?: string;
  notes?: string;
  chosen?: boolean;
};

type Playlist = { id: string; name: string; notes?: string; itemIds: string[] };
type Album = { id: string; name: string; year?: string; coverUrl?: string; notes?: string; itemIds: string[] };

type Workspace = {
  tracks: Track[];
  playlists: Playlist[];
  albums: Album[];
  createdAt: number;
  version: "1.0";
};
Persistence keys

suno_tracks – Track[]

suno_playlists – Playlist[]

suno_albums – Album[]

suno_playlist – legacy quick list (string[] of Track IDs)

Import/Export shape

json
Always show details

Copy code
{
  "tracks": [ { /* Track */ } ],
  "playlists": [ { /* Playlist */ } ],
  "albums": [ { /* Album */ } ],
  "createdAt": 1730000000000,
  "version": "1.0"
}
7) UX & visual design principles
Magix-style tri‑pane layout: Left (filters & ingest) — Center (catalogue table) — Right (collections).

Dark mode base with violet accents; high contrast for action elements.

Minimal modal usage; inline edits preferred.

Latency budget: all state changes feel instant (≤ 100 ms), filtering ≤ 150 ms for 1k items.

Never lose user input: autosave to localStorage; non‑blocking errors.

8) Feature blueprint (dev tasks)
Workspace import/export UI

Buttons in TopBar: Export Workspace → downloads .json file; Import Workspace → file picker → merge or overwrite.

Validation: schema check; if invalid show compact error toast.

Edit & Attach modal (already present in JSX)

Ensure two‑pass updates: save Track changes, then synchronize memberships for Playlists/Albums.

Add input validation (URL patterns for Suno/SoundCloud/BandLab; year as 4 digits).

Bulk ops (optional for v1)

Multi‑select in table → Add to playlist/album, Set status, Delete.

Keyboard affordances

/ focuses search, n opens “Add by URL”, e opens Edit modal for focused row.

Cover thumbnails & link icons in table

If coverUrl present, render 24px square thumbnail.

Clickable icons for Suno/SC/BandLab open in new tab.

9) Tag Builder contracts
Inputs: styles (≤3), mood, tempo, instruments, vocals (+ tone), sections, harmony, notes.

Outputs:

stylePrompt: one paragraph describing arrangement & production.

lyrics: structured section markers.

displayedLyricsTags: concatenated bracket tags (quality stack).

exclude: comma‑separated list (user picks + custom).

Quality stack (ordered; pick ≈ 6)
high_fidelity, studio_mix, clean_master, no_artifacts, clear_vocals, balanced_eq, dynamic_range:wide, stereo_depth, true_stereo, warm_low_end, tight_highs, transient_detail, low_noise_floor, crystal_clarity, analog_warmth

10) Integrations (future API contracts)
Suno (read-only)
GET /song/:id → { title, duration, cover, prompt?, lyrics?, createdAt }

Map to Track fields; store original URL.

SoundCloud (oEmbed)
GET https://soundcloud.com/oembed?format=json&url=...

Use title/author/thumbnail; store as soundcloudLink & coverUrl.

BandLab (placeholder)
Track publish/master links as free-form URLs for now; later replace with API object.

11) Privacy & data
All data is local (localStorage). No remote writes by default.

Import/export JSON contains your links and notes. Treat exported files as sensitive.

Future cloud sync must be opt‑in with explicit scopes.

12) Performance & reliability
Avoid heavy re‑renders: memoize filters and computed outputs.

Table virtualization is not necessary for ≤ 1k items, but consider react‑virtual for growth.

Clipboard operations must gracefully fall back to select‑text when blocked by policy.

13) QA plan & tests
Unit-like runtime assertions (already included)
Verify TEMPO list and lyrics markers during mount (console.assert).

Manual test checklist
URL ingest: Suno & SoundCloud create track; modal opens; save persists; filter finds it.

Edit modal: change fields; add to playlists/albums; removal works; counts update.

Filters: by Status, Style, Year, Project, Artist, Search across basic fields.

Snapshots copy: copy works; fallback selects on blocked clipboard.

Export/Import: round‑trip equality.

Persistency: refresh keeps state.

Example test tracks (add for dev)
Suno: https://suno.com/song/8e696014-01cc-4f82-a701-a985dcc56498

SoundCloud: https://soundcloud.com/unya-duo/chrome-spine-protocol-ix-2

14) Definition of Done (v1.0)
 URL ingest with Edit & Attach modal finalized.

 Playlists/Albums CRUD + membership ops complete.

 Library table shows link icons and optional cover thumb.

 Tag Builder outputs copyable (clipboard + fallback).

 Import/Export workspace JSON done.

 Filters, search, and status workflow stable.

 No console errors; Lighthouse a11y ≥ 90 (color contrast, focus states).

 Basic keyboard shortcuts wired.

15) Roadmap (post‑v1)
API integrations (Suno/BandLab/SoundCloud).

Artwork gallery per album & song (drag & drop).

Audio preview with HLS proxy or oEmbed players.

Collaboration via shared JSON or cloud sync.

Smart tag suggestions (AI) based on selected styles.

16) Glossary
Track — a specific generated output (tied to a version label).

Playlist — arbitrary collection for auditioning or thematic grouping.

Album — release bundle with optional year and cover art.

Snapshots — text fields derived from Tag Builder: stylePrompt, lyrics, remasterTags, exclude.

Status — lifecycle marker: generated → selected → mastered → published.

