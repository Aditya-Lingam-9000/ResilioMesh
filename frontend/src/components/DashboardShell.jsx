import HeaderBar from './HeaderBar'
import TopNav from './TopNav'

export default function DashboardShell({
  sections,
  activeSection,
  onSelectSection,
  meshStatus,
  connections,
  connectInput,
  setConnectInput,
  connectToPeer,
  meshTransport,
  onTransportChange,
  children,
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 relative text-slate-800">
      <HeaderBar
        meshStatus={meshStatus}
        connections={connections}
        connectInput={connectInput}
        setConnectInput={setConnectInput}
        connectToPeer={connectToPeer}
        meshTransport={meshTransport}
        onTransportChange={onTransportChange}
      />
      <TopNav sections={sections} activeSection={activeSection} onSelect={onSelectSection} />
      <main className="mt-6 space-y-6 fade-in" style={{ animationDelay: '0.1s' }}>
        {children}
      </main>
    </div>
  )
}
