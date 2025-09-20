import AppShell from './components/layout/AppShell'
import { WorkspaceProvider } from './state/workspaceStore'
import { sampleAlbums } from './sampleData'

function App() {
  return (
    <WorkspaceProvider initialAlbums={sampleAlbums}>
      <AppShell />
    </WorkspaceProvider>
  )
}

export default App
