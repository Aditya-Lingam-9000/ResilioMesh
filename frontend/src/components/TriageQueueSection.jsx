export default function TriageQueueSection({ triageCounts, triageReports, riskStyle, onSelectReport }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-slate-100 px-5 py-4 bg-slate-50/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Priority Triage Queue</h2>
        <p className="mt-1 text-xs text-slate-500">Auto-ranked by risk and confidence for rapid response.</p>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {['High', 'Medium', 'Low'].map((level) => (
            <div key={level} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{level} Risk</p>
              <p className="mt-3 text-3xl font-extrabold text-slate-800">{triageCounts[level]}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {triageReports.slice(0, 6).map((report) => (
            <button
              key={`triage-${report.id}`}
              type="button"
              onClick={() => onSelectReport(report)}
              className="group flex w-full flex-col gap-3 rounded-lg border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3 w-full">
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{report.id}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">{report.location}</p>
                </div>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                  {report.risk_level === 'High' ? 'P1' : report.risk_level === 'Medium' ? 'P2' : 'P3'}
                </span>
              </div>

              {report.is_duplicate ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  Duplicate
                </span>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
                <span className={`rounded-md border px-2 py-1 ${riskStyle[report.risk_level]}`}>
                  {report.risk_level} Risk
                </span>
                <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1">
                  Needs: <span className="font-bold text-slate-700">{report.help_needed}</span>
                </span>
              </div>

              <p className="text-[11px] font-medium text-slate-500">
                Confidence: <span className="font-bold text-slate-700">{typeof report.confidence === 'number' ? report.confidence.toFixed(2) : '0.50'}</span>
              </p>
            </button>
          ))}
        </div>

        {triageReports.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white shadow-sm">
            <p className="text-xs font-medium text-slate-400">No reports available yet.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
