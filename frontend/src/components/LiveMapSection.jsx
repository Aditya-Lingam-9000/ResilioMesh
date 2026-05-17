import MapDashboard from './MapDashboard'

export default function LiveMapSection({ reports, riskStyle, showHeatmap, setShowHeatmap, onSelectReport }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-slate-100 bg-slate-50/50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Live Situation Map</h2>
            <p className="mt-1 text-xs text-slate-500">Automatically plotting coordinates</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(event) => setShowHeatmap(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
              />
              Heatmap
            </label>
            <span className="rounded-md bg-slate-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
              {reports.length} Reports
            </span>
          </div>
        </div>
      </div>

      <MapDashboard reports={reports} riskStyle={riskStyle} showHeatmap={showHeatmap} />

      <div className="p-5 border-t border-slate-100 bg-slate-50/30">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800">Detailed Incident Reports</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((report) => (
            <article
              key={report.id}
              onClick={() => onSelectReport(report)}
              className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{report.id}</h4>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{report.location}</span>
                    </div>
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${riskStyle[report.risk_level]}`}>
                    {report.risk_level} Risk
                  </span>
                </div>

                {report.is_duplicate ? (
                  <span className="inline-flex mb-3 items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                    Duplicate
                  </span>
                ) : null}

                <div className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-800 shadow-sm">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Needs: {report.help_needed}
                </div>

                <div className="mb-4 text-[11px] font-medium text-slate-600 space-y-1.5">
                  <p>
                    Conf: <span className="font-bold text-slate-800">{typeof report.confidence === 'number' ? report.confidence.toFixed(2) : '0.50'}</span>
                  </p>
                  <p className="truncate">
                    Actions:{' '}
                    {Array.isArray(report.recommended_actions) && report.recommended_actions.length > 0
                      ? report.recommended_actions.slice(0, 2).join(' | ')
                      : 'Pending'}
                  </p>
                </div>

                <div className="mb-5">
                  <p className="text-[12px] leading-relaxed text-slate-600 line-clamp-2">{report.description}</p>
                </div>
              </div>

              <div className="mt-auto border-t border-slate-100 pt-3">
                <p className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Source Node</span>
                  <span className="text-slate-600">{report.source}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
