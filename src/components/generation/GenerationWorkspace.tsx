import React, { useState } from "react"
import { Version } from "../../lib/types"
import { Copy, PlusCircle, CheckCircle2, Sparkles } from "lucide-react"

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`
}

type Props = {
  version: Version
  onUpdateVersion: (updater: (version: Version) => Version) => void
}

const GenerationWorkspace: React.FC<Props> = ({ version, onUpdateVersion }) => {
  const [takeDraft, setTakeDraft] = useState({ label: "", shareUrl: "", notes: "", selected: false })
  const [iterationDraft, setIterationDraft] = useState({ summary: "", sunoUrl: "", seed: "", notes: "", enhancements: "" })

  const handleCopy = async (value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
    } catch (error) {
      console.warn("Copy failed", error)
    }
  }

  const addTake = () => {
    if (!takeDraft.label.trim()) return
    const newTake = {
      id: randomId("take"),
      label: takeDraft.label.trim(),
      shareUrl: takeDraft.shareUrl.trim() || undefined,
      notes: takeDraft.notes.trim() || undefined,
      selected: takeDraft.selected
    }
    onUpdateVersion(prev => ({
      ...prev,
      takes: [...prev.takes, newTake]
    }))
    setTakeDraft({ label: "", shareUrl: "", notes: "", selected: false })
  }

  const toggleTakeSelected = (takeId: string) => {
    onUpdateVersion(prev => ({
      ...prev,
      takes: prev.takes.map(take => (take.id === takeId ? { ...take, selected: !take.selected } : take))
    }))
  }

  const addIteration = () => {
    if (!iterationDraft.summary.trim() && !iterationDraft.sunoUrl.trim()) return
    const entry = {
      id: randomId("iter"),
      createdAt: new Date().toISOString(),
      promptSummary: iterationDraft.summary.trim() || undefined,
      sunoUrl: iterationDraft.sunoUrl.trim() || undefined,
      seed: iterationDraft.seed.trim() || undefined,
      notes: iterationDraft.notes.trim() || undefined,
      enhancements: iterationDraft.enhancements
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
    }
    onUpdateVersion(prev => ({
      ...prev,
      iterationTimeline: [...prev.iterationTimeline, entry]
    }))
    setIterationDraft({ summary: "", sunoUrl: "", seed: "", notes: "", enhancements: "" })
  }

  return (
    <div className="space-y-5">
      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5">
        <h3 className="text-sm font-semibold text-violet-200">Keeper Prompt</h3>
        <p className="mt-1 text-xs text-zinc-500">Copy the approved prompt when logging variations.</p>
        <div className="mt-3 rounded border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
          {version.finalPrompt || version.prompt || "No final prompt captured yet."}
        </div>
        <button
          onClick={() => handleCopy(version.finalPrompt || version.prompt || "")}
          className="mt-2 inline-flex items-center gap-2 rounded border border-zinc-700 px-3 py-2 text-[11px] text-zinc-300 hover:border-violet-500/40"
        >
          <Copy className="h-3 w-3" /> Copy prompt
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 rounded border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-violet-200">Log Suno Take</h3>
          <div className="space-y-2 text-xs text-zinc-300">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Label</label>
              <input
                value={takeDraft.label}
                onChange={e => setTakeDraft(prev => ({ ...prev, label: e.target.value }))}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="Take name"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Share URL</label>
              <input
                value={takeDraft.shareUrl}
                onChange={e => setTakeDraft(prev => ({ ...prev, shareUrl: e.target.value }))}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="https://app.suno.ai/share/..."
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Notes</label>
              <textarea
                value={takeDraft.notes}
                onChange={e => setTakeDraft(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="Describe what changed"
              />
            </div>
            <label className="flex items-center gap-2 text-[11px] text-zinc-400">
              <input
                type="checkbox"
                checked={takeDraft.selected}
                onChange={e => setTakeDraft(prev => ({ ...prev, selected: e.target.checked }))}
              />
              Mark as keeper
            </label>
            <button
              onClick={addTake}
              className="inline-flex items-center gap-2 rounded border border-violet-500 bg-violet-500/20 px-3 py-2 text-[11px] text-violet-100"
            >
              <PlusCircle className="h-3 w-3" /> Add take
            </button>
          </div>
          <div className="space-y-2">
            {version.takes.length === 0 ? (
              <p className="text-xs text-zinc-500">No takes logged yet.</p>
            ) : (
              version.takes.map(take => (
                <div
                  key={take.id}
                  className={`rounded border px-3 py-2 text-xs transition ${
                    take.selected ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-200">{take.label}</p>
                      {take.shareUrl && (
                        <a
                          href={take.shareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-violet-300 hover:text-violet-100"
                        >
                          {take.shareUrl}
                        </a>
                      )}
                      {take.notes && <p className="text-[11px] text-zinc-500">{take.notes}</p>}
                    </div>
                    <button
                      onClick={() => toggleTakeSelected(take.id)}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] uppercase tracking-wide transition ${
                        take.selected
                          ? "bg-violet-500 text-white"
                          : "border border-zinc-700 text-zinc-400 hover:border-violet-500/40"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" /> {take.selected ? "Keeper" : "Mark keeper"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 rounded border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-violet-200">Iteration Timeline</h3>
          <p className="text-xs text-zinc-500">Document prompt tweaks or regeneration attempts.</p>

          <div className="space-y-2 text-xs text-zinc-300">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Summary</label>
              <input
                value={iterationDraft.summary}
                onChange={e => setIterationDraft(prev => ({ ...prev, summary: e.target.value }))}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="e.g. Reinforced chorus guitars"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Suno URL</label>
                <input
                  value={iterationDraft.sunoUrl}
                  onChange={e => setIterationDraft(prev => ({ ...prev, sunoUrl: e.target.value }))}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                  placeholder="https://app.suno.ai/share/..."
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Seed</label>
                <input
                  value={iterationDraft.seed}
                  onChange={e => setIterationDraft(prev => ({ ...prev, seed: e.target.value }))}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                  placeholder="seed-1234"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Enhancements</label>
              <input
                value={iterationDraft.enhancements}
                onChange={e => setIterationDraft(prev => ({ ...prev, enhancements: e.target.value }))}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="comma-separated (tighten_chorus, widen_pads)"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Notes</label>
              <textarea
                value={iterationDraft.notes}
                onChange={e => setIterationDraft(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
            <button
              onClick={addIteration}
              className="inline-flex items-center gap-2 rounded border border-violet-500 bg-violet-500/20 px-3 py-2 text-[11px] text-violet-100"
            >
              <Sparkles className="h-3 w-3" /> Log iteration
            </button>
          </div>

          <div className="space-y-2">
            {version.iterationTimeline.length === 0 ? (
              <p className="text-xs text-zinc-500">No iterations logged yet.</p>
            ) : (
              version.iterationTimeline
                .slice()
                .reverse()
                .map(entry => (
                  <div key={entry.id} className="rounded border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</span>
                      {entry.sunoUrl && (
                        <a href={entry.sunoUrl} target="_blank" rel="noreferrer" className="text-violet-300 hover:text-violet-100">
                          View Suno
                        </a>
                      )}
                    </div>
                    {entry.promptSummary && <p className="mt-1 font-medium text-zinc-200">{entry.promptSummary}</p>}
                    {entry.enhancements.length > 0 && (
                      <p className="text-[11px] text-zinc-500">Enhancements: {entry.enhancements.join(', ')}</p>
                    )}
                    {entry.notes && <p className="text-[11px] text-zinc-500">Notes: {entry.notes}</p>}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenerationWorkspace
