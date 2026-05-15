import ClientLayout from '../components/ClientLayout';

export default function ClientDashboard() {
  return (
    <ClientLayout>
      <section className="mb-xl">
        <h2 className="font-headline-xl text-headline-xl text-on-background mb-xs">Welcome back, Sarah</h2>
        <p className="font-body-md text-on-surface-variant">Your agency performance is up 12% this week.</p>
      </section>

      <section className="grid grid-cols-2 gap-md mb-xl">
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50">
          <span className="material-symbols-outlined text-primary mb-sm">edit_square</span>
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Posts this month</p>
          <p className="font-stat-lg text-stat-lg text-primary">24</p>
          <div className="flex items-center gap-xs mt-xs text-teal-600">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-[12px] font-bold">+4.2%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50">
          <span className="material-symbols-outlined text-error mb-sm">favorite</span>
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase">Total likes</p>
          <p className="font-stat-lg text-stat-lg text-primary">12.8k</p>
          <div className="flex items-center gap-xs mt-xs text-teal-600">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-[12px] font-bold">+8.1%</span>
          </div>
        </div>
      </section>

      <section className="mb-xl">
        <h3 className="font-headline-md text-headline-md text-primary mb-md">Connected Platforms</h3>
        <div className="flex gap-md overflow-x-auto pb-sm no-scrollbar">
          <div className="flex-shrink-0 bg-surface-container-lowest px-lg py-md rounded-lg border border-surface-variant flex items-center gap-sm">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            <span className="font-label-bold text-label-bold text-on-surface">Instagram</span>
          </div>
          <div className="flex-shrink-0 bg-surface-container-lowest px-lg py-md rounded-lg border border-surface-variant flex items-center gap-sm">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            <span className="font-label-bold text-label-bold text-on-surface">Facebook</span>
          </div>
        </div>
      </section>
    </ClientLayout>
  );
}
