import ClientLayout from '../components/ClientLayout';

export default function ClientAnalytics() {
  return (
    <ClientLayout>
      {/* Page Header */}
      <section className="mb-xl px-xs">
        <h2 className="font-headline-xl text-headline-xl text-on-surface">Analytics</h2>
        <p className="font-body-md text-on-surface-variant">Track your social media performance.</p>
      </section>

      {/* Section 1: Overview Cards */}
      <section className="grid grid-cols-3 gap-sm mb-xl">
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-surface-container">
          <p className="font-label-bold text-on-secondary-container text-[10px] uppercase mb-1">Reach</p>
          <p className="font-headline-md text-headline-md text-primary truncate">12.4k</p>
          <div className="flex items-center gap-xs text-[10px] text-green-600 font-semibold mt-1">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            <span>4.2%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-surface-container">
          <p className="font-label-bold text-on-secondary-container text-[10px] uppercase mb-1">Engagement Rate</p>
          <p className="font-headline-md text-headline-md text-primary truncate">5.8%</p>
          <div className="flex items-center gap-xs text-[10px] text-green-600 font-semibold mt-1">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            <span>1.1%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-surface-container">
          <p className="font-label-bold text-on-secondary-container text-[10px] uppercase mb-1">Posts</p>
          <p className="font-headline-md text-headline-md text-primary truncate">48</p>
          <div className="flex items-center gap-xs text-[10px] text-on-surface-variant font-semibold mt-1">
            <span className="material-symbols-outlined text-[12px]">schedule</span>
            <span>Live</span>
          </div>
        </div>
      </section>

      {/* Section 2: Weekly Engagement Chart */}
      <section className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container mb-xl">
        <div className="flex justify-between mb-lg">
          <h3 className="font-headline-md text-headline-md text-on-surface">Post Performance Overview</h3>
          <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
        </div>
        <div className="flex items-end justify-between h-40 gap-xs pb-sm overflow-x-auto no-scrollbar">
          {[
            { day: 'Mon', h: 'h-12' },
            { day: 'Tue', h: 'h-24' },
            { day: 'Wed', h: 'h-16' },
            { day: 'Thu', h: 'h-32', active: true },
            { day: 'Fri', h: 'h-20' },
            { day: 'Sat', h: 'h-28' },
            { day: 'Sun', h: 'h-14' },
          ].map((bar, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 flex-1 min-w-[30px]">
              <div className={`w-full ${bar.active ? 'bg-primary' : 'bg-primary-fixed'} rounded-t-sm ${bar.h}`}></div>
              <span className={`text-[10px] font-label-bold text-on-surface-variant ${bar.active ? 'font-bold' : ''}`}>{bar.day}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-md mt-md">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-[10px] text-on-surface-variant">Likes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-fixed"></span>
            <span className="text-[10px] text-on-surface-variant">Reach</span>
          </div>
        </div>
      </section>

      {/* Section 3: Platform Reach Breakdown */}
      <section className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container mb-xl">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-lg">Platform Reach</h3>
        <div className="space-y-lg">
          {[
            { name: 'Instagram', reach: '8.2k', growth: '+12%', width: '75%', color: 'text-green-600', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKm74RpzhUeo-FHWOkpNBXLnOJ4t9oiRAWTWHf3Zt1hrL3IvgpurQz-wIyDPON60PTtPW0FyMIyw6rlNFDgtFJgI4e4woFhfB_pV4MzcYSPvn4XLkONwR-NgN3odAAdUbeZpzneESnbpnghFNC7ZnaF64IgimmDQonNu-xcdctlKvA6lc4glLj00LdJVmiVbh7T_27_V0MKH45dXRk-xCr0BC1QJqoyw9RGdYtjk5tXLtc19J8c4OAn0VrMIciKIthq4BZUpQbpFXU' },
            { name: 'Facebook', reach: '3.1k', growth: '+5%', width: '45%', color: 'text-green-600', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQdWGwpDXLhPZuWUDBwTsH_1xKcFstC-A1kqzCgei3rY915eXfTK-B3WXlaT80gk-uIbcUoXgtCoh3pFrMQj7tn4oxUSApCyPG1iawlqMc9m_mVCEprIhyEoxaMboV4q5fSsiXB_uCe9nfY5LGpqf_RLJJ8P8mqJdUf6e8V3uBixhLpznOhwtTXlvHRKk3tarFzwksdgBBStS8pyCW8xZsn_xMJg9GF6ELXvFsXhE40obxaD6fHmE-wvYFRzDaONdCN9htLBY5Y2PM' },
            { name: 'Twitter/X', reach: '1.4k', growth: '-2%', width: '30%', color: 'text-error', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxzXKBBccvv2KiqOkqezTKsLVixevzqxuoqlUtfi1eH8vmqKDXK-JOIkSRuKEpv2RZ7ykFJqpejU58W2kpaZEDuxT3QfD_fCey26n8mPMns2djAs8OGtU1IroD4q3tNglCPASjmNIykTEcJm3Z0LtDMA10DJL9hjsj3icB3h202fBViH7QTxFEU6U7KpvdVRPkotSObfw4fzyk_E5Ad0t6CEe2rIyrFlamgDNJRXC_hrQsvU5OqKognjcJZOrab8zaQcvpy2mNgmM2' },
          ].map((platform, idx) => (
            <div key={idx} className="space-y-xs">
              <div className="flex justify-between items-center text-on-surface">
                <div className="flex items-center gap-sm">
                  <img alt={platform.name} className="w-4 h-4" src={platform.icon} />
                  <span className="font-label-bold">{platform.name}</span>
                </div>
                <span className={`text-[10px] font-bold ${platform.color}`}>{platform.growth}</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: platform.width }}></div>
              </div>
              <div className="text-[10px] text-on-surface-variant text-right">{platform.reach} reach</div>
            </div>
          ))}
        </div>
      </section>
    </ClientLayout>
  );
}
