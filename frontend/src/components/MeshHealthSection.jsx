export default function MeshHealthSection({
  meshHealthLabel,
  meshHealthStyle,
  connections,
  recentMeshCount,
  meshSourceCount,
  meshReportCount,
  lastMeshTimestamp,
  coverageLabel,
  coveragePercent,
  formatTimestamp,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-slate-100 px-5 py-4 bg-slate-50/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Mesh Health & Coverage</h2>
        <p className="mt-1 text-xs text-slate-500">Live view of mesh reach, reporting nodes, and recent syncs.</p>
      </div>

      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mesh Health</p>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meshHealthStyle[meshHealthLabel]}`}>
                {meshHealthLabel}
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-800">{connections.length}</p>
            <p className="font-medium text-[11px] text-slate-400 uppercase tracking-widest mt-1">Active links</p>
            <p className="mt-3 text-[11px] font-medium text-slate-500">
              Recent mesh reports: <span className="text-slate-800 font-bold">{recentMeshCount}</span>
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Connected Peers</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-800">{connections.length}</p>
            <p className="mt-3 text-[11px] font-medium text-slate-500">
              {connections.length > 0 ? connections.join(', ') : 'None connected'}
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reporting Nodes</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-800">{meshSourceCount}</p>
            <p className="mt-3 text-[11px] font-medium text-slate-500">
              Mesh reports: <span className="text-slate-800 font-bold">{meshReportCount}</span>
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 truncate">
              Last: {lastMeshTimestamp ? formatTimestamp(lastMeshTimestamp) : 'None'}
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Coverage</p>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">{coverageLabel}</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-800">{coveragePercent}%</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${coveragePercent}%` }} />
            </div>
            <p className="mt-2 text-[10px] font-medium text-slate-400">Sources / Peers</p>
          </div>
        </div>
      </div>
    </section>
  )
}
