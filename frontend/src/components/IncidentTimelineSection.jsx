export default function IncidentTimelineSection({ timelineReports, riskStyle, formatTimestamp, onSelectReport }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-slate-100 px-5 py-4 bg-slate-50/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Incident Timeline</h2>
        <p className="mt-1 text-xs text-slate-500">Chronological view of reports captured on this device or synced via mesh.</p>
      </div>

      <div className="p-5 space-y-3">
        {timelineReports.slice(0, 10).map((report) => (
          <button
            key={`timeline-${report.id}`}
            type="button"
            onClick={() => onSelectReport(report)}
            className="group flex w-full flex-col gap-3 rounded-lg border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3 w-full">
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{report.id}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">{formatTimestamp(report.captured_at)}</p>
              </div>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${riskStyle[report.risk_level]}`}>
                {report.risk_level} Risk
              </span>
            </div>

            {report.is_duplicate ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Duplicate
              </span>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
              <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {report.location}
              </span>
              <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1">
                Needs: <span className="font-bold text-slate-700">{report.help_needed}</span>
              </span>
              <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1">
                Conf: <span className="font-bold text-slate-700">{typeof report.confidence === 'number' ? report.confidence.toFixed(2) : '0.50'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{report.description}</p>
          </button>
        ))}

        {timelineReports.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white shadow-sm">
            <p className="text-xs font-medium text-slate-400">No timeline entries yet. Capture or upload an image.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
