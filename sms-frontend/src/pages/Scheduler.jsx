export default function Scheduler() {
  return (
    <div className="p-xl max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs">Schedule</h1>
          <p className="text-body-md text-outline">Manage your content calendar across all platforms.</p>
        </div>
        <div className="flex gap-md">
          <button className="px-lg py-md border border-outline-variant rounded-lg font-bold hover:bg-surface-container transition-colors">Today</button>
          <button className="bg-primary text-on-primary px-lg py-md rounded-lg font-bold shadow-md">Schedule Post</button>
        </div>
      </div>
      
      <div className="bg-surface-container-lowest p-lg rounded-xl border border-surface-variant overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-surface-variant">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-md text-center font-label-bold text-[11px] text-outline uppercase tracking-widest">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-5 h-[600px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="border-r border-b border-surface-variant/30 p-sm hover:bg-surface-container transition-colors cursor-pointer group relative">
              <span className={`text-xs font-bold ${i === 14 ? 'bg-primary text-on-primary w-6 h-6 flex items-center justify-center rounded-full' : 'text-on-surface-variant'}`}>
                {(i % 31) + 1}
              </span>
              {i === 14 && (
                <div className="absolute top-10 left-2 right-2 bg-primary-container text-on-primary-container p-xs rounded text-[10px] font-bold truncate shadow-sm">
                  10:00 AM - Instagram Post
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
