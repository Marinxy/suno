import React, { useState } from "react"
import { ReleasePlan, ReleaseStatus, Version } from "../../lib/types"
import { PlusCircle, Trash2, Check, AlertTriangle, Download } from "lucide-react"

const STATUS_OPTIONS: ReleaseStatus[] = ["draft", "scheduled", "released", "live"]

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`
}

type Props = {
  version: Version
  onUpdateVersion: (updater: (version: Version) => Version) => void
}

const ReleaseWorkspace: React.FC<Props> = ({ version, onUpdateVersion }) => {
  const [planDraft, setPlanDraft] = useState<Pick<ReleasePlan, "platform" | "url" | "releaseDate" | "status" | "notes">>({
    platform: "soundcloud",
    url: "",
    releaseDate: "",
    status: "draft",
    notes: ""
  })

  const addReleasePlan = () => {
    if (!planDraft.platform.trim()) return
    const newPlan: ReleasePlan = {
      id: randomId("release"),
      platform: planDraft.platform.trim(),
      url: planDraft.url?.trim() || undefined,
      releaseDate: planDraft.releaseDate?.trim() || undefined,
      notes: planDraft.notes?.trim() || undefined,
      status: planDraft.status
    }
    onUpdateVersion(prev => ({
      ...prev,
      releasePlans: [...prev.releasePlans, newPlan]
    }))
    setPlanDraft({ platform: "soundcloud", url: "", releaseDate: "", status: "draft", notes: "" })
  }

  const updateReleasePlan = (id: string, changes: Partial<ReleasePlan>) => {
    onUpdateVersion(prev => ({
      ...prev,
      releasePlans: prev.releasePlans.map(plan => (plan.id === id ? { ...plan, ...changes } : plan))
    }))
  }

  const removeReleasePlan = (id: string) => {
    onUpdateVersion(prev => ({
      ...prev,
      releasePlans: prev.releasePlans.filter(plan => plan.id !== id)
    }))
  }

  const handleExport = () => {
    window.alert("Export bundle placeholder – wiring will arrive in Phase 5 polish.")
  }

  const missingFinalUrl = !version.finalReleaseUrl

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Final Links</h3>
          <div className="text-xs text-zinc-300 space-y-2">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Final release URL</label>
              <input
                value={version.finalReleaseUrl || ""}
                onChange={e =>
                  onUpdateVersion(prev => ({
                    ...prev,
                    finalReleaseUrl: e.target.value || undefined
                  }))
                }
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Suno URL</label>
              <input
                value={version.sunoUrl || ""}
                onChange={e =>
                  onUpdateVersion(prev => ({
                    ...prev,
                    sunoUrl: e.target.value || undefined
                  }))
                }
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="https://app.suno.ai/share/..."
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Share URL</label>
              <input
                value={version.shareUrl || ""}
                onChange={e =>
                  onUpdateVersion(prev => ({
                    ...prev,
                    shareUrl: e.target.value || undefined
                  }))
                }
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">SoundCloud URL</label>
              <input
                value={version.soundcloudUrl || ""}
                onChange={e =>
                  onUpdateVersion(prev => ({
                    ...prev,
                    soundcloudUrl: e.target.value || undefined
                  }))
                }
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded border border-violet-500 bg-violet-500/20 px-3 py-2 text-[11px] text-violet-100"
          >
            <Download className="h-3 w-3" /> Export bundle (placeholder)
          </button>
          {missingFinalUrl && (
            <p className="flex items-center gap-2 text-[11px] text-amber-300">
              <AlertTriangle className="h-3 w-3" /> Reminder: add the final public URL before release.
            </p>
          )}
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Add Release Plan</h3>
          <div className="grid gap-2 text-xs text-zinc-300">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Platform</label>
              <input
                value={planDraft.platform}
                onChange={e => setPlanDraft(prev => ({ ...prev, platform: e.target.value }))}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="soundcloud"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Status</label>
                <select
                  value={planDraft.status}
                  onChange={e => setPlanDraft(prev => ({ ...prev, status: e.target.value as ReleaseStatus }))}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Release date</label>
                <input
                  value={planDraft.releaseDate}
                  onChange={e => setPlanDraft(prev => ({ ...prev, releaseDate: e.target.value }))}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                  placeholder="2025-02-01"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">URL</label>
              <input
                value={planDraft.url}
                onChange={e => setPlanDraft(prev => ({ ...prev, url: e.target.value }))}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Notes</label>
              <textarea
                value={planDraft.notes}
                onChange={e => setPlanDraft(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                placeholder="Distribution tasks, marketing reminders..."
              />
            </div>
            <button
              onClick={addReleasePlan}
              className="inline-flex items-center gap-2 rounded border border-violet-500 bg-violet-500/20 px-3 py-2 text-[11px] text-violet-100"
            >
              <PlusCircle className="h-3 w-3" /> Add release plan
            </button>
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Release Plans</h3>
          {version.releasePlans.length === 0 ? (
            <p className="text-xs text-zinc-500">No release plans logged yet.</p>
          ) : (
            <div className="space-y-2 text-xs text-zinc-300">
              {version.releasePlans.map(plan => (
                <div key={plan.id} className="rounded border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={plan.platform}
                      onChange={e => updateReleasePlan(plan.id, { platform: e.target.value })}
                      className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                    />
                    <button
                      onClick={() => removeReleasePlan(plan.id)}
                      className="rounded border border-rose-600/60 px-2 py-1 text-[10px] uppercase tracking-wide text-rose-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={plan.status}
                      onChange={e => updateReleasePlan(plan.id, { status: e.target.value as ReleaseStatus })}
                      className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      value={plan.releaseDate || ""}
                      onChange={e => updateReleasePlan(plan.id, { releaseDate: e.target.value })}
                      className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                      placeholder="2025-02-01"
                    />
                  </div>
                  <input
                    value={plan.url || ""}
                    onChange={e => updateReleasePlan(plan.id, { url: e.target.value })}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                    placeholder="https://"
                  />
                  <textarea
                    value={plan.notes || ""}
                    onChange={e => updateReleasePlan(plan.id, { notes: e.target.value })}
                    rows={2}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                    placeholder="Notes"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5"> 
        <h3 className="text-sm font-semibold text-violet-200">Release Checklist</h3>
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-400" /> Final URL logged</li>
          <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-400" /> Release plans documented</li>
          <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-400" /> Export ready</li>
        </ul>
      </div>
    </div>
  )
}

export default ReleaseWorkspace
