export default function HeaderBar({ meshStatus, connections, connectInput, setConnectInput, connectToPeer, meshTransport, onTransportChange }) {
  return (
    <header className="fade-in rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-1">
            Disaster Response
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Resilio Mesh</h1>
        </div>
        <span className="self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
          Phase 5 (Final)
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mesh Status</label>
            <p className="mt-1 font-medium text-indigo-600">{meshStatus}</p>
            <p className="mt-1 text-xs text-slate-500">
              Connected Peers: <span className="font-semibold">{connections.length}</span> | {connections.join(', ') || 'None'}
            </p>
          </div>

          <div className="flex flex-col gap-1 sm:items-end">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Transport</label>
            <select
              value={meshTransport}
              onChange={(event) => onTransportChange(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="webrtc">WebRTC (PeerJS)</option>
              <option value="bluetooth">Bluetooth (Beta)</option>
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const target = connectInput.trim()
              if (meshTransport === 'webrtc' && target) {
                connectToPeer(target)
              } else if (meshTransport === 'bluetooth') {
                connectToPeer()
              }
              setConnectInput('')
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Connect to ID (e.g., 1234)"
              value={connectInput}
              onChange={(e) => setConnectInput(e.target.value)}
              disabled={meshTransport === 'bluetooth'}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-64"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-95"
            >
              {meshTransport === 'bluetooth' ? 'Scan' : 'Connect'}
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
