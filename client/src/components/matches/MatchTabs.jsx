const TABS = [
  { id: 'received', label: 'Received' },
  { id: 'sent',     label: 'Sent'     },
  { id: 'accepted', label: 'Accepted' },
];

const MatchTabs = ({ activeTab, setActiveTab }) => (
  <div role="tablist" aria-label="Match request tabs" className="flex gap-2 rounded-[22px] border border-white/10 bg-slate-800/70 p-1.5">
    {TABS.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={activeTab === id}
        aria-controls={`tabpanel-${id}`}
        id={`tab-${id}`}
        onClick={() => setActiveTab(id)}
        className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${activeTab === id ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30" : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}
      >
        {label}
      </button>
    ))}
  </div>
);

export default MatchTabs;
