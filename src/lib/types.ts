export type WorkflowStage = 'prompt' | 'generation' | 'mastering' | 'release'

export type PromptMode = 'full' | 'instrumental' | 'addVocals' | 'addInstrumentals'

export interface Take {
  id: string
  label: string
  shareUrl?: string
  notes?: string
  selected?: boolean
}

export type ReleaseStatus = 'draft' | 'scheduled' | 'released' | 'live'

export interface ReleasePlan {
  id: string
  platform: string
  url?: string
  releaseDate?: string
  status: ReleaseStatus
  notes?: string
}

export interface SpectrumSnapshotPoint {
  label: string
  value: number
}

export interface IterationEntry {
  id: string
  createdAt: string
  promptSummary?: string
  sunoUrl?: string
  seed?: string
  notes?: string
  enhancements: string[]
}

export interface MasteringProfile {
  targetLufs?: string
  targetTruePeak?: string
  bandlab: Record<string, string | undefined>
  expose: Record<string, string | undefined>
}

export interface Version {
  id: string
  label: string
  createdAt: string
  status: WorkflowStage | 'approved' | 'published'
  seed?: string
  bpm?: string
  key?: string
  duration?: string
  prompt?: string
  finalPrompt?: string
  finalPromptId?: string
  finalLyrics?: string
  promptHistory: string[]
  iterationTimeline: IterationEntry[]
  takes: Take[]
  releasePlans: ReleasePlan[]
  qaChecks: Record<string, boolean>
  metaTags: string[]
  exclude?: string
  notes?: string
  lufs?: string
  truePeak?: string
  masteringProfile?: MasteringProfile
  spectrumNotes?: string
  spectrumSnapshot?: string
  shareUrl?: string
  sunoUrl?: string
  soundcloudUrl?: string
  finalReleaseUrl?: string
}

export interface Song {
  id: string
  title: string
  createdAt: string
  status: WorkflowStage | 'approved' | 'published'
  presetId?: string
  tags: string[]
  lyricBrief?: string
  briefNotes?: string
  references: string[]
  versions: Version[]
}

export interface Album {
  id: string
  name: string
  createdAt: string
  releaseTargetDate?: string
  notes?: string
  songs: Song[]
}

export interface WorkspaceState {
  albums: Album[]
}
