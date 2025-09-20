import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Copy, Library, ListMusic, Play, Pause, SkipBack, SkipForward, Plus, Music2, Link as LinkIcon, X, Settings, Star, Clock, Download, Volume2, Edit, ExternalLink, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen, Disc3, List, Square, ArrowRight } from "lucide-react";

// ======================================================
// Suno – Library & Tag Builder (Magix-style UI) — v2.4
// New in v2.4:
// • Post‑paste "Edit & Attach" modal → immediately fill missing fields

// Tree Node Component for Windows Explorer-style navigation
interface TreeNodeProps {
  nodeId: string;
  label: string;
  icon: React.ReactNode;
  isExpanded?: boolean;
  isSelected?: boolean;
  hasChildren?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  children?: React.ReactNode;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  nodeId,
  label,
  icon,
  isExpanded = false,
  isSelected = false,
  hasChildren = false,
  onToggle,
  onClick,
  children,
  level = 0
}) => {
  const indentStyle = { paddingLeft: `${level * 16}px` };
  
  return (
    <div>
      <div 
        className={`flex items-center gap-1 text-sm cursor-pointer hover:bg-zinc-800/50 rounded px-2 py-1 ${
          isSelected ? 'bg-violet-900/30 text-violet-200' : 'text-zinc-300 hover:text-zinc-200'
        }`}
        style={indentStyle}
        onClick={onClick}
      >
        {hasChildren && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="p-0.5 hover:bg-zinc-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {isExpanded && children && (
        <div className="ml-2">
          {children}
        </div>
      )}
    </div>
  );
};
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

const ImagePreview = ({ src, alt = "Cover", className = "" }: { src?: string; alt?: string; className?: string }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded-md ${className}`}>
        <div className="text-center p-4">
          <Music2 className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">{imageError ? "Image failed to load" : "No image"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded-md">
          <div className="text-center p-4">
            <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-xs text-zinc-500">Loading...</p>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-md border border-violet-900/40"
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

const ImageInputWithPreview = ({ value, onChange, placeholder = "Cover URL" }: { value: string; onChange: (value: string) => void; placeholder?: string }) => {
  const [showPreview, setShowPreview] = useState(false);
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input 
          placeholder={placeholder} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="flex-1 bg-zinc-900 border-violet-900/40 text-zinc-200"
        />
        {value && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPreview(!showPreview)}
            className="border-violet-700 text-violet-200"
          >
            {showPreview ? "Hide" : "Preview"}
          </Button>
        )}
      </div>
      {showPreview && value && (
        <ImagePreview src={value} alt="Cover preview" className="h-32" />
      )}
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

// ---------- Types for Workflow System ----------
type ProjectStatus = "active" | "completed" | "archived";

// Core project structure for complete workflow tracking
type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  tags?: string[];              // Original tag builder tags (legacy)
  originalPrompt: string;       // Initial prompt used
  stylePrompt?: string;         // Generated style prompt from Create step
  lyrics?: string;              // Generated lyrics structure from Create step
  qualityTags?: string;         // Generated quality tags from Create step
  excludeTerms?: string;        // Generated exclude terms from Create step
  notes?: string;               // Additional notes and settings used
  versionIds?: string[];        // All versions of this project
  status: ProjectStatus;
};

type Version = {
  id: string;
  projectId: string;
  name: string;
  sunoUrl?: string;           // e.g., https://suno.com/song/3ba39276-f2cc-4d81-9c0d-f64bc4b5afd9
  prompt: string;             // Specific prompt for this version
  remixPrompt?: string;       // Additional remix prompt if applicable
  parentVersionId?: string;   // For tracking remix hierarchy
  createdAt: string;
  status: VersionStatus;
  remixIds: string[];         // Child remixes
  masteringId?: string;       // Link to mastering process
  publicationId?: string;     // Link to publication details
  audioUrl?: string;          // Direct audio link if available
  coverUrl?: string;          // Version-specific artwork
};

type MasteringProcess = {
  id: string;
  versionId: string;
  soundlabSettings: {
    eq?: string;
    compression?: string;
    limiting?: string;
    stereoEnhancement?: string;
    reverb?: string;
    other?: string;
  };
  notes: string;
  beforeUrl?: string;         // Audio before mastering
  afterUrl?: string;          // Audio after mastering
  completedAt: string;
};

type Publication = {
  id: string;
  versionId: string;
  platform: "soundcloud" | "spotify" | "youtube" | "other";
  url?: string;
  releaseType: "single" | "album" | "ep";
  albumId?: string;           // If part of album
  publishedAt: string;
  metadata: {
    title: string;
    artist: string;
    description?: string;
    tags: string[];
    artwork?: string;
  };
  status: "draft" | "scheduled" | "published" | "unlisted";
};

// ---------- Types for Library (Legacy + Enhanced) ----------
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
  albumId?: string; // Reference to album
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
function isSoundCloudSet(url:string){ 
  return /soundcloud\.com\/[^\/]+\/sets\//.test(url) || 
         /soundcloud\.com\/[^\/]+\/sets\/[^\/]+\/s-[A-Za-z0-9]+/.test(url);
}
function isSuno(url:string){ return /suno\.com\/(song|track)/.test(url); }

async function fetchSoundCloudMeta(url:string){
  try{
    const oembed = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const res = await fetch(oembed);
    if(!res.ok) throw new Error('oEmbed failed');
    const j:any = await res.json();
    
    // Extract additional metadata
    const description = j.description as string || '';
    const authorUrl = j.author_url as string || '';
    
    // Parse description for genre/style hints
    const detectedStyles = parseDescriptionForStyles(description);
    
    // Extract year from title if present (common pattern: "Song Name (2024)")
    const yearMatch = j.title.match(/\((\d{4})\)/);
    const detectedYear = yearMatch ? yearMatch[1] : '';
    
    // Try to get higher quality thumbnail (SoundCloud provides different sizes)
    let thumbnail = j.thumbnail_url as string|undefined;
    if (thumbnail) {
      // Try to get larger version by replacing size parameter
      thumbnail = thumbnail.replace(/-\d+x\d+\.jpg/, '-t500x500.jpg');
    }
    
    return {
      title: j.title as string,
      author: j.author_name as string,
      thumbnail: thumbnail,
      description: description,
      authorUrl: authorUrl,
      detectedStyles: detectedStyles,
      detectedYear: detectedYear,
    };
  }catch(err){
    console.warn('SoundCloud meta fetch failed', err);
    return null;
  }
}

// Helper function to parse description for style/genre hints
function parseDescriptionForStyles(description: string): string[] {
  const styles: string[] = [];
  const lowerDesc = description.toLowerCase();
  
  // Map keywords to styles
  const styleKeywords: Record<string, string> = {
    'cyberpunk': 'cyberpunk',
    'industrial': 'industrial',
    'synthwave': 'synthwave',
    'darksynth': 'synthwave',
    'electronic': 'techno',
    'techno': 'techno',
    'ambient': 'ambient',
    'cinematic': 'cinematic',
    'orchestral': 'orchestral',
    'metal': 'metal',
    'rock': 'rock',
    'pop': 'pop',
    'hip-hop': 'hip-hop',
    'house': 'house',
    'trance': 'trance',
    'drum & bass': 'drum & bass',
    'drum and bass': 'drum & bass',
  };
  
  // Check for style keywords in description
  for (const [keyword, style] of Object.entries(styleKeywords)) {
    if (lowerDesc.includes(keyword) && !styles.includes(style)) {
      styles.push(style);
    }
  }
  
  // If no styles detected, try to infer from common patterns
  if (styles.length === 0) {
    if (lowerDesc.includes('guitar') && lowerDesc.includes('electronic')) {
      styles.push('industrial');
    } else if (lowerDesc.includes('synth') || lowerDesc.includes('modular')) {
      styles.push('synthwave');
    } else if (lowerDesc.includes('cinematic') || lowerDesc.includes('film')) {
      styles.push('cinematic');
    }
  }
  
  return styles.slice(0, 3); // Limit to 3 styles max
}

// Extract album name from SoundCloud URL
function extractAlbumNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const setsIndex = pathParts.indexOf('sets');

    if (setsIndex !== -1 && pathParts[setsIndex + 1]) {
      // Get the part after /sets/ and convert hyphens to spaces, capitalize
      let albumSlug = pathParts[setsIndex + 1];
      
      // Handle secret URLs: remove the secret part (e.g., "album-name/s-Z3oJmcErquD")
      if (albumSlug.includes('/s-')) {
        albumSlug = albumSlug.split('/s-')[0];
      }
      
      return albumSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  } catch (err) {
    console.warn('Failed to parse URL for album name:', err);
  }

  return '';
}

async function fetchSoundCloudSetMeta(url:string){
  try{
    const oembed = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    console.log('Fetching SoundCloud set metadata from:', oembed);
    const res = await fetch(oembed);
    console.log('SoundCloud oEmbed response status:', res.status);
    if(!res.ok) {
      const errorText = await res.text();
      console.error('SoundCloud oEmbed failed:', res.status, errorText);
      
      // Handle specific error cases
      if (res.status === 404) {
        throw new Error(`SoundCloud set not found or not accessible. The URL may be private, unpublished, or invalid.`);
      } else if (res.status === 403) {
        throw new Error(`Access denied. This SoundCloud set may be private or restricted.`);
      } else {
        throw new Error(`SoundCloud API error (${res.status}): ${errorText}`);
      }
    }
    const j:any = await res.json();
    console.log('SoundCloud oEmbed response:', j);
    
    // Extract set metadata
    const description = j.description as string || '';
    const authorUrl = j.author_url as string || '';
    
    // Parse description for genre/style hints
    const detectedStyles = parseDescriptionForStyles(description);
    
    // Extract year from title if present
    const yearMatch = j.title.match(/\((\d{4})\)/);
    const detectedYear = yearMatch ? yearMatch[1] : '';
    
    // Try to get higher quality thumbnail
    let thumbnail = j.thumbnail_url as string|undefined;
    if (thumbnail) {
      thumbnail = thumbnail.replace(/-\d+x\d+\.jpg/, '-t500x500.jpg');
    }
    
    // Extract album name from URL as fallback
    const urlAlbumName = extractAlbumNameFromUrl(url);
    
    return {
      title: j.title as string,
      author: j.author_name as string,
      thumbnail: thumbnail,
      description: description,
      authorUrl: authorUrl,
      urlAlbumName: urlAlbumName,
      detectedStyles: detectedStyles,
      detectedYear: detectedYear,
      type: 'set' as const
    };
  }catch(err){
    console.warn('SoundCloud set meta fetch failed', err);
    
    // Fallback: Try to extract basic info from URL
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const setsIndex = pathParts.indexOf('sets');
      
      if (setsIndex !== -1 && pathParts[setsIndex + 1]) {
        let albumSlug = pathParts[setsIndex + 1];
        
        // Handle secret URLs: remove the secret part (e.g., "album-name/s-Z3oJmcErquD")
        if (albumSlug.includes('/s-')) {
          albumSlug = albumSlug.split('/s-')[0];
        }
        
        const albumName = albumSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        console.log('Using fallback metadata for album:', albumName);
        return {
          title: albumName,
          description: `Imported from SoundCloud secret sharing URL: ${url}. This is a private/unpublished set accessed via secret link.`,
          author: pathParts[1] || 'Unknown Artist',
          thumbnail: undefined,
          detectedStyles: ['electronic'],
          detectedYear: '',
          urlAlbumName: albumName
        };
      }
    } catch (urlErr) {
      console.warn('Fallback URL parsing failed:', urlErr);
    }
    
    return null;
  }
}

async function extractTracksFromSoundCloudSet(url: string): Promise<string[]> {
  // List of CORS proxy services to try
  const corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/'
  ];
  
  for (const proxy of corsProxies) {
    try {
      console.log(`Trying CORS proxy: ${proxy}`);
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { 
        mode: 'cors',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!res.ok) {
        console.warn(`Proxy ${proxy} failed with status: ${res.status}`);
        continue;
      }
      
      const html = await res.text();
      console.log(`Successfully fetched page via ${proxy}, HTML length: ${html.length}`);
      
      // Extract track URLs from the page using multiple patterns
      const patterns = [
        /href="\/[^"]+\/[^"]+"/g,
        /data-track-id="[^"]*"/g,
        /\/tracks\/[^"'\s]+/g
      ];
      
      const trackUrls: string[] = [];
      
      for (const pattern of patterns) {
        const matches = html.match(pattern) || [];
        for (const match of matches) {
          let href = match.replace(/href="|"$|data-track-id="|"/g, '');
          
          // Handle different URL formats
          if (href.startsWith('/')) {
            href = `https://soundcloud.com${href}`;
          } else if (href.startsWith('/tracks/')) {
            href = `https://soundcloud.com${href}`;
          } else if (!href.startsWith('http')) {
            continue;
          }
          
          // Filter out non-track URLs
          if (href.includes('/sets/') || href.includes('/albums') || 
              href.includes('/likes') || href.includes('/reposts') ||
              href.includes('/users/') || href.includes('/playlists/')) {
            continue;
          }
          
          // Only include SoundCloud track URLs
          if (href.includes('soundcloud.com') && !trackUrls.includes(href)) {
            trackUrls.push(href);
          }
        }
      }
      
      console.log(`Extracted ${trackUrls.length} track URLs:`, trackUrls);
      return trackUrls.slice(0, 20); // Limit to first 20 tracks
      
    } catch (err) {
      console.warn(`CORS proxy ${proxy} failed:`, err);
      continue;
    }
  }
  
  console.warn('All CORS proxies failed, falling back to manual track extraction');
  return [];
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
    
    // Parse description for style hints (same logic as SoundCloud)
    const detectedStyles = parseDescriptionForStyles(description);
    
    // Extract year from title if present
    const yearMatch = title.match(/\((\d{4})\)/);
    const detectedYear = yearMatch ? yearMatch[1] : '';
    
    return { 
      title, 
      image, 
      description,
      detectedStyles,
      detectedYear
    };
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
  const [view, setView] = useState<'create'|'generate'|'refine'|'master'|'publish'|'library'>("create");

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

  // Workflow System State
  const [projects, setProjects] = useState<Project[]>(() => {
    try { return JSON.parse(localStorage.getItem("suno_projects")||"[]"); } catch { return []; }
  });
  const [versions, setVersions] = useState<Version[]>(() => {
    try { return JSON.parse(localStorage.getItem("suno_versions")||"[]"); } catch { return []; }
  });
  const [masteringProcesses, setMasteringProcesses] = useState<MasteringProcess[]>(() => {
    try { return JSON.parse(localStorage.getItem("suno_mastering")||"[]"); } catch { return []; }
  });
  const [publications, setPublications] = useState<Publication[]>(() => {
    try { return JSON.parse(localStorage.getItem("suno_publications")||"[]"); } catch { return []; }
  });

  // Current workflow context
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [currentVersionId, setCurrentVersionId] = useState<string>("");
  const [workflowView, setWorkflowView] = useState<"projects" | "versions" | "mastering" | "publishing">("projects");
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

  // Audio player
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // SoundCloud API credentials
  const [soundcloudClientId, setSoundcloudClientId] = useState<string>(() => {
    return localStorage.getItem('soundcloud_client_id') || '';
  });
  const [soundcloudClientSecret, setSoundcloudClientSecret] = useState<string>(() => {
    return localStorage.getItem('soundcloud_client_secret') || '';
  });

  // Edit modal state
  const [editId, setEditId] = useState<string>("");
  const [draft, setDraft] = useState<Partial<Track>>({});
  const [draftPlaylistIds, setDraftPlaylistIds] = useState<string[]>([]);
  const [draftAlbumIds, setDraftAlbumIds] = useState<string[]>([]);
  
  // Table view state
  const [compactView, setCompactView] = useState(false);
  
  // Tree structure state
  const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set(['albums-root']));
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set(['playlists-root']));
  const [selectedNode, setSelectedNode] = useState<string>('all-tracks');

  useEffect(()=>{ localStorage.setItem("suno_tracks", JSON.stringify(tracks)); }, [tracks]);
  useEffect(()=>{ localStorage.setItem("suno_playlist", JSON.stringify(playlist)); }, [playlist]);
  useEffect(()=>{ localStorage.setItem("suno_playlists", JSON.stringify(playlists)); }, [playlists]);
  useEffect(()=>{ localStorage.setItem("suno_albums", JSON.stringify(albums)); }, [albums]);
  
  // Workflow system persistence
  useEffect(()=>{ localStorage.setItem("suno_projects", JSON.stringify(projects)); }, [projects]);
  useEffect(()=>{ localStorage.setItem("suno_versions", JSON.stringify(versions)); }, [versions]);
  useEffect(()=>{ localStorage.setItem("suno_mastering", JSON.stringify(masteringProcesses)); }, [masteringProcesses]);
  useEffect(()=>{ localStorage.setItem("suno_publications", JSON.stringify(publications)); }, [publications]);
  useEffect(()=>{ runSelfTests(); }, []);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Tree management functions
  const toggleAlbumExpansion = (albumId: string) => {
    setExpandedAlbums(prev => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) {
        newSet.delete(albumId);
      } else {
        newSet.add(albumId);
      }
      return newSet;
    });
  };

  const togglePlaylistExpansion = (playlistId: string) => {
    setExpandedPlaylists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  const addTrack = () => {
    const t: Track = { id: makeId(), project: fProject||"New Project", song: "New Song", version: "v1", artist: fArtist||"UN&YA", styles: fStyle? [fStyle] : ["industrial"], status: "generated", year: fYear||"2025", duration: "03:30" };
    setTracks(prev=>[...prev, t]);
  };
  const removeTrack = (id:string)=> setTracks(prev=>prev.filter(t=>t.id!==id));

  // Legacy quick playlist actions
  const addToPlaylistQuick = (id:string)=> setPlaylist(prev=> prev.includes(id)? prev : [...prev, id]);
  const removeFromPlaylistQuick = (id:string)=> setPlaylist(prev=> prev.filter(x=>x!==id));

  // ===== Workflow Management Functions =====
  
  // Project management
  const createProject = (name: string, tags: string[], originalPrompt: string, description?: string): Project => {
    const project: Project = {
      id: makeId(),
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date().toISOString(),
      tags,
      originalPrompt,
      versionIds: [],
      status: "active"
    };
    setProjects(prev => [...prev, project]);
    setCurrentProjectId(project.id);
    return project;
  };

  const createVersion = (projectId: string, name: string, prompt: string, sunoUrl?: string, parentVersionId?: string, remixPrompt?: string): Version => {
    const version: Version = {
      id: makeId(),
      projectId,
      name: name.trim(),
      sunoUrl,
      prompt,
      remixPrompt,
      parentVersionId,
      createdAt: new Date().toISOString(),
      status: "generated",
      remixIds: []
    };
    
    setVersions(prev => [...prev, version]);
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, versionIds: [...p.versionIds, version.id] }
        : p
    ));
    
    // If this is a remix, update parent version
    if (parentVersionId) {
      setVersions(prev => prev.map(v => 
        v.id === parentVersionId 
          ? { ...v, remixIds: [...v.remixIds, version.id] }
          : v
      ));
    }
    
    setCurrentVersionId(version.id);
    return version;
  };

  const createMasteringProcess = (versionId: string, notes: string, soundlabSettings: MasteringProcess['soundlabSettings']): MasteringProcess => {
    const mastering: MasteringProcess = {
      id: makeId(),
      versionId,
      soundlabSettings,
      notes,
      completedAt: new Date().toISOString()
    };
    
    setMasteringProcesses(prev => [...prev, mastering]);
    setVersions(prev => prev.map(v => 
      v.id === versionId 
        ? { ...v, masteringId: mastering.id, status: "mastered" }
        : v
    ));
    
    return mastering;
  };

  const createPublication = (versionId: string, platform: Publication['platform'], metadata: Publication['metadata'], releaseType: Publication['releaseType']): Publication => {
    const publication: Publication = {
      id: makeId(),
      versionId,
      platform,
      releaseType,
      publishedAt: new Date().toISOString(),
      metadata,
      status: "published"
    };
    
    setPublications(prev => [...prev, publication]);
    setVersions(prev => prev.map(v => 
      v.id === versionId 
        ? { ...v, publicationId: publication.id, status: "published" }
        : v
    ));
    
    return publication;
  };

  // Get workflow data for current context
  const getCurrentProject = () => projects.find(p => p.id === currentProjectId);
  const getCurrentVersion = () => versions.find(v => v.id === currentVersionId);
  const getProjectVersions = (projectId: string) => versions.filter(v => v.projectId === projectId);
  const getVersionRemixes = (versionId: string) => versions.filter(v => v.parentVersionId === versionId);
  const getVersionMastering = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    return version?.masteringId ? masteringProcesses.find(m => m.id === version.masteringId) : undefined;
  };
  const getVersionPublication = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    return version?.publicationId ? publications.find(p => p.id === version.publicationId) : undefined;
  };

  // Collections helpers
  const addPlaylist = () => { if(!playlistNameDraft.trim()) return; const p:Playlist={id:makeId(), name:playlistNameDraft.trim(), itemIds:[]}; setPlaylists(v=>[...v,p]); setActivePlaylistId(p.id); setPlaylistNameDraft(""); };
  const removePlaylist = (id:string) => setPlaylists(v=>v.filter(p=>p.id!==id));
  const addAlbum = () => { if(!albumNameDraft.trim()) return; const a:Album={id:makeId(), name:albumNameDraft.trim(), year:albumYearDraft||undefined, coverUrl:albumCoverDraft||undefined, itemIds:[]}; setAlbums(v=>[...v,a]); setActiveAlbumId(a.id); setAlbumNameDraft(""); setAlbumYearDraft(""); setAlbumCoverDraft(""); };
  const removeAlbum = (id:string) => {
    // Remove album
    setAlbums(v=>v.filter(a=>a.id!==id));
    // Remove all tracks that belong to this album
    setTracks(v=>v.filter(t=>t.albumId!==id));
  };
  const addTrackToNamedPlaylist = (playlistId:string, trackId:string) => { if(!playlistId) return; setPlaylists(v=>v.map(p=> p.id===playlistId && !p.itemIds.includes(trackId)? {...p, itemIds:[...p.itemIds, trackId]}: p)); };
  const addTrackToAlbum = (albumId:string, trackId:string) => { if(!albumId) return; setAlbums(v=>v.map(a=> a.id===albumId && !a.itemIds.includes(trackId)? {...a, itemIds:[...a.itemIds, trackId]}: a)); };
  const removeTrackFromPlaylist = (playlistId:string, trackId:string) => setPlaylists(v=>v.map(p=> p.id===playlistId? {...p, itemIds:p.itemIds.filter(id=>id!==trackId)}: p));
  const removeTrackFromAlbum = (albumId:string, trackId:string) => setAlbums(v=>v.map(a=> a.id===albumId? {...a, itemIds:a.itemIds.filter(id=>id!==trackId)}: a));

  const filtered = useMemo(()=> {
    let baseTracks = tracks;
    
    // Filter based on selected tree node
    if (selectedNode.startsWith('album-')) {
      const albumId = selectedNode.replace('album-', '');
      const album = albums.find(a => a.id === albumId);
      if (album) {
        baseTracks = tracks.filter(t => album.itemIds.includes(t.id));
      }
    } else if (selectedNode.startsWith('playlist-')) {
      const playlistId = selectedNode.replace('playlist-', '');
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist) {
        baseTracks = tracks.filter(t => playlist.itemIds.includes(t.id));
      }
    } else if (selectedNode === 'favorites') {
      // TODO: Implement favorites logic
      baseTracks = tracks;
    } else if (selectedNode === 'recent') {
      // Show recently added tracks (last 10)
      baseTracks = [...tracks].sort((a, b) => {
        // Simple sort by ID for now (newer IDs first)
        return b.id.localeCompare(a.id);
      }).slice(0, 10);
    }
    
    return baseTracks.filter(t => {
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
    });
  }, [tracks, fProject, fArtist, fYear, fStatus, fStyle, search, selectedNode, playlists]);

  // ===== Tag Builder State =====
  const [styles, setStyles] = useState<string[]>(["industrial","cyberpunk"]);
  const [mood, setMood] = useState<string>("dark");
  const [tempo, setTempo] = useState<Tempo>("mid");
  const [copyLabel, setCopyLabel] = useState<string>("Copy Prompt");
  const [instruments, setInstruments] = useState<string[]>(["drums (electronic)","synth bass (808)","electric guitar (distorted)","pad"]);
  const [vocal, setVocal] = useState<string>("female");
  const [vocalTone, setVocalTone] = useState<string>("powerful");
  const [excludePicks, setExcludePicks] = useState<string[]>([]);
  const [excludeExtra, setExcludeExtra] = useState<string>("");
  const [sections, setSections] = useState<string[]>(["Intro","Verse","Pre-Chorus","Chorus","Bridge","Outro"]);
  const [harmony, setHarmony] = useState<string>("minor-tonal");
  const [notes, setNotes] = useState<string>("");

  // ===== Tag Builder Constants (Based on Suno Best Practices) =====
  const STYLES = [
    // Electronic & Synth
    "cyberpunk", "industrial", "synthwave", "darksynth", "retrowave", "techno", "house", "drum & bass", "trance", "ambient", "downtempo",
    // Rock & Metal  
    "metal", "heavy metal", "death metal", "black metal", "progressive metal", "rock", "hard rock", "punk rock", "alternative rock",
    // Pop & Mainstream
    "pop", "electropop", "synthpop", "indie pop", "dream pop", "darkwave", "new wave",
    // Hip-Hop & Urban
    "hip-hop", "trap", "lo-fi hip hop", "boom bap", "experimental hip hop",
    // Classical & Orchestral
    "orchestral", "cinematic", "neoclassical", "epic orchestral", "film score", "symphonic",
    // Experimental & Niche
    "experimental", "noise", "avant-garde", "minimal", "post-rock", "shoegaze"
  ];
  
  const MOODS = [
    "dark", "melancholic", "energetic", "uplifting", "aggressive", "peaceful", "mysterious", 
    "romantic", "nostalgic", "epic", "haunting", "dreamy", "intense", "calm", "chaotic", 
    "euphoric", "ominous", "triumphant", "contemplative", "rebellious"
  ];
  
  const TEMPOS = ["slow", "mid", "fast"];
  
  const INSTRUMENTS = [
    // Core Rhythm
    "drums (electronic)", "drums (acoustic)", "808 drums", "trap drums", "live drums",
    // Bass
    "synth bass (808)", "bass (electric)", "bass (acoustic)", "sub bass", "distorted bass",
    // Guitars
    "electric guitar (clean)", "electric guitar (distorted)", "acoustic guitar", "lead guitar", "rhythm guitar",
    // Keys & Synths
    "piano", "electric piano", "synth lead", "synth pad", "analog synth", "digital synth", "organ",
    // Orchestral
    "strings", "violin", "cello", "brass", "trumpet", "trombone", "french horn",
    // Electronic
    "arpeggiator", "sequencer", "sampler", "vocoder", "talk box",
    // Vocals
    "vocals (lead)", "vocals (harmony)", "choir", "vocal chops"
  ];
  
  const VOCALS = ["none (instrumental)", "male", "female", "mixed", "choir", "robotic"];
  const VOCAL_TONES = ["powerful", "soft", "aggressive", "melodic", "raw", "processed", "ethereal", "gritty", "smooth", "operatic"];
  const SECTIONS = ["Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Outro", "Solo", "Breakdown", "Build-up"];
  const HARMONY = ["major", "minor", "minor-tonal", "modal", "atonal", "pentatonic", "blues scale"];
  
  // Enhanced Quality Tags (from Vision Document)
  const QUALITY_TAGS_ORDER = [
    "high_fidelity", "studio_mix", "clean_master", "no_artifacts", "clear_vocals", "balanced_eq", 
    "dynamic_range:wide", "stereo_depth", "true_stereo", "warm_low_end", "tight_highs", 
    "transient_detail", "low_noise_floor", "crystal_clarity", "analog_warmth"
  ];
  
  // Exclude Options (Common Suno Problems)
  const EXCLUDE_OPTIONS = [
    "muddy mix", "harsh highs", "clipping", "distortion artifacts", "vocal artifacts", 
    "timing issues", "off-key vocals", "robotic vocals", "background noise", "compression artifacts",
    "reverb tail", "sibilance", "plosives", "breathing sounds", "microphone noise"
  ];
  
  const buildQualityStack = (prefs: any) => {
    const s = new Set<string>(["high_fidelity", "studio_mix", "clean_master"]);
    const styles: string[] = prefs.styles || [];
    const has = (k: string) => styles.includes(k);
    if (prefs.vocal !== "none (instrumental)") s.add("clear_vocals");
    if (has("industrial") || has("metal")) { s.add("no_artifacts"); s.add("tight_highs"); s.add("warm_low_end"); }
    if (has("techno") || has("house") || has("drum & bass") || has("trance") || has("cyberpunk")) { s.add("stereo_depth"); s.add("dynamic_range:wide"); }
    const chosen: string[] = []; for (const t of QUALITY_TAGS_ORDER) { if (s.has(t) && chosen.length < 6) chosen.push(t); } if (!chosen.includes("balanced_eq") && chosen.length < 6) chosen.push("balanced_eq"); return chosen;
  };

  const makeStylePrompt = (p: any) => {
    const instruments = [...(p.instruments || [])];
    const vox = p.vocal === "none (instrumental)" ? "instrumental track (no vocals)" : `${p.vocal} vocals (${p.vocalTone})`;
    const styleLine = p.styles?.length ? p.styles.slice(0, 3).join(" / ") : "";
    
    // Enhanced prompt structure based on Suno best practices
    const parts = [];
    
    // Core style and mood
    if (styleLine) {
      parts.push(`A ${p.mood}-driven ${styleLine} track`);
    }
    
    // Tempo and energy
    parts.push(`at ${p.tempo} tempo with crystal-clear modern production`);
    
    // Instrumentation (limit to most important)
    if (instruments.length > 0) {
      const primaryInstruments = instruments.slice(0, 4).join(", ");
      parts.push(`Features ${primaryInstruments} with each part distinct in the mix`);
    }
    
    // Vocals
    if (vox) {
      parts.push(`and ${vox}`);
    }
    
    // Production quality (essential for Suno)
    parts.push(`Full-band sound is balanced with a punchy, warm low end and crisp highs (no muddiness or harshness)`);
    parts.push(`Studio-grade mastering with wide stereo image and tasteful dynamics`);
    
    return parts.join(". ") + ".";
  };

  const makeLyrics = (p: any) => {
    const lines: string[] = [];
    const vox = p.vocal === "none (instrumental)" ? "[Instrumental]" : `vocals (${p.vocalTone})`;
    const sectionHints: Record<string, string> = { "Intro": "build gradually", "Verse": `${vox} over sparse arrangement`, "Pre-Chorus": "energy rises", "Chorus": "full band kicks in", "Bridge": "contrast section", "Outro": "decelerate" };
    for (const s of p.sections) lines.push(`[${s}: ${sectionHints[s] || "section"}]`);
    return lines.join("\n\n");
  };

  const makeExclude = (p: any) => {
    const picked: string[] = p.excludePicks || [];
    const extra = (p.excludeExtra || "").trim();
    const all = [...picked];
    if (extra) all.push(extra);
    
    // Add common excludes based on style
    const styles: string[] = p.styles || [];
    const autoExcludes: string[] = [];
    
    // Auto-exclude common issues for specific styles
    if (styles.some(s => s.includes("metal") || s.includes("industrial"))) {
      autoExcludes.push("muddy mix", "harsh highs");
    }
    if (styles.some(s => s.includes("ambient") || s.includes("cinematic"))) {
      autoExcludes.push("background noise", "compression artifacts");
    }
    if (p.vocal !== "none (instrumental)") {
      autoExcludes.push("vocal artifacts", "robotic vocals");
    }
    
    // Combine and deduplicate
    const combined = [...all, ...autoExcludes];
    return Array.from(new Set(combined.filter(Boolean))).join(", ");
  };

  const makeDisplayedLyricsTags = (tags: string[]) => tags.map(t => `[${t}]`).join("");

  // ===== Raw Preferences =====
  const rawPrefs = useMemo(() => ({ styles, mood, tempo, instruments, vocal, vocalTone, sections, harmony, excludePicks, excludeExtra }), [styles, mood, tempo, instruments, vocal, vocalTone, sections, harmony, excludePicks, excludeExtra]);

  // ===== Computed Values =====
  const qualityStack = useMemo(() => buildQualityStack(rawPrefs), [rawPrefs]);
  const stylePrompt = useMemo(() => makeStylePrompt({ ...rawPrefs, guitars: [], guitarConfigs: {} }), [rawPrefs]);
  const lyrics = useMemo(() => makeLyrics(rawPrefs), [rawPrefs]);
  const exclude = useMemo(() => makeExclude(rawPrefs), [rawPrefs]);
  const displayedLyricsTags = useMemo(() => makeDisplayedLyricsTags(qualityStack), [qualityStack]);

  // Main finalPrompt (stylePrompt + notes)
  const finalPrompt = useMemo(() => {
    return stylePrompt + (notes ? ` Notes: ${notes}` : "");
  }, [stylePrompt, notes]);
  // Simplified for now - complex tag builder functions removed

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

  // ===== Audio Player Functions =====
  const playTrack = async (track: Track) => {
    if (!track.soundcloudLink) {
      console.warn('No SoundCloud link available for track:', track.song);
      return;
    }

    if (!soundcloudClientId || !soundcloudClientSecret) {
      console.warn('SoundCloud API credentials not configured. Please enter your Client ID and Client Secret in the SoundCloud API section.');
      alert('SoundCloud API credentials not configured. Please enter your Client ID and Client Secret in the SoundCloud API section to enable audio playback.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
        setupAudioEventListeners();
      }

      // Stop current track if playing
      if (isPlaying) {
        audioRef.current.pause();
      }

      // Set new track
      setCurrentTrack(track);
      
      // For SoundCloud, we need to use their embed API or widget
      // For now, let's try direct audio source
      const audioUrl = await getSoundCloudAudioUrl(track.soundcloudLink);
      
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.volume = volume;
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        console.warn('Could not get audio URL for track:', track.song);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolumeLevel = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const setupAudioEventListeners = () => {
    if (!audioRef.current) return;

    audioRef.current.addEventListener('timeupdate', () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
    });

    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current?.duration || 0);
    });

    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audioRef.current.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setIsPlaying(false);
    });
  };

  // Save SoundCloud credentials to localStorage
  useEffect(() => {
    if (soundcloudClientId) {
      localStorage.setItem('soundcloud_client_id', soundcloudClientId);
    }
  }, [soundcloudClientId]);

  useEffect(() => {
    if (soundcloudClientSecret) {
      localStorage.setItem('soundcloud_client_secret', soundcloudClientSecret);
    }
  }, [soundcloudClientSecret]);
  
  // Get SoundCloud access token using Client Credentials Flow
  const getSoundCloudAccessToken = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://secure.soundcloud.com/oauth/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json; charset=utf-8',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': soundcloudClientId,
          'client_secret': soundcloudClientSecret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      } else {
        console.error('Failed to get SoundCloud access token:', response.status);
      }
    } catch (error) {
      console.error('Error getting SoundCloud access token:', error);
    }
    return null;
  };

  // Resolve SoundCloud URL to get track information
  const resolveSoundCloudUrl = async (soundcloudUrl: string, accessToken: string): Promise<any | null> => {
    try {
      const response = await fetch(`https://api.soundcloud.com/resolve?url=${encodeURIComponent(soundcloudUrl)}`, {
        headers: {
          'Accept': 'application/json; charset=utf-8',
          'Authorization': `OAuth ${accessToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to resolve SoundCloud URL:', response.status);
      }
    } catch (error) {
      console.error('Error resolving SoundCloud URL:', error);
    }
    return null;
  };

  // Get SoundCloud audio stream URL
  const getSoundCloudAudioUrl = async (soundcloudUrl: string): Promise<string | null> => {
    try {
      // Get access token
      const accessToken = await getSoundCloudAccessToken();
      if (!accessToken) {
        console.warn('Could not get SoundCloud access token');
        return null;
      }

      // Resolve the URL to get track info
      const trackInfo = await resolveSoundCloudUrl(soundcloudUrl, accessToken);
      if (!trackInfo) {
        console.warn('Could not resolve SoundCloud URL');
        return null;
      }

      // Get the stream URL
      if (trackInfo.stream_url) {
        const streamResponse = await fetch(`${trackInfo.stream_url}?client_id=${soundcloudClientId}`, {
          headers: {
            'Accept': 'application/json; charset=utf-8',
            'Authorization': `OAuth ${accessToken}`,
          },
        });

        if (streamResponse.ok) {
          const streamData = await streamResponse.json();
          return streamData.url || trackInfo.stream_url;
        }
      }

      // Fallback to direct stream_url if available
      if (trackInfo.stream_url) {
        return `${trackInfo.stream_url}?client_id=${soundcloudClientId}`;
      }

    } catch (error) {
      console.error('Error getting SoundCloud audio URL:', error);
    }
    return null;
  };

  // ===== Ingest by URL =====
  const ingestByUrl = async () => {
    const url = ingestUrl.trim(); if(!url) return;
    setIngestBusy(true); setIngestMsg('');
    try{
      const host = domainOf(url);
      let created: Track | null = null;
      if (isSoundCloudSet(url)){
        try {
          const meta = await fetchSoundCloudSetMeta(url);
          
          if (meta) {
            // Create an album from the SoundCloud set
            const albumId = makeId();
            
            // Use title if available, otherwise fall back to URL-extracted name
            let albumName = meta.title.replace(/\s+by\s+[^,]+$/i, '').trim();
            if (!albumName || albumName === '') {
              albumName = meta.urlAlbumName || 'SoundCloud Album';
            }
            
            const album: Album = {
              id: albumId,
              name: albumName,
              year: meta.detectedYear || fYear || '',
              coverUrl: meta.thumbnail,
              notes: meta.description,
              itemIds: []
            };
            
            setAlbums(prev => [...prev, album]);
            setActiveAlbumId(albumId);
            
            // Extract and import individual tracks
            setIngestMsg('Extracting tracks from SoundCloud set...');
            const trackUrls = await extractTracksFromSoundCloudSet(url);
          
          if (trackUrls.length > 0) {
            setIngestMsg(`Importing ${trackUrls.length} tracks from "${album.name}"...`);
            let importedCount = 0;
            
            for (const trackUrl of trackUrls) {
              try {
                const trackMeta = await fetchSoundCloudMeta(trackUrl);
                if (trackMeta) {
                  const styles = trackMeta.detectedStyles?.length ? trackMeta.detectedStyles : meta.detectedStyles || [fStyle || 'industrial'];
                  const year = trackMeta.detectedYear || meta.detectedYear || fYear || '';
                  const cleanTitle = trackMeta.title?.replace(/\s+by\s+[^,]+$/i, '').trim() || 'SoundCloud Track';
                  
                  const track: Track = {
                    id: makeId(),
                    project: fProject || "Imported",
                    song: cleanTitle,
                    version: 'v1',
                    artist: trackMeta.author || meta.author || fArtist || undefined,
                    styles: styles,
                    status: 'generated',
                    year: year,
                    duration: '',
                    soundcloudLink: trackUrl,
                    coverUrl: trackMeta.thumbnail || meta.thumbnail,
                    notes: trackMeta.description || '',
                    prompt: trackMeta.description ? `Imported from SoundCloud: ${trackMeta.description}` : undefined,
                    albumId: albumId // Link track to album
                  };
                  
                  setTracks(prev => [...prev, track]);
                  
                  // Add track to album
                  setAlbums(prev => prev.map(a => 
                    a.id === albumId 
                      ? { ...a, itemIds: [...a.itemIds, track.id] }
                      : a
                  ));
                  
                  importedCount++;
                }
              } catch (err) {
                console.warn(`Failed to import track ${trackUrl}:`, err);
              }
            }
            
            const styleInfo = meta.detectedStyles?.length ? ` (detected styles: ${meta.detectedStyles.join(', ')})` : '';
            const yearInfo = meta.detectedYear ? ` (detected year: ${meta.detectedYear})` : '';
            setIngestMsg(`SoundCloud album "${album.name}" created with ${importedCount} tracks${styleInfo}${yearInfo}.`);
          } else {
            const styleInfo = meta.detectedStyles?.length ? ` (detected styles: ${meta.detectedStyles.join(', ')})` : '';
            const yearInfo = meta.detectedYear ? ` (detected year: ${meta.detectedYear})` : '';
            setIngestMsg(`SoundCloud album "${album.name}" created${styleInfo}${yearInfo}. Note: Could not extract individual tracks automatically. You can manually add track URLs to populate the album.`);
          }
        } else {
          console.error('SoundCloud set metadata fetch returned null');
          setIngestMsg('Failed to import SoundCloud set metadata. Check console for details.');
        }
        } catch (err) {
          console.error('Error importing SoundCloud set:', err);
          setIngestMsg(`Failed to import SoundCloud set: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else if (isSoundCloud(url)){
        const meta = await fetchSoundCloudMeta(url);
        
        // Use detected styles or fallback to filter style or default
        const styles = meta?.detectedStyles?.length ? meta.detectedStyles : [fStyle || 'industrial'];
        
        // Use detected year or fallback to filter year
        const year = meta?.detectedYear || fYear || '';
        
        // Clean up title (remove "by Artist" suffix if present)
        const cleanTitle = meta?.title?.replace(/\s+by\s+[^,]+$/i, '').trim() || 'SoundCloud Track';
        
        created = {
          id: makeId(), 
          project: fProject || "Imported", 
          song: cleanTitle, 
          version: 'v1',
          artist: meta?.author || fArtist || undefined, 
          styles: styles, 
          status: 'generated', 
          year: year, 
          duration: '',
          soundcloudLink: url, 
          coverUrl: meta?.thumbnail,
          notes: meta?.description || '',
          prompt: meta?.description ? `Imported from SoundCloud: ${meta.description}` : undefined
        };
        setTracks(prev=>[...prev, created!]);
        
        const styleInfo = meta?.detectedStyles?.length ? ` (detected styles: ${meta.detectedStyles.join(', ')})` : '';
        const yearInfo = meta?.detectedYear ? ` (detected year: ${meta.detectedYear})` : '';
        setIngestMsg(meta? `SoundCloud metadata imported${styleInfo}${yearInfo}.` : 'Added minimal SoundCloud record (oEmbed failed).');
      } else if (isSuno(url)){
        const meta = await fetchSunoMeta(url);
        
        // Use detected styles or fallback to filter style or default
        const styles = meta?.detectedStyles?.length ? meta.detectedStyles : [fStyle || 'industrial'];
        
        // Use detected year or fallback to filter year
        const year = meta?.detectedYear || fYear || '';
        
        const title = meta?.title || 'Suno Track';
        created = {
          id: makeId(), 
          project: fProject || "Imported", 
          song: title, 
          version: 'v1', 
          artist: fArtist || undefined,
          styles: styles, 
          status: 'generated', 
          year: year, 
          duration: '',
          sunoLink: url, 
          coverUrl: meta?.image, 
          notes: meta?.description,
          prompt: meta?.description ? `Imported from Suno: ${meta.description}` : undefined
        };
        setTracks(prev=>[...prev, created!]);
        
        const styleInfo = meta?.detectedStyles?.length ? ` (detected styles: ${meta.detectedStyles.join(', ')})` : '';
        const yearInfo = meta?.detectedYear ? ` (detected year: ${meta.detectedYear})` : '';
        setIngestMsg(meta? `Suno metadata imported${styleInfo}${yearInfo}.` : 'Added minimal Suno record (CORS likely blocked).');
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
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      {/* Top Menu Bar */}
      <div className="bg-zinc-900 border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Music2 className="w-5 h-5 text-violet-300"/>
          <h1 className="text-lg font-semibold text-violet-200">Suno Production Studio</h1>
          
          {/* Workflow Progress Indicator */}
          <div className="flex items-center gap-2 ml-4">
            <div className="text-xs text-zinc-400">Workflow:</div>
            <div className="flex items-center gap-1">
              {[
                { key: 'create', label: '1', active: view === 'create' },
                { key: 'generate', label: '2', active: view === 'generate' },
                { key: 'refine', label: '3', active: view === 'refine' },
                { key: 'master', label: '4', active: view === 'master' },
                { key: 'publish', label: '5', active: view === 'publish' },
                { key: 'library', label: '6', active: view === 'library' }
              ].map((step, index) => (
                <React.Fragment key={step.key}>
                  <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
                    step.active 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {step.label}
                  </div>
                  {index < 5 && (
                    <div className={`w-2 h-px ${
                      step.active ? 'bg-violet-600' : 'bg-zinc-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={view === 'create' ? 'default' : 'outline'} 
              onClick={() => setView('create')}
              className={view === 'create' ? 'bg-violet-600 text-white' : 'border-zinc-600 text-zinc-300'}
            >
              <Plus className="w-4 h-4 mr-1" />
              1. Create
            </Button>
            <Button 
              variant={view === 'generate' ? 'default' : 'outline'} 
              onClick={() => setView('generate')}
              className={view === 'generate' ? 'bg-violet-600 text-white' : 'border-zinc-600 text-zinc-300'}
            >
              <Music2 className="w-4 h-4 mr-1" />
              2. Generate
            </Button>
            <Button 
              variant={view === 'refine' ? 'default' : 'outline'} 
              onClick={() => setView('refine')}
              className={view === 'refine' ? 'bg-violet-600 text-white' : 'border-zinc-600 text-zinc-300'}
            >
              <Edit className="w-4 h-4 mr-1" />
              3. Refine
            </Button>
            <Button 
              variant={view === 'master' ? 'default' : 'outline'} 
              onClick={() => setView('master')}
              className={view === 'master' ? 'bg-violet-600 text-white' : 'border-zinc-600 text-zinc-300'}
            >
              <Settings className="w-4 h-4 mr-1" />
              4. Master
            </Button>
            <Button 
              variant={view === 'publish' ? 'default' : 'outline'} 
              onClick={() => setView('publish')}
              className={view === 'publish' ? 'bg-violet-600 text-white' : 'border-zinc-600 text-zinc-300'}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              5. Publish
            </Button>
            <Button 
              variant={view === 'library' ? 'default' : 'outline'} 
              onClick={() => setView('library')}
              className={view === 'library' ? 'bg-violet-600 text-white' : 'border-zinc-600 text-zinc-300'}
            >
              <Library className="w-4 h-4 mr-1" />
              6. Library
            </Button>
          </div>
          </div>
          <div className="flex items-center gap-2">
          <Button variant="outline" className="border-zinc-600 text-zinc-300">
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
          </div>
        </div>

      {/* ===== WORKFLOW VIEWS ===== */}
      
       {/* STEP 1: CREATE - Suno-like Interface */}
       {view === 'create' && (
         <div className="flex-1 flex flex-col bg-gradient-to-br from-zinc-900 via-violet-950/30 to-zinc-900">
           {/* TOP HALF: Suno-style Input Controls */}
           <div className="h-1/2 bg-zinc-900/50 border-b border-zinc-700 flex">
             <div className="w-96 bg-zinc-900/50 border-r border-zinc-700 flex flex-col">
               <div className="p-4 border-b border-zinc-700">
                 <h2 className="text-lg font-semibold text-violet-200 mb-2">🎵 Create Music</h2>
                 <p className="text-sm text-zinc-400">Configure your music parameters</p>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {/* Lyrics Section */}
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <h3 className="text-sm font-medium text-zinc-300">Lyrics</h3>
                   <ChevronDown className="w-4 h-4 text-zinc-400" />
                 </div>
                 <Textarea 
                   value={notes} 
                   onChange={(e) => setNotes(e.target.value)}
                   placeholder="Write some lyrics"
                   className="bg-zinc-800 border-zinc-600 text-zinc-200 min-h-[80px]"
                 />
                 <Button 
                   variant={vocal === "none (instrumental)" ? "default" : "outline"}
                   size="sm"
                   onClick={() => setVocal(vocal === "none (instrumental)" ? "female" : "none (instrumental)")}
                   className={vocal === "none (instrumental)" ? "bg-violet-600 text-white" : "border-zinc-600 text-zinc-300"}
                 >
                   {vocal === "none (instrumental)" ? "Instrumental" : "With Vocals"}
                 </Button>
               </div>

               {/* Styles Section */}
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <h3 className="text-sm font-medium text-zinc-300">Styles ({styles.length}/{STYLE_LIMIT})</h3>
                   <ChevronDown className="w-4 h-4 text-zinc-400" />
                 </div>
                 
                 {/* Selected Styles */}
                 <div className="flex flex-wrap gap-2">
                   {styles.map(style => (
                     <span 
                       key={style} 
                       className="px-2 py-1 bg-violet-600 text-white text-xs rounded cursor-pointer hover:bg-violet-700"
                       onClick={() => setStyles(prev => prev.filter(s => s !== style))}
                       title="Click to remove"
                     >
                       {style} ×
                     </span>
                   ))}
                   {styles.length === 0 && (
                     <span className="text-xs text-zinc-500 italic">Select up to 3 styles</span>
                   )}
                 </div>
                 
                 {/* Style Categories */}
                 <div className="space-y-2">
                   <div className="text-xs text-zinc-500 uppercase tracking-wide">Electronic & Synth</div>
                   <div className="flex flex-wrap gap-1">
                     {STYLES.slice(0, 11).map(style => (
                       <Button
                         key={style}
                         variant="outline"
                         size="sm"
                         onClick={() => {
                           if (styles.includes(style)) {
                             setStyles(prev => prev.filter(s => s !== style));
                           } else if (styles.length < STYLE_LIMIT) {
                             setStyles(prev => [...prev, style]);
                           }
                         }}
                         disabled={!styles.includes(style) && styles.length >= STYLE_LIMIT}
                         className={`text-xs px-2 py-1 ${
                           styles.includes(style) 
                             ? "bg-violet-600 text-white border-violet-600" 
                             : "border-zinc-600 text-zinc-300 hover:border-violet-600"
                         } ${!styles.includes(style) && styles.length >= STYLE_LIMIT ? "opacity-50 cursor-not-allowed" : ""}`}
                       >
                         {styles.includes(style) ? style : `+ ${style}`}
                       </Button>
                     ))}
                   </div>
                   
                   <div className="text-xs text-zinc-500 uppercase tracking-wide">Rock & Metal</div>
                   <div className="flex flex-wrap gap-1">
                     {STYLES.slice(11, 20).map(style => (
                       <Button
                         key={style}
                         variant="outline"
                         size="sm"
                         onClick={() => {
                           if (styles.includes(style)) {
                             setStyles(prev => prev.filter(s => s !== style));
                           } else if (styles.length < STYLE_LIMIT) {
                             setStyles(prev => [...prev, style]);
                           }
                         }}
                         disabled={!styles.includes(style) && styles.length >= STYLE_LIMIT}
                         className={`text-xs px-2 py-1 ${
                           styles.includes(style) 
                             ? "bg-violet-600 text-white border-violet-600" 
                             : "border-zinc-600 text-zinc-300 hover:border-violet-600"
                         } ${!styles.includes(style) && styles.length >= STYLE_LIMIT ? "opacity-50 cursor-not-allowed" : ""}`}
                       >
                         {styles.includes(style) ? style : `+ ${style}`}
                       </Button>
                     ))}
                   </div>
                   
                   <div className="text-xs text-zinc-500 uppercase tracking-wide">More Styles</div>
                   <div className="flex flex-wrap gap-1">
                     {STYLES.slice(20).map(style => (
                       <Button
                         key={style}
                         variant="outline"
                         size="sm"
                         onClick={() => {
                           if (styles.includes(style)) {
                             setStyles(prev => prev.filter(s => s !== style));
                           } else if (styles.length < STYLE_LIMIT) {
                             setStyles(prev => [...prev, style]);
                           }
                         }}
                         disabled={!styles.includes(style) && styles.length >= STYLE_LIMIT}
                         className={`text-xs px-2 py-1 ${
                           styles.includes(style) 
                             ? "bg-violet-600 text-white border-violet-600" 
                             : "border-zinc-600 text-zinc-300 hover:border-violet-600"
                         } ${!styles.includes(style) && styles.length >= STYLE_LIMIT ? "opacity-50 cursor-not-allowed" : ""}`}
                       >
                         {styles.includes(style) ? style : `+ ${style}`}
                       </Button>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Advanced Options */}
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <h3 className="text-sm font-medium text-zinc-300">Advanced Options</h3>
                   <ChevronDown className="w-4 h-4 text-zinc-400" />
                 </div>
                 
                 {/* Mood & Tempo */}
                 <div className="space-y-2">
                   <label className="text-xs text-zinc-400">Mood</label>
                   <select 
                     value={mood} 
                     onChange={(e) => setMood(e.target.value)}
                     className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-200"
                   >
                     {MOODS.map(m => (
                       <option key={m} value={m}>{m}</option>
                     ))}
                   </select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs text-zinc-400">Tempo</label>
                   <select 
                     value={tempo} 
                     onChange={(e) => setTempo(e.target.value as Tempo)}
                     className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-200"
                   >
                     {TEMPOS.map(t => (
                       <option key={t} value={t}>{t}</option>
                     ))}
                   </select>
                 </div>

                 {/* Vocal Gender */}
                 {vocal !== "none (instrumental)" && (
                   <div className="space-y-2">
                     <div className="flex items-center gap-1">
                       <label className="text-xs text-zinc-400">Vocal Gender</label>
                       <div className="w-3 h-3 rounded-full bg-zinc-600 text-xs flex items-center justify-center text-zinc-400">i</div>
                     </div>
                <div className="flex gap-2">
                       <Button
                         variant={vocal === "male" ? "default" : "outline"}
                         size="sm"
                         onClick={() => setVocal("male")}
                         className={`text-xs px-3 py-1 ${
                           vocal === "male" ? "bg-violet-600 text-white" : "border-zinc-600 text-zinc-300"
                         }`}
                       >
                         Male
                       </Button>
                       <Button
                         variant={vocal === "female" ? "default" : "outline"}
                         size="sm"
                         onClick={() => setVocal("female")}
                         className={`text-xs px-3 py-1 ${
                           vocal === "female" ? "bg-violet-600 text-white" : "border-zinc-600 text-zinc-300"
                         }`}
                       >
                         Female
                       </Button>
                </div>
                   </div>
                 )}

                 {/* Instruments */}
                <div className="space-y-2">
                   <label className="text-xs text-zinc-400">Instruments</label>
                   <div className="flex flex-wrap gap-1">
                     {INSTRUMENTS.slice(0, 8).map(instrument => (
                       <Button
                         key={instrument}
                         variant={instruments.includes(instrument) ? "default" : "outline"}
                         size="sm"
                         onClick={() => {
                           if (instruments.includes(instrument)) {
                             setInstruments(prev => prev.filter(i => i !== instrument));
                           } else {
                             setInstruments(prev => [...prev, instrument]);
                           }
                         }}
                         className={`text-xs px-2 py-1 ${
                           instruments.includes(instrument) 
                             ? "bg-violet-600 text-white" 
                             : "border-zinc-600 text-zinc-300 hover:border-violet-600"
                         }`}
                       >
                         {instrument}
                       </Button>
                    ))}
                  </div>
                 </div>

                 {/* Exclude Options */}
                 <div className="space-y-2">
                   <label className="text-xs text-zinc-400">Exclude (Common Issues)</label>
                   <div className="flex flex-wrap gap-1">
                     {EXCLUDE_OPTIONS.slice(0, 6).map(excludeItem => (
                       <Button
                         key={excludeItem}
                         variant={excludePicks.includes(excludeItem) ? "default" : "outline"}
                         size="sm"
                         onClick={() => {
                           if (excludePicks.includes(excludeItem)) {
                             setExcludePicks(prev => prev.filter(e => e !== excludeItem));
                           } else {
                             setExcludePicks(prev => [...prev, excludeItem]);
                           }
                         }}
                         className={`text-xs px-2 py-1 ${
                           excludePicks.includes(excludeItem) 
                             ? "bg-red-600 text-white" 
                             : "border-zinc-600 text-zinc-300 hover:border-red-600"
                         }`}
                       >
                         {excludeItem}
                       </Button>
                    ))}
                  </div>
                   <Textarea 
                     value={excludeExtra} 
                     onChange={(e) => setExcludeExtra(e.target.value)}
                     placeholder="Additional exclude terms..."
                     className="bg-zinc-800 border-zinc-600 text-zinc-200 text-xs"
                     rows={2}
                   />
                </div>
               </div>
             </div>

               {/* Bottom Actions */}
               <div className="p-4 border-t border-zinc-700 space-y-3">
                 <div className="space-y-2">
                   <label className="text-xs text-zinc-400">Add a song title</label>
                   <Input 
                     placeholder="Enter song title"
                     className="bg-zinc-800 border-zinc-600 text-zinc-200 text-sm"
                   />
                 </div>
                 <div className="flex items-center gap-2">
                   <Folder className="w-4 h-4 text-zinc-400" />
                   <span className="text-xs text-zinc-400">Workspace:</span>
                   <Button variant="outline" size="sm" className="text-xs border-zinc-600 text-zinc-300">
                     New Project <ChevronDown className="w-3 h-3 ml-1" />
                   </Button>
                 </div>
               </div>
             </div>
           </div>

           {/* BOTTOM HALF: Generated Prompts */}
           <div className="h-1/2 p-6 overflow-y-auto">
             <div className="space-y-4">
               <h3 className="text-lg font-semibold text-violet-200 mb-4">Generated Prompts</h3>
               
               {/* Style Prompt */}
               <div className="bg-zinc-900/80 rounded-lg border border-zinc-700">
                 <div className="flex items-center justify-between p-3 border-b border-zinc-700">
                   <h4 className="text-sm font-medium text-zinc-300">Style Prompt</h4>
                   <Button 
                     size="sm"
                     variant="outline"
                     onClick={async () => {
                       const result = await safeCopyText(finalPrompt);
                       setCopyLabel(result === "copied" ? "Copied!" : "Failed");
                       setTimeout(() => setCopyLabel("Copy"), 2000);
                     }}
                     className="border-violet-700 text-violet-200"
                   >
                     <Copy className="w-3 h-3 mr-1" />
                     {copyLabel}
                   </Button>
                 </div>
                 <div className="p-3">
                   <pre className="text-sm text-zinc-200 font-mono whitespace-pre-wrap">
                     {finalPrompt}
                   </pre>
                 </div>
               </div>

               {/* Lyrics Structure */}
               <div className="bg-zinc-900/80 rounded-lg border border-zinc-700">
                 <div className="flex items-center justify-between p-3 border-b border-zinc-700">
                   <h4 className="text-sm font-medium text-zinc-300">Lyrics Structure</h4>
                   <Button 
                     size="sm"
                     variant="outline"
                     onClick={async () => {
                       const result = await safeCopyText(lyrics);
                     }}
                     className="border-violet-700 text-violet-200"
                   >
                     <Copy className="w-3 h-3 mr-1" />
                     Copy
                   </Button>
                 </div>
                 <div className="p-3">
                   <pre className="text-sm text-zinc-200 font-mono whitespace-pre-wrap">
                     {lyrics}
                   </pre>
                 </div>
               </div>

               {/* Quality Tags */}
               <div className="bg-zinc-900/80 rounded-lg border border-zinc-700">
                 <div className="flex items-center justify-between p-3 border-b border-zinc-700">
                   <h4 className="text-sm font-medium text-zinc-300">Quality Tags</h4>
                   <Button 
                     size="sm"
                     variant="outline"
                     onClick={async () => {
                       const result = await safeCopyText(displayedLyricsTags);
                     }}
                     className="border-violet-700 text-violet-200"
                   >
                     <Copy className="w-3 h-3 mr-1" />
                     Copy
                   </Button>
                 </div>
                 <div className="p-3">
                   <pre className="text-sm text-zinc-200 font-mono">
                     {displayedLyricsTags}
                   </pre>
                 </div>
               </div>

               {/* Exclude List */}
               {exclude && (
                 <div className="bg-zinc-900/80 rounded-lg border border-zinc-700">
                   <div className="flex items-center justify-between p-3 border-b border-zinc-700">
                     <h4 className="text-sm font-medium text-zinc-300">Exclude Terms</h4>
                     <Button 
                       size="sm"
                       variant="outline"
                       onClick={async () => {
                         const result = await safeCopyText(exclude);
                       }}
                       className="border-red-700 text-red-200"
                     >
                       <Copy className="w-3 h-3 mr-1" />
                       Copy
                     </Button>
                   </div>
                   <div className="p-3">
                     <pre className="text-sm text-zinc-200 font-mono whitespace-pre-wrap">
                       {exclude}
                     </pre>
                   </div>
                 </div>
               )}

               {/* Project Creation */}
               <div className="mt-6 p-4 bg-violet-900/20 rounded-lg border border-violet-700">
                 <div className="space-y-3">
                   <div>
                     <label className="text-xs text-zinc-400 block mb-1">Project Name</label>
                     <input
                       type="text"
                       value={notes || ""}
                       onChange={(e) => setNotes(e.target.value)}
                       placeholder="Enter project name..."
                       className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-200 text-sm"
                     />
                   </div>
                   
                   <Button 
                     onClick={() => {
                       // Create new project with ALL generated prompts
                       const projectName = notes.trim() || `${styles.join(' & ')} Project`;
                       const newProject: Project = {
                         id: Date.now().toString(),
                         name: projectName,
                         status: 'active',
                         originalPrompt: finalPrompt,
                         stylePrompt: stylePrompt,
                         lyrics: lyrics,
                         qualityTags: displayedLyricsTags,
                         excludeTerms: exclude,
                         notes: `Created with: ${styles.join(', ')} | ${mood} mood | ${tempo} tempo | ${vocal === "none (instrumental)" ? "Instrumental" : `${vocal} vocals (${vocalTone})`}`,
                         createdAt: Date.now()
                       };
                       
                       setProjects(prev => [...prev, newProject]);
                       setCurrentProjectId(newProject.id);
                       setView('generate');
                     }}
                     className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                     disabled={styles.length === 0}
                   >
                     <ArrowRight className="w-4 h-4 mr-2" />
                     Create Project & Continue to Generate
                   </Button>
                   
                   {styles.length === 0 && (
                     <p className="text-xs text-zinc-500 text-center">Select at least one style to create a project</p>
                   )}
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* STEP 2: GENERATE */}
      {view === 'generate' && (
        <div className="flex-1 p-6 bg-gradient-to-br from-zinc-900 via-blue-950/30 to-zinc-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-blue-200 mb-2">🎼 Generate Your Music</h2>
              <p className="text-zinc-300">Use Suno to generate music and track your versions</p>
            </div>
            
            {getCurrentProject() ? (
              <div className="bg-zinc-900/80 rounded-xl border border-blue-900/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-200">Project: {getCurrentProject()?.name}</h3>
                    <p className="text-zinc-400 text-sm">{getCurrentProject()?.notes}</p>
                  </div>
                  <Button
                    onClick={() => setCurrentProjectId('')}
                    variant="outline"
                    className="border-zinc-600 text-zinc-300"
                  >
                    Change Project
                  </Button>
                </div>

                {/* All Generated Prompts from Create Step */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {/* Style Prompt */}
                  {getCurrentProject()?.stylePrompt && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-300">Style Prompt</h4>
                        <Button 
                          onClick={async () => {
                            await safeCopyText(getCurrentProject()?.stylePrompt || '');
                          }}
                          size="sm"
                          variant="outline"
                          className="border-blue-700 text-blue-200"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-zinc-900 rounded p-3 text-xs text-zinc-200 font-mono max-h-24 overflow-y-auto">
                        {getCurrentProject()?.stylePrompt}
                      </div>
                    </div>
                  )}

                  {/* Original Prompt */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-blue-300">Main Prompt</h4>
                      <Button 
                        onClick={async () => {
                          await safeCopyText(getCurrentProject()?.originalPrompt || '');
                        }}
                        size="sm"
                        variant="outline"
                        className="border-blue-700 text-blue-200"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-zinc-900 rounded p-3 text-xs text-zinc-200 font-mono max-h-24 overflow-y-auto">
                      {getCurrentProject()?.originalPrompt}
                    </div>
                  </div>

                  {/* Lyrics Structure */}
                  {getCurrentProject()?.lyrics && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-300">Lyrics Structure</h4>
                        <Button 
                          onClick={async () => {
                            await safeCopyText(getCurrentProject()?.lyrics || '');
                          }}
                          size="sm"
                          variant="outline"
                          className="border-blue-700 text-blue-200"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-zinc-900 rounded p-3 text-xs text-zinc-200 font-mono max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {getCurrentProject()?.lyrics}
                      </div>
                    </div>
                  )}

                  {/* Quality Tags */}
                  {getCurrentProject()?.qualityTags && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-300">Quality Tags</h4>
                        <Button 
                          onClick={async () => {
                            await safeCopyText(getCurrentProject()?.qualityTags || '');
                          }}
                          size="sm"
                          variant="outline"
                          className="border-blue-700 text-blue-200"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-zinc-900 rounded p-3 text-xs text-zinc-200 font-mono max-h-24 overflow-y-auto">
                        {getCurrentProject()?.qualityTags}
                      </div>
                    </div>
                  )}

                  {/* Exclude Terms */}
                  {getCurrentProject()?.excludeTerms && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 lg:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-red-300">Exclude Terms</h4>
                        <Button 
                          onClick={async () => {
                            await safeCopyText(getCurrentProject()?.excludeTerms || '');
                          }}
                          size="sm"
                          variant="outline"
                          className="border-red-700 text-red-200"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-zinc-900 rounded p-3 text-xs text-zinc-200 font-mono max-h-24 overflow-y-auto">
                        {getCurrentProject()?.excludeTerms}
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-6">
                  <h4 className="text-blue-200 font-medium mb-2">🎼 Next Steps:</h4>
                  <ol className="text-zinc-300 text-sm space-y-1">
                    <li>1. Copy the prompt above</li>
                    <li>2. Go to <a href="https://suno.com" target="_blank" className="text-blue-400 hover:text-blue-300">Suno.com</a></li>
                    <li>3. Generate 2+ song versions</li>
                    <li>4. Come back and add each version below</li>
                  </ol>
                </div>

                {/* Add New Version */}
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700 mb-6">
                  <h4 className="text-lg font-medium text-blue-200 mb-3">Add New Version</h4>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Version name (e.g., 'Version 1', 'Happy version')"
                      className="bg-zinc-800 border-zinc-600 text-zinc-200"
                      id="version-name"
                    />
                    <Input 
                      placeholder="Suno URL (https://suno.com/song/...)"
                      className="bg-zinc-800 border-zinc-600 text-zinc-200"
                      id="suno-url"
                    />
                    <Textarea 
                      placeholder="Any specific prompt variations used? (optional)"
                      className="bg-zinc-800 border-zinc-600 text-zinc-200"
                      id="version-prompt"
                      rows={2}
                    />
                    <Button 
                      onClick={() => {
                        const nameInput = document.getElementById('version-name') as HTMLInputElement;
                        const urlInput = document.getElementById('suno-url') as HTMLInputElement;
                        const promptInput = document.getElementById('version-prompt') as HTMLTextAreaElement;
                        
                        if (nameInput.value.trim()) {
                          createVersion(
                            currentProjectId,
                            nameInput.value.trim(),
                            promptInput.value.trim() || getCurrentProject()?.originalPrompt || '',
                            urlInput.value.trim() || undefined
                          );
                          nameInput.value = '';
                          urlInput.value = '';
                          promptInput.value = '';
                        }
                      }}
                      className="bg-blue-600 text-white w-full"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Version
                    </Button>
                  </div>
                </div>

                {/* Existing Versions */}
                {getProjectVersions(currentProjectId).length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-blue-200 mb-4">Generated Versions ({getProjectVersions(currentProjectId).length})</h4>
                    <div className="space-y-3">
                      {getProjectVersions(currentProjectId).map(version => (
                        <div 
                          key={version.id}
                          className={`p-4 rounded border cursor-pointer transition-colors ${
                            currentVersionId === version.id
                              ? 'border-blue-500 bg-blue-900/20'
                              : 'border-zinc-700 bg-zinc-800/50 hover:border-blue-600'
                          }`}
                          onClick={() => setCurrentVersionId(version.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-zinc-200">{version.name}</h5>
                              {version.sunoUrl && (
                                <a 
                                  href={version.sunoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-sm block mt-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  🎵 Listen on Suno
                                </a>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-xs px-2 py-1 rounded ${
                                version.status === 'generated' ? 'bg-yellow-800/30 text-yellow-200' :
                                version.status === 'selected' ? 'bg-blue-800/30 text-blue-200' :
                                version.status === 'mastered' ? 'bg-purple-800/30 text-purple-200' :
                                'bg-green-800/30 text-green-200'
                              }`}>
                                {version.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {currentVersionId && (
                      <div className="mt-6 flex gap-3">
                        <Button 
                          onClick={() => {
                            setVersions(prev => prev.map(v => 
                              v.id === currentVersionId 
                                ? { ...v, status: 'selected' as VersionStatus }
                                : v
                            ));
                            setView('refine');
                          }}
                          className="bg-blue-600 text-white"
                        >
                          Select This Version & Continue to Refine
                        </Button>
                        <Button 
                          onClick={() => setView('refine')}
                          variant="outline"
                          className="border-blue-600 text-blue-200"
                        >
                          Continue to Refine
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900/80 rounded-xl border border-blue-900/30 p-6 text-center">
                <h3 className="text-xl font-semibold text-blue-200 mb-4">No Project Selected</h3>
                <p className="text-zinc-400 mb-6">Create a project first or select an existing one.</p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => setView('create')}
                    className="bg-blue-600 text-white"
                  >
                    Go to Create Project
                  </Button>
                  {projects.length > 0 && (
                    <Button 
                      onClick={() => {
                        setCurrentProjectId(projects[0].id);
                      }}
                      variant="outline"
                      className="border-blue-600 text-blue-200"
                    >
                      Select Recent Project
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: REFINE */}
      {view === 'refine' && (
        <div className="flex-1 p-6 bg-gradient-to-br from-zinc-900 via-green-950/30 to-zinc-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-green-200 mb-2">✨ Refine Your Music</h2>
              <p className="text-zinc-300">Create remixes and variations of your selected version</p>
            </div>
            
            <div className="bg-zinc-900/80 rounded-xl border border-green-900/30 p-6">
              <p className="text-zinc-400">Remix creation and variation tracking will go here.</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: MASTER */}
      {view === 'master' && (
        <div className="flex-1 p-6 bg-gradient-to-br from-zinc-900 via-purple-950/30 to-zinc-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-purple-200 mb-2">🎛️ Master Your Music</h2>
              <p className="text-zinc-300">Document your SoundLab mastering process</p>
            </div>
            
            <div className="bg-zinc-900/80 rounded-xl border border-purple-900/30 p-6">
              <p className="text-zinc-400">Mastering documentation and SoundLab settings will go here.</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: PUBLISH */}
      {view === 'publish' && (
        <div className="flex-1 p-6 bg-gradient-to-br from-zinc-900 via-orange-950/30 to-zinc-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-orange-200 mb-2">🚀 Publish Your Music</h2>
              <p className="text-zinc-300">Release to SoundCloud, Spotify, and other platforms</p>
            </div>
            
            <div className="bg-zinc-900/80 rounded-xl border border-orange-900/30 p-6">
              <p className="text-zinc-400">Publication tracking and platform management will go here.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Library View */}
      <div className="flex-1 flex">
        {view === 'library' ? (
          <>
            {/* LEFT PANE: Navigation & Filters */}
            <div className="w-80 bg-zinc-900/50 border-r border-zinc-700 flex flex-col">
              {/* Search Bar */}
              <div className="p-4 border-b border-zinc-700">
                <Input 
                  placeholder="Search tracks..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="bg-zinc-800 border-zinc-600 text-zinc-200"
                />
                </div>

              {/* URL Import Section */}
              <div className="p-4 border-b border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-200 mb-2">Import Music</h3>
                <div className="space-y-2">
                  <Input 
                    placeholder="Paste Suno/SoundCloud URL (including secret links)..." 
                    value={ingestUrl} 
                    onChange={(e) => setIngestUrl(e.target.value)} 
                    className="bg-zinc-800 border-zinc-600 text-zinc-200 text-sm"
                    title="Supports regular URLs and SoundCloud secret sharing links for private/unpublished content"
                  />
                  <Button 
                    onClick={ingestByUrl} 
                    disabled={ingestBusy} 
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm"
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    {ingestBusy ? 'Importing...' : 'Import'}
                  </Button>
                  {ingestMsg && (
                    <div className="text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded">
                      {ingestMsg}
                  </div>
                  )}
                </div>
              </div>

              {/* Windows Explorer-style Tree Navigation */}
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                  {/* Library Root */}
                  <TreeNode
                    nodeId="library"
                    label="Library"
                    icon={<Library className="w-4 h-4" />}
                    isExpanded={true}
                    hasChildren={true}
                  >
                    {/* All Tracks */}
                    <TreeNode
                      nodeId="all-tracks"
                      label={`All Tracks (${tracks.length})`}
                      icon={<Music2 className="w-4 h-4" />}
                      isSelected={selectedNode === 'all-tracks'}
                      onClick={() => setSelectedNode('all-tracks')}
                      level={1}
                    />
                    
                    {/* Favorites */}
                    <TreeNode
                      nodeId="favorites"
                      label="Favorites"
                      icon={<Star className="w-4 h-4" />}
                      isSelected={selectedNode === 'favorites'}
                      onClick={() => setSelectedNode('favorites')}
                      level={1}
                    />
                    
                    {/* Recently Added */}
                    <TreeNode
                      nodeId="recent"
                      label="Recently Added"
                      icon={<Clock className="w-4 h-4" />}
                      isSelected={selectedNode === 'recent'}
                      onClick={() => setSelectedNode('recent')}
                      level={1}
                    />
                  </TreeNode>

                  {/* Albums */}
                  <TreeNode
                    nodeId="albums-root"
                    label="Albums"
                    icon={<Disc3 className="w-4 h-4" />}
                    isExpanded={expandedAlbums.has('albums-root')}
                    hasChildren={albums.length > 0}
                    onToggle={() => toggleAlbumExpansion('albums-root')}
                  >
                    {albums.map(album => {
                      const albumTracks = tracks.filter(t => album.itemIds.includes(t.id));
                      return (
                        <TreeNode
                          key={album.id}
                          nodeId={`album-${album.id}`}
                          label={`${album.name} (${albumTracks.length})`}
                          icon={expandedAlbums.has(album.id) ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                          isExpanded={expandedAlbums.has(album.id)}
                          hasChildren={albumTracks.length > 0}
                          onToggle={() => toggleAlbumExpansion(album.id)}
                          isSelected={selectedNode === `album-${album.id}`}
                          onClick={() => setSelectedNode(`album-${album.id}`)}
                          level={1}
                        >
                          {albumTracks.map(track => (
                            <TreeNode
                              key={track.id}
                              nodeId={`track-${track.id}`}
                              label={track.song}
                              icon={<Music2 className="w-4 h-4" />}
                              isSelected={selectedNode === `track-${track.id}`}
                              onClick={() => setSelectedNode(`track-${track.id}`)}
                              level={2}
                            />
                          ))}
                        </TreeNode>
                      );
                    })}
                  </TreeNode>

                  {/* Playlists */}
                  <TreeNode
                    nodeId="playlists-root"
                    label="Playlists"
                    icon={<List className="w-4 h-4" />}
                    isExpanded={expandedPlaylists.has('playlists-root')}
                    hasChildren={playlists.length > 0}
                    onToggle={() => togglePlaylistExpansion('playlists-root')}
                  >
                    {playlists.map(playlist => {
                      const playlistTracks = playlist.itemIds.map(id => tracks.find(t => t.id === id)).filter(Boolean);
                      return (
                        <TreeNode
                          key={playlist.id}
                          nodeId={`playlist-${playlist.id}`}
                          label={`${playlist.name} (${playlistTracks.length})`}
                          icon={expandedPlaylists.has(playlist.id) ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                          isExpanded={expandedPlaylists.has(playlist.id)}
                          hasChildren={playlistTracks.length > 0}
                          onToggle={() => togglePlaylistExpansion(playlist.id)}
                          isSelected={selectedNode === `playlist-${playlist.id}`}
                          onClick={() => setSelectedNode(`playlist-${playlist.id}`)}
                          level={1}
                        >
                          {playlistTracks.map(track => (
                            <TreeNode
                              key={track!.id}
                              nodeId={`track-${track!.id}`}
                              label={track!.song}
                              icon={<Music2 className="w-4 h-4" />}
                              isSelected={selectedNode === `track-${track!.id}`}
                              onClick={() => setSelectedNode(`track-${track!.id}`)}
                              level={2}
                            />
                          ))}
                        </TreeNode>
                      );
                    })}
                  </TreeNode>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-zinc-700">
                    <h3 className="text-sm font-medium text-zinc-200 mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button 
                        onClick={addTrack} 
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Track
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {setFProject(""); setFArtist(""); setFYear(""); setFStatus(""); setFStyle(""); setSearch("");}}
                        className="w-full border-zinc-600 text-zinc-300 text-sm"
                      >
                        Clear Filters
                      </Button>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* CENTER PANE: Track List */}
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="bg-zinc-900/30 border-b border-zinc-700 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-medium text-zinc-200">Tracks</h2>
                    <span className="text-sm text-zinc-400">
                      {filtered.length} of {tracks.length} tracks
                    </span>
                    {filtered.length !== tracks.length && (
                      <span className="text-sm text-violet-300">• Filters active</span>
                    )}
                  </div>
              <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setCompactView(!compactView)}
                      className="border-zinc-600 text-zinc-300"
                    >
                      {compactView ? "Expanded" : "Compact"}
                    </Button>
                    <Button size="sm" variant="outline" className="border-zinc-600 text-zinc-300">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
              </div>
            </div>

              {/* Track Table */}
              <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-900/90 border-b border-zinc-700">
                    <tr>
                      <th className="text-left font-medium py-2 px-3 w-16">Cover</th>
                      <th className="text-left font-medium py-2 px-3 w-32">Song</th>
                      <th className="text-left font-medium py-2 px-3 w-24">Artist</th>
                      <th className="text-left font-medium py-2 px-3 w-20">Album</th>
                      <th className="text-left font-medium py-2 px-3 w-32">Genre</th>
                      <th className="text-left font-medium py-2 px-3 w-16">Year</th>
                      <th className="text-left font-medium py-2 px-3 w-20">Status</th>
                      <th className="text-left font-medium py-2 px-3 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(t => (
                        <tr key={t.id} className="border-b border-zinc-800/60 hover:bg-violet-900/10 transition-colors py-1">
                          <td className="px-2 py-1">
                            <ImagePreview src={t.coverUrl} alt={`${t.song} cover`} className="w-8 h-8" />
                          </td>
                          <td className="px-2 py-1">
                            <div className="text-zinc-100 font-medium text-sm">{t.song}</div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="text-zinc-300 text-xs">{t.artist || "–"}</div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="text-zinc-300 text-xs">
                              {t.albumId ? (albums.find(a => a.id === t.albumId)?.name || "–") : "–"}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex gap-0.5 overflow-hidden">
                              {t.styles.slice(0, 2).map(style => (
                                <span key={style} className="text-xs bg-violet-900/30 text-violet-200 px-1 py-0.5 rounded whitespace-nowrap">
                                  {style}
                                </span>
                              ))}
                              {t.styles.length > 2 && (
                                <span className="text-xs text-zinc-400 px-1 py-0.5">
                                  +{t.styles.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              t.status === 'published' ? 'bg-green-900/30 text-green-300' :
                              t.status === 'mastered' ? 'bg-blue-900/30 text-blue-300' :
                              t.status === 'selected' ? 'bg-yellow-900/30 text-yellow-300' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-2 py-1">
                            <div className="text-zinc-400 text-xs">{t.year || "–"}</div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex gap-0.5">
                              {t.soundcloudLink && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => playTrack(t)} 
                                  className={`p-1 ${
                                    !soundcloudClientId || !soundcloudClientSecret 
                                      ? 'text-zinc-600 hover:text-zinc-500' 
                                      : 'text-zinc-400 hover:text-green-400'
                                  }`}
                                  disabled={isLoading && currentTrack?.id === t.id}
                                  title={
                                    !soundcloudClientId || !soundcloudClientSecret 
                                      ? 'Configure SoundCloud API credentials to enable playback'
                                      : 'Play track'
                                  }
                                >
                                  {isLoading && currentTrack?.id === t.id ? (
                                    <div className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin"/>
                                  ) : (
                                    <Play className="w-3 h-3"/>
                                  )}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => setEditId(t.id)} className="text-zinc-400 hover:text-violet-400 p-1">
                                <Edit className="w-3 h-3"/>
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => removeTrack(t.id)} className="text-zinc-400 hover:text-rose-400 p-1">
                                <Trash2 className="w-3 h-3"/>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length===0 && (
                        <tr><td colSpan={8} className="py-8 text-center text-zinc-500">
                          <div className="flex flex-col items-center gap-2">
                            <Music2 className="w-8 h-8 text-zinc-600" />
                            <p>No tracks found</p>
                            <p className="text-xs">Paste a Suno/SoundCloud URL above or use Quick add</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </div>

            {/* RIGHT: Collections */}
            <div className="col-span-12 md:col-span-3 space-y-3">
              <Section title="SoundCloud API">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Client ID</label>
                    <Input
                      type="text"
                      placeholder="Your SoundCloud Client ID"
                      value={soundcloudClientId}
                      onChange={(e) => setSoundcloudClientId(e.target.value)}
                      className="bg-zinc-900 border-violet-900/40 text-zinc-200 text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Client Secret</label>
                    <Input
                      type="password"
                      placeholder="Your SoundCloud Client Secret"
                      value={soundcloudClientSecret}
                      onChange={(e) => setSoundcloudClientSecret(e.target.value)}
                      className="bg-zinc-900 border-violet-900/40 text-zinc-200 text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-zinc-500">
                    <a href="https://developers.soundcloud.com/" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">
                      Get API credentials →
                    </a>
                  </div>
                </div>
              </Section>
              
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
                    <div className="col-span-3">
                      <ImageInputWithPreview 
                        value={albumCoverDraft} 
                        onChange={setAlbumCoverDraft} 
                        placeholder="Cover URL (optional)"
                      />
                    </div>
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
          </>
        ) : (
          // ===== DEFAULT VIEW - REDIRECT TO LIBRARY =====
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-violet-200 mb-4">Welcome to Suno Production Studio</h2>
              <p className="text-zinc-300 mb-6">Use the workflow steps above to create and manage your music projects.</p>
              <Button 
                onClick={() => setView('library')}
                className="bg-violet-600 text-white"
              >
                <Library className="w-4 h-4 mr-2" />
                Go to Library
              </Button>
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
              <div className="col-span-2">
                <ImageInputWithPreview 
                  value={draft.coverUrl||''} 
                  onChange={value=>setDraft(d=>({...d, coverUrl:value}))} 
                  placeholder="Cover URL"
                />
              </div>
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


      {/* Mini Audio Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <ImagePreview 
                src={currentTrack.coverUrl} 
                alt={`${currentTrack.song} cover`} 
                className="w-12 h-12 flex-shrink-0" 
              />
              <div className="min-w-0 flex-1">
                <div className="text-zinc-100 font-medium text-sm truncate">
                  {currentTrack.song}
                </div>
                <div className="text-zinc-400 text-xs truncate">
                  {currentTrack.artist || 'Unknown Artist'}
                </div>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={stopTrack}
                className="text-zinc-400 hover:text-zinc-200 p-2"
              >
                <Square className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={isPlaying ? pauseTrack : resumeTrack}
                className="text-zinc-400 hover:text-zinc-200 p-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border border-zinc-400 border-t-transparent rounded-full animate-spin"/>
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs text-zinc-400 w-10 text-right">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
              </span>
              <div className="flex-1 bg-zinc-700 rounded-full h-1 cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                seekTo(percentage * duration);
              }}>
                <div 
                  className="bg-violet-500 h-1 rounded-full transition-all"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-10">
                {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
              </span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-zinc-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                stopTrack();
                setCurrentTrack(null);
              }}
              className="text-zinc-400 hover:text-zinc-200 p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
