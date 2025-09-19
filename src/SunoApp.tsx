import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Music2,
  Copy,
  Plus,
  Library as LibraryIcon,
  Settings2,
  Rocket,
  Disc3,
  CheckCircle2,
  ListChecks,
  BookOpen,
  Share2,
  Target,
  Sparkles,
  ClipboardList,
  Layers,
  Check,
  Trash2,
  Wand2,
  PenSquare,
  AlertTriangle
} from "lucide-react";

type PromptMode = "full" | "instrumental" | "addVocals" | "addInstrumentals";

type PromptForm = {
  genre: string;
  subgenre: string;
  mood: string;
  energy: string;
  tempo: string;
  key: string;
  timeSignature: string;
  vocal: string;
  language: string;
  leadVox: string;
  backingVox: string;
  structure: string;
  instrumentation: string;
  hooks: string;
  mixNotes: string[];
  exclude: string;
  additionalDirectives: string;
  mode: PromptMode;
  lyricSections: string[];
  lyricNotes: string;
  inspireNotes: string;
};

type WorkflowStatus = "draft" | "candidate" | "approved" | "remastered" | "released" | "liveset";

type ReleaseStatus = "draft" | "scheduled" | "released" | "live";

type TakeRecord = {
  id: string;
  versionId: string;
  label: string;
  shareUrl?: string;
  notes?: string;
  selected?: boolean;
};

type ReleaseRecord = {
  id: string;
  platform: string;
  url?: string;
  releaseDate?: string;
  status: ReleaseStatus;
  notes?: string;
};

type VersionRecord = {
  id: string;
  songId: string;
  label: string;
  seed?: string;
  bpm?: string;
  key?: string;
  duration?: string;
  structureNotes?: string;
  prompt?: string;
  exclude?: string;
  metaTags: string[];
  lyricTags?: string;
  lyrics?: string;
  iterationPlan?: string;
  notes?: string;
  lufs?: string;
  truePeak?: string;
  exportName?: string;
  masteringNotes?: string;
  exposeLog?: string;
  qaChecks: Record<string, boolean>;
  shareUrl?: string;
  sunoUrl?: string;
  soundcloudUrl?: string;
  createdAt: string;
  status: WorkflowStatus;
  takes: TakeRecord[];
  releasePlans: ReleaseRecord[];
};

type SongRecord = {
  id: string;
  projectId: string;
  title: string;
  bpm?: string;
  key?: string;
  structure?: string;
  status: WorkflowStatus;
  references: string[];
  notes?: string;
  versions: VersionRecord[];
};

type ProjectRecord = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  notes?: string;
  songs: SongRecord[];
};

const META_TAGS = [
  "high_fidelity",
  "studio_mix",
  "clean_master",
  "no_artifacts",
  "clear_vocals",
  "warm_low_end",
  "tight_highs",
  "analog_warmth",
  "dynamic_range:wide",
  "balanced_eq",
  "stereo_depth",
  "crystal_clarity",
  "true_stereo",
  "clear_guitar"
];

const UNVERIFIED_META_TAGS = ["phase_coherent"];

const MIX_NOTE_PRESETS = [
  "warm_low_end",
  "tight_highs",
  "stereo_depth",
  "analog_warmth",
  "dynamic_range:wide",
  "clear_guitar",
  "crystal_clarity",
  "balanced_eq",
  "true_stereo"
];

const EXCLUDE_RECOMMENDATIONS = [
  "rap",
  "trap_hats",
  "screamo",
  "growl",
  "guttural",
  "crowd_noise",
  "vinyl_crackle",
  "whistle",
  "ukulele",
  "kazoo",
  "slap_bass",
  "EDM supersaw",
  "voiceover"
];

const SECTION_ORDER = [
  "Intro",
  "Verse",
  "Pre-Chorus",
  "Chorus",
  "Drop",
  "Bridge",
  "Break",
  "Instrumental Hook",
  "Outro"
];

const DEFAULT_PROMPT_FORM: PromptForm = {
  genre: "Industrial Metal",
  subgenre: "Cyber-Brutalist, Slavonic Anthemic",
  mood: "Cold, Triumphant",
  energy: "High",
  tempo: "130",
  key: "C minor",
  timeSignature: "4/4",
  vocal: "Duet(Male deep, Female ethereal)",
  language: "English",
  leadVox: "Male deep",
  backingVox: "Female ethereal",
  structure: "Long Intro – Verse – Pre – Chorus – Verse – Chorus – Bridge – Epic Outro",
  instrumentation: "Drop-tuned guitars, distorted bass, glitched synths, hybrid orchestra, live drums",
  hooks: "Choir-like synth lead doubles chorus melody",
  mixNotes: ["warm_low_end", "tight_highs", "stereo_depth", "clear_guitar"],
  exclude: "rap, screamo, trap_hats, vinyl_crackle",
  additionalDirectives: "",
  mode: "full",
  lyricSections: ["Intro", "Verse", "Pre-Chorus", "Chorus", "Verse", "Chorus", "Bridge", "Outro"],
  lyricNotes: "",
  inspireNotes: "Mission brief + 2 reference attributes"
};

const DEFAULT_META_SELECTION = [
  "high_fidelity",
  "studio_mix",
  "clean_master",
  "no_artifacts",
  "clear_vocals",
  "warm_low_end",
  "tight_highs",
  "stereo_depth"
];

const WORKFLOW_STATUSES: WorkflowStatus[] = [
  "draft",
  "candidate",
  "approved",
  "remastered",
  "released",
  "liveset"
];

const RELEASE_STATUSES: ReleaseStatus[] = ["draft", "scheduled", "released", "live"];

const SOP_CHECKLISTS = [
  {
    id: "pre-gen",
    title: "Pre-generation",
    items: [
      { id: "brief", label: "Brief + 2 reference attributes captured" },
      { id: "prompt", label: "Style prompt clean (Lyrics field free of meta)" },
      { id: "exclude", label: "Exclude list adjusted for project" }
    ]
  },
  {
    id: "generation",
    title: "Generate & Select",
    items: [
      { id: "takes", label: "2–4 takes generated" },
      { id: "seed", label: "Best seed logged" },
      { id: "variations", label: "≤3 variation waves on locked seed" },
      { id: "structure", label: "Structure confirmed or re-prompted" }
    ]
  },
  {
    id: "instrumental",
    title: "Instrumental / Stem workflow",
    items: [
      { id: "instrumental-tags", label: "Instrumental directives added" },
      { id: "hook", label: "Hook instrument defined" },
      { id: "cleanup", label: "DAW clean-up plan noted (EQ, de-reverb, M/S)" }
    ]
  },
  {
    id: "remaster",
    title: "Remaster & QA",
    items: [
      { id: "meta", label: "Meta tags inserted before remaster" },
      { id: "expose", label: "EXPOSE 2 run / input gain decision" },
      { id: "export", label: "Export 44.1/24 + naming scheme" }
    ]
  }
];

const QA_ITEMS = [
  { id: "conflicts", label: "No conflicting tags (e.g. Lo-fi vs crystal clarity)" },
  { id: "bpm-key", label: "BPM/Key logged & file named Project_Song_vX.Y.Z_seed" },
  { id: "lufs", label: "−12 ±2 LUFS, ≤ −1 dBTP" },
  { id: "sibilance", label: "Sibilance/transients controlled" },
  { id: "mono", label: "Kick/Bass mono compatible to ~120 Hz" },
  { id: "meta-added", label: "Meta tags applied before remaster" }
];

const FAILURE_MODES = [
  {
    id: "tempo",
    title: "Off-tempo / click drift",
    fix: "Add [Tempo=] + [Tight Groove=On] and reinforce sections in lyrics"
  },
  {
    id: "screamo",
    title: "Unwanted harsh vocals",
    fix: "Add [Exclude=screamo, growl, fry] + [Vocal=Clean]"
  },
  {
    id: "noise",
    title: "Noise / artifacts",
    fix: "Use [no_artifacts], tame distortion in instrumentation, remaster lighter"
  },
  {
    id: "language",
    title: "Wrong language",
    fix: "Add [Language=English only] and keep lyrics language consistent"
  }
];

const INSTRUMENTAL_PLAYBOOK = [
  {
    title: "Prompt",
    points: [
      "Add [Instrumental Only], [No Choir], [No Backing Vox]",
      "Define hook instrument explicitly"
    ]
  },
  {
    title: "Generation",
    points: [
      "If vox leak, boost excludes and restate lead hook",
      "Lock arrangement once hook works"
    ]
  },
  {
    title: "Post-processing",
    points: [
      "Dynamic EQ 2–6 kHz for residual vox",
      "M/S trim in 2–4 kHz centre",
      "Try vocal subtraction if stems available"
    ]
  }
];

const SOUND_BIBLE_TEMPLATES = [
  {
    id: "brutalisk",
    name: "Template A — Brutalisk Anthem",
    description: "Core UN&YA industrial anthem shell",
    prompt: `[Genre=Industrial Metal] [Subgenre=Cyber-Brutalist, Slavonic Anthemic] [Mood=Cold, Triumphant]\n[Energy=High] [Tempo=130bpm] [Key=C minor] [TimeSig=4/4]\n[Vocal=Duet(Male deep, Female ethereal)] [Language=English]\n[Structure=Long Intro–Verse–Pre–Chorus–Verse–Chorus–Bridge–Epic Outro]\n[Instrumentation=Drop-tuned guitars, distorted bass, glitched synths, hybrid orchestra, live drums]\n[Hooks=Choir-like synth lead doubles chorus melody]\n[MixNotes=warm_low_end, tight_highs, stereo_depth, clear_guitar]\n[Exclude=rap, screamo, trap_hats, vinyl_crackle]`
  },
  {
    id: "fragments",
    name: "Template B — Fragments of Silence",
    description: "Slow build to orchestral metal",
    prompt: `[Genre=Orchestral Industrial] [Mood=Introspective→Epic] [Energy=Rising]\n[Tempo=100→128bpm] [Key=E minor]\n[Structure=Soft Ambient Intro – Sparse Verse – Build – Grand Orchestral Metal Chorus – Sudden Cut Ending]\n[Vocal=Female lead, Male low harmonies (subtle)] [Language=English]\n[Instrumentation=Ambient pads, piano motifs, string ostinato, hybrid drums, wide guitars in chorus]\n[MixNotes=dynamic_range:wide, stereo_depth]\n[Exclude=trap_hats, growl]`
  }
];

const LIVE_BLUEPRINT = [
  {
    title: "Ableton Live",
    points: [
      "Session view scenes per section (Intro/Verse/Chorus...)",
      "Stems: DRUM/BASS/SYNTH/GTR/FX/BACKING + CLICK + TALKBACK",
      "Follow Actions + locators as safety"
    ]
  },
  {
    title: "Control",
    points: [
      "Launchpad/Push mapped for risers",
      "In-ears, Complex Pro stretch, global quantize 1 bar",
      "Tempo track for BPM changes"
    ]
  },
  {
    title: "Fallback",
    points: ["Stereo backing panic scene ready"]
  }
];

const CATALOG_VISION = [
  "Project > Song > Version > Take hierarchy",
  "Capture Prompt, Lyrics, Meta, Seed, BPM/Key, LUFS/TP, Excludes",
  "SemVer naming + seed slug (e.g. anthem-cold-v1.2.0_seed-1047)",
  "Export package: WAV/MP3, PROMPT, LYRICS, META, NOTES, COVER, stems/"
];

const QUICK_START_STEPS = [
  "Write style prompt (separate Lyrics vs Style fields)",
  "Keep lyrics clean with [Section] labels only",
  "Generate 2–4 takes → pick seed",
  "Run ≤3 variation waves on keeper",
  "Instrumental? follow playbook",
  "Remaster with meta tags → QA (−12 LUFS, −1 dBTP)",
  "Log version in catalog"
];

const QUICK_FAILURE_FIX_ORDER = ["Mark logic: minimal directive, maximal effect"];

const DEFAULT_VERSION_QA = QA_ITEMS.reduce<Record<string, boolean>>((acc, item) => {
  acc[item.id] = false;
  return acc;
}, {});

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

async function safeCopyText(value: string) {
  if (!value) return;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {}
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    const stored = window.localStorage.getItem(key);
    if (!stored) return defaultValue;
    try {
      return JSON.parse(stored) as T;
    } catch (err) {
      console.warn("Failed to parse localStorage", key, err);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState];
}

const modeLabels: Record<PromptMode, string> = {
  full: "Full song",
  instrumental: "Instrumental Only",
  addVocals: "Add Vocals",
  addInstrumentals: "Add Instrumentals"
};

const modeTag: Record<PromptMode, string> = {
  full: "",
  instrumental: "[Instrumental Only]",
  addVocals: "[Add Vocals]",
  addInstrumentals: "[Add Instrumentals]"
};

const versionDraftTemplate = {
  label: "v1.0.0",
  seed: "",
  bpm: "",
  key: "",
  duration: "",
  structureNotes: "",
  shareUrl: "",
  notes: ""
};

const takeDraftTemplate = {
  label: "Take 1",
  shareUrl: "",
  notes: "",
  selected: false
};

const releaseDraftTemplate = {
  platform: "soundcloud",
  url: "",
  releaseDate: "",
  status: "draft" as ReleaseStatus,
  notes: ""
};
export default function SunoMagixLike() {
  const [view, setView] = useState<"create" | "generate" | "refine" | "master" | "publish" | "library">("create");
  const [promptForm, setPromptForm] = useLocalStorageState<PromptForm>("suno_prompt_form_v2", DEFAULT_PROMPT_FORM);
  const [selectedMetaTags, setSelectedMetaTags] = useLocalStorageState<string[]>("suno_meta_tags_v2", DEFAULT_META_SELECTION);
  const [projects, setProjects] = useLocalStorageState<ProjectRecord[]>("suno_projects_v2", []);
  const [checklistState, setChecklistState] = useLocalStorageState<Record<string, boolean>>("suno_checklists_v2", {});

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedSongId, setSelectedSongId] = useState<string>("");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const [projectDraftName, setProjectDraftName] = useState<string>("");
  const [projectDraftNotes, setProjectDraftNotes] = useState<string>("");

  const [songDraft, setSongDraft] = useState({ title: "", bpm: "", key: "", structure: "", references: "", notes: "" });
  const [versionDraft, setVersionDraft] = useState({ ...versionDraftTemplate });
  const [takeDraft, setTakeDraft] = useState({ ...takeDraftTemplate });
  const [releaseDraft, setReleaseDraft] = useState({ ...releaseDraftTemplate });

  const stylePrompt = useMemo(() => {
    const lines = [
      `[Genre=${promptForm.genre}] [Subgenre=${promptForm.subgenre}] [Mood=${promptForm.mood}] [Energy=${promptForm.energy}]`,
      `[Tempo=${promptForm.tempo}bpm] [Key=${promptForm.key}] [TimeSig=${promptForm.timeSignature}]`,
      `[Vocal=${promptForm.vocal}] [Language=${promptForm.language}]${promptForm.leadVox ? ` [LeadVox=${promptForm.leadVox}]` : ""}${promptForm.backingVox ? ` [BackingVox=${promptForm.backingVox}]` : ""}`,
      `[Structure=${promptForm.structure}]`,
      `[Instrumentation=${promptForm.instrumentation}]`,
      promptForm.hooks ? `[Hooks=${promptForm.hooks}]` : "",
      promptForm.mixNotes.length ? `[MixNotes=${Array.from(new Set(promptForm.mixNotes)).join(", ")}]` : "",
      modeTag[promptForm.mode],
      promptForm.exclude ? `[Exclude=${promptForm.exclude}]` : "",
      promptForm.additionalDirectives?.trim() || ""
    ].filter(Boolean);
    return lines.join("\n");
  }, [promptForm]);

  const lyricOutline = useMemo(() => {
    return promptForm.lyricSections.map(section => `[${section}]`).join("\n\n");
  }, [promptForm.lyricSections]);

  const displayedLyricsTags = useMemo(() => selectedMetaTags.map(tag => `[${tag}]`).join(" "), [selectedMetaTags]);

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId) || null, [projects, selectedProjectId]);
  const selectedSong = useMemo(() => selectedProject?.songs.find(s => s.id === selectedSongId) || null, [selectedProject, selectedSongId]);
  const selectedVersion = useMemo(() => selectedSong?.versions.find(v => v.id === selectedVersionId) || null, [selectedSong, selectedVersionId]);

  useEffect(() => {
    if (!selectedProject) {
      setSelectedSongId("");
      setSelectedVersionId("");
      return;
    }
    if (selectedSongId && !selectedProject.songs.some(song => song.id === selectedSongId)) {
      const firstSong = selectedProject.songs[0];
      setSelectedSongId(firstSong ? firstSong.id : "");
      setSelectedVersionId("");
    }
  }, [selectedProject, selectedSongId]);

  useEffect(() => {
    if (!selectedSong) {
      setSelectedVersionId("");
      return;
    }
    if (selectedVersionId && !selectedSong.versions.some(v => v.id === selectedVersionId)) {
      const firstVersion = selectedSong.versions[0];
      setSelectedVersionId(firstVersion ? firstVersion.id : "");
    }
  }, [selectedSong, selectedVersionId]);

  const updatePromptForm = <K extends keyof PromptForm>(key: K, value: PromptForm[K]) => {
    setPromptForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleMixNote = (note: string) => {
    setPromptForm(prev => {
      const has = prev.mixNotes.includes(note);
      const mixNotes = has ? prev.mixNotes.filter(item => item !== note) : [...prev.mixNotes, note];
      return { ...prev, mixNotes };
    });
  };

  const toggleLyricSection = (section: string) => {
    setPromptForm(prev => {
      const has = prev.lyricSections.includes(section);
      let next = has ? prev.lyricSections.filter(item => item !== section) : [...prev.lyricSections, section];
      const order = SECTION_ORDER;
      next = order.filter(item => next.includes(item));
      return { ...prev, lyricSections: next };
    });
  };

  const toggleMetaTag = (tag: string) => {
    setSelectedMetaTags(prev => {
      const has = prev.includes(tag);
      return has ? prev.filter(item => item !== tag) : [...prev, tag];
    });
  };

  const toggleChecklistItem = (sectionId: string, itemId: string) => {
    const key = `${sectionId}_${itemId}`;
    setChecklistState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addProject = () => {
    const name = projectDraftName.trim();
    if (!name) return;
    const project: ProjectRecord = {
      id: makeId(),
      name,
      description: "",
      createdAt: new Date().toISOString(),
      notes: projectDraftNotes.trim() || undefined,
      songs: []
    };
    setProjects(prev => [...prev, project]);
    setProjectDraftName("");
    setProjectDraftNotes("");
    setSelectedProjectId(project.id);
  };

  const removeProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (selectedProjectId === projectId) {
      setSelectedProjectId("");
      setSelectedSongId("");
      setSelectedVersionId("");
    }
  };

  const addSong = () => {
    if (!selectedProject) return;
    const title = songDraft.title.trim();
    if (!title) return;
    const song: SongRecord = {
      id: makeId(),
      projectId: selectedProject.id,
      title,
      bpm: songDraft.bpm.trim() || undefined,
      key: songDraft.key.trim() || undefined,
      structure: songDraft.structure.trim() || promptForm.structure,
      status: "draft",
      references: songDraft.references
        .split(/\n|,/)
        .map(ref => ref.trim())
        .filter(Boolean),
      notes: songDraft.notes.trim() || undefined,
      versions: []
    };
    setProjects(prev => prev.map(project => project.id === selectedProject.id ? { ...project, songs: [...project.songs, song] } : project));
    setSongDraft({ title: "", bpm: "", key: "", structure: "", references: "", notes: "" });
    setSelectedSongId(song.id);
  };

  const removeSong = (songId: string) => {
    setProjects(prev => prev.map(project => project.id === selectedProjectId ? { ...project, songs: project.songs.filter(song => song.id !== songId) } : project));
    if (selectedSongId === songId) {
      setSelectedSongId("");
      setSelectedVersionId("");
    }
  };

  const updateSong = (songId: string, updater: (song: SongRecord) => SongRecord) => {
    setProjects(prev => prev.map(project => ({
      ...project,
      songs: project.songs.map(song => song.id === songId ? updater(song) : song)
    })));
  };

  const updateVersion = (versionId: string, updater: (version: VersionRecord) => VersionRecord) => {
    setProjects(prev => prev.map(project => ({
      ...project,
      songs: project.songs.map(song => ({
        ...song,
        versions: song.versions.map(version => version.id === versionId ? updater(version) : version)
      }))
    })));
  };

  const addVersion = () => {
    if (!selectedSong) return;
    const label = versionDraft.label.trim() || `v1.0.${selectedSong.versions.length}`;
    const version: VersionRecord = {
      id: makeId(),
      songId: selectedSong.id,
      label,
      seed: versionDraft.seed.trim() || undefined,
      bpm: versionDraft.bpm.trim() || promptForm.tempo,
      key: versionDraft.key.trim() || promptForm.key,
      duration: versionDraft.duration.trim() || undefined,
      structureNotes: versionDraft.structureNotes.trim() || promptForm.structure,
      prompt: stylePrompt,
      exclude: promptForm.exclude,
      metaTags: [...selectedMetaTags],
      lyricTags: displayedLyricsTags,
      lyrics: lyricOutline,
      notes: versionDraft.notes.trim() || undefined,
      qaChecks: { ...DEFAULT_VERSION_QA },
      createdAt: new Date().toISOString(),
      status: "draft",
      takes: [],
      releasePlans: []
    };
    setProjects(prev => prev.map(project => project.id === selectedProject!.id ? {
      ...project,
      songs: project.songs.map(song => song.id === selectedSong.id ? {
        ...song,
        versions: [...song.versions, version]
      } : song)
    } : project));
    setVersionDraft({ ...versionDraftTemplate });
    setSelectedVersionId(version.id);
  };

  const removeVersion = (versionId: string) => {
    setProjects(prev => prev.map(project => ({
      ...project,
      songs: project.songs.map(song => ({
        ...song,
        versions: song.versions.filter(version => version.id !== versionId)
      }))
    })));
    if (selectedVersionId === versionId) {
      setSelectedVersionId("");
    }
  };

  const addTake = () => {
    if (!selectedVersion) return;
    const label = takeDraft.label.trim() || `Take ${selectedVersion.takes.length + 1}`;
    const take: TakeRecord = {
      id: makeId(),
      versionId: selectedVersion.id,
      label,
      shareUrl: takeDraft.shareUrl.trim() || undefined,
      notes: takeDraft.notes.trim() || undefined,
      selected: takeDraft.selected
    };
    updateVersion(selectedVersion.id, version => ({
      ...version,
      takes: [...version.takes, take]
    }));
    setTakeDraft({ ...takeDraftTemplate, label: `Take ${selectedVersion.takes.length + 2}` });
  };

  const toggleTakeSelected = (versionId: string, takeId: string) => {
    updateVersion(versionId, version => ({
      ...version,
      takes: version.takes.map(take => take.id === takeId ? { ...take, selected: !take.selected } : take)
    }));
  };

  const removeTake = (versionId: string, takeId: string) => {
    updateVersion(versionId, version => ({
      ...version,
      takes: version.takes.filter(take => take.id !== takeId)
    }));
  };

  const addRelease = () => {
    if (!selectedVersion) return;
    const platform = releaseDraft.platform.trim() || "soundcloud";
    const release: ReleaseRecord = {
      id: makeId(),
      platform,
      url: releaseDraft.url.trim() || undefined,
      releaseDate: releaseDraft.releaseDate.trim() || undefined,
      status: releaseDraft.status,
      notes: releaseDraft.notes.trim() || undefined
    };
    updateVersion(selectedVersion.id, version => ({
      ...version,
      releasePlans: [...version.releasePlans, release]
    }));
    setReleaseDraft({ ...releaseDraftTemplate });
  };

  const updateRelease = (versionId: string, releaseId: string, updater: (release: ReleaseRecord) => ReleaseRecord) => {
    updateVersion(versionId, version => ({
      ...version,
      releasePlans: version.releasePlans.map(release => release.id === releaseId ? updater(release) : release)
    }));
  };

  const removeRelease = (versionId: string, releaseId: string) => {
    updateVersion(versionId, version => ({
      ...version,
      releasePlans: version.releasePlans.filter(release => release.id !== releaseId)
    }));
  };

  const updateVersionField = <K extends keyof VersionRecord>(versionId: string, key: K, value: VersionRecord[K]) => {
    updateVersion(versionId, version => ({ ...version, [key]: value }));
  };

  const toggleQA = (versionId: string, itemId: string) => {
    updateVersion(versionId, version => ({
      ...version,
      qaChecks: { ...version.qaChecks, [itemId]: !version.qaChecks[itemId] }
    }));
  };

  const flattenedVersions = useMemo(() => {
    return projects.flatMap(project =>
      project.songs.flatMap(song =>
        song.versions.map(version => ({ project, song, version }))
      )
    );
  }, [projects]);

  const ContextSelectors = ({ showVersion = true, showSong = true }: { showVersion?: boolean; showSong?: boolean }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-zinc-400">Project</label>
        <select
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Select project…</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.songs.length} songs)
            </option>
          ))}
        </select>
      </div>
      {showSong && (
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-zinc-400">Song</label>
          <select
            value={selectedSongId}
            onChange={e => setSelectedSongId(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100"
            disabled={!selectedProject || (selectedProject?.songs.length ?? 0) === 0}
          >
            <option value="">Select song…</option>
            {selectedProject?.songs.map(song => (
              <option key={song.id} value={song.id}>
                {song.title} ({song.versions.length} versions)
              </option>
            ))}
          </select>
        </div>
      )}
      {showVersion && (
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-zinc-400">Version</label>
          <select
            value={selectedVersionId}
            onChange={e => setSelectedVersionId(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100"
            disabled={!selectedSong || (selectedSong?.versions.length ?? 0) === 0}
          >
            <option value="">Select version…</option>
            {selectedSong?.versions.map(version => (
              <option key={version.id} value={version.id}>
                {version.label} — {version.status}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music2 className="w-6 h-6 text-violet-300" />
          <div>
            <h1 className="text-lg font-semibold text-violet-200">Suno Master Studio</h1>
            <p className="text-xs text-zinc-400">UN&YA production OS · Suno v4.5+ workflow</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {([
            { key: "create", label: "1. Create" },
            { key: "generate", label: "2. Generate" },
            { key: "refine", label: "3. Refine" },
            { key: "master", label: "4. Master" },
            { key: "publish", label: "5. Publish" },
            { key: "library", label: "6. Library" }
          ] as const).map(item => (
            <Button
              key={item.key}
              variant={view === item.key ? "default" : "outline"}
              className={view === item.key ? "bg-violet-600 text-white" : "border-zinc-600 text-zinc-300"}
              onClick={() => setView(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </header>

      {view === "create" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2 space-y-4">
                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Sparkles className="w-5 h-5" /> Core Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Genre</label>
                        <Input
                          value={promptForm.genre}
                          onChange={e => updatePromptForm("genre", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Subgenre</label>
                        <Input
                          value={promptForm.subgenre}
                          onChange={e => updatePromptForm("subgenre", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Mood</label>
                        <Input
                          value={promptForm.mood}
                          onChange={e => updatePromptForm("mood", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Energy</label>
                        <Input
                          value={promptForm.energy}
                          onChange={e => updatePromptForm("energy", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Tempo (BPM)</label>
                        <Input
                          value={promptForm.tempo}
                          onChange={e => updatePromptForm("tempo", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Key</label>
                        <Input
                          value={promptForm.key}
                          onChange={e => updatePromptForm("key", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Time Signature</label>
                        <Input
                          value={promptForm.timeSignature}
                          onChange={e => updatePromptForm("timeSignature", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Mode</label>
                        <select
                          value={promptForm.mode}
                          onChange={e => updatePromptForm("mode", e.target.value as PromptMode)}
                          className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm"
                        >
                          {Object.entries(modeLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Wand2 className="w-5 h-5" /> Vocal & Structure Blueprint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Vocal Tag</label>
                        <Input
                          value={promptForm.vocal}
                          onChange={e => updatePromptForm("vocal", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Language</label>
                        <Input
                          value={promptForm.language}
                          onChange={e => updatePromptForm("language", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Lead Vox Descriptor</label>
                        <Input
                          value={promptForm.leadVox}
                          onChange={e => updatePromptForm("leadVox", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Backing Vox Descriptor</label>
                        <Input
                          value={promptForm.backingVox}
                          onChange={e => updatePromptForm("backingVox", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-400">Structure</label>
                      <Textarea
                        value={promptForm.structure}
                        onChange={e => updatePromptForm("structure", e.target.value)}
                        className="bg-zinc-950 border-zinc-700"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-400">Structure Sections</label>
                      <div className="flex flex-wrap gap-2">
                        {SECTION_ORDER.map(section => {
                          const active = promptForm.lyricSections.includes(section);
                          return (
                            <Button
                              key={section}
                              size="sm"
                              variant={active ? "default" : "outline"}
                              onClick={() => toggleLyricSection(section)}
                              className={active ? "bg-violet-600 text-white" : "border-zinc-700 text-zinc-300"}
                            >
                              {section}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Settings2 className="w-5 h-5" /> Instrumentation & Directives
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-400">Instrumentation</label>
                      <Textarea
                        value={promptForm.instrumentation}
                        onChange={e => updatePromptForm("instrumentation", e.target.value)}
                        className="bg-zinc-950 border-zinc-700"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-400">Hooks</label>
                      <Textarea
                        value={promptForm.hooks}
                        onChange={e => updatePromptForm("hooks", e.target.value)}
                        className="bg-zinc-950 border-zinc-700"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-400">Mix Notes</label>
                      <div className="flex flex-wrap gap-2">
                        {MIX_NOTE_PRESETS.map(note => {
                          const active = promptForm.mixNotes.includes(note);
                          return (
                            <Button
                              key={note}
                              size="sm"
                              variant={active ? "default" : "outline"}
                              onClick={() => toggleMixNote(note)}
                              className={active ? "bg-violet-600 text-white" : "border-zinc-700 text-zinc-300"}
                            >
                              {note}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Exclude (comma separated)</label>
                        <Textarea
                          value={promptForm.exclude}
                          onChange={e => updatePromptForm("exclude", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                          rows={2}
                        />
                        <div className="text-xs text-zinc-500">
                          Recommended: {EXCLUDE_RECOMMENDATIONS.join(", ")}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Additional Directives</label>
                        <Textarea
                          value={promptForm.additionalDirectives}
                          onChange={e => updatePromptForm("additionalDirectives", e.target.value)}
                          className="bg-zinc-950 border-zinc-700"
                          rows={4}
                          placeholder="Add extra [Directive] strings if needed"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-400">Brief / Inspire Notes</label>
                      <Textarea
                        value={promptForm.inspireNotes}
                        onChange={e => updatePromptForm("inspireNotes", e.target.value)}
                        className="bg-zinc-950 border-zinc-700"
                        rows={2}
                        placeholder="1–2 reference attributes instead of artist names"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <ListChecks className="w-5 h-5" /> Lyric Outline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Outline Preview</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-violet-700 text-violet-200"
                        onClick={() => safeCopyText(lyricOutline)}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy Outline
                      </Button>
                    </div>
                    <pre className="bg-zinc-950 border border-zinc-800 rounded p-3 text-xs whitespace-pre-wrap text-zinc-100">
                      {lyricOutline || "Select sections above"}
                    </pre>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-400">Draft Lyrics</label>
                      <Textarea
                        value={promptForm.lyricNotes}
                        onChange={e => updatePromptForm("lyricNotes", e.target.value)}
                        className="bg-zinc-950 border-zinc-700"
                        rows={6}
                        placeholder="Keep sections labelled [Verse], avoid ALL CAPS in lines"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="bg-zinc-900/70 border-violet-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Target className="w-5 h-5" /> Mission & Quick Start
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-zinc-300">
                        Mission: repeatable, predictable, pro-grade Suno output through disciplined prompts, workflow and QA.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Principles</h4>
                      <ul className="space-y-1 text-zinc-300 list-disc list-inside">
                        <li>Separate Lyrics vs Style prompts</li>
                        <li>Directive brackets only: [Directive]</li>
                        <li>Iterate with control — only vary keeper seeds</li>
                        <li>Measure everything: BPM, Key, LUFS, TP, Meta</li>
                        <li>Mark logic: smallest directive, biggest effect</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Quick Start</h4>
                      <ul className="space-y-1 text-zinc-300 list-disc list-inside">
                        {QUICK_START_STEPS.map(step => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-violet-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Disc3 className="w-5 h-5" /> Style Prompt Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Style Prompt</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-violet-700 text-violet-200"
                        onClick={() => safeCopyText(stylePrompt)}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy Style Prompt
                      </Button>
                    </div>
                    <pre className="bg-zinc-950 border border-zinc-800 rounded p-3 text-xs whitespace-pre-wrap text-zinc-100">
                      {stylePrompt}
                    </pre>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Meta Tags (Displayed Lyrics)</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-violet-700 text-violet-200"
                        onClick={() => safeCopyText(displayedLyricsTags)}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy Meta Tags
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[...META_TAGS, ...UNVERIFIED_META_TAGS].map(tag => {
                        const active = selectedMetaTags.includes(tag);
                        const unverified = UNVERIFIED_META_TAGS.includes(tag);
                        return (
                          <Button
                            key={tag}
                            size="sm"
                            variant={active ? "default" : "outline"}
                            onClick={() => toggleMetaTag(tag)}
                            className={active ? "bg-violet-600 text-white" : unverified ? "border-amber-600 text-amber-300" : "border-zinc-700 text-zinc-300"}
                          >
                            {tag}
                          </Button>
                        );
                      })}
                    </div>
                    <div className="text-xs text-zinc-400">Displayed Lyrics String: {displayedLyricsTags || "Select tags"}</div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-violet-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <BookOpen className="w-5 h-5" /> UN&YA Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {SOUND_BIBLE_TEMPLATES.map(template => (
                      <div key={template.id} className="border border-zinc-800 rounded p-3 space-y-2 bg-zinc-950/80">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-violet-100">{template.name}</h4>
                            <p className="text-xs text-zinc-400">{template.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-violet-700 text-violet-200"
                            onClick={() => safeCopyText(template.prompt)}
                          >
                            <Copy className="w-4 h-4 mr-1" /> Copy
                          </Button>
                        </div>
                        <pre className="text-xs whitespace-pre-wrap text-zinc-200 bg-zinc-950 border border-zinc-800 rounded p-2">
                          {template.prompt}
                        </pre>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-violet-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <ClipboardList className="w-5 h-5" /> SOP Checklists
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {SOP_CHECKLISTS.map(section => (
                      <div key={section.id} className="border border-zinc-800 rounded p-3 bg-zinc-950/80 space-y-2">
                        <h4 className="text-xs uppercase tracking-wide text-zinc-400">{section.title}</h4>
                        <ul className="space-y-2">
                          {section.items.map(item => {
                            const key = `${section.id}_${item.id}`;
                            const checked = checklistState[key] ?? false;
                            return (
                              <li key={item.id} className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleChecklistItem(section.id, item.id)}
                                  className={`w-4 h-4 rounded border ${checked ? "bg-violet-600 border-violet-400" : "border-zinc-600"}`}
                                  aria-label={item.label}
                                >
                                  {checked && <Check className="w-3 h-3 mx-auto" />}
                                </button>
                                <span className="text-zinc-300">{item.label}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-violet-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Layers className="w-5 h-5" /> Catalog Vision
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-zinc-300">
                    <ul className="space-y-1 list-disc list-inside">
                      {CATALOG_VISION.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="text-xs text-zinc-500 mt-2">
                      Failure triage mantra: {QUICK_FAILURE_FIX_ORDER[0]}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
      {view === "generate" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <Rocket className="w-5 h-5" /> Generation Playbook
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300 space-y-2">
                <p>1) Brief + prompt, 2) Generate 2–4 takes, 3) Pick seed, 4) Variations ≤3 waves, 5) Log everything.</p>
                <p>Use the builder output above to populate version logs. Keep lyrics clean and note meta tags for remaster.</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <ListChecks className="w-5 h-5" /> Active Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContextSelectors />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-zinc-900/70 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-violet-200">
                    <Music2 className="w-5 h-5" /> Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-zinc-400">New Project</label>
                    <Input
                      value={projectDraftName}
                      onChange={e => setProjectDraftName(e.target.value)}
                      placeholder="Project name"
                      className="bg-zinc-950 border-zinc-700"
                    />
                    <Textarea
                      value={projectDraftNotes}
                      onChange={e => setProjectDraftNotes(e.target.value)}
                      placeholder="Notes (mission, references, etc.)"
                      rows={3}
                      className="bg-zinc-950 border-zinc-700"
                    />
                    <Button className="bg-violet-600 text-white" onClick={addProject}>
                      <Plus className="w-4 h-4 mr-1" /> Create Project
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {projects.length === 0 && <p className="text-xs text-zinc-500">No projects yet. Start by creating one.</p>}
                    {projects.map(project => {
                      const selected = project.id === selectedProjectId;
                      return (
                        <div key={project.id} className={`border rounded p-3 bg-zinc-950/80 ${selected ? "border-violet-600" : "border-zinc-800"}`}>
                          <div className="flex items-center justify-between">
                            <button
                              className={`text-sm font-semibold ${selected ? "text-violet-200" : "text-zinc-200"}`}
                              onClick={() => setSelectedProjectId(project.id)}
                            >
                              {project.name}
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">{project.songs.length} songs</span>
                              <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => removeProject(project.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {project.notes && <p className="text-xs text-zinc-400 mt-2">{project.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/70 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-violet-200">
                    <LibraryIcon className="w-5 h-5" /> Songs & Versions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {!selectedProject && <p className="text-xs text-zinc-500">Select a project to manage songs.</p>}
                  {selectedProject && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">Add Song</label>
                        <Input
                          value={songDraft.title}
                          onChange={e => setSongDraft(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Song title"
                          className="bg-zinc-950 border-zinc-700"
                        />
                        <div className="grid md:grid-cols-3 gap-2">
                          <Input
                            value={songDraft.bpm}
                            onChange={e => setSongDraft(prev => ({ ...prev, bpm: e.target.value }))}
                            placeholder="BPM"
                            className="bg-zinc-950 border-zinc-700"
                          />
                          <Input
                            value={songDraft.key}
                            onChange={e => setSongDraft(prev => ({ ...prev, key: e.target.value }))}
                            placeholder="Key"
                            className="bg-zinc-950 border-zinc-700"
                          />
                          <Input
                            value={songDraft.structure}
                            onChange={e => setSongDraft(prev => ({ ...prev, structure: e.target.value }))}
                            placeholder="Structure"
                            className="bg-zinc-950 border-zinc-700"
                          />
                        </div>
                        <Textarea
                          value={songDraft.references}
                          onChange={e => setSongDraft(prev => ({ ...prev, references: e.target.value }))}
                          placeholder="Reference attributes (one per line)"
                          rows={2}
                          className="bg-zinc-950 border-zinc-700"
                        />
                        <Textarea
                          value={songDraft.notes}
                          onChange={e => setSongDraft(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Notes"
                          rows={2}
                          className="bg-zinc-950 border-zinc-700"
                        />
                        <Button className="bg-violet-600 text-white" onClick={addSong}>
                          <Plus className="w-4 h-4 mr-1" /> Add Song
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {selectedProject.songs.length === 0 && <p className="text-xs text-zinc-500">No songs logged yet.</p>}
                        {selectedProject.songs.map(song => {
                          const active = song.id === selectedSongId;
                          return (
                            <div key={song.id} className={`border rounded p-3 bg-zinc-950/80 ${active ? "border-violet-600" : "border-zinc-800"}`}>
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <button className={`text-sm font-semibold ${active ? "text-violet-200" : "text-zinc-200"}`} onClick={() => setSelectedSongId(song.id)}>
                                    {song.title}
                                  </button>
                                  <div className="text-xs text-zinc-500">{song.versions.length} versions logged</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={song.status}
                                    onChange={e => updateSong(song.id, s => ({ ...s, status: e.target.value as WorkflowStatus }))}
                                    className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs"
                                  >
                                    {WORKFLOW_STATUSES.map(status => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                  <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => removeSong(song.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {song.notes && <p className="text-xs text-zinc-400 mt-2">{song.notes}</p>}
                            </div>
                          );
                        })}
                      </div>

                      {selectedSong && (
                        <div className="space-y-4">
                          <div className="border border-zinc-800 rounded p-4 bg-zinc-950/70 space-y-3">
                            <h4 className="text-sm font-semibold text-violet-100">Add Version</h4>
                            <div className="grid md:grid-cols-2 gap-2">
                              <Input
                                value={versionDraft.label}
                                onChange={e => setVersionDraft(prev => ({ ...prev, label: e.target.value }))}
                                placeholder="SemVer (v1.0.0)"
                                className="bg-zinc-950 border-zinc-700"
                              />
                              <Input
                                value={versionDraft.seed}
                                onChange={e => setVersionDraft(prev => ({ ...prev, seed: e.target.value }))}
                                placeholder="Seed"
                                className="bg-zinc-950 border-zinc-700"
                              />
                              <Input
                                value={versionDraft.bpm}
                                onChange={e => setVersionDraft(prev => ({ ...prev, bpm: e.target.value }))}
                                placeholder="BPM"
                                className="bg-zinc-950 border-zinc-700"
                              />
                              <Input
                                value={versionDraft.key}
                                onChange={e => setVersionDraft(prev => ({ ...prev, key: e.target.value }))}
                                placeholder="Key"
                                className="bg-zinc-950 border-zinc-700"
                              />
                              <Input
                                value={versionDraft.duration}
                                onChange={e => setVersionDraft(prev => ({ ...prev, duration: e.target.value }))}
                                placeholder="Duration"
                                className="bg-zinc-950 border-zinc-700"
                              />
                              <Input
                                value={versionDraft.shareUrl}
                                onChange={e => setVersionDraft(prev => ({ ...prev, shareUrl: e.target.value }))}
                                placeholder="Share URL"
                                className="bg-zinc-950 border-zinc-700"
                              />
                            </div>
                            <Textarea
                              value={versionDraft.structureNotes}
                              onChange={e => setVersionDraft(prev => ({ ...prev, structureNotes: e.target.value }))}
                              placeholder="Structure notes"
                              rows={2}
                              className="bg-zinc-950 border-zinc-700"
                            />
                            <Textarea
                              value={versionDraft.notes}
                              onChange={e => setVersionDraft(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Notes"
                              rows={2}
                              className="bg-zinc-950 border-zinc-700"
                            />
                            <Button className="bg-violet-600 text-white" onClick={addVersion}>
                              <Plus className="w-4 h-4 mr-1" /> Log Version with Current Prompt
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {selectedSong.versions.length === 0 && (
                              <p className="text-xs text-zinc-500">No versions logged. Add one above after generating in Suno.</p>
                            )}
                            {selectedSong.versions.map(version => {
                              const open = selectedVersionId === version.id;
                              return (
                                <div key={version.id} className={`border rounded p-4 bg-zinc-950/80 ${open ? "border-violet-600" : "border-zinc-800"}`}>
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <button className={`text-sm font-semibold ${open ? "text-violet-200" : "text-zinc-200"}`} onClick={() => setSelectedVersionId(version.id)}>
                                        {version.label}
                                      </button>
                                      <div className="text-xs text-zinc-500">Seed: {version.seed || "n/a"}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={version.status}
                                        onChange={e => updateVersionField(version.id, "status", e.target.value as WorkflowStatus)}
                                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs"
                                      >
                                        {WORKFLOW_STATUSES.map(status => (
                                          <option key={status} value={status}>
                                            {status}
                                          </option>
                                        ))}
                                      </select>
                                      <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => removeVersion(version.id)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  {open && (
                                    <div className="mt-4 space-y-3 text-xs">
                                      <div className="grid md:grid-cols-3 gap-2">
                                        <Input
                                          value={version.seed || ""}
                                          onChange={e => updateVersionField(version.id, "seed", e.target.value)}
                                          placeholder="Seed"
                                          className="bg-zinc-950 border-zinc-700"
                                        />
                                        <Input
                                          value={version.bpm || ""}
                                          onChange={e => updateVersionField(version.id, "bpm", e.target.value)}
                                          placeholder="BPM"
                                          className="bg-zinc-950 border-zinc-700"
                                        />
                                        <Input
                                          value={version.key || ""}
                                          onChange={e => updateVersionField(version.id, "key", e.target.value)}
                                          placeholder="Key"
                                          className="bg-zinc-950 border-zinc-700"
                                        />
                                      </div>
                                      <Textarea
                                        value={version.structureNotes || ""}
                                        onChange={e => updateVersionField(version.id, "structureNotes", e.target.value)}
                                        placeholder="Structure / arrangement notes"
                                        rows={2}
                                        className="bg-zinc-950 border-zinc-700"
                                      />
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-zinc-200">Prompt</span>
                                          <Button size="sm" variant="outline" className="border-violet-700 text-violet-200" onClick={() => safeCopyText(version.prompt || "")}>Copy</Button>
                                        </div>
                                        <Textarea
                                          value={version.prompt || ""}
                                          onChange={e => updateVersionField(version.id, "prompt", e.target.value)}
                                          rows={4}
                                          className="bg-zinc-950 border-zinc-700"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-zinc-200">Lyrics / Tags</span>
                                          <Button size="sm" variant="outline" className="border-violet-700 text-violet-200" onClick={() => safeCopyText(version.lyrics || "")}>Copy Lyrics</Button>
                                        </div>
                                        <Textarea
                                          value={version.lyrics || ""}
                                          onChange={e => updateVersionField(version.id, "lyrics", e.target.value)}
                                          rows={4}
                                          className="bg-zinc-950 border-zinc-700"
                                        />
                                        <Textarea
                                          value={version.lyricTags || ""}
                                          onChange={e => updateVersionField(version.id, "lyricTags", e.target.value)}
                                          rows={2}
                                          className="bg-zinc-950 border-zinc-700"
                                          placeholder="Displayed lyrics meta tags"
                                        />
                                      </div>
                                      <Textarea
                                        value={version.exclude || ""}
                                        onChange={e => updateVersionField(version.id, "exclude", e.target.value)}
                                        rows={2}
                                        className="bg-zinc-950 border-zinc-700"
                                        placeholder="Exclude terms used"
                                      />
                                      <Textarea
                                        value={version.notes || ""}
                                        onChange={e => updateVersionField(version.id, "notes", e.target.value)}
                                        rows={3}
                                        className="bg-zinc-950 border-zinc-700"
                                        placeholder="Notes / decisions"
                                      />
                                      <div className="grid md:grid-cols-3 gap-2">
                                        <Input
                                          value={version.shareUrl || ""}
                                          onChange={e => updateVersionField(version.id, "shareUrl", e.target.value)}
                                          placeholder="Share URL"
                                          className="bg-zinc-950 border-zinc-700"
                                        />
                                        <Input
                                          value={version.sunoUrl || ""}
                                          onChange={e => updateVersionField(version.id, "sunoUrl", e.target.value)}
                                          placeholder="Suno URL"
                                          className="bg-zinc-950 border-zinc-700"
                                        />
                                        <Input
                                          value={version.soundcloudUrl || ""}
                                          onChange={e => updateVersionField(version.id, "soundcloudUrl", e.target.value)}
                                          placeholder="SoundCloud URL"
                                          className="bg-zinc-950 border-zinc-700"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {view === "refine" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <PenSquare className="w-5 h-5" /> Refine & Variations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-300">
                <p>Run controlled variation waves only after locking a winning seed. Track takes, mark favorites, and capture iteration notes.</p>
                <p>Iteration order: reinforce directives → regenerate sections → finalize arrangement.</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <ListChecks className="w-5 h-5" /> Active Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContextSelectors />
              </CardContent>
            </Card>

            {selectedVersion ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Target className="w-5 h-5" /> Iteration Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <Textarea
                      value={selectedVersion.iterationPlan || ""}
                      onChange={e => updateVersionField(selectedVersion.id, "iterationPlan", e.target.value)}
                      rows={8}
                      className="bg-zinc-950 border-zinc-700"
                      placeholder="Document variation strategy, arrangement tweaks, directives to try."
                    />
                    <div className="text-xs text-zinc-500">
                      Reminder: ≤3 variation waves unless structural issue persists.
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <CheckCircle2 className="w-5 h-5" /> Takes & Seeds
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-400">Add Take</label>
                      <Input
                        value={takeDraft.label}
                        onChange={e => setTakeDraft(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Take label"
                        className="bg-zinc-950 border-zinc-700"
                      />
                      <Input
                        value={takeDraft.shareUrl}
                        onChange={e => setTakeDraft(prev => ({ ...prev, shareUrl: e.target.value }))}
                        placeholder="Share URL"
                        className="bg-zinc-950 border-zinc-700"
                      />
                      <Textarea
                        value={takeDraft.notes}
                        onChange={e => setTakeDraft(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Notes"
                        rows={2}
                        className="bg-zinc-950 border-zinc-700"
                      />
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <input
                          type="checkbox"
                          checked={takeDraft.selected}
                          onChange={e => setTakeDraft(prev => ({ ...prev, selected: e.target.checked }))}
                        />
                        Mark as keeper
                      </div>
                      <Button className="bg-violet-600 text-white" onClick={addTake}>
                        <Plus className="w-4 h-4 mr-1" /> Log Take
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {selectedVersion.takes.length === 0 && <p className="text-xs text-zinc-500">No takes logged yet.</p>}
                      {selectedVersion.takes.map(take => (
                        <div key={take.id} className={`border rounded p-3 bg-zinc-950/70 ${take.selected ? "border-violet-600" : "border-zinc-800"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-zinc-200">{take.label}</div>
                              {take.shareUrl && (
                                <a href={take.shareUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-300 hover:text-violet-200">
                                  {take.shareUrl}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className={take.selected ? "border-violet-600 text-violet-200" : "border-zinc-700 text-zinc-300"} onClick={() => toggleTakeSelected(selectedVersion.id, take.id)}>
                                {take.selected ? "Selected" : "Mark"}
                              </Button>
                              <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => removeTake(selectedVersion.id, take.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {take.notes && <p className="text-xs text-zinc-400 mt-2">{take.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-zinc-900/70 border-zinc-800">
                <CardContent className="text-sm text-zinc-400">
                  Select a project, song, and version to log refinement notes.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      {view === "master" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <Settings2 className="w-5 h-5" /> Master & QA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300 space-y-2">
                <p>Remaster with meta tags in displayed lyrics, run EXPOSE 2, aim for −12 ±2 LUFS and ≤ −1 dBTP. Log export name and QA state.</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <ListChecks className="w-5 h-5" /> Active Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContextSelectors />
              </CardContent>
            </Card>

            {selectedVersion ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Disc3 className="w-5 h-5" /> Remaster Meta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {[...META_TAGS, ...UNVERIFIED_META_TAGS].map(tag => {
                        const active = selectedVersion.metaTags.includes(tag);
                        const unverified = UNVERIFIED_META_TAGS.includes(tag);
                        return (
                          <Button
                            key={tag}
                            size="sm"
                            variant={active ? "default" : "outline"}
                            className={active ? "bg-violet-600 text-white" : unverified ? "border-amber-600 text-amber-300" : "border-zinc-700 text-zinc-300"}
                            onClick={() => {
                              const has = selectedVersion.metaTags.includes(tag);
                              const metaTags = has
                                ? selectedVersion.metaTags.filter(item => item !== tag)
                                : [...selectedVersion.metaTags, tag];
                              updateVersionField(selectedVersion.id, "metaTags", metaTags);
                            }}
                          >
                            {tag}
                          </Button>
                        );
                      })}
                    </div>
                    <Textarea
                      value={selectedVersion.masteringNotes || ""}
                      onChange={e => updateVersionField(selectedVersion.id, "masteringNotes", e.target.value)}
                      rows={4}
                      className="bg-zinc-950 border-zinc-700"
                      placeholder="Mastering chain / SoundLab settings"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <CheckCircle2 className="w-5 h-5" /> Metrics & Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid md:grid-cols-2 gap-2">
                      <Input
                        value={selectedVersion.lufs || ""}
                        onChange={e => updateVersionField(selectedVersion.id, "lufs", e.target.value)}
                        placeholder="Integrated LUFS"
                        className="bg-zinc-950 border-zinc-700"
                      />
                      <Input
                        value={selectedVersion.truePeak || ""}
                        onChange={e => updateVersionField(selectedVersion.id, "truePeak", e.target.value)}
                        placeholder="True Peak"
                        className="bg-zinc-950 border-zinc-700"
                      />
                      <Input
                        value={selectedVersion.exportName || ""}
                        onChange={e => updateVersionField(selectedVersion.id, "exportName", e.target.value)}
                        placeholder="Export filename"
                        className="bg-zinc-950 border-zinc-700"
                      />
                      <Input
                        value={selectedVersion.exposeLog || ""}
                        onChange={e => updateVersionField(selectedVersion.id, "exposeLog", e.target.value)}
                        placeholder="EXPOSE 2 notes"
                        className="bg-zinc-950 border-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-wide text-zinc-400">QA Checklist</h4>
                      <ul className="space-y-2">
                        {QA_ITEMS.map(item => {
                          const checked = selectedVersion.qaChecks[item.id];
                          return (
                            <li key={item.id} className="flex items-center gap-2">
                              <button
                                onClick={() => toggleQA(selectedVersion.id, item.id)}
                                className={`w-4 h-4 rounded border ${checked ? "bg-violet-600 border-violet-400" : "border-zinc-600"}`}
                                aria-label={item.label}
                              >
                                {checked && <Check className="w-3 h-3 mx-auto" />}
                              </button>
                              <span className="text-zinc-300">{item.label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <AlertTriangle className="w-5 h-5" /> Failure Modes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {FAILURE_MODES.map(mode => (
                      <div key={mode.id} className="border border-zinc-800 rounded p-3 bg-zinc-950/80">
                        <div className="text-sm font-semibold text-violet-100">{mode.title}</div>
                        <div className="text-xs text-zinc-400">Fix: {mode.fix}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Music2 className="w-5 h-5" /> Instrumental Playbook
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {INSTRUMENTAL_PLAYBOOK.map(step => (
                      <div key={step.title} className="border border-zinc-800 rounded p-3 bg-zinc-950/80">
                        <div className="text-sm font-semibold text-violet-100">{step.title}</div>
                        <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 mt-1">
                          {step.points.map(point => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-zinc-900/70 border-zinc-800">
                <CardContent className="text-sm text-zinc-400">Select a version to log mastering notes.</CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {view === "publish" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <Share2 className="w-5 h-5" /> Publish & Live
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <p>Track platform releases, schedule states, and capture live set requirements. Remember export naming convention.</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <ListChecks className="w-5 h-5" /> Active Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContextSelectors />
              </CardContent>
            </Card>

            {selectedVersion ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <Share2 className="w-5 h-5" /> Release Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid md:grid-cols-2 gap-2">
                      <Input
                        value={releaseDraft.platform}
                        onChange={e => setReleaseDraft(prev => ({ ...prev, platform: e.target.value }))}
                        placeholder="Platform"
                        className="bg-zinc-950 border-zinc-700"
                      />
                      <select
                        value={releaseDraft.status}
                        onChange={e => setReleaseDraft(prev => ({ ...prev, status: e.target.value as ReleaseStatus }))}
                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-2 text-sm"
                      >
                        {RELEASE_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={releaseDraft.url}
                        onChange={e => setReleaseDraft(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="URL"
                        className="bg-zinc-950 border-zinc-700"
                      />
                      <Input
                        value={releaseDraft.releaseDate}
                        onChange={e => setReleaseDraft(prev => ({ ...prev, releaseDate: e.target.value }))}
                        placeholder="Release date"
                        className="bg-zinc-950 border-zinc-700"
                      />
                    </div>
                    <Textarea
                      value={releaseDraft.notes}
                      onChange={e => setReleaseDraft(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="bg-zinc-950 border-zinc-700"
                      placeholder="Notes"
                    />
                    <Button className="bg-violet-600 text-white" onClick={addRelease}>
                      <Plus className="w-4 h-4 mr-1" /> Add Release Entry
                    </Button>
                    <div className="space-y-2">
                      {selectedVersion.releasePlans.length === 0 && <p className="text-xs text-zinc-500">No releases logged.</p>}
                      {selectedVersion.releasePlans.map(release => (
                        <div key={release.id} className="border border-zinc-800 rounded p-3 bg-zinc-950/80">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-zinc-200">{release.platform}</div>
                              <div className="text-xs text-zinc-500">Status: {release.status}</div>
                              {release.url && (
                                <a href={release.url} target="_blank" rel="noreferrer" className="text-xs text-violet-300 hover:text-violet-200">
                                  {release.url}
                                </a>
                              )}
                            </div>
                            <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => removeRelease(selectedVersion.id, release.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 mt-2">
                            <select
                              value={release.status}
                              onChange={e => updateRelease(selectedVersion.id, release.id, r => ({ ...r, status: e.target.value as ReleaseStatus }))}
                              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs"
                            >
                              {RELEASE_STATUSES.map(status => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <Input
                              value={release.releaseDate || ""}
                              onChange={e => updateRelease(selectedVersion.id, release.id, r => ({ ...r, releaseDate: e.target.value }))}
                              placeholder="Release date"
                              className="bg-zinc-950 border-zinc-700"
                            />
                          </div>
                          <Textarea
                            value={release.notes || ""}
                            onChange={e => updateRelease(selectedVersion.id, release.id, r => ({ ...r, notes: e.target.value }))}
                            rows={2}
                            className="bg-zinc-950 border-zinc-700 mt-2"
                            placeholder="Notes"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-200">
                      <BookOpen className="w-5 h-5" /> Live Blueprint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {LIVE_BLUEPRINT.map(section => (
                      <div key={section.title} className="border border-zinc-800 rounded p-3 bg-zinc-950/80">
                        <div className="text-sm font-semibold text-violet-100">{section.title}</div>
                        <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 mt-1">
                          {section.points.map(point => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-zinc-900/70 border-zinc-800">
                <CardContent className="text-sm text-zinc-400">Select a version to track publication details.</CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      {view === "library" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <LibraryIcon className="w-5 h-5" /> Catalog Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300 grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-semibold text-violet-200">{projects.length}</div>
                  <div className="text-xs uppercase tracking-wide text-zinc-400">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-violet-200">{projects.reduce((sum, p) => sum + p.songs.length, 0)}</div>
                  <div className="text-xs uppercase tracking-wide text-zinc-400">Songs</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-violet-200">{flattenedVersions.length}</div>
                  <div className="text-xs uppercase tracking-wide text-zinc-400">Versions</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-200">
                  <ListChecks className="w-5 h-5" /> Version Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {flattenedVersions.length === 0 ? (
                  <p className="text-xs text-zinc-500">No versions logged yet. Use Generate step to create entries.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-zinc-900 text-zinc-400 uppercase tracking-wide">
                        <tr>
                          <th className="text-left py-2 px-3">Project</th>
                          <th className="text-left py-2 px-3">Song</th>
                          <th className="text-left py-2 px-3">Version</th>
                          <th className="text-left py-2 px-3">Status</th>
                          <th className="text-left py-2 px-3">Seed</th>
                          <th className="text-left py-2 px-3">BPM</th>
                          <th className="text-left py-2 px-3">Key</th>
                          <th className="text-left py-2 px-3">LUFS</th>
                          <th className="text-left py-2 px-3">TP</th>
                          <th className="text-left py-2 px-3">Meta Tags</th>
                          <th className="text-left py-2 px-3">Links</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...flattenedVersions]
                          .sort((a, b) => new Date(b.version.createdAt).getTime() - new Date(a.version.createdAt).getTime())
                          .map(entry => (
                            <tr key={entry.version.id} className="border-t border-zinc-800">
                              <td className="py-2 px-3 text-zinc-200">{entry.project.name}</td>
                              <td className="py-2 px-3 text-zinc-400">{entry.song.title}</td>
                              <td className="py-2 px-3 text-zinc-200">{entry.version.label}</td>
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-200">
                                  {entry.version.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-zinc-300">{entry.version.seed || "–"}</td>
                              <td className="py-2 px-3 text-zinc-300">{entry.version.bpm || "–"}</td>
                              <td className="py-2 px-3 text-zinc-300">{entry.version.key || "–"}</td>
                              <td className="py-2 px-3 text-zinc-300">{entry.version.lufs || "–"}</td>
                              <td className="py-2 px-3 text-zinc-300">{entry.version.truePeak || "–"}</td>
                              <td className="py-2 px-3 text-zinc-300 max-w-[160px]">
                                <div className="truncate">{entry.version.metaTags.join(", ")}</div>
                              </td>
                              <td className="py-2 px-3 text-zinc-300 space-y-1">
                                {entry.version.prompt && (
                                  <Button size="sm" variant="outline" className="border-violet-700 text-violet-200" onClick={() => safeCopyText(entry.version.prompt || "")}>Prompt</Button>
                                )}
                                {entry.version.shareUrl && (
                                  <a href={entry.version.shareUrl} target="_blank" rel="noreferrer" className="block text-xs text-violet-300 hover:text-violet-200">Share</a>
                                )}
                                {entry.version.sunoUrl && (
                                  <a href={entry.version.sunoUrl} target="_blank" rel="noreferrer" className="block text-xs text-violet-300 hover:text-violet-200">Suno</a>
                                )}
                                {entry.version.soundcloudUrl && (
                                  <a href={entry.version.soundcloudUrl} target="_blank" rel="noreferrer" className="block text-xs text-violet-300 hover:text-violet-200">SoundCloud</a>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

