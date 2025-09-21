import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useWorkspace } from "../../state/workspaceStore"
import { Album, Song, Version, WorkflowStage } from "../../lib/types"
import { Music2, MapPin, Rocket, Disc3, Share2, ClipboardList, ChevronRight } from "lucide-react"
import PromptWorkspace from "../prompt/PromptWorkspace"
import GenerationWorkspace from "../generation/GenerationWorkspace"
import MasteringWorkspace from "../mastering/MasteringWorkspace"
import ReleaseWorkspace from "../release/ReleaseWorkspace"
import DashboardSummary, { Reminder, UpcomingRelease } from "../dashboard/DashboardSummary"

const workflowTabs: { id: WorkflowStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "prompt", label: "Prompt", icon: MapPin },
  { id: "generation", label: "Generation", icon: Rocket },
  { id: "mastering", label: "Mastering", icon: Disc3 },
  { id: "release", label: "Release", icon: Share2 }
]

const assistantTips: string[] = [
  "1. Build the style prompt with preset + manual tweaks.",
  "2. Copy the prompt to ChatGPT for lyric merge.",
  "3. Log Suno takes and mark the keeper seed.",
  "4. Capture BandLab chain + Expose metrics.",
  "5. Record final URLs before moving to release."
]

const AppShell: React.FC = () => {
  const { state, setAlbums } = useWorkspace()
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("")
  const [selectedSongId, setSelectedSongId] = useState<string>("")
  const [selectedVersionId, setSelectedVersionId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<WorkflowStage>("prompt")

  const albums = state.albums

  useEffect(() => {
    if (!albums.length) return
    setSelectedAlbumId(prev => (prev && albums.some(album => album.id === prev) ? prev : albums[0].id))
  }, [albums])

  const selectedAlbum: Album | undefined = useMemo(
    () => albums.find(album => album.id === selectedAlbumId),
    [albums, selectedAlbumId]
  )

  useEffect(() => {
    if (!selectedAlbum) {
      setSelectedSongId("")
      return
    }
    setSelectedSongId(prev => (prev && selectedAlbum.songs.some(song => song.id === prev) ? prev : selectedAlbum.songs[0]?.id ?? ""))
  }, [selectedAlbum])

  const selectedSong: Song | undefined = useMemo(
    () => selectedAlbum?.songs.find(song => song.id === selectedSongId),
    [selectedAlbum, selectedSongId]
  )

  useEffect(() => {
    if (!selectedSong) {
      setSelectedVersionId("")
      return
    }
    setSelectedVersionId(prev => (prev && selectedSong.versions.some(version => version.id === prev) ? prev : selectedSong.versions[0]?.id ?? ""))
  }, [selectedSong])

  const selectedVersion: Version | undefined = useMemo(
    () => selectedSong?.versions.find(version => version.id === selectedVersionId),
    [selectedSong, selectedVersionId]
  )

  const versionStatusLabel = selectedVersion?.status ?? "prompt"

  const updateSelectedVersion = useCallback(
    (updater: (version: Version) => Version) => {
      if (!selectedAlbum || !selectedSong || !selectedVersion) return
      const albumId = selectedAlbum.id
      const songId = selectedSong.id
      const versionId = selectedVersion.id
      setAlbums(prev =>
        prev.map(album => {
          if (album.id !== albumId) return album
          return {
            ...album,
            songs: album.songs.map(song => {
              if (song.id !== songId) return song
              return {
                ...song,
                versions: song.versions.map(version => (version.id === versionId ? updater(version) : version))
              }
            })
          }
        })
      )
    },
    [selectedAlbum, selectedSong, selectedVersion, setAlbums]
  )

  const workspaceContent = useMemo(() => {
    if (!selectedVersion || !selectedSong) {
      return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-400">
          Select a version to start working through the workflow steps.
        </div>
      )
    }

    if (activeTab === "prompt") {
      return (
        <PromptWorkspace
          key={selectedVersion.id}
          version={selectedVersion}
          song={selectedSong}
          onUpdateVersion={updateSelectedVersion}
        />
      )
    }

    if (activeTab === "generation") {
      return (
        <GenerationWorkspace
          key={selectedVersion.id}
          version={selectedVersion}
          onUpdateVersion={updateSelectedVersion}
        />
      )
    }

    if (activeTab === "mastering") {
      return (
        <MasteringWorkspace
          key={selectedVersion.id}
          version={selectedVersion}
          onUpdateVersion={updateSelectedVersion}
        />
      )
    }

    if (activeTab === "release") {
      return (
        <ReleaseWorkspace
          key={selectedVersion.id}
          version={selectedVersion}
          onUpdateVersion={updateSelectedVersion}
        />
      )
    }

    return (
      <div className="space-y-4 text-sm text-zinc-300">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-base font-semibold text-violet-200 flex items-center gap-2">
            <ChevronRight className="h-4 w-4" /> {workflowTabs.find(tab => tab.id === activeTab)?.label}
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Detailed workspace for this step will replace this placeholder in upcoming phases.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-200">Version Summary</h3>
          <p className="text-xs text-zinc-400">Seed: {selectedVersion.seed || "n/a"}</p>
          <p className="text-xs text-zinc-400">Prompt history entries: {selectedVersion.promptHistory.length}</p>
          <p className="text-xs text-zinc-400">Release plans: {selectedVersion.releasePlans.length}</p>
        </div>
      </div>
    )
  }, [activeTab, selectedSong, selectedVersion, updateSelectedVersion])

  const dashboardStats = useMemo(() => {
    const songs = albums.flatMap(album => album.songs)
    const versions = songs.flatMap(song => song.versions)
    const readyAlbums = albums.filter(album =>
      album.songs.length > 0 &&
      album.songs.every(song => song.versions.length > 0 && song.versions.every(version => version.finalReleaseUrl))
    ).length
    const attentionAlbums = albums.filter(album =>
      album.songs.some(song =>
        song.versions.some(version => !version.finalReleaseUrl || Object.values(version.qaChecks).some(check => !check))
      )
    ).length
    const inProgressAlbums = Math.max(albums.length - readyAlbums - attentionAlbums, 0)
    return {
      albumCount: albums.length,
      songCount: songs.length,
      versionCount: versions.length,
      readyAlbums,
      inProgressAlbums,
      attentionAlbums
    }
  }, [albums])

  const reminders: Reminder[] = useMemo(() => {
    const list: Reminder[] = []
    albums.forEach(album => {
      album.songs.forEach(song => {
        if (song.versions.length === 0) {
          list.push({
            id: `reminder_${song.id}_no_versions`,
            level: "info",
            message: `Create the first version for “${song.title}” in ${album.name}.`
          })
          return
        }
        song.versions.forEach(version => {
          if (!version.finalReleaseUrl) {
            list.push({
              id: `reminder_${version.id}_final_url`,
              level: "warning",
              message: `Add the final release URL for “${song.title}” – ${version.label}.`
            })
          }
          if (Object.values(version.qaChecks).some(check => !check)) {
            list.push({
              id: `reminder_${version.id}_qa`,
              level: "warning",
              message: `Complete QA checklist for “${song.title}” – ${version.label}.`
            })
          }
          if (version.releasePlans.some(plan => plan.status === "scheduled" && !plan.releaseDate)) {
            list.push({
              id: `reminder_${version.id}_release_date`,
              level: "info",
              message: `Add release date to scheduled plan for “${song.title}” – ${version.label}.`
            })
          }
        })
      })
    })
    return list
  }, [albums])

  const upcoming: UpcomingRelease[] = useMemo(() => {
    const items: UpcomingRelease[] = []
    albums.forEach(album => {
      album.songs.forEach(song => {
        song.versions.forEach(version => {
          version.releasePlans.forEach(plan => {
            if (plan.releaseDate && plan.status === "scheduled") {
              items.push({
                id: `${version.id}_${plan.id}`,
                songTitle: song.title,
                versionLabel: version.label,
                platform: plan.platform,
                releaseDate: plan.releaseDate
              })
            }
          })
        })
      })
    })
    return items.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
  }, [albums])

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="w-72 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
            <Music2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-200">Suno Master Studio</p>
            <p className="text-[11px] text-zinc-500">UN&YA production OS</p>
          </div>
        </div>

        <div className="px-4 py-3 text-[11px] font-semibold text-amber-300 tracking-wide">THIS IS A TEST SAMPLE</div>

        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Albums</p>
          <div className="mt-2 space-y-2">
            {albums.map(album => (
              <button
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                  album.id === selectedAlbumId
                    ? "border-violet-500 bg-violet-500/10 text-violet-100"
                    : "border-zinc-800 bg-transparent text-zinc-300 hover:border-violet-500/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{album.name}</span>
                  <span className="text-[11px] text-zinc-500">{album.songs.length} songs</span>
                </div>
                {album.releaseTargetDate && (
                  <p className="mt-1 text-[11px] text-zinc-500">Release target {album.releaseTargetDate}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Songs</p>
          {selectedAlbum ? (
            <div className="mt-2 space-y-2">
              {selectedAlbum.songs.map(song => (
                <button
                  key={song.id}
                  onClick={() => setSelectedSongId(song.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    song.id === selectedSongId
                      ? "border-violet-500 bg-violet-500/10 text-violet-100"
                      : "border-zinc-800 bg-transparent text-zinc-300 hover:border-violet-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{song.title}</span>
                    <span className="text-[11px] text-zinc-500">{song.versions.length} versions</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">Status: {song.status}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-zinc-600">Select an album to see its songs.</p>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-zinc-900/60">
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-violet-200">{selectedSong?.title ?? "Select a song"}</h1>
            {selectedVersion ? (
              <p className="text-xs text-zinc-500">
                Version {selectedVersion.label} · Stage: {versionStatusLabel.toUpperCase()}
              </p>
            ) : (
              <p className="text-xs text-zinc-500">Choose a version to begin.</p>
            )}
          </div>
          <nav className="flex flex-wrap gap-2">
            {workflowTabs.map(tab => {
              const Icon = tab.icon
              const isActive = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                    isActive ? "border-violet-500 bg-violet-500 text-white" : "border-zinc-700 text-zinc-300 hover:border-violet-500/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <section className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <DashboardSummary
              stats={dashboardStats}
              reminders={reminders}
              upcoming={upcoming}
              onNavigate={setActiveTab}
            />
            {workspaceContent}
          </section>

          <aside className="hidden w-72 flex-col border-l border-zinc-800 bg-zinc-950/70 px-5 py-6 lg:flex">
            <h2 className="text-sm font-semibold text-violet-200">Workflow Assistant</h2>
            <p className="mt-1 text-xs text-zinc-500">Follow the checklist to keep the process on track.</p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-300">
              {assistantTips.map(step => (
                <li key={step} className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                  {step}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default AppShell
