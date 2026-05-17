export default function BasecampSection({ onRunOrchestration, isOrchestrating, basecampPlan, reportsCount }) {
  return (
    <section className="space-y-6 fade-in">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Basecamp Node</p>
            <h2 className="text-xl font-black text-slate-900">Strategic Orchestration</h2>
            <p className="mt-1 text-xs text-slate-500">Aggregate mesh reports and generate deployment recommendations via MoE model.</p>
          </div>
          <button
            type="button"
            onClick={onRunOrchestration}
            disabled={isOrchestrating || reportsCount === 0}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOrchestrating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Analyzing Reports...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate Strategic Plan</span>
              </>
            )}
          </button>
        </div>

        {reportsCount === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium text-slate-500">No reports available in the mesh. Seed the timeline first.</p>
          </div>
        )}
      </div>

      {basecampPlan && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Situation Summary
              </h3>
              <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-lg border border-slate-100 italic">
                "{basecampPlan.summary || 'No summary provided.'}"
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Deployment Action Plan
              </h3>
              <div className="space-y-3">
                {Array.isArray(basecampPlan.deployment_recommendations) && basecampPlan.deployment_recommendations.length > 0 ? (
                  basecampPlan.deployment_recommendations.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-4 rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <p className="pt-0.5 text-sm font-semibold text-slate-800">{action}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-medium text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg text-center">No recommendations provided.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Priority Targets
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(basecampPlan.prioritized_incidents) && basecampPlan.prioritized_incidents.length > 0 ? (
                  basecampPlan.prioritized_incidents.map((id, idx) => (
                    <span key={idx} className="rounded-md bg-indigo-50 border border-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-700 shadow-sm">
                      {id}
                    </span>
                  ))
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">No targets identified.</p>
                )}
              </div>
            </div>

            {basecampPlan.raw_response && !basecampPlan.summary && (
              <div className="rounded-xl border border-red-100 bg-red-50/30 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 mb-4">Debug: Raw AI Response</h3>
                <pre className="max-h-64 overflow-y-auto rounded-lg border border-red-100 bg-white p-4 text-[11px] font-medium leading-relaxed text-slate-700 shadow-inner whitespace-pre-wrap">
                  {basecampPlan.raw_response}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
