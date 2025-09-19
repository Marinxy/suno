import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Copy, Library, ListMusic, Play, Pause, SkipBack, SkipForward, Plus, Music2, Link as LinkIcon, X } from "lucide-react";

// ======================================================
// Suno – Library & Tag Builder (Magix-style UI) — v2.4
// New in v2.4:
// • Post‑paste "Edit & Attach" modal → immediately fill missing fields
// • From the same modal you can attach the new track to Playlists/Albums
// • Changes propagate to Library + chosen collections (localStorage persisted)
// v2.3: Collections (Playlists/Albums). v2.2: URL ingest (Suno/SoundCloud)
// ======================================================

// ---------- Utils ----------
const makeId = () => (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
  ? (crypto as any).randomUUID()
  : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

async function safeCopyText(text: string): Promise<"copied" | "error"> {
  try {
    if (typeof navigator !== "undefined" && (navigator as any).clipboard && window.isSecureContext) {
      await (navigator as any).clipboard.writeText(text);
      return "copied";
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text || "";
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return "copied";
  } catch {}
  return "error";
}

const Section = ({ title, children, description }: any) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-300/90">{title}</h2>
      {description && <p className="text-xs text-zinc-400">{description}</p>}
    </div>
    <Card className="shadow-sm border border-violet-800/40 bg-zinc-950/60 backdrop-blur-sm">
      <CardContent className="p-3 space-y-3">{children}</CardContent>
    </Card>
  </div>
);

const Chip = ({ active, disabled, onClick, onLongPress, children }: any) => {
  const [timer, setTimer] = useState<number | null>(null);
  const start = () => { const id = window.setTimeout(() => onLongPress && onLongPress(), 450); setTimer(id); };
  const clear = () => { if (timer) window.clearTimeout(timer); setTimer(null); };
  return (
    <button
      onClick={onClick}
      onMouseDown={start}
      onMouseUp={clear}
      onMouseLeave={clear}
      onTouchStart={start}
      onTouchEnd={clear}
      disabled={disabled}
      className={`px-2.5 py-1 rounded-2xl border text-xs transition ${
        active
          ? "bg-violet-900/50 border-violet-600 text-violet-100 shadow-[0_0_0_1px_rgba(139,92,246,0.3)]"
          : "bg-transparent border-zinc-800 text-zinc-300 hover:border-violet-700 hover:text-violet-200"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >{children}</button>
  );
};

const CodeBox = ({ label, value }: { label: string; value: string }) => {
  const preRef = useRef<HTMLPreElement | null>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "selected">("idle");
  const doCopy = async () => {
    const res = await safeCopyText(value || "");
    if (res === "copied") { setStatus("copied"); setTimeout(()=>setStatus("idle"), 1200); }
    else { if (preRef.current) { const sel = window.getSelection(); if (sel) { const r = document.createRange(); r.selectNodeContents(preRef.current); sel.removeAllRanges(); sel.addRange(r);} } setStatus("selected"); setTimeout(()=>setStatus("idle"), 2000); }
  };
  const copyLabel = status === "copied" ? "Copied!" : status === "selected" ? "Blocked → Selected" : "Copy";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-xs text-zinc-300">{label}</h3>
        <Button variant="outline" size="sm" onClick={doCopy} className="gap-2 border-violet-700 text-violet-200 hover:bg-violet-900/30"><Copy className="w-4 h-4" /> {copyLabel}</Button>
      </div>
      <pre ref={preRef} className="font-mono text-xs min-h-[100px] p-3 rounded-md bg-[#0b0b12] border border-violet-900/60 overflow-x-auto text-zinc-200 whitespace-pre-wrap">{value}</pre>
    </div>
  );
};

// ---------- Domain data (builder) ----------
const STYLES = ["cyberpunk","industrial","orchestral","synthwave","metal","pop","rock","hip-hop","ambient","techno","house","drum & bass","trance","cinematic"];
const MOODS = ["uplifting","somber","dramatic","cold","dark","epic","melancholic","energetic","intimate"];
// Explicit Tempo typing
type Tempo = "slow" | "mid" | "fast";
const TEMPOS: Tempo[] = ["slow","mid","fast"];
const INSTRUMENTS = ["piano","acoustic guitar","electric guitar (clean)","electric guitar (distorted)","bass guitar","synth bass (808)","analog synth","pad","strings","brass","choir","drums (acoustic)","drums (electronic)","percussion","fx / risers"];
const VOCALS = ["female","male","duet","choir","none (instrumental)"];
const VOCAL_TONES = ["intimate","powerful","gritty","whisper","operatic","raspy","clean"];
const SECTIONS = ["Intro","Verse","Pre-Chorus","Chorus","Hook","Bridge","Break","Interlude","Drop","Outro","Fade Out"];
const HARMONY = ["simple","modal","minor-tonal","major-tonal","cinematic-suspensions"];
const EXCLUDE_OPTIONS = ["vocals","screamo","harsh vocals","male vocals","female vocals","auto-tune artifacts","lo-fi noise","muddy bass","overcompressed master","harsh highs/sibilance","detuned guitars"];
const QUALITY_TAGS_ORDER = ["high_fidelity","studio_mix","clean_master","no_artifacts","clear_vocals","balanced_eq","dynamic_range:wide","stereo_depth","true_stereo","warm_low_end","tight_highs","transient_detail","low_noise_floor","crystal_clarity","analog_warmth"];
const STYLE_LIMIT = 3;

// ---------- Types for Library ----------
type VersionStatus = "generated" | "selected" | "mastered" | "published";

type Track = {
  id: string;
  project: string;
  song: string;
  version: string; // label
  artist?: string;
  styles: string[];
  status: VersionStatus;
  year?: string;
  duration?: string; // mm:ss
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

// Collections
type Playlist = { id: string; name: string; notes?: string; itemIds: string[] };
type Album = { id: string; name: string; year?: string; coverUrl?: string; notes?: string; itemIds: string[] };

// ---------- Builder helpers (short) ----------
function buildQualityStack(prefs:any){
  const s = new Set<string>(["high_fidelity","studio_mix","clean_master"]);
  const styles: string[] = prefs.styles || [];
  const has = (k:string)=>styles.includes(k);
  if (prefs.vocal !== "none (instrumental)") s.add("clear_vocals");
  if (has("industrial")||has("metal")){ s.add("no_artifacts"); s.add("tight_highs"); s.add("warm_low_end"); }
  if (has("techno")||has("house")||has("drum & bass")||has("trance")||has("cyberpunk")) { s.add("stereo_depth"); s.add("dynamic_range:wide"); }
  const chosen: string[]=[]; for(const t of QUALITY_TAGS_ORDER){ if(s.has(t)&&chosen.length<6) chosen.push(t);} if(!chosen.includes("balanced_eq")&&chosen.length<6) chosen.push("balanced_eq"); return chosen;
}
function guitarConfigToPhrase(kind:"clean"|"distorted", cfg:any){ if(!cfg) return kind+" guitars"; const parts:string[]=[]; if(cfg.width) parts.push(`${cfg.width} image`); if(cfg.tone&&cfg.tone!=="neutral") parts.push(`${cfg.tone} tone`); if(kind==="distorted"&&cfg.dist&&cfg.dist!=="none") parts.push(`${cfg.dist} distortion`); if(cfg.roles?.length) parts.push(cfg.roles.join(", ")); if(cfg.fx?.length) parts.push(`${cfg.fx.join(" + ")} FX`); return `${kind} guitars (${parts.join("; ")})`; }
function makeStylePrompt(p:any){ const instruments=[...p.instruments]; if(p.instruments.includes("electric guitar (clean)")) instruments.push(guitarConfigToPhrase("clean", p.guitarConfigs?.clean)); if(p.instruments.includes("electric guitar (distorted)")) instruments.push(guitarConfigToPhrase("distorted", p.guitarConfigs?.distorted)); const vox=p.vocal==="none (instrumental)"?"instrumental track (no vocals)":`${p.vocal} vocals (${p.vocalTone})`; const styleLine=p.styles?.length?p.styles.join(" / "):p.genre||""; return [`A ${p.mood}-driven ${styleLine} track at ${p.tempo} tempo with crystal-clear modern production.`,`Features ${instruments.join(", ")} with each part distinct in the mix, and ${vox}.`,`Full-band sound is balanced with a punchy, warm low end and crisp highs (no muddiness or harshness).`,`Studio-grade mastering with wide stereo image and tasteful dynamics.`].join(" "); }
function makeLyrics(p:any){ const lines:string[]=[]; const vox=p.vocal==="none (instrumental)"?"[Instrumental]":`vocals (${p.vocalTone})`; const sectionHints:Record<string,string>={"Intro":"build gradually","Verse":`${vox} over sparse arrangement`,"Pre-Chorus":"energy rises","Chorus":"full band kicks in","Bridge":"contrast section","Outro":"decelerate"}; for(const s of p.sections) lines.push(`[${s}: ${sectionHints[s]||"section"}]`); return lines.join("\n\n"); }
function makeExclude(p:any){ const picked:string[]=p.excludePicks||[]; const extra=(p.excludeExtra||"").trim(); const all=[...picked]; if(extra) all.push(extra); return Array.from(new Set(all.filter(Boolean))).join(", "); }
function makeDisplayedLyricsTags(tags:string[]){ return tags.map(t=>`[${t}]`).join(""); }

// ---------- URL ingestion helpers ----------
function domainOf(url:string){ try{ return new URL(url).hostname.replace(/^www\./,''); }catch{ return ''; } }
function isSoundCloud(url:string){ return /soundcloud\.com/.test(url); }
function isSuno(url:string){ return /suno\.com\/(song|track)/.test(url); }

async function fetchSoundCloudMeta(url:string){
  try{
    const oembed = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const res = await fetch(oembed);
    if(!res.ok) throw new Error('oEmbed failed');
    const j:any = await res.json();
    return {
      title: j.title as string,
      author: j.author_name as string,
      thumbnail: j.thumbnail_url as string|undefined,
    };
  }catch(err){
    console.warn('SoundCloud meta fetch failed', err);
    return null;
  }
}

async function fetchSunoMeta(url:string){
  try{
    const res = await fetch(url, { mode:'cors' });
    if(!res.ok) throw new Error('Suno page not ok');
    const html = await res.text();
    const pick = (name:string, prop='property')=>{
      const re = new RegExp(`<meta[^>]+${prop}=[\"']${name}[\"'][^>]+content=[\"']([^\"']+)[\"']`, 'i');
      const m = html.match(re); return m? m[1] : '';
    };
    const title = pick('og:title') || pick('twitter:title');
    const image = pick('og:image') || pick('twitter:image');
    const description = pick('og:description') || pick('twitter:description');
    return { title, image, description };
  }catch(err){
    console.warn('Suno meta fetch likely blocked by CORS', err);
    return null;
  }
}

// ---------- Self-tests (dev only; non-blocking) ----------
function runSelfTests(){
  try { console.assert(Array.isArray(TEMPOS) && TEMPOS.length===3, 'TEMPOS should have 3 items'); } catch {}
}

// ---------- Main Component ----------
export default function SunoMagixLike() {
  const [view, setView] = useState<'library'|'builder'>("library");

  // ===== Library State =====
  const [tracks, setTracks] = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem("suno_tracks")||"[]"); } catch { return []; }
  });
  // Collections
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try { return JSON.parse(localStorage.getItem("suno_playlists")||"[]"); } catch { return []; }
  });
  const [albums, setAlbums] = useState<Album[]>(() => {
    try { return JSON.parse(localStorage.getItem("suno_albums")||"[]"); } catch { return []; }
  });
  const [activePlaylistId, setActivePlaylistId] = useState<string>("");
  const [activeAlbumId, setActiveAlbumId] = useState<string>("");
  const [playlistNameDraft, setPlaylistNameDraft] = useState("");
  const [albumNameDraft, setAlbumNameDraft] = useState("");
  const [albumYearDraft, setAlbumYearDraft] = useState("");
  const [albumCoverDraft, setAlbumCoverDraft] = useState("");

  // Legacy quick-list for fast auditioning
  const [playlist, setPlaylist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("suno_playlist")||"[]"); } catch { return []; }
  });

  // Filters
  const [fProject, setFProject] = useState<string>("");
  const [fArtist, setFArtist] = useState<string>("");
  const [fYear, setFYear] = useState<string>("");
  const [fStatus, setFStatus] = useState<VersionStatus|"">("");
  const [fStyle, setFStyle] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // URL ingest
  const [ingestUrl, setIngestUrl] = useState<string>("");
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestMsg, setIngestMsg] = useState<string>("");

  // Edit modal state
  const [editId, setEditId] = useState<string>("");
  const [draft, setDraft] = useState<Partial<Track>>({});
  const [draftPlaylistIds, setDraftPlaylistIds] = useState<string[]>([]);
  const [draftAlbumIds, setDraftAlbumIds] = useState<string[]>([]);

  useEffect(()=>{ localStorage.setItem("suno_tracks", JSON.stringify(tracks)); }, [tracks]);
  useEffect(()=>{ localStorage.setItem("suno_playlist", JSON.stringify(playlist)); }, [playlist]);
  useEffect(()=>{ localStorage.setItem("suno_playlists", JSON.stringify(playlists)); }, [playlists]);
  useEffect(()=>{ localStorage.setItem("suno_albums", JSON.stringify(albums)); }, [albums]);
  useEffect(()=>{ runSelfTests(); }, []);

  const addTrack = () => {
    const t: Track = { id: makeId(), project: fProject||"New Project", song: "New Song", version: "v1", artist: fArtist||"UN&YA", styles: fStyle? [fStyle] : ["industrial"], status: "generated", year: fYear||"2025", duration: "03:30" };
    setTracks(prev=>[...prev, t]);
  };
  const removeTrack = (id:string)=> setTracks(prev=>prev.filter(t=>t.id!==id));

  // Legacy quick playlist actions
  const addToPlaylistQuick = (id:string)=> setPlaylist(prev=> prev.includes(id)? prev : [...prev, id]);
  const removeFromPlaylistQuick = (id:string)=> setPlaylist(prev=> prev.filter(x=>x!==id));

  // Collections helpers
  const addPlaylist = () => { if(!playlistNameDraft.trim()) return; const p:Playlist={id:makeId(), name:playlistNameDraft.trim(), itemIds:[]}; setPlaylists(v=>[...v,p]); setActivePlaylistId(p.id); setPlaylistNameDraft(""); };
  const removePlaylist = (id:string) => setPlaylists(v=>v.filter(p=>p.id!==id));
  const addAlbum = () => { if(!albumNameDraft.trim()) return; const a:Album={id:makeId(), name:albumNameDraft.trim(), year:albumYearDraft||undefined, coverUrl:albumCoverDraft||undefined, itemIds:[]}; setAlbums(v=>[...v,a]); setActiveAlbumId(a.id); setAlbumNameDraft(""); setAlbumYearDraft(""); setAlbumCoverDraft(""); };
  const removeAlbum = (id:string) => setAlbums(v=>v.filter(a=>a.id!==id));
  const addTrackToNamedPlaylist = (playlistId:string, trackId:string) => { if(!playlistId) return; setPlaylists(v=>v.map(p=> p.id===playlistId && !p.itemIds.includes(trackId)? {...p, itemIds:[...p.itemIds, trackId]}: p)); };
  const addTrackToAlbum = (albumId:string, trackId:string) => { if(!albumId) return; setAlbums(v=>v.map(a=> a.id===albumId && !a.itemIds.includes(trackId)? {...a, itemIds:[...a.itemIds, trackId]}: a)); };
  const removeTrackFromPlaylist = (playlistId:string, trackId:string) => setPlaylists(v=>v.map(p=> p.id===playlistId? {...p, itemIds:p.itemIds.filter(id=>id!==trackId)}: p));
  const removeTrackFromAlbum = (albumId:string, trackId:string) => setAlbums(v=>v.map(a=> a.id===albumId? {...a, itemIds:a.itemIds.filter(id=>id!==trackId)}: a));

  const filtered = useMemo(()=> tracks.filter(t => {
    if (fProject && !t.project.toLowerCase().includes(fProject.toLowerCase())) return false;
    if (fArtist && !(t.artist||'').toLowerCase().includes(fArtist.toLowerCase())) return false;
    if (fYear && t.year !== fYear) return false;
    if (fStatus && t.status !== fStatus) return false;
    if (fStyle && !t.styles.includes(fStyle)) return false;
    if (search) {
      const blob = `${t.project} ${t.song} ${t.version} ${t.artist||''}`.toLowerCase();
      if (!blob.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [tracks, fProject, fArtist, fYear, fStatus, fStyle, search]);

  // ===== Tag Builder State (existing) =====
  const [styles, setStyles] = useState<string[]>(["industrial","cyberpunk"]);
  const [mood, setMood] = useState<string>("dark");
  const [tempo, setTempo] = useState<Tempo>("mid");
  const [instruments, setInstruments] = useState<string[]>(["drums (electronic)","synth bass (808)","electric guitar (distorted)","pad"]);
  const [vocal, setVocal] = useState<string>("female");
  const [vocalTone, setVocalTone] = useState<string>("powerful");
  const [excludePicks, setExcludePicks] = useState<string[]>([]);
  const [excludeExtra, setExcludeExtra] = useState<string>("");
  const [sections, setSections] = useState<string[]>(["Intro","Verse","Pre-Chorus","Chorus","Bridge","Outro"]);
  const [harmony, setHarmony] = useState<string>("minor-tonal");
  const [notes, setNotes] = useState<string>("");

  const rawPrefs = useMemo(() => ({ styles, mood, tempo, instruments, vocal, vocalTone, sections, harmony, excludePicks, excludeExtra }), [styles, mood, tempo, instruments, vocal, vocalTone, sections, harmony, excludePicks, excludeExtra]);
  const qualityStack = useMemo(() => buildQualityStack(rawPrefs), [rawPrefs]);
  const stylePrompt = useMemo(() => makeStylePrompt({ ...rawPrefs, guitars: [], guitarConfigs: {} }), [rawPrefs]);
  const lyrics = useMemo(() => makeLyrics(rawPrefs), [rawPrefs]);
  const exclude = useMemo(() => makeExclude(rawPrefs), [rawPrefs]);
  const displayedLyricsTags = useMemo(() => makeDisplayedLyricsTags(qualityStack), [qualityStack]);

  const toggleStyle = (s: string) => setStyles(prev => { if (prev.includes(s)) return prev.filter(x=>x!==s); if (prev.length >= STYLE_LIMIT) return prev; return [...prev, s]; });
  const toggleInstrument = (i:string)=> setInstruments(prev => prev.includes(i)? prev.filter(x=>x!==i) : [...prev,i]);
  const toggleSection = (s:string)=> setSections(prev => prev.includes(s)? prev.filter(x=>x!==s) : [...prev,s]);

  // ===== Edit modal helpers =====
  const openEditorFor = (t:Track) => {
    setEditId(t.id);
    setDraft({ ...t });
    setDraftPlaylistIds(playlists.filter(p=>p.itemIds.includes(t.id)).map(p=>p.id));
    setDraftAlbumIds(albums.filter(a=>a.itemIds.includes(t.id)).map(a=>a.id));
  };
  const closeEditor = () => { setEditId(""); setDraft({}); setDraftPlaylistIds([]); setDraftAlbumIds([]); };
  const persistDraft = () => {
    if(!editId) return;
    setTracks(prev=>prev.map(t=> t.id===editId ? { ...t, ...draft, styles:(draft.styles as any) || t.styles } : t));
    // propagate to collections
    const setIn = new Set(draftPlaylistIds);
    setPlaylists(prev=> prev.map(p=> ({...p, itemIds: p.id===editId? p.itemIds : p.itemIds})));
    setPlaylists(prev=> prev.map(p=> p.id===p.id ? ({ ...p, itemIds: Array.from(new Set((p.itemIds||[]).filter(id=> id!==editId || setIn.has(p.id)).concat(setIn.has(p.id)? [editId]: []))) }) : p ));
    const setAlb = new Set(draftAlbumIds);
    setAlbums(prev=> prev.map(a=> ({...a, itemIds: Array.from(new Set((a.itemIds||[]).filter(id=> id!==editId))) })));
    setAlbums(prev=> prev.map(a=> setAlb.has(a.id) ? ({...a, itemIds: Array.from(new Set([...(a.itemIds||[]), editId]))}) : a));
    closeEditor();
  };

  // ===== Ingest by URL =====
  const ingestByUrl = async () => {
    const url = ingestUrl.trim(); if(!url) return;
    setIngestBusy(true); setIngestMsg('');
    try{
      const host = domainOf(url);
      let created: Track | null = null;
      if (isSoundCloud(url)){
        const meta = await fetchSoundCloudMeta(url);
        created = {
          id: makeId(), project: fProject||"Imported", song: meta?.title || 'SoundCloud Track', version: 'v1',
          artist: meta?.author || fArtist || undefined, styles: [fStyle||'industrial'], status: 'published', year: fYear||'', duration: '',
          soundcloudLink: url, coverUrl: meta?.thumbnail
        };
        setTracks(prev=>[...prev, created!]);
        setIngestMsg(meta? 'SoundCloud metadata imported.' : 'Added minimal SoundCloud record (oEmbed failed).');
      } else if (isSuno(url)){
        const meta = await fetchSunoMeta(url);
        const title = meta?.title || 'Suno Track';
        created = {
          id: makeId(), project: fProject||"Imported", song: title, version: 'v1', artist: fArtist||undefined,
          styles: [fStyle||'industrial'], status: 'generated', year: fYear||'', duration: '',
          sunoLink: url, coverUrl: meta?.image, notes: meta?.description
        };
        setTracks(prev=>[...prev, created!]);
        setIngestMsg(meta? 'Suno metadata imported.' : 'Added minimal Suno record (CORS likely blocked).');
      } else {
        setIngestMsg(`Unsupported domain: ${host}`);
      }
      setIngestUrl('');
      if (created) openEditorFor(created);
    } finally {
      setIngestBusy(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#090914] text-zinc-100">
      {/* Top bar */}
      <div className="border-b border-violet-900/40 bg-zinc-950/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music2 className="w-5 h-5 text-violet-300"/>
            <h1 className="text-lg font-semibold tracking-tight text-violet-100">Suno — Catalogue & Workflow</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view==="library"?"default":"outline"} onClick={()=>setView("library")} className={view==="library"?"bg-violet-700 text-white":"border-violet-700 text-violet-200"}><Library className="w-4 h-4 mr-1"/>Library</Button>
            <Button variant={view==="builder"?"default":"outline"} onClick={()=>setView("builder")} className={view==="builder"?"bg-violet-700 text-white":"border-violet-700 text-violet-200"}><ListMusic className="w-4 h-4 mr-1"/>Tag Builder</Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {view === 'library' ? (
          <div className="grid grid-cols-12 gap-4">
            {/* LEFT: Filters + URL ingest */}
            <div className="col-span-12 md:col-span-3 space-y-3">
              <Section title="Add by URL" description="Paste a Suno or SoundCloud link">
                <div className="flex gap-2">
                  <Input placeholder="https://suno.com/song/... or https://soundcloud.com/..." value={ingestUrl} onChange={e=>setIngestUrl(e.target.value)} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                  <Button onClick={ingestByUrl} disabled={ingestBusy} className="bg-violet-700 hover:bg-violet-600 text-white gap-1"><LinkIcon className="w-4 h-4"/>{ingestBusy? 'Adding…':'Add'}</Button>
                </div>
                {ingestMsg && <p className="text-xs text-zinc-400 pt-1">{ingestMsg}</p>}
              </Section>

              <Section title="Filters">
                <div className="space-y-2">
                  <Input placeholder="Search…" value={search} onChange={(e)=>setSearch(e.target.value)} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                  <Input placeholder="Project" value={fProject} onChange={(e)=>setFProject(e.target.value)} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                  <Input placeholder="Artist" value={fArtist} onChange={(e)=>setFArtist(e.target.value)} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                  <Input placeholder="Year" value={fYear} onChange={(e)=>setFYear(e.target.value)} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-400">Status:</span>
                    {["","generated","selected","mastered","published"].map(s => (
                      <Chip key={s||'all'} active={fStatus===s} onClick={()=>setFStatus(s as any)}>{s||'all'}</Chip>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-400">Style:</span>
                    {STYLES.slice(0,12).map(s => (
                      <Chip key={s} active={fStyle===s} onClick={()=> setFStyle(fStyle===s? "": s)}>{s}</Chip>
                    ))}
                  </div>
                </div>
              </Section>
              <div className="flex items-center gap-2">
                <Button className="bg-violet-700 hover:bg-violet-600 text-white w-full" onClick={addTrack}><Plus className="w-4 h-4"/>Quick add</Button>
                <Button variant="outline" className="border-violet-700 text-violet-200 w-full" onClick={()=>{setFProject(""); setFArtist(""); setFYear(""); setFStatus(""); setFStyle(""); setSearch("");}}>Clear</Button>
              </div>
            </div>

            {/* CENTER: Table */}
            <div className="col-span-12 md:col-span-6">
              <Section title="Tracks">
                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-violet-900/40">
                      <tr className="text-zinc-400">
                        <th className="text-left font-medium py-2 px-2">Project</th>
                        <th className="text-left font-medium py-2 px-2">Song</th>
                        <th className="text-left font-medium py-2 px-2">Version</th>
                        <th className="text-left font-medium py-2 px-2">Styles</th>
                        <th className="text-left font-medium py-2 px-2">Status</th>
                        <th className="text-left font-medium py-2 px-2">Len</th>
                        <th className="text-left font-medium py-2 px-2">Links</th>
                        <th className="text-left font-medium py-2 px-2">Add</th>
                        <th className="text-left font-medium py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(t => (
                        <tr key={t.id} className="border-b border-zinc-800/60 hover:bg-violet-900/10">
                          <td className="py-1.5 px-2 text-zinc-200">{t.project}</td>
                          <td className="py-1.5 px-2 text-zinc-200">{t.song}</td>
                          <td className="py-1.5 px-2 text-zinc-200">{t.version}</td>
                          <td className="py-1.5 px-2 text-zinc-300">{t.styles.join(" / ")}</td>
                          <td className="py-1.5 px-2">{t.status}</td>
                          <td className="py-1.5 px-2 text-zinc-400">{t.duration||"–"}</td>
                          <td className="py-1.5 px-2 text-xs text-violet-300 space-x-2">
                            {t.sunoLink && <a href={t.sunoLink} target="_blank" className="underline hover:text-violet-200">Suno</a>}
                            {t.soundcloudLink && <a href={t.soundcloudLink} target="_blank" className="underline hover:text-violet-200">SC</a>}
                          </td>
                          <td className="py-1.5 px-2">
                            <div className="flex gap-1 min-w-[210px]">
                              <select className="bg-zinc-900 border border-violet-900/40 text-xs rounded px-1 py-0.5" value="" onChange={(e)=>{ addTrackToNamedPlaylist(e.target.value, t.id); e.currentTarget.value=''; }}>
                                <option value="">+ Playlist…</option>
                                {playlists.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <select className="bg-zinc-900 border border-violet-900/40 text-xs rounded px-1 py-0.5" value="" onChange={(e)=>{ addTrackToAlbum(e.target.value, t.id); e.currentTarget.value=''; }}>
                                <option value="">+ Album…</option>
                                {albums.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                            </div>
                          </td>
                          <td className="py-1.5 px-2">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="border-violet-700 text-violet-200" onClick={()=>addToPlaylistQuick(t.id)}>Add→QuickList</Button>
                              <Button size="sm" variant="outline" className="border-violet-700 text-violet-200" onClick={()=>openEditorFor(t)}>Edit</Button>
                              <Button size="sm" variant="outline" className="border-violet-700 text-rose-300" onClick={()=>removeTrack(t.id)}>Del</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length===0 && (
                        <tr><td colSpan={9} className="py-4 text-center text-zinc-500">No tracks. Paste a Suno/SoundCloud URL above or use Quick add.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
              {/* Transport stub */}
              <div className="mt-3 flex items-center justify-between bg-zinc-950/60 border border-violet-900/40 rounded-md px-3 py-2">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">Transport</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="border-violet-700 text-violet-200"><SkipBack className="w-4 h-4"/></Button>
                  <Button size="sm" className="bg-violet-700 text-white"><Play className="w-4 h-4"/></Button>
                  <Button size="sm" variant="outline" className="border-violet-700 text-violet-200"><Pause className="w-4 h-4"/></Button>
                  <Button size="sm" variant="outline" className="border-violet-700 text-violet-200"><SkipForward className="w-4 h-4"/></Button>
                </div>
              </div>
            </div>

            {/* RIGHT: Collections */}
            <div className="col-span-12 md:col-span-3 space-y-3">
              <Section title="Playlists">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="New playlist name" value={playlistNameDraft} onChange={e=>setPlaylistNameDraft(e.target.value)} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                    <Button className="bg-violet-700 text-white" onClick={addPlaylist}>Create</Button>
                  </div>
                  <div className="space-y-1 max-h-[26vh] overflow-auto">
                    {playlists.map(p=> (
                      <div key={p.id} className="p-2 rounded border border-violet-800/40 bg-zinc-900/40">
                        <div className="flex items-center justify-between">
                          <button className="text-sm text-violet-100 font-medium" onClick={()=>setActivePlaylistId(p.id)}>{p.name}</button>
                          <Button size="sm" variant="outline" className="border-rose-700 text-rose-300" onClick={()=>removePlaylist(p.id)}>Del</Button>
                        </div>
                        <div className="text-xs text-zinc-400">{p.itemIds.length} tracks</div>
                      </div>
                    ))}
                    {playlists.length===0 && <p className="text-xs text-zinc-500">No playlists yet.</p>}
                  </div>
                  {activePlaylistId && (()=>{ const p=playlists.find(x=>x.id===activePlaylistId); if(!p) return null; return (
                    <div className="mt-2">
                      <h4 className="text-xs text-zinc-400 mb-1">Items in: <span className="text-violet-200">{p.name}</span></h4>
                      <div className="space-y-1 max-h-[20vh] overflow-auto">
                        {p.itemIds.map(id=>{ const t=tracks.find(x=>x.id===id); if(!t) return null; return (
                          <div key={id} className="flex items-center justify-between text-xs bg-zinc-900/40 border border-violet-900/30 rounded px-2 py-1">
                            <span className="text-zinc-300">{t.song} — {t.version}</span>
                            <Button size="sm" variant="outline" className="border-violet-700 text-violet-200" onClick={()=>removeTrackFromPlaylist(p.id, id)}>Remove</Button>
                          </div>
                        ); })}
                        {p.itemIds.length===0 && <p className="text-xs text-zinc-500">Empty playlist.</p>}
                      </div>
                    </div>
                  ); })()}
                </div>
              </Section>

              <Section title="Albums">
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Album name" value={albumNameDraft} onChange={e=>setAlbumNameDraft(e.target.value)} className="col-span-2 bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                    <Input placeholder="Year" value={albumYearDraft} onChange={e=>setAlbumYearDraft(e.target.value)} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                    <Input placeholder="Cover URL (optional)" value={albumCoverDraft} onChange={e=>setAlbumCoverDraft(e.target.value)} className="col-span-3 bg-zinc-900 border-violet-900/40 text-zinc-200"/>
                    <Button className="col-span-3 bg-violet-700 text-white" onClick={addAlbum}>Create Album</Button>
                  </div>
                  <div className="space-y-1 max-h-[26vh] overflow-auto">
                    {albums.map(a=> (
                      <div key={a.id} className="p-2 rounded border border-violet-800/40 bg-zinc-900/40">
                        <div className="flex items-center justify-between">
                          <button className="text-sm text-violet-100 font-medium" onClick={()=>setActiveAlbumId(a.id)}>{a.name}{a.year? ` (${a.year})`: ''}</button>
                          <Button size="sm" variant="outline" className="border-rose-700 text-rose-300" onClick={()=>removeAlbum(a.id)}>Del</Button>
                        </div>
                        <div className="text-xs text-zinc-400">{a.itemIds.length} tracks</div>
                      </div>
                    ))}
                    {albums.length===0 && <p className="text-xs text-zinc-500">No albums yet.</p>}
                  </div>
                  {activeAlbumId && (()=>{ const a=albums.find(x=>x.id===activeAlbumId); if(!a) return null; return (
                    <div className="mt-2">
                      <h4 className="text-xs text-zinc-400 mb-1">Tracks in album: <span className="text-violet-200">{a.name}</span></h4>
                      <div className="space-y-1 max-h-[20vh] overflow-auto">
                        {a.itemIds.map(id=>{ const t=tracks.find(x=>x.id===id); if(!t) return null; return (
                          <div key={id} className="flex items-center justify-between text-xs bg-zinc-900/40 border border-violet-900/30 rounded px-2 py-1">
                            <span className="text-zinc-300">{t.song} — {t.version}</span>
                            <Button size="sm" variant="outline" className="border-violet-700 text-violet-200" onClick={()=>removeTrackFromAlbum(a.id, id)}>Remove</Button>
                          </div>
                        ); })}
                        {a.itemIds.length===0 && <p className="text-xs text-zinc-500">Album has no tracks yet.</p>}
                      </div>
                    </div>
                  ); })()}
                </div>
              </Section>

              {/* Legacy quick playlist for fast auditioning */}
              <Section title="Quick Playlist (legacy)">
                <div className="space-y-2 max-h-[30vh] overflow-auto pr-1">
                  {playlist.map(id => {
                    const t = tracks.find(x=>x.id===id); if(!t) return null;
                    return (
                      <div key={id} className="p-2 rounded-md border border-violet-800/40 bg-zinc-900/40">
                        <div className="text-sm text-violet-100 font-medium">{t.song} — {t.version}</div>
                        <div className="text-xs text-zinc-400">{t.project} • {t.styles.join("/")} • {t.status}</div>
                        <div className="mt-1 flex items-center gap-1">
                          <Button size="sm" variant="outline" className="border-violet-700 text-violet-200" onClick={()=>removeFromPlaylistQuick(id)}>Remove</Button>
                        </div>
                      </div>
                    );
                  })}
                  {playlist.length===0 && <p className="text-sm text-zinc-500">Empty. Add items from the table.</p>}
                </div>
              </Section>
            </div>
          </div>
        ) : (
          // ===== TAG BUILDER VIEW =====
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Controls (condensed) */}
            <div className="space-y-6">
              <Section title="Styles (up to 3)">
                <div className="flex flex-wrap gap-2">{STYLES.map(s => (<Chip key={s} active={styles.includes(s)} disabled={!styles.includes(s)&&styles.length>=STYLE_LIMIT} onClick={()=>toggleStyle(s)}>{s}</Chip>))}</div>
              </Section>
              <Section title="Mood & Tempo">
                <div className="flex flex-wrap gap-2">{MOODS.map(m => (<Chip key={m} active={mood===m} onClick={()=>setMood(m)}>{m}</Chip>))}</div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-sm text-zinc-400">Tempo:</span>
                  {TEMPOS.map(t => (<Chip key={t} active={tempo===t} onClick={()=> setTempo(t as Tempo)}>{t}</Chip>))}
                </div>
              </Section>
              <Section title="Instruments">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{INSTRUMENTS.map(i => (<Chip key={i} active={instruments.includes(i)} onClick={()=>toggleInstrument(i)}>{i}</Chip>))}</div>
              </Section>
              <Section title="Structure & Harmony">
                <div className="flex items-center gap-2 flex-wrap">{SECTIONS.map(s => (<Chip key={s} active={sections.includes(s)} onClick={()=>toggleSection(s)}>{s}</Chip>))}</div>
                <div className="flex items-center gap-2 flex-wrap mt-2"><span className="text-sm text-zinc-400">Harmony:</span>{HARMONY.map(h => (<Chip key={h} active={harmony===h} onClick={()=>setHarmony(h)}>{h}</Chip>))}</div>
              </Section>
              <Section title="Vocals">
                <div className="flex flex-wrap gap-2">{VOCALS.map(v => (<Chip key={v} active={vocal===v} onClick={()=>setVocal(v)}>{v}</Chip>))}</div>
                {vocal!=="none (instrumental)" && <div className="flex items-center gap-2 flex-wrap mt-2"><span className="text-sm text-zinc-400">Tone:</span>{VOCAL_TONES.map(t => (<Chip key={t} active={vocalTone===t} onClick={()=>setVocalTone(t)}>{t}</Chip>))}</div>}
              </Section>
              <Section title="Notes">
                <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="References, constraints, story beats..." className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              </Section>
            </div>

            {/* RIGHT: Outputs */}
            <div className="space-y-6">
              <Section title="Style Prompt">
                <CodeBox label="Style prompt" value={stylePrompt + (notes? ` Notes: ${notes}` : "")} />
              </Section>
              <Section title="Lyrics (structured)">
                <CodeBox label="Lyrics" value={lyrics} />
              </Section>
              <Section title="Displayed Lyrics — Remaster tags">
                <CodeBox label="Remaster tag stack" value={displayedLyricsTags} />
              </Section>
              <Section title="Exclude">
                <CodeBox label="Exclude" value={exclude} />
              </Section>
            </div>
          </div>
        )}

        <footer className="pt-4 text-xs text-zinc-500">Built for UN&YA · v2.4 • Edit & Attach modal • Collections • URL ingest • localStorage.</footer>
      </div>

      {/* Edit & Attach Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeEditor} />
          <div className="relative w-[min(920px,95vw)] max-h-[85vh] overflow-auto rounded-xl border border-violet-800/40 bg-zinc-950/95 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-violet-200">Edit & Attach</h3>
              <button onClick={closeEditor} className="p-1 rounded hover:bg-zinc-800"><X className="w-4 h-4 text-zinc-400"/></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <Input placeholder="Project" value={draft.project||''} onChange={e=>setDraft(d=>({...d, project:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Song" value={draft.song||''} onChange={e=>setDraft(d=>({...d, song:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Version" value={draft.version||''} onChange={e=>setDraft(d=>({...d, version:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Artist" value={draft.artist||''} onChange={e=>setDraft(d=>({...d, artist:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Year" value={draft.year||''} onChange={e=>setDraft(d=>({...d, year:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Duration (mm:ss)" value={draft.duration||''} onChange={e=>setDraft(d=>({...d, duration:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Styles (comma separated)" value={(draft.styles||[]).join(', ')} onChange={e=>setDraft(d=>({...d, styles:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} className="col-span-2 bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Status (generated/selected/mastered/published)" value={draft.status||'generated'} onChange={e=>setDraft(d=>({...d, status:e.target.value as VersionStatus}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Suno link" value={draft.sunoLink||''} onChange={e=>setDraft(d=>({...d, sunoLink:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="SoundCloud link" value={draft.soundcloudLink||''} onChange={e=>setDraft(d=>({...d, soundcloudLink:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="BandLab link" value={draft.bandlabLink||''} onChange={e=>setDraft(d=>({...d, bandlabLink:e.target.value}))} className="bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Input placeholder="Cover URL" value={draft.coverUrl||''} onChange={e=>setDraft(d=>({...d, coverUrl:e.target.value}))} className="col-span-2 bg-zinc-900 border-violet-900/40 text-zinc-200"/>
              <Textarea placeholder="Notes" value={draft.notes||''} onChange={e=>setDraft(d=>({...d, notes:e.target.value}))} className="col-span-2 bg-zinc-900 border-violet-900/40 text-zinc-200"/>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Section title="Attach to Playlists">
                <div className="flex flex-wrap gap-2">
                  {playlists.map(p=>{
                    const active = draftPlaylistIds.includes(p.id);
                    return <Chip key={p.id} active={active} onClick={()=> setDraftPlaylistIds(prev=> active? prev.filter(id=>id!==p.id): [...prev, p.id])}>{p.name}</Chip>;
                  })}
                  {playlists.length===0 && <p className="text-xs text-zinc-500">No playlists yet.</p>}
                </div>
              </Section>
              <Section title="Attach to Albums">
                <div className="flex flex-wrap gap-2">
                  {albums.map(a=>{
                    const active = draftAlbumIds.includes(a.id);
                    return <Chip key={a.id} active={active} onClick={()=> setDraftAlbumIds(prev=> active? prev.filter(id=>id!==a.id): [...prev, a.id])}>{a.name}</Chip>;
                  })}
                  {albums.length===0 && <p className="text-xs text-zinc-500">No albums yet.</p>}
                </div>
              </Section>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="outline" className="border-violet-700 text-violet-200" onClick={closeEditor}>Cancel</Button>
              <Button className="bg-violet-700 text-white" onClick={persistDraft}>Save & Attach</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
