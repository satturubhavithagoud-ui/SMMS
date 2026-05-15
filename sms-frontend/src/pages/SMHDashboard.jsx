import SMHLayout from '../components/SMHLayout';
import { Link } from 'react-router-dom';

export default function SMHDashboard() {
  return (
    <SMHLayout>
      <div className="space-y-xl">
        <header className="mb-xl">
          <h1 className="font-headline-md text-on-surface">Handler overview</h1>
          <p className="text-on-surface-variant text-label-bold">All clients and platform activity — May 6, 2026</p>
        </header>

        {/* Top Level Analytics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {[
            { label: 'Active clients', value: '8', trend: '12%', icon: 'groups' },
            { label: 'Posts published today', value: '34', trend: '5%', icon: 'send' },
            { label: 'Posts scheduled', value: '47', trend: '8', icon: 'event', isAdd: true },
            { label: 'Total reach', value: '2.1M', trend: '24%', icon: 'visibility' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container-high">
              <div className="flex justify-between items-start mb-md">
                <p className="text-on-surface-variant font-label-bold">{stat.label}</p>
                <span className="p-xs bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                </span>
              </div>
              <div className="flex items-baseline gap-sm">
                <span className="font-stat-lg text-stat-lg text-on-background">{stat.value}</span>
                <span className="text-emerald-600 font-label-bold text-xs flex items-center gap-[2px]">
                  <span className="material-symbols-outlined text-[14px]">{stat.isAdd ? 'add' : 'trending_up'}</span>
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Publishing Analytics & Alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container-high">
            <div className="flex justify-between items-center mb-xl">
              <h2 className="font-headline-md text-on-surface">Posts published vs scheduled — last 7 days</h2>
              <div className="flex items-center gap-md">
                <div className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-sm bg-primary"></span>
                  <span className="text-label-bold text-on-surface-variant">Published</span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-sm bg-primary-fixed-dim"></span>
                  <span className="text-label-bold text-on-surface-variant">Scheduled</span>
                </div>
              </div>
            </div>
            <div className="h-[240px] flex items-end justify-between px-md gap-sm">
              {[
                { day: 'Mon', p: 40, s: 30 },
                { day: 'Tue', p: 25, s: 45 },
                { day: 'Wed', p: 60, s: 20 },
                { day: 'Thu', p: 35, s: 55 },
                { day: 'Fri', p: 50, s: 40 },
                { day: 'Sat', p: 10, s: 15 },
                { day: 'Sun', p: 15, s: 25 },
              ].map(d => (
                <div key={d.day} className="flex-1 flex flex-col justify-end gap-xs h-full">
                  <div className="bg-primary-fixed-dim rounded-t w-full" style={{ height: `${d.s}%` }}></div>
                  <div className="bg-primary rounded-t w-full" style={{ height: `${d.p}%` }}></div>
                  <span className="text-[10px] text-center mt-xs text-outline uppercase font-bold">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container-high">
            <h2 className="font-headline-md text-on-surface mb-lg">Alerts & notifications</h2>
            <div className="space-y-md">
              <div className="p-md bg-orange-50 border-l-4 border-orange-400 rounded-lg flex gap-md items-start">
                <span className="material-symbols-outlined text-orange-600">warning</span>
                <div>
                  <p className="text-body-md font-bold text-orange-900">API Token Expiring</p>
                  <p className="text-xs text-orange-800">Instagram token for 'Luxe Hotels' expires in 2 days.</p>
                </div>
              </div>
              <div className="p-md bg-blue-50 border-l-4 border-blue-400 rounded-lg flex gap-md items-start">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <div>
                  <p className="text-body-md font-bold text-blue-900">New Campaign</p>
                  <p className="text-xs text-blue-800">'TechNova' added 12 new assets to the library.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Client Roster */}
        <section className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container-high overflow-hidden">
          <div className="flex justify-between items-center mb-xl">
            <h2 className="font-headline-md text-on-surface">Client roster — platforms & reach</h2>
            <Link to="/smh-clients" className="text-primary font-label-bold flex items-center gap-xs hover:underline">
              Manage clients <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-variant">
                  <th className="pb-md font-label-bold text-outline uppercase tracking-wider text-[10px]">Client Name</th>
                  <th className="pb-md font-label-bold text-outline uppercase tracking-wider text-[10px]">Plan</th>
                  <th className="pb-md font-label-bold text-outline uppercase tracking-wider text-[10px]">Platforms</th>
                  <th className="pb-md font-label-bold text-outline uppercase tracking-wider text-[10px]">Status</th>
                  <th className="pb-md font-label-bold text-outline uppercase tracking-wider text-[10px]">Weekly Posts</th>
                  <th className="pb-md"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                <tr className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-lg">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden">
                        <img alt="Luxe Hotels Group" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/ADBb0ujKwsanRkXbzZCQusaDz-_CSHISAe6etTFauis1hwR7LCfLX2w7FhlibgvuvJJD1YdbOEw06R_jz673DTK3i2mI1EmFKQtLcx3eIZRUN1To9apWENwOYyjOfm9PDG6x9yT2MwwRr_BW4rl8ILysYNoCbIo1_JiJV3QNItoX0-c8n8V_VBikY904NU-ZLWSAT_mZXVB-0YhIFngMIKZJCBNkaeY5EIepGlzWq7TkYpGDQNXUneW38oVKFC5mMgWRzH_lg7p0bRriG8s" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Luxe Hotels Group</p>
                        <p className="text-xs text-outline">Hospitality & Travel</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-lg"><span className="px-sm py-xs bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">Enterprise</span></td>
                  <td className="py-lg">
                    <div className="flex gap-xs text-white">
                      <div className="w-6 h-6 flex items-center justify-center bg-[#E1306C] rounded"><span className="material-symbols-outlined text-[14px]">camera</span></div>
                      <div className="w-6 h-6 flex items-center justify-center bg-[#1877F2] rounded"><span className="material-symbols-outlined text-[14px]">social_leaderboard</span></div>
                      <div className="w-6 h-6 flex items-center justify-center bg-black rounded"><span className="material-symbols-outlined text-[14px]">close</span></div>
                    </div>
                  </td>
                  <td className="py-lg">
                    <div className="flex items-center gap-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-body-md text-emerald-700 font-bold">Active</span>
                    </div>
                  </td>
                  <td className="py-lg font-bold text-on-surface">14 posts</td>
                  <td className="py-lg text-right"><button className="p-sm text-outline hover:text-primary transition-colors"><span className="material-symbols-outlined">more_vert</span></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SMHLayout>
  );
}
