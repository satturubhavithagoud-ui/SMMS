import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
import PlatformLogo from '../components/PlatformLogo';
import { PageHeader, StatCard, SectionCard, EmptyState, StatusBadge } from '../components/ui';
import { getClientDashboard } from '../services/smhService';

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
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
      <div className="card h-[300px] p-6">
        <div className="mb-6 h-4 w-40 rounded bg-surface-container-high" />
        <div className="flex h-48 items-end gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex-1 rounded-t bg-surface-container-high" style={{ height: `${35 + (i * 9) % 40}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const clientId = getUser().client_id || null;

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getClientDashboard(clientId);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const hasChartData = data?.chart_data?.some(d => d.published_count > 0 || d.scheduled_count > 0);

  return (
    <ClientLayout>
      <PageHeader
        title={loading ? 'Welcome back' : `Welcome back, ${data?.username || 'there'}`}
        subtitle={
          loading
            ? 'Loading your dashboard...'
            : data?.organization_name
            ? `${data.organization_name} — here's your performance at a glance.`
            : 'Here\'s your performance at a glance.'
        }
        actions={
          !loading && !error && data ? (
            <Link to="/scheduler" className="btn btn-primary">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Post
            </Link>
          ) : null
        }
      />

      {loading ? (
        <Skeleton />
      ) : error ? (
        <section className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <div>
            <h3 className="card-heading">Unable to load dashboard</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
          </div>
          <button onClick={fetchDashboard} className="btn btn-primary">
            Try Again
          </button>
        </section>
      ) : (
        <div className="space-y-5">
          {/* Stats Grid */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="edit_square"
              label="Posts this month"
              value={data.stats.posts_this_month}
              sub={`${data.stats.posts_published} published total`}
              iconBgClass="bg-primary/10 text-primary"
            />
            <StatCard
              icon="groups"
              label="Total reach"
              value={formatCount(data.stats.total_reach)}
              sub={`${formatCount(data.stats.followers_gained)} followers gained`}
              iconBgClass="bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant"
            />
            <StatCard
              icon="favorite"
              label="Engagement rate"
              value={`${data.stats.engagement_rate}%`}
              sub={`${formatCount(data.stats.total_engagement)} engagements`}
              iconBgClass="bg-error-container text-on-error-container"
            />
            <StatCard
              icon="calendar_today"
              label="Scheduled"
              value={data.stats.posts_scheduled}
              sub={`${data.stats.drafts} drafts · ${data.stats.posts_failed} failed`}
              iconBgClass="bg-primary-fixed-dim/40 text-primary"
            />
          </section>

          {/* Connected Platforms */}
          <SectionCard
            title="Connected Platforms"
            subtitle="Social accounts linked to your workspace"
            icon="link"
            action={
              <Link to="/settings" className="btn btn-outline btn-sm">
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Manage
              </Link>
            }
          >
            {data.connected_platforms.length === 0 ? (
              <EmptyState
                icon="add_link"
                title="No platforms connected yet"
                message="Connect your social accounts to start publishing."
                action={
                  <Link to="/settings" className="btn btn-primary btn-sm mt-2">
                    Connect your first platform
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.connected_platforms.map(platform => (
                  <div
                    key={platform.platform}
                    className="flex items-center gap-3 rounded-xl border border-surface-variant/60 bg-surface-container-low/40 px-4 py-3.5 transition-colors hover:bg-surface-container-low"
                  >
                    <PlatformLogo platform={platform.platform} size={24} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-manrope text-sm font-semibold text-on-surface">
                        {platform.label}
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </p>
                      {platform.account_username && (
                        <p className="truncate text-xs text-on-surface-variant">@{platform.account_username}</p>
                      )}
                    </div>
                    <span className="badge badge-success shrink-0">Active</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Posts This Week */}
          <SectionCard
            title="Posts This Week"
            subtitle="Published vs scheduled distribution"
            icon="bar_chart"
            bodyClassName="py-6"
          >
            {!hasChartData ? (
              <EmptyState icon="bar_chart" title="No activity yet this week" message="Once you publish or schedule posts, they'll show up here." />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chart_data} barGap={6} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efedf0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#44474e' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#44474e' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(3,22,53,0.05)' }} contentStyle={TOOLTIP_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="published_count" name="Published" fill="#031635" radius={[6, 6, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="scheduled_count" name="Scheduled" fill="#b6c6ef" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* Recent & Scheduled Posts + Activity */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <SectionCard
              title="Recent & Scheduled"
              subtitle="Your latest content"
              icon="post_add"
              className="lg:col-span-3"
              bodyClassName="p-0 md:p-0"
              action={
                <Link to="/scheduler" className="text-sm font-semibold text-primary transition-colors hover:underline">
                  View all
                </Link>
              }
            >
              {data.recent_posts.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon="post_add"
                    title="No posts yet"
                    message="Create your first post in the Scheduler."
                    action={
                      <Link to="/scheduler" className="btn btn-primary btn-sm mt-2">
                        Go to Scheduler
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-surface-variant/50">
                  {data.recent_posts.map(post => (
                    <li key={post.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-container-low/40 md:px-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high">
                        {post.media_url ? (
                          <img alt="Post content" className="h-full w-full object-cover" src={post.media_url} />
                        ) : (
                          <span className="material-symbols-outlined text-outline">article</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-on-surface">{post.caption}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {post.platforms.map((plat, i) => (
                              <PlatformLogo key={i} platform={plat} size={14} />
                            ))}
                          </div>
                          <span className="text-xs text-on-surface-variant">
                            {formatDateTime(post.scheduled_time || post.created_at)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={post.status} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Recent Activity"
              subtitle="Latest notifications and events"
              icon="notifications_active"
              className="lg:col-span-2"
              bodyClassName="p-0 md:p-0"
            >
              {data.activity.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon="history" title="No recent activity" message="Updates will appear here as they happen." />
                </div>
              ) : (
                <ul className="divide-y divide-surface-variant/50">
                  {data.activity.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 px-5 py-4 md:px-6">
                      <span
                        className={`material-symbols-outlined mt-0.5 text-[18px] ${
                          item.type === 'POST_FAILED' || item.type === 'POST_REJECTED' ? 'text-error' : 'text-primary'
                        }`}
                      >
                        {item.type === 'POST_FAILED' ? 'error' : item.type === 'POST_REJECTED' ? 'block' : 'notifications'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-on-surface-variant">{item.message}</p>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-on-surface-variant">
                        {formatDateTime(item.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
