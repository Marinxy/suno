import React, { createContext, useContext, useMemo, useState } from "react"
import { Album, WorkspaceState } from "../lib/types"

type WorkspaceContextValue = {
  state: WorkspaceState
  setAlbums: React.Dispatch<React.SetStateAction<Album[]>>
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

export const WorkspaceProvider: React.FC<{ initialAlbums: Album[]; children: React.ReactNode }> = ({ initialAlbums, children }) => {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)

  const value = useMemo<WorkspaceContextValue>(() => ({
    state: { albums },
    setAlbums
  }), [albums])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return ctx
}
