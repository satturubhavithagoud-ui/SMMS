import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import SMHLayout from '../components/SMHLayout';
import { apiRequest } from '../services/api';

const PLATFORM_META = {
  Instagram: { color: '#E1306C', icon: 'photo_camera' },
  Facebook:  { color: '#1877F2', icon: 'thumb_up' },
  LinkedIn:  { color: '#0A66C2', icon: 'business_center' },
  'Twitter/X': { color: '#000000', icon: 'close' },
  YouTube:   { color: '#FF0000', icon: 'play_circle' },
  Pinterest: { color: '#BD081C', icon: 'push_pin' },
};

function fmtReach(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n;
}

export default function SMHAnalytics() {
  const [activeFilter, setActiveFilter] = useState('30');
  const [activeMetric, setActiveMetric] = useState('reach');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await apiRequest(`/smh/analytics/?days=${activeFilter}`);
        setData(response);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeFilter]);

  if (loading || !data) {
    return (
      <SMHLayout>
        <main className="p-8 w-full min-h-screen bg-[#F6F5FA] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#031B4E] border-t-transparent rounded-full mb-4"></div>
            <p className="text-[#031B4E] font-bold">Loading Live Analytics...</p>
          </div>
        </main>
      </SMHLayout>
    );
  }

  const { kpi, platforms } = data;

  // Highest reach platform
  const topPlatform = [...platforms].sort((a, b) => b.reach - a.reach)[0];

  // Pie data
  const pieData = platforms.map(p => ({
    name: p.name,
    value: p.engagement,
    color: PLATFORM_META[p.name].color,
  }));

  // Bar chart data
  const barData = platforms.map(p => ({
    name: p.name,
    value: activeMetric === 'reach' ? p.reach
         : activeMetric === 'engagement' ? p.engagement
         : activeMetric === 'followers' ? p.followers
         : p.posts,
    color: PLATFORM_META[p.name].color,
  }));

  const metricLabel = activeMetric === 'reach' ? 'Reach'
    : activeMetric === 'engagement' ? 'Engagement %'
    : activeMetric === 'followers' ? 'Followers Gained'
    : 'Posts Published';

  return (
    <SMHLayout>
      <main className="p-2 w-full min-h-screen">

        {/* HEADER + FILTERS */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-[42px] font-bold text-[#031B4E] leading-tight">Analytics</h1>
            <p className="text-gray-500 text-lg mt-1 mb-6">Detailed performance insights across all managed accounts.</p>
            
            {/* Search Bar */}
            <div className="relative w-full" style={{ width: '400px', maxWidth: '100%' }}>
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input 
                type="text" 
                placeholder="Search analytics, campaigns..." 
                className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-14 pr-5 shadow-sm outline-none focus:border-[#031B4E] transition"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm shrink-0">
            {[['30','Last 30 Days'],['90','90 Days'],['365','1 Year']].map(([val, label]) => (
              <button key={val} onClick={() => setActiveFilter(val)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeFilter === val ? 'bg-[#031B4E] text-white shadow' : 'text-gray-500 hover:text-[#031B4E]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
          {[
            { label: 'Total Engagement', value: kpi.engagement, trend: '+12%', icon: 'favorite', color: 'text-pink-500', bg: 'bg-pink-50' },
            { label: 'Reach',            value: kpi.reach,      trend: '+8%',  icon: 'visibility', color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Followers Growth', value: kpi.followers,  trend: '+15%', icon: 'group_add', color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'CTR',              value: kpi.ctr,        trend: 'Avg',  icon: 'ads_click', color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Published Posts',  value: kpi.posts,      trend: '+18',  icon: 'post_add', color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-[20px] ${m.color}`}>{m.icon}</span>
                </div>
                <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">{m.trend}</span>
              </div>
              <p className="text-gray-500 text-sm mb-1">{m.label}</p>
              <h2 className="text-[32px] font-bold text-[#031B4E]">{m.value}</h2>
            </div>
          ))}
        </div>

        {/* HIGHEST REACH BANNER */}
        <div className="bg-[#031B4E] rounded-3xl p-7 mb-8 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: PLATFORM_META[topPlatform.name].color }}>
            <span className="material-symbols-outlined text-white text-[30px]">{PLATFORM_META[topPlatform.name].icon}</span>
          </div>
          <div className="flex-1">
            <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-1">🏆 Highest Reach Platform</p>
            <h2 className="text-3xl font-bold text-white">{topPlatform.name}</h2>
            <p className="text-white/60 text-sm mt-1">Reached <span className="text-white font-bold">{fmtReach(topPlatform.reach)}</span> people in the selected period</p>
          </div>
          <div className="hidden md:flex gap-8 text-center">
            <div><p className="text-white/50 text-xs uppercase tracking-wide mb-1">Engagement</p><p className="text-2xl font-bold text-white">{topPlatform.engagement}%</p></div>
            <div><p className="text-white/50 text-xs uppercase tracking-wide mb-1">Followers</p><p className="text-2xl font-bold text-white">{fmtReach(topPlatform.followers)}</p></div>
            <div><p className="text-white/50 text-xs uppercase tracking-wide mb-1">Posts</p><p className="text-2xl font-bold text-white">{topPlatform.posts}</p></div>
          </div>
        </div>

        {/* PIE + BAR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* PIE CHART */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-[#031B4E] mb-1">Platform Traffic Distribution</h2>
            <p className="text-gray-500 text-sm mb-6">Engagement share across all connected platforms.</p>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={130} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, 'Engagement']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BAR CHART */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#031B4E] mb-1">Platform Comparison</h2>
                <p className="text-gray-500 text-sm">Compare platforms by key metric.</p>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {[['reach','Reach'],['engagement','Engage'],['followers','Followers'],['posts','Posts']].map(([val, label]) => (
                  <button key={val} onClick={() => setActiveMetric(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeMetric === val ? 'bg-white shadow text-[#031B4E]' : 'text-gray-500'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtReach(v)} />
                  <Tooltip formatter={(v) => [fmtReach(v), metricLabel]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PLATFORM DETAIL TABLE */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#031B4E]">Platform-by-Platform Breakdown</h2>
            <span className="text-sm text-gray-400">{activeFilter === '30' ? 'Last 30 days' : activeFilter === '90' ? 'Last 90 days' : 'Last 1 year'}</span>
          </div>
          <table className="w-full">
            <thead className="bg-[#F4F6FB]">
              <tr>
                {['Platform','Reach','Engagement','Followers Gained','Posts','Likes','Shares','Reach Share'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-bold text-[#031B4E] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...platforms].sort((a, b) => b.reach - a.reach).map((p, i) => {
                const totalReach = platforms.reduce((s, x) => s + x.reach, 0);
                const share = ((p.reach / totalReach) * 100).toFixed(1);
                const isTop = i === 0;
                return (
                  <tr key={p.name} className={`border-t border-gray-100 ${isTop ? 'bg-yellow-50' : 'hover:bg-gray-50'} transition`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: PLATFORM_META[p.name].color + '20' }}>
                          <span className="material-symbols-outlined text-[18px]" style={{ color: PLATFORM_META[p.name].color }}>{PLATFORM_META[p.name].icon}</span>
                        </div>
                        <span className="font-bold text-[#031B4E]">{p.name}</span>
                        {isTop && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-bold">🏆 Top</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-[#031B4E]">{fmtReach(p.reach)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-20">
                          <div className="h-full rounded-full" style={{ width: `${p.engagement}%`, backgroundColor: PLATFORM_META[p.name].color }} />
                        </div>
                        <span className="font-semibold text-[#031B4E] text-sm">{p.engagement}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-[#031B4E]">+{fmtReach(p.followers)}</td>
                    <td className="px-6 py-5 font-semibold text-[#031B4E]">{p.posts}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-pink-500 text-[16px]">favorite</span>
                        <span className="font-semibold text-[#031B4E]">{p.likes}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-[16px]">share</span>
                        <span className="font-semibold text-[#031B4E]">{p.shares}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-20">
                          <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: PLATFORM_META[p.name].color }} />
                        </div>
                        <span className="font-semibold text-[#031B4E] text-sm">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>
    </SMHLayout>
  );
}
