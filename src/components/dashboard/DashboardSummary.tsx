import React from "react"
import { WorkflowStage } from "../../lib/types"
import { AlertTriangle, CalendarDays, Music4 } from "lucide-react"

type ReminderLevel = "info" | "warning" | "critical"

type Reminder = {
  id: string
  message: string
  level: ReminderLevel
}

type UpcomingRelease = {
  id: string
  songTitle: string
  versionLabel: string
  platform: string
  releaseDate: string
}

type Props = {
  stats: {
    albumCount: number
    songCount: number
    versionCount: number
    readyAlbums: number
    inProgressAlbums: number
    attentionAlbums: number
  }
  reminders: Reminder[]
  upcoming: UpcomingRelease[]
  onNavigate: (stage: WorkflowStage) => void
}

const levelStyles: Record<ReminderLevel, string> = {
  info: "border-violet-500/40 text-violet-100",
  warning: "border-amber-500/50 text-amber-100",
  critical: "border-rose-600/60 text-rose-100"
}

const DashboardSummary: React.FC<Props> = ({ stats, reminders, upcoming, onNavigate }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Albums</p>
          <p className="text-xl font-semibold text-violet-200">{stats.albumCount}</p>
          <p className="text-[11px] text-zinc-500">Ready {stats.readyAlbums} · In progress {stats.inProgressAlbums}</p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Songs</p>
          <p className="text-xl font-semibold text-violet-200">{stats.songCount}</p>
          <p className="text-[11px] text-zinc-500">Need attention {stats.attentionAlbums}</p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Versions</p>
          <p className="text-xl font-semibold text-violet-200">{stats.versionCount}</p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Shortcuts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["prompt", "generation", "mastering", "release"] as WorkflowStage[]).map(stage => (
              <button
                key={stage}
                onClick={() => onNavigate(stage)}
                className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 hover:border-violet-500/40"
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Reminders
          </h3>
          {reminders.length === 0 ? (
            <p className="text-xs text-zinc-500">No outstanding actions. Great job.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {reminders.slice(0, 4).map(reminder => (
                <li
                  key={reminder.id}
                  className={`rounded border px-3 py-2 ${levelStyles[reminder.level]} bg-zinc-950/60`}
                >
                  {reminder.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Upcoming releases
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-zinc-500">No scheduled releases yet.</p>
          ) : (
            <ul className="space-y-2 text-xs text-zinc-300">
              {upcoming.slice(0, 4).map(item => (
                <li key={item.id} className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                  <p className="font-medium text-zinc-100">{item.songTitle} — {item.versionLabel}</p>
                  <p className="text-[11px] text-zinc-500">{item.platform} · {item.releaseDate}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-sm font-semibold text-violet-200 flex items-center gap-2">
          <Music4 className="h-4 w-4" /> Quick context
        </h3>
        <p className="mt-2 text-xs text-zinc-500">
          Use the prompt tab to generate style prompts, log Suno takes in generation, capture mastering data, then finalize releases.
        </p>
        <p className="mt-1 text-[11px] text-zinc-500">
          Albums ready: {stats.readyAlbums}. Albums requiring attention: {stats.attentionAlbums}.
        </p>
      </div>
    </div>
  )
}

export type { Reminder, UpcomingRelease }

export default DashboardSummary
