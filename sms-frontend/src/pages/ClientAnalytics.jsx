import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import ClientLayout from '../components/ClientLayout';
import { getClientAnalytics } from '../services/smhService';
import PlatformLogo from '../components/PlatformLogo';
import { PageHeader, StatCard, SectionCard, EmptyState } from '../components/ui';

function getUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function formatCount(value) {
  const num = Number(value) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function exportCSV(data) {
  const rows = [['Metric', 'Value']];
  const m = data?.metrics || {};
  rows.push(['Reach', m.total_reach ?? 0]);
  rows.push(['Total Engagement', m.total_engagement ?? 0]);
  rows.push(['Engagement Rate (%)', m.engagement_rate ?? 0]);
  rows.push(['Followers Gained', m.followers_gained ?? 0]);
  rows.push(['Posts Published', m.posts_published ?? 0]);
  rows.push(['Posts Scheduled', m.posts_scheduled ?? 0]);
  rows.push(['Drafts', m.drafts ?? 0]);
  rows.push([]);
  rows.push(['Platform', 'Posts']);
  (data?.platform_stats || []).forEach(p => rows.push([p.name, p.value]));
  rows.push([]);
  rows.push(['Best Content', 'Platforms', 'Created']);
  (data?.best_content || []).forEach(p => rows.push([p.title, (p.platforms || []).join(', '), p.created_at || '']));

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `client_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PERIODS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: '1 Year', days: 365 },
];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e4e2e5',
  fontSize: 12,
  boxShadow: '0 12px 40px -12px rgba(16,24,40,0.3)',
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="card space-y-3 p-5">
            <div className="h-9 w-9 rounded-lg bg-surface-container-high" />
            <div className="h-3 w-24 rounded bg-surface-container-high" />
            <div className="h-7 w-16 rounded bg-surface-container-high" />
          </div>
        ))}
      </div>
      <div className="card h-[320px] p-6">
        <div className="mb-6 h-4 w-48 rounded bg-surface-container-high" />
        <div className="flex h-48 items-end gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="flex-1 rounded-t bg-surface-container-high" style={{ height: `${30 + (i * 11) % 45}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ClientAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(30);

  const clientId = getUser().client_id || null;

  const fetchAnalytics = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getClientAnalytics(clientId, p);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const metrics = data?.metrics;
  const chartData = data?.chart_data || [];
  const hasChartData = chartData.length > 0 && chartData.some(d => d.published_count > 0 || d.scheduled_count > 0);
  const platformStats = (data?.platform_stats || []).map(p => ({ name: p.name, posts: p.value }));
  const xTickInterval = chartData.length > 14 ? Math.ceil(chartData.length / 8) : 0;

  const currentPeriod = PERIODS.find(p => p.days === period)?.label || `${period} Days`;

  return (
    <ClientLayout>
      <PageHeader
        title="Analytics"
        subtitle={`Track your social media performance over the last ${currentPeriod.toLowerCase()}.`}
        actions={
          <>
            <div className="flex rounded-xl border border-surface-variant/70 bg-surface-container-lowest p-1 shadow-card">
              {PERIODS.map(opt => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setPeriod(opt.days)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    period === opt.days
                      ? 'bg-primary text-on-primary shadow-card'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => data && exportCSV(data)} className="btn btn-outline">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Report
            </button>
          </>
        }
      />

      {loading ? (
        <Skeleton />
      ) : error ? (
        <section className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <div>
            <h3 className="card-heading">Unable to load analytics</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
          </div>
          <button onClick={() => fetchAnalytics(period)} className="btn btn-primary">
            Retry
          </button>
        </section>
      ) : (
        <div className="space-y-5">
          {/* Overview Cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="visibility"
              label="Reach"
              value={formatCount(metrics?.total_reach)}
              sub={metrics?.total_reach ? `${formatCount(metrics.total_reach)} impressions` : 'No data yet'}
              iconBgClass="bg-primary/10 text-primary"
            />
            <StatCard
              icon="thumbs_up_down"
              label="Engagement Rate"
              value={`${metrics?.engagement_rate ?? 0}%`}
              sub={metrics?.total_engagement ? `${formatCount(metrics.total_engagement)} engagements` : 'No data yet'}
              iconBgClass="bg-error-container text-on-error-container"
            />
            <StatCard
              icon="group_add"
              label="Followers Gained"
              value={`+${formatCount(metrics?.followers_gained)}`}
              sub={metrics?.followers_gained ? 'Net new followers' : 'No data yet'}
              iconBgClass="bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant"
            />
            <StatCard
              icon="post_add"
              label="Posts"
              value={metrics?.posts_published ?? 0}
              sub={metrics?.posts_scheduled ? `${metrics.posts_scheduled} scheduled · ${metrics.drafts ?? 0} drafts` : `${metrics?.drafts ?? 0} drafts`}
              iconBgClass="bg-primary-fixed-dim/40 text-primary"
            />
          </section>

          {/* Post Performance */}
          <SectionCard
            title="Post Performance Overview"
            subtitle="Published vs scheduled content over time"
            icon="bar_chart"
            bodyClassName="py-6"
          >
            {!hasChartData ? (
              <EmptyState icon="bar_chart" title="No post activity in this period yet" message="Publish or schedule posts to see performance here." />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={6} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efedf0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#44474e' }} axisLine={false} tickLine={false} interval={xTickInterval} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#44474e' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(3,22,53,0.05)' }} contentStyle={TOOLTIP_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="published_count" name="Published" fill="#031635" radius={[6, 6, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="scheduled_count" name="Scheduled" fill="#b6c6ef" radius={[6, 6, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* Platform Reach */}
          <SectionCard title="Platform Reach" subtitle="Posts per connected platform" icon="hub" bodyClassName="py-6">
            {platformStats.length === 0 ? (
              <EmptyState icon="hub" title="No platform data yet" message="Connect platforms and publish content to see reach by platform." />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformStats} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#efedf0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#44474e' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 12, fill: '#44474e' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(3,22,53,0.05)' }} contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="posts" name="Posts" fill="#031635" radius={[0, 6, 6, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* Best Performing Content */}
          <SectionCard
            title="Best Performing Content"
            subtitle="Your top published posts"
            icon="workspace_premium"
            bodyClassName="p-0 md:p-0"
            action={
              <button
                type="button"
                onClick={() => navigate('/scheduler')}
                className="flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:underline"
              >
                View Content Library
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant md:px-6">Content</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Platforms</th>
                    <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant sm:table-cell">Created</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {data?.best_content?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-sm text-on-surface-variant">
                        No published content in this period.
                      </td>
                    </tr>
                  ) : (
                    data?.best_content?.map((post) => (
                      <tr key={post.id} className="transition-colors hover:bg-surface-container-low/50">
                        <td className="px-5 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high">
                              {post.media_url ? (
                                <img alt="Post Thumbnail" className="h-full w-full object-cover" src={post.media_url} />
                              ) : (
                                <span className="material-symbols-outlined text-outline">image</span>
                              )}
                            </div>
                            <span className="max-w-[240px] truncate text-sm font-medium text-on-surface">{post.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {(post.platforms || []).map((platformKey, pidx) => (
                              <PlatformLogo key={pidx} platform={platformKey} size={16} />
                            ))}
                          </div>
                        </td>
                        <td className="hidden whitespace-nowrap px-5 py-4 text-sm text-on-surface-variant sm:table-cell">
                          {formatDateTime(post.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="badge badge-success">Published</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </ClientLayout>
  );
}
