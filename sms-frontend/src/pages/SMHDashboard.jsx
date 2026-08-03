import React, { useState, useEffect } from 'react';
import SMHLayout from '../components/SMHLayout';
import PlatformLogo from '../components/PlatformLogo';
import { Link } from 'react-router-dom';
import { getSMHSummary } from '../services/smhService';

export default function SMHDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSMHSummary()
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard summary:', err);
        setError(err.message || 'Failed to load dashboard summary.');
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: 'Active clients', value: summary?.active_clients ?? 0, trend: '12%', icon: 'groups' },
    { label: 'Posts published today', value: summary?.posts_published_today ?? 0, trend: '5%', icon: 'send' },
    { label: 'Posts scheduled', value: summary?.posts_scheduled ?? 0, trend: '8%', icon: 'event', isAdd: true },
    { label: 'Total reach', value: summary?.total_reach ?? '0.0M', trend: '24%', icon: 'visibility' },
  ];

  return (
    <SMHLayout>
      <div className="space-y-xl">
        <header className="mb-xl">
          <h1 className="font-headline-md text-on-surface">Handler overview</h1>
          <p className="text-on-surface-variant text-label-bold">
            All clients and platform activity — {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-md bg-error-container text-on-error-container rounded-xl border border-error/20">
            <p className="font-bold">Error loading dashboard summary</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : (
          <>
            {/* Top Level Analytics */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
              {stats.map(stat => (
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
                  {(summary?.chart_data ?? []).map(d => (
                    <div key={d.day} className="flex-1 flex flex-col justify-end gap-xs h-full" title={`Published: ${d.published_count}, Scheduled: ${d.scheduled_count}`}>
                      <div className="bg-primary-fixed-dim rounded-t w-full" style={{ height: `${d.s}%` }}></div>
                      <div className="bg-primary rounded-t w-full" style={{ height: `${d.p}%` }}></div>
                      <span className="text-[10px] text-center mt-xs text-outline uppercase font-bold">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container-high">
                <h2 className="font-headline-md text-on-surface mb-lg">Alerts & notifications</h2>
                <div className="space-y-md max-h-[250px] overflow-y-auto">
                  {(summary?.alerts ?? []).map((alert, index) => {
                    const isWarning = alert.type === 'warning';
                    return (
                      <div key={index} className={`p-md ${isWarning ? 'bg-orange-50 border-orange-400' : 'bg-blue-50 border-blue-400'} border-l-4 rounded-lg flex gap-md items-start`}>
                        <span className={`material-symbols-outlined ${isWarning ? 'text-orange-600' : 'text-blue-600'}`}>{isWarning ? 'warning' : 'info'}</span>
                        <div>
                          <p className={`text-body-md font-bold ${isWarning ? 'text-orange-900' : 'text-blue-900'}`}>{alert.title}</p>
                          <p className={`text-xs ${isWarning ? 'text-orange-800' : 'text-blue-800'}`}>{alert.message}</p>
                        </div>
                      </div>
                    );
                  })}
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
                    {(summary?.client_roster ?? []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-lg text-center text-on-surface-variant">
                          No active clients found. Go to Clients tab to add.
                        </td>
                      </tr>
                    ) : (
                      (summary?.client_roster ?? []).map(client => (
                        <tr key={client.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-lg">
                            <div className="flex items-center gap-md">
                              <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden flex items-center justify-center">
                                {client.logo ? (
                                  <img alt={client.name} className="w-full h-full object-cover" src={client.logo} />
                                ) : (
                                  <span className="material-symbols-outlined text-outline">group</span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">{client.name}</p>
                                <p className="text-xs text-outline">{client.industry}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-lg">
                            <span className="px-sm py-xs bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">
                              {client.plan}
                            </span>
                          </td>
                          <td className="py-lg">
                            <div className="flex gap-xs">
                              {client.platforms.map((p, idx) => (
                                <PlatformLogo key={idx} platform={p} size={12} variant="badge" />
                              ))}
                            </div>
                          </td>
                          <td className="py-lg">
                            <div className="flex items-center gap-xs">
                              <span className={`w-2 h-2 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-orange-400'}`}></span>
                              <span className={`text-body-md ${client.status === 'Active' ? 'text-emerald-700' : 'text-orange-700'} font-bold`}>
                                {client.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-lg font-bold text-on-surface">{client.weekly_posts}</td>
                          <td className="py-lg text-right">
                            <button className="p-sm text-outline hover:text-primary transition-colors">
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </SMHLayout>
  );
}
