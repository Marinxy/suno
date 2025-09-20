import React, { useEffect, useMemo, useState } from "react"
import { Song, Version } from "../../lib/types"
import { Copy, Sparkles, History } from "lucide-react"

const genreOptions = [
  "Industrial Metal",
  "Synthwave",
  "Cinematic",
  "Ambient"
]

const subgenreOptions = [
  "Cyber-Brutalist",
  "Slavonic Anthemic",
  "Darkwave",
  "Hybrid Orchestral"
]

const moodOptions = [
  "Cold",
  "Triumphant",
  "Introspective",
  "Epic",
  "Rising"
]

const mixNoteOptions = [
  "warm_low_end",
  "tight_highs",
  "stereo_depth",
  "clear_guitar",
  "analog_warmth",
  "dynamic_range:wide"
]

type PromptForm = {
  genre: string
  subgenre: string
  mood: string
  energy: string
  tempo: string
  key: string
  vocal: string
  language: string
  structure: string
  instrumentation: string
  mixNotes: string[]
  exclude: string
}

const defaultForm: PromptForm = {
  genre: "Industrial Metal",
  subgenre: "Cyber-Brutalist",
  mood: "Cold",
  energy: "High",
  tempo: "128",
  key: "E minor",
  vocal: "Duet (male deep, female ethereal)",
  language: "English",
  structure: "Intro – Verse – Pre – Chorus – Chorus – Bridge – Outro",
  instrumentation: "Drop-tuned guitars, distorted bass, glitched synths, hybrid orchestra, live drums",
  mixNotes: ["warm_low_end", "tight_highs", "stereo_depth"],
  exclude: "rap, screamo, trap_hats, vinyl_crackle"
}

type Props = {
  version: Version
  song: Song
  onUpdateVersion: (updater: (version: Version) => Version) => void
}

const PromptWorkspace: React.FC<Props> = ({ version, song, onUpdateVersion }) => {
  const [form, setForm] = useState<PromptForm>(defaultForm)
  const [additionalNotes, setAdditionalNotes] = useState<string>("")
  const [finalPrompt, setFinalPrompt] = useState<string>(version.finalPrompt || "")

  useEffect(() => {
    setForm(prev => ({ ...prev, mixNotes: prev.mixNotes }))
    setFinalPrompt(version.finalPrompt || "")
    setAdditionalNotes(version.notes || "")
  }, [version.id])

  const stylePrompt = useMemo(() => {
    const lines = [
      `[Genre=${form.genre}] [Subgenre=${form.subgenre}] [Mood=${form.mood}]`,
      `[Energy=${form.energy}] [Tempo=${form.tempo}bpm] [Key=${form.key}]`,
      `[Vocal=${form.vocal}] [Language=${form.language}]`,
      `[Structure=${form.structure}]`,
      `[Instrumentation=${form.instrumentation}]`,
      form.mixNotes.length ? `[MixNotes=${form.mixNotes.join(', ')}]` : "",
      form.exclude ? `[Exclude=${form.exclude}]` : "",
      additionalNotes.trim()
    ].filter(Boolean)
    return lines.join("\n")
  }, [form, additionalNotes])

  const handleCopy = async (value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
    } catch (error) {
      console.warn("Copy failed", error)
    }
  }

  const handleSaveSnapshot = () => {
    const stamp = new Date().toISOString()
    onUpdateVersion(prev => ({
      ...prev,
      prompt: stylePrompt,
      promptHistory: [...prev.promptHistory, `${stamp}: ${stylePrompt}`]
    }))
  }

  const handleSaveFinalPrompt = () => {
    onUpdateVersion(prev => ({
      ...prev,
      finalPrompt,
      notes: additionalNotes
    }))
  }

  const handleFormChange = <K extends keyof PromptForm>(key: K, value: PromptForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const toggleMixNote = (note: string) => {
    setForm(prev => ({
      ...prev,
      mixNotes: prev.mixNotes.includes(note)
        ? prev.mixNotes.filter(item => item !== note)
        : [...prev.mixNotes, note]
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-violet-200">Style Preset</h3>
          <div className="space-y-3 text-xs text-zinc-200">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Genre</label>
              <select
                value={form.genre}
                onChange={e => handleFormChange('genre', e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              >
                {genreOptions.map(option => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Subgenre</label>
              <select
                value={form.subgenre}
                onChange={e => handleFormChange('subgenre', e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              >
                {subgenreOptions.map(option => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Mood</label>
                <select
                  value={form.mood}
                  onChange={e => handleFormChange('mood', e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                >
                  {moodOptions.map(option => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Energy</label>
                <input
                  value={form.energy}
                  onChange={e => handleFormChange('energy', e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Tempo</label>
                <input
                  value={form.tempo}
                  onChange={e => handleFormChange('tempo', e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Key</label>
                <input
                  value={form.key}
                  onChange={e => handleFormChange('key', e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Vocal</label>
              <input
                value={form.vocal}
                onChange={e => handleFormChange('vocal', e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Language</label>
              <input
                value={form.language}
                onChange={e => handleFormChange('language', e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-violet-200">Structure & Mix</h3>
          <div className="space-y-3 text-xs text-zinc-200">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Structure</label>
              <input
                value={form.structure}
                onChange={e => handleFormChange('structure', e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Instrumentation</label>
              <textarea
                value={form.instrumentation}
                onChange={e => handleFormChange('instrumentation', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Mix Notes</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {mixNoteOptions.map(note => (
                  <button
                    key={note}
                    onClick={() => toggleMixNote(note)}
                    className={`rounded-full border px-2 py-1 text-[11px] transition ${
                      form.mixNotes.includes(note)
                        ? "border-violet-500 bg-violet-500/20 text-violet-100"
                        : "border-zinc-700 text-zinc-400 hover:border-violet-500/40"
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Exclude</label>
              <input
                value={form.exclude}
                onChange={e => handleFormChange('exclude', e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Additional Notes</label>
              <textarea
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="e.g. reinforce outro vocal stack"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-violet-200">Live Prompt Preview</h3>
          <div className="rounded border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-200 whitespace-pre-wrap">
            {stylePrompt}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(stylePrompt)}
              className="flex items-center gap-2 rounded border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-violet-500/40"
            >
              <Copy className="h-3 w-3" /> Copy style prompt
            </button>
            <button
              onClick={handleSaveSnapshot}
              className="flex items-center gap-2 rounded border border-violet-500 bg-violet-500/20 px-3 py-2 text-xs text-violet-100"
            >
              <Sparkles className="h-3 w-3" /> Save snapshot
            </button>
          </div>
          <div>
            <h4 className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
              <History className="h-3 w-3" /> Prompt history
            </h4>
            <ul className="mt-2 space-y-1 text-[11px] text-zinc-400 max-h-32 overflow-y-auto">
              {version.promptHistory.length === 0 ? (
                <li>No prompt history yet.</li>
              ) : (
                version.promptHistory
                  .slice()
                  .reverse()
                  .map(entry => <li key={entry}>{entry}</li>)
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Final Prompt (Style + Lyrics)</h3>
          <p className="text-xs text-zinc-500">
            After ChatGPT merges the lyrics, paste the final prompt here to keep a reference for the approved version.
          </p>
          <textarea
            value={finalPrompt}
            onChange={e => setFinalPrompt(e.target.value)}
            rows={10}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(finalPrompt)}
              className="flex items-center gap-2 rounded border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-violet-500/40"
            >
              <Copy className="h-3 w-3" /> Copy final prompt
            </button>
            <button
              onClick={handleSaveFinalPrompt}
              className="rounded border border-violet-500 bg-violet-500/20 px-3 py-2 text-xs text-violet-100"
            >
              Save final prompt
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Song Brief</h3>
          <p className="text-xs text-zinc-500">Quick context for this song.</p>
          <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3 text-xs leading-relaxed text-zinc-300 space-y-2">
            <p><strong>Album:</strong> {song.title}</p>
            <p><strong>References:</strong> {song.references.join(', ') || 'n/a'}</p>
            <p><strong>Current notes:</strong> {song.briefNotes || 'This version is ready for prompt iteration.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromptWorkspace
