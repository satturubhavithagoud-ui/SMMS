import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SMHLayout from '../components/SMHLayout';
import { getSMHAnalytics } from '../services/smhService';
import PlatformLogo, { getPlatformConfig } from '../components/PlatformLogo';

function fmt(val, type) {
  if (type === 'pct') return `${val}%`;
  if (type === 'growth') {
    const num = Number(val);
    return `${num >= 1000 ? `${(num / 1000).toFixed(0)}K` : num}`;
  }
  const n = Number(val);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function exportCSV(data) {
  const rows = [['Metric', 'Value']];
  rows.push(['Total Engagement', data.total_engagement ?? 0]);
  rows.push(['Reach', data.total_reach ?? 0]);
  rows.push(['Followers Growth', data.followers_growth ?? 0]);
  rows.push(['CTR (%)', data.ctr ?? 0]);
  rows.push(['Published Posts', data.published_posts ?? 0]);
  rows.push([]);
  rows.push(['Platform', 'Posts']);
  (data.platform_stats || []).forEach(p => rows.push([p.name, p.value]));
  rows.push([]);
  rows.push(['Best Content', 'Platforms']);
  (data.best_content || []).forEach(p => rows.push([p.title, (p.platforms || []).join(', ')]));

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PERIODS = [
  { label: 'Last 30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: '1 Year', days: 365 },
];

export default function SMHAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);

  const fetchData = useCallback((p) => {
    setLoading(true);
    setError(null);
    getSMHAnalytics(p)
      .then(setData)
      .catch(err => setError(err.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  const metrics = [
    { label: 'Total Engagement', value: fmt(data?.total_engagement), trend: '+12%', isTrend: true },
    { label: 'Reach', value: fmt(data?.total_reach), trend: '+8%', isTrend: true },
    { label: 'Followers Growth', value: `+${fmt(data?.followers_growth, 'growth')}`, icon: 'trending_up', isTrend: false },
    { label: 'CTR', value: fmt(data?.ctr, 'pct'), trend: 'Avg', isTrend: false },
    { label: 'Published Posts', value: data?.published_posts ?? 0, icon: 'post_add', isTrend: false },
  ];

  return (
    <SMHLayout>
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-md">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Analytics</h1>
            <p className="text-on-surface-variant font-body-md">Detailed performance insights across all managed accounts.</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex bg-surface-container-high rounded-lg p-xs">
              {PERIODS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setPeriod(opt.days)}
                  className={`px-md py-xs text-label-bold font-label-bold rounded transition-colors ${
                    period === opt.days
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => data && exportCSV(data)}
              className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg font-label-bold text-label-bold hover:bg-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Report
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="p-md bg-error-container text-on-error-container rounded-xl">
            <p className="font-bold">Error loading analytics</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-md mb-xl">
              {metrics.map((metric, idx) => (
                <div key={idx} className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container">
                  <div className="flex justify-between items-start mb-sm">
                    <span className="text-on-surface-variant font-label-bold text-label-bold">{metric.label}</span>
                    {metric.trend ? (
                      <span className={`${metric.isTrend ? 'text-teal-600 bg-teal-50' : 'text-on-surface-variant opacity-50'} px-xs rounded text-[10px] font-bold`}>{metric.trend}</span>
                    ) : metric.icon ? (
                      <span className={`material-symbols-outlined ${metric.label.includes('Growth') ? 'text-teal-600' : 'text-on-surface-variant'} text-[18px]`}>{metric.icon}</span>
                    ) : null}
                  </div>
                  <div className="font-stat-lg text-stat-lg text-primary">{metric.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container mb-xl">
              <h3 className="font-headline-md text-headline-md text-primary mb-lg">Connected Platforms Overview</h3>
              <div className="space-y-lg py-md">
                {(data?.platform_stats ?? []).length === 0 ? (
                  <p className="text-on-surface-variant text-center py-lg">No platform data available.</p>
                ) : (
                  (data?.platform_stats ?? []).map((platform, idx) => {
                    const config = getPlatformConfig(platform.key);
                    return (
                      <div key={idx} className="flex items-center gap-md">
                        <div className="w-32 flex items-center gap-sm">
                          <PlatformLogo platform={platform.key} size={16} />
                          <span className="font-body-md text-primary font-semibold">{platform.name}</span>
                        </div>
                        <div className="flex-grow bg-surface-container-low h-8 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${platform.width_pct}%` }}></div>
                        </div>
                        <div className="w-12 text-right">
                          <span className="font-stat-lg text-primary text-[20px]">{platform.value}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
              <div className="p-lg border-b border-surface-container flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-primary">Best Performing Content</h3>
                <button
                  onClick={() => navigate('/smh-content-queue')}
                  className="text-primary font-label-bold text-label-bold hover:underline flex items-center gap-xs"
                >
                  View Full Content Library
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="p-md font-label-bold text-label-bold text-on-surface-variant">Content Thumbnail</th>
                      <th className="p-md font-label-bold text-label-bold text-on-surface-variant">Platform</th>
                      <th className="p-md font-label-bold text-label-bold text-on-surface-variant">Eng. Rate</th>
                      <th className="p-md font-label-bold text-label-bold text-on-surface-variant">Impressions</th>
                      <th className="p-md font-label-bold text-label-bold text-on-surface-variant">Shares</th>
                      <th className="p-md font-label-bold text-label-bold text-on-surface-variant">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {(data?.best_content ?? []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-md text-center text-on-surface-variant">No published content yet.</td>
                      </tr>
                    ) : (
                      (data?.best_content ?? []).map((post) => {
                        const primaryPlatform = post.platforms?.[0] || 'unknown';
                        return (
                          <tr key={post.id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="p-md">
                              <div className="flex items-center gap-md">
                                <div className="w-12 h-12 bg-surface-container rounded overflow-hidden">
                                  {post.media_url ? (
                                    <img alt="Post Thumbnail" className="w-full h-full object-cover" src={post.media_url} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="material-symbols-outlined text-outline">image</span>
                                    </div>
                                  )}
                                </div>
                                <span className="font-body-md text-primary font-semibold truncate max-w-[200px]">{post.title}</span>
                              </div>
                            </td>
                            <td className="p-md">
                              <div className="flex items-center gap-sm">
                                <PlatformLogo platform={primaryPlatform} size={14} variant="badge" />
                                <span className="text-body-md capitalize">{primaryPlatform}</span>
                              </div>
                            </td>
                            <td className="p-md font-label-bold text-primary">{(data?.ctr ?? 0) > 0 ? `${(data.ctr / Math.max(data.best_content.length, 1)).toFixed(1)}%` : '—'}</td>
                            <td className="p-md text-body-md">{data?.total_reach ? fmt(Math.round(data.total_reach / Math.max(data.best_content.length, 1))) : '—'}</td>
                            <td className="p-md text-body-md">{data?.total_engagement ? fmt(Math.round(data.total_engagement / Math.max(data.best_content.length * 10, 1))) : '—'}</td>
                            <td className="p-md">
                              <span className="bg-teal-100 text-teal-800 px-sm py-xs rounded-full text-[10px] font-bold uppercase tracking-wider">Top Performing</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </SMHLayout>
  );
}
