import React, { useMemo, useState } from "react"
import { MasteringProfile, Version } from "../../lib/types"
import { Check, Info, RefreshCw } from "lucide-react"

function formatNumber(value?: string) {
  if (!value) return "n/a"
  return value
}

type Props = {
  version: Version
  onUpdateVersion: (updater: (version: Version) => Version) => void
}

const bandlabFields: Array<{ key: string; label: string; placeholder: string }> = [
  { key: "preset", label: "Preset", placeholder: "Universal (low)" },
  { key: "engine", label: "Engine", placeholder: "Universal" },
  { key: "intensity", label: "Intensity", placeholder: "45%" },
  { key: "inputGain", label: "Input Gain", placeholder: "-1.9 dB" },
  { key: "outputGain", label: "Output Gain", placeholder: "0 dB" },
  { key: "focus", label: "Focus", placeholder: "Low-end" },
  { key: "tape", label: "Tape", placeholder: "45%" }
]

const exposeFields: Array<{ key: string; label: string; placeholder: string }> = [
  { key: "integrated", label: "Integrated LUFS", placeholder: "-12" },
  { key: "short", label: "Short-term LUFS", placeholder: "-11" },
  { key: "truePeak", label: "True Peak", placeholder: "-1" },
  { key: "lra", label: "LRA", placeholder: "7" }
]

const MasteringWorkspace: React.FC<Props> = ({ version, onUpdateVersion }) => {
  const profile: MasteringProfile = useMemo(
    () =>
      version.masteringProfile ?? {
        targetLufs: "-12",
        targetTruePeak: "-1",
        bandlab: {},
        expose: {}
      },
    [version.masteringProfile]
  )

  const [notes, setNotes] = useState(version.masteringNotes || "")
  const [exposeLog, setExposeLog] = useState(version.exposeLog || "")

  const handleBandlabChange = (key: string, value: string) => {
    onUpdateVersion(prev => ({
      ...prev,
      masteringProfile: {
        ...profile,
        bandlab: {
          ...profile.bandlab,
          [key]: value || undefined
        }
      }
    }))
  }

  const handleExposeChange = (key: string, value: string) => {
    onUpdateVersion(prev => ({
      ...prev,
      masteringProfile: {
        ...profile,
        expose: {
          ...profile.expose,
          [key]: value || undefined
        }
      }
    }))
  }

  const handleTargetChange = (key: "targetLufs" | "targetTruePeak", value: string) => {
    onUpdateVersion(prev => ({
      ...prev,
      masteringProfile: {
        ...profile,
        [key]: value || undefined
      }
    }))
  }

  const handleSaveNotes = () => {
    onUpdateVersion(prev => ({
      ...prev,
      masteringNotes: notes || undefined,
      exposeLog: exposeLog || undefined
    }))
  }

  const lufs = version.lufs ?? profile.expose.integrated
  const truePeak = version.truePeak ?? profile.expose.truePeak

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Targets</h3>
          <div className="text-xs text-zinc-300 space-y-2">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Target LUFS</label>
              <input
                value={profile.targetLufs || ""}
                onChange={e => handleTargetChange("targetLufs", e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-zinc-500">Target True Peak</label>
              <input
                value={profile.targetTruePeak || ""}
                onChange={e => handleTargetChange("targetTruePeak", e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3 text-[11px] text-zinc-400 space-y-1">
              <div>Measured LUFS: {formatNumber(lufs)}</div>
              <div>Measured TP: {formatNumber(truePeak)}</div>
            </div>
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">BandLab Chain</h3>
          <div className="grid gap-2 text-xs text-zinc-300">
            {bandlabFields.map(field => (
              <div key={field.key}>
                <label className="text-[11px] uppercase tracking-wide text-zinc-500">{field.label}</label>
                <input
                  value={profile.bandlab[field.key] || ""}
                  onChange={e => handleBandlabChange(field.key, e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Expose Metrics</h3>
          <div className="grid gap-2 text-xs text-zinc-300">
            {exposeFields.map(field => (
              <div key={field.key}>
                <label className="text-[11px] uppercase tracking-wide text-zinc-500">{field.label}</label>
                <input
                  value={profile.expose[field.key] || ""}
                  onChange={e => handleExposeChange(field.key, e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Mastering Notes</h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"
            placeholder="Capture extra processing or reference checks."
          />
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-violet-200">EXPOSE Log</h3>
            <button
              onClick={() => setExposeLog("")}
              className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Clear
            </button>
          </div>
          <textarea
            value={exposeLog}
            onChange={e => setExposeLog(e.target.value)}
            rows={6}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"
            placeholder="Paste EXPOSE output here for reference."
          />
        </div>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-violet-200">QA Checklist</h3>
        <p className="text-xs text-zinc-500">Mark each item once verified.</p>
        <div className="grid gap-2 text-xs text-zinc-300">
          {Object.entries(version.qaChecks).map(([key, checked]) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-900/60 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onUpdateVersion(prev => ({
                    ...prev,
                    qaChecks: {
                      ...prev.qaChecks,
                      [key]: !prev.qaChecks[key]
                    }
                  }))
                }
              />
              <span>{key}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSaveNotes}
        className="inline-flex items-center gap-2 rounded border border-violet-500 bg-violet-500/20 px-4 py-2 text-xs text-violet-100"
      >
        <Check className="h-3 w-3" /> Save mastering updates
      </button>

      <div className="rounded border border-zinc-800 bg-zinc-900/60 p-4 text-[11px] text-zinc-400">
        <p className="flex items-center gap-2">
          <Info className="h-3 w-3" /> Tip: target −12 ±2 LUFS and ≤ −1 dBTP. Confirm dynamics match the catalog before releasing.
        </p>
      </div>
    </div>
  )
}

export default MasteringWorkspace
