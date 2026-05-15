export default function Analytics() {
  const stats = [
    { label: 'Total Engagement', value: '142.5k', change: '+18.4%', trend: 'up' },
    { label: 'Follower Growth', value: '+3,402', change: '+5.2%', trend: 'up' },
    { label: 'Click-Through Rate', value: '3.2%', change: '-0.4%', trend: 'down' },
    { label: 'Conversions', value: '1,204', change: '+12.1%', trend: 'up' },
  ];

  return (
    <div className="p-xl max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs">Analytics</h1>
          <p className="text-body-md text-outline">Track your performance and growth metrics.</p>
        </div>
        <select className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm font-label-bold outline-none focus:ring-2 focus:ring-primary/20">
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>This Month</option>
          <option>Custom Range</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
        {stats.map(s => (
          <div key={s.label} className="bg-surface-container-lowest p-lg rounded-xl border border-surface-variant shadow-sm">
            <p className="text-[11px] font-label-bold text-outline uppercase tracking-wider mb-xs">{s.label}</p>
            <p className="text-stat-lg font-stat-lg text-primary">{s.value}</p>
            <p className={`text-xs font-bold mt-xs flex items-center gap-xs ${s.trend === 'up' ? 'text-teal-600' : 'text-error'}`}>
              <span className="material-symbols-outlined text-[14px]">{s.trend === 'up' ? 'trending_up' : 'trending_down'}</span>
              {s.change}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest p-xl rounded-xl border border-surface-variant shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center gap-md">
        <div className="w-full h-64 flex items-end justify-between gap-2 px-xl mb-md">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 bg-primary/10 rounded-t-lg group relative cursor-pointer hover:bg-primary/30 transition-colors" style={{ height: `${20 + Math.random() * 80}%` }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] px-sm py-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {(Math.random() * 10).toFixed(1)}k Views
              </div>
            </div>
          ))}
        </div>
        <h3 className="font-headline-md text-on-surface">Engagement Overview</h3>
        <p className="text-body-md text-outline max-w-sm">Detailed performance breakdown by platform and content type.</p>
      </div>
    </div>
  );
}
