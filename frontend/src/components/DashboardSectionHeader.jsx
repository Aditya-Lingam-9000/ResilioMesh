export default function DashboardSectionHeader({ title, subtitle, actions }) {
  return (
    <div className="border-b border-slate-100 px-5 py-4 bg-slate-50/50">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  )
}
