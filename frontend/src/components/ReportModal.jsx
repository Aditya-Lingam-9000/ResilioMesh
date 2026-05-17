import { downloadEvidencePack } from '../utils/evidencePack'

export default function ReportModal({ selectedReport, setSelectedReport, riskStyle, getChecklistState, toggleChecklistItem }) {
  if (!selectedReport) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity fade-in"
      onClick={() => setSelectedReport(null)}
    >
      <div
        className="modal-animate relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setSelectedReport(null)}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/40 text-white backdrop-blur-sm transition-all hover:bg-slate-900/60 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {selectedReport.image ? (
          <div className="h-48 w-full bg-slate-900 sm:h-64 border-b border-slate-200">
            <img
              src={selectedReport.image}
              className="h-full w-full object-cover opacity-90 hover:opacity-100 transition-opacity"
              alt="Disaster Scene"
            />
          </div>
        ) : (
          <div className="h-32 w-full bg-slate-50 flex items-center justify-center border-b border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Image Available</p>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">{selectedReport.id}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Source: <span className="text-indigo-600">{selectedReport.source}</span>
              </p>
            </div>
            <span className={`rounded-md border px-3 py-1 text-[11px] font-bold uppercase tracking-widest shadow-sm ${riskStyle[selectedReport.risk_level]}`}>
              {selectedReport.risk_level} Risk
            </span>
          </div>

          {selectedReport.is_duplicate ? (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-700 shadow-sm">
              Duplicate report{selectedReport.duplicate_of ? ` (matches ${selectedReport.duplicate_of})` : ''}
            </div>
          ) : null}

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordinates</p>
              <p className="mt-2 text-[13px] font-bold text-slate-800 flex items-center gap-1.5 truncate">
                <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedReport.location}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Src: {selectedReport.location_source || 'model'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assistance</p>
              <p className="mt-2 text-[13px] font-bold text-slate-800 flex items-center gap-1.5 truncate">
                <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {selectedReport.help_needed}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence</p>
              <p className="mt-2 text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
                {typeof selectedReport.confidence === 'number' ? selectedReport.confidence.toFixed(2) : '0.50'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device GPS</p>
              {selectedReport.device_gps ? (
                <>
                  <p className="mt-2 text-[13px] font-bold text-slate-800">
                    {typeof selectedReport.device_gps.lat === 'number'
                      ? selectedReport.device_gps.lat.toFixed(4)
                      : selectedReport.device_gps.lat},{' '}
                    {typeof selectedReport.device_gps.lng === 'number'
                      ? selectedReport.device_gps.lng.toFixed(4)
                      : selectedReport.device_gps.lng}
                  </p>
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    ~{Math.round(selectedReport.device_gps.accuracy || 0)}m
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs font-semibold text-slate-400">Not attached</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI Assessment</p>
            <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-5 shadow-inner">
              <p className="text-[13px] font-medium leading-relaxed text-slate-700">{selectedReport.description}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Actions</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
              {Array.isArray(selectedReport.recommended_actions) && selectedReport.recommended_actions.length > 0 ? (
                <ul className="list-disc pl-5 text-[13px] font-medium text-slate-700 space-y-1">
                  {selectedReport.recommended_actions.map((action, index) => (
                    <li key={`${selectedReport.id}-action-${index}`}>{action}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs font-medium text-slate-500">No recommended actions provided.</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responder Checklist</p>
              {Array.isArray(selectedReport.recommended_actions) && selectedReport.recommended_actions.length > 0 ? (
                <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {Object.values(getChecklistState(selectedReport.id, selectedReport.recommended_actions)).filter(Boolean).length}
                  /{selectedReport.recommended_actions.length} done
                </span>
              ) : null}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
              {Array.isArray(selectedReport.recommended_actions) && selectedReport.recommended_actions.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedReport.recommended_actions.map((action, index) => (
                    <label
                      key={`${selectedReport.id}-check-${index}`}
                      className="flex items-start gap-3 rounded-md border border-slate-100 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={getChecklistState(selectedReport.id, selectedReport.recommended_actions)[action]}
                        onChange={() => toggleChecklistItem(selectedReport.id, action)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
                      />
                      <span>{action}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-500 p-2">No actions to track yet.</p>
              )}
            </div>
            </div>
          </div>

          {selectedReport.raw && (
            <div className="mb-6">
              <details className="group rounded-lg border border-red-100 bg-red-50/30 p-2 shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between text-[10px] font-bold uppercase tracking-widest text-red-600 transition-colors hover:text-red-700">
                  <span>Debug: Raw Model Output</span>
                  <svg className="h-3 w-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-3 overflow-x-auto rounded border border-red-100 bg-white p-3 shadow-inner">
                  <pre className="text-[11px] font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {typeof selectedReport.raw === 'string' ? selectedReport.raw : JSON.stringify(selectedReport.raw, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => downloadEvidencePack(selectedReport)}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Export Evidence Pack
            </button>
        </div>
      </div>
    </div>
  )
}
