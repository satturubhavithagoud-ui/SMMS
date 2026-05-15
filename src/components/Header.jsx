export default function Header({ title }) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-[64px] bg-surface border-b border-surface-variant z-40 px-lg flex justify-between items-center">
      <div className="flex items-center gap-md flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            className="w-full bg-surface-container border-none rounded-full pl-xl pr-md py-sm text-body-md focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Search clients, industries..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-lg">
        <button className="relative hover:bg-surface-container-high p-sm rounded-full transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </button>
        <div className="flex items-center gap-sm cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="font-label-bold text-[13px] text-on-surface">Agency Manager</p>
            <p className="text-[11px] text-outline text-right">SR</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs group-hover:ring-2 ring-primary/20 transition-all">
            SR
          </div>
        </div>
      </div>
    </header>
  );
}
