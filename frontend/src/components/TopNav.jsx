export default function TopNav({ sections, activeSection, onSelect }) {
  return (
    <nav className="mt-4 flex flex-wrap items-center gap-2">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSelect(section.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
            activeSection === section.id
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
          }`}
        >
          {section.label}
        </button>
      ))}
    </nav>
  )
}
