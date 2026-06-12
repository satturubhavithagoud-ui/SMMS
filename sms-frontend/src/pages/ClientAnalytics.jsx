import { useState, useEffect } from 'react';
import ClientLayout from '../components/ClientLayout';
import { getClientAnalytics } from '../services/analyticsService';

const PLATFORM_STYLES = {
  instagram: {
    label: 'Instagram',
    accent: 'from-pink-500 via-orange-400 to-yellow-400',
    chip: 'bg-pink-50 text-pink-700',
    accentColor: '#E1306C',
    accentSoft: 'bg-[#f2f0ff]',
    accentText: 'text-[#5b53c5]',
    accentBorder: 'border-[#dcd7ff]',
    track: 'bg-[#ece9fb]',
    fill: 'bg-[#5b53c5]',
    icon: 'photo_camera',
    permissionCaption: 'Uses instagram_basic and pages_read_engagement for profile and post metrics.',
  },
  facebook: {
    label: 'Facebook',
    accent: 'from-blue-600 to-blue-400',
    chip: 'bg-blue-50 text-blue-700',
    accentColor: '#1877F2',
    accentSoft: 'bg-[#eef5ff]',
    accentText: 'text-[#2167ae]',
    accentBorder: 'border-[#d8e8ff]',
    track: 'bg-[#e7eef8]',
    fill: 'bg-[#2167ae]',
    icon: 'thumb_up',
    permissionCaption: 'Uses pages_show_list, pages_read_engagement, and page-level post access.',
  },
  youtube: {
    label: 'YouTube',
    accent: 'from-red-600 to-red-400',
    chip: 'bg-red-50 text-red-700',
    accentColor: '#FF0000',
    accentSoft: 'bg-[#fff0f0]',
    accentText: 'text-[#cc0000]',
    accentBorder: 'border-[#ffd6d6]',
    track: 'bg-[#fce8e8]',
    fill: 'bg-[#cc0000]',
    icon: 'play_circle',
    permissionCaption: 'Uses YouTube Data API v3 for channel statistics and video performance metrics.',
  },
};

const TREND_SERIES = [
  { key: 'posts', label: 'Posts', color: '#5b53c5' },
  { key: 'engagement', label: 'Engagement', color: '#19a38c' },
  { key: 'likes', label: 'Likes', color: '#f2a126' },
];

const HEATMAP_SLOTS = [
  { label: '9am', start: 8, end: 11 },
  { label: '12pm', start: 11, end: 14 },
  { label: '3pm', start: 14, end: 17 },
  { label: '6pm', start: 17, end: 20 },
  { label: '9pm', start: 20, end: 23 },
];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function formatNumber(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(numericValue);
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getClientId() {
  try {
    const user = JSON.parse(window.localStorage.getItem('user') || '{}');
    return user?.client_id || null;
  } catch {
    return null;
  }
}

function getPlatformAudience(platform) {
  const metrics = platform?.metrics || {};
  return Number(metrics.followers_count || metrics.fan_count || 0);
}

function getPlatformEngagement(platform) {
  const metrics = platform?.metrics || {};
  return Number(metrics.recent_engagement_total || 0);
}

function buildOverviewCards(overview, platforms) {
  const mostEngaged = platforms.reduce((best, platform) => {
    return getPlatformEngagement(platform) > getPlatformEngagement(best) ? platform : best;
  }, platforms[0] || null);

  return [
    {
      label: 'Total Audience',
      value: formatNumber(overview.total_audience),
      caption: 'Combined followers and page likes',
      trend: `${overview.connected_platforms} platforms connected`,
    },
    {
      label: 'Recent Engagement',
      value: formatNumber(overview.recent_engagement_total),
      caption: 'Likes and comments from recent content',
      trend: mostEngaged ? `${mostEngaged.label} leading now` : 'Waiting for engagement',
    },
    {
      label: 'Published Posts',
      value: formatNumber(overview.published_posts),
      caption: `${overview.scheduled_posts} scheduled in queue`,
      trend: `${overview.draft_posts} drafts still pending`,
    },
    {
      label: 'Platform Mix',
      value: formatNumber(overview.connected_platforms),
      caption: 'Channels currently active',
      trend: platforms.length ? platforms.map(item => item.label).join(' + ') : 'No platforms yet',
    },
  ];
}

function buildReachByPlatform(platforms) {
  const totalAudience = platforms.reduce((sum, platform) => sum + getPlatformAudience(platform), 0);
  const totalEngagement = platforms.reduce((sum, platform) => sum + getPlatformEngagement(platform), 0);

  return platforms.map((platform) => {
    const audience = getPlatformAudience(platform);
    const engagement = getPlatformEngagement(platform);
    const fallbackBase = totalEngagement || 1;
    const percent = totalAudience > 0
      ? Math.round((audience / totalAudience) * 100)
      : Math.round((engagement / fallbackBase) * 100);

    return {
      ...platform,
      value: audience,
      percent: Number.isFinite(percent) ? percent : 0,
    };
  });
}

function buildEngagementBreakdown(platforms) {
  const total = platforms.reduce((sum, platform) => sum + getPlatformEngagement(platform), 0);
  let cursor = 0;

  const segments = platforms.map((platform) => {
    const value = getPlatformEngagement(platform);
    const percent = total > 0 ? (value / total) * 100 : 0;
    const start = cursor;
    cursor += percent;
    return {
      label: platform.label,
      value,
      percent: Math.round(percent),
      color: PLATFORM_STYLES[platform.platform]?.accentColor || '#5b53c5',
      start,
      end: cursor,
    };
  });

  const gradient = segments.length
    ? `conic-gradient(${segments.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(', ')})`
    : 'conic-gradient(#ece9fb 0% 100%)';

  return {
    total,
    segments,
    gradient,
  };
}

function buildPlatformMetricCards(platform) {
  if (!platform) return [];
  const metrics = platform.metrics || {};
  return [
    {
      key: 'followers',
      label: platform.platform === 'youtube' ? 'Subscribers' : 'Followers',
      value: formatNumber(metrics.followers_count),
      visible: 'followers_count' in metrics,
      note: platform.platform === 'instagram' ? platform.account_name : (platform.platform === 'youtube' ? 'Channel subscribers' : 'Audience size'),
      change: platform.platform === 'youtube'
        ? `Videos: ${formatNumber(metrics.video_count || 0)}`
        : `Recent media: ${formatNumber(metrics.recent_media_count || metrics.media_count || 0)}`,
    },
    {
      key: 'total_views',
      label: 'Total Views',
      value: formatNumber(metrics.total_views),
      visible: 'total_views' in metrics,
      note: 'Lifetime channel views',
      change: `Recent views: ${formatNumber(metrics.recent_views || 0)}`,
    },
    {
      key: 'reach',
      label: 'Page Likes',
      value: formatNumber(metrics.fan_count),
      visible: 'fan_count' in metrics && platform.platform === 'facebook',
      note: 'Facebook page likes',
      change: `Engagement: ${formatNumber(metrics.recent_engagement_total || 0)}`,
    },
    {
      key: 'likes',
      label: 'Recent Likes',
      value: formatNumber(metrics.recent_likes),
      visible: 'recent_likes' in metrics,
      note: 'Across fetched recent content',
      change: `Comments: ${formatNumber(metrics.recent_comments || 0)}`,
    },
    {
      key: 'engagement',
      label: 'Recent Engagement',
      value: formatNumber(metrics.recent_engagement_total),
      visible: 'recent_engagement_total' in metrics,
      note: 'Likes + comments',
      change: `Content count: ${formatNumber(metrics.recent_media_count || metrics.media_count || 0)}`,
    },
  ].filter((item) => item.visible);
}

function buildRecentActivity(platform) {
  if (!platform) return [];
  const recentMedia = platform.recent_media || [];
  return recentMedia.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.caption || 'Untitled post',
    subtitle: `${platform.label} · ${formatDateTime(item.timestamp)}`,
    likes: item.like_count || 0,
    comments: item.comments_count || 0,
    engagement: item.engagement_total || 0,
    permalink: item.permalink,
  }));
}

function buildWeeklyTrend(weeklyPosts, platform) {
  const recentMedia = platform?.recent_media || [];
  const mediaByDate = {};
  const engagementByDate = {};
  const likesByDate = {};

  recentMedia.forEach((item) => {
    if (!item.timestamp) return;
    const dateKey = new Date(item.timestamp).toISOString().slice(0, 10);
    mediaByDate[dateKey] = (mediaByDate[dateKey] || 0) + 1;
    engagementByDate[dateKey] = (engagementByDate[dateKey] || 0) + (item.engagement_total || 0);
    likesByDate[dateKey] = (likesByDate[dateKey] || 0) + (item.like_count || 0);
  });

  return weeklyPosts.map((day) => ({
    label: day.label,
    date: day.date,
    posts: mediaByDate[day.date] || 0,
    engagement: engagementByDate[day.date] || 0,
    likes: likesByDate[day.date] || 0,
    appPosts: day.count || 0,
  }));
}

function getLinePath(values, width, height, padding) {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const maxValue = Math.max(...values, 1);

  return values.map((value, index) => {
    const x = padding + (innerWidth / Math.max(values.length - 1, 1)) * index;
    const y = height - padding - (value / maxValue) * innerHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
}

function buildHeatmap(platform) {
  const matrix = HEATMAP_SLOTS.map(() => DAY_LABELS.map(() => 0));
  const recentMedia = platform?.recent_media || [];

  recentMedia.forEach((item) => {
    if (!item.timestamp) return;
    const date = new Date(item.timestamp);
    const hour = date.getHours();
    const dayIndex = (date.getDay() + 6) % 7; // Monday = 0
    const rowIndex = HEATMAP_SLOTS.findIndex((slot) => hour >= slot.start && hour < slot.end);

    if (rowIndex >= 0) {
      matrix[rowIndex][dayIndex] += (item.engagement_total || 0) + 1;
    }
  });

  const maxValue = Math.max(...matrix.flat(), 1);
  const topSlots = [];

  matrix.forEach((row, rowIndex) => {
    row.forEach((value, dayIndex) => {
      if (value > 0) {
        topSlots.push({
          dayIndex,
          rowIndex,
          value,
        });
      }
    });
  });

  topSlots.sort((a, b) => b.value - a.value);

  const summary = topSlots.slice(0, 3).map((item) => {
    return `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][item.dayIndex]} ${HEATMAP_SLOTS[item.rowIndex].label}`;
  });

  return {
    matrix,
    maxValue,
    summary,
  };
}

export default function ClientAnalytics({ overrideClientId = null, hideLayout = false }) {
  const [analytics, setAnalytics] = useState(null);
  const clientId = overrideClientId || getClientId();
  const [loading, setLoading] = useState(Boolean(clientId));
  const [error, setError] = useState(clientId ? '' : 'Please log in as a client to see analytics.');
  const [selectedPlatformKey, setSelectedPlatformKey] = useState('overview');
  const Wrapper = hideLayout ? 'div' : ClientLayout;
  const wrapperProps = hideLayout ? { className: "w-full" } : {};

  useEffect(() => {
    if (!clientId) {
      return undefined;
    }

    let active = true;
    async function loadAnalytics() {
      try {
        setLoading(true);
        const data = await getClientAnalytics(clientId);
        if (active) {
          setAnalytics(data);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load client analytics.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadAnalytics();
    return () => {
      active = false;
    };
  }, [clientId]);

  const overview = analytics?.overview ?? {
    total_audience: 0,
    recent_engagement_total: 0,
    published_posts: 0,
    scheduled_posts: 0,
    draft_posts: 0,
    connected_platforms: 0,
  };

  const weeklyPosts = analytics?.weekly_posts ?? [];
  const platforms = analytics?.platforms ?? [];
  const platformErrors = analytics?.errors ?? [];
  const peakWeeklyCount = Math.max(...weeklyPosts.map((item) => item.count), 1);

  const selectedPlatform = selectedPlatformKey === 'overview'
    ? null
    : platforms.find((platform) => platform.platform === selectedPlatformKey) || platforms[0] || null;

  const effectiveSelectedPlatformKey = selectedPlatform ? selectedPlatform.platform : 'overview';
  const selectedStyle = selectedPlatform ? PLATFORM_STYLES[selectedPlatform.platform] || PLATFORM_STYLES.instagram : null;

  const overviewCards = buildOverviewCards(overview, platforms);
  const reachByPlatform = buildReachByPlatform(platforms);
  const engagementBreakdown = buildEngagementBreakdown(platforms);
  const metricCards = buildPlatformMetricCards(selectedPlatform);
  const recentActivity = buildRecentActivity(selectedPlatform);
  const trendData = buildWeeklyTrend(weeklyPosts, selectedPlatform);
  const heatmap = selectedPlatform ? buildHeatmap(selectedPlatform) : null;

  const chartWidth = 420;
  const chartHeight = 180;
  const chartPadding = 18;
  const activityPath = getLinePath(trendData.map((item) => item.posts), chartWidth, chartHeight, chartPadding);
  const engagementPath = getLinePath(trendData.map((item) => item.engagement), chartWidth, chartHeight, chartPadding);
  const likesPath = getLinePath(trendData.map((item) => item.likes), chartWidth, chartHeight, chartPadding);

  if (loading) {
    return (
      <Wrapper {...wrapperProps}>
        <div className="flex h-64 items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps}>
      {/* Page Header */}
      <section className="mb-xl px-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface">Analytics</h2>
          <p className="font-body-md text-on-surface-variant">
            Live account metrics from your connected Instagram, Facebook, and YouTube profiles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-on-surface-variant font-medium">Select platform</label>
          <select
            value={effectiveSelectedPlatformKey}
            onChange={(event) => setSelectedPlatformKey(event.target.value)}
            className="rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary"
          >
            <option value="overview">Overview</option>
            {platforms.map((platform) => (
              <option key={platform.platform} value={platform.platform}>
                {platform.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="mb-xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Overview Cards - Always shown to summarize the overall/platform scope */}
      <section className="grid grid-cols-1 gap-sm mb-xl sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-surface-container"
          >
            <p className="font-label-bold text-on-secondary-container text-[10px] uppercase mb-1">
              {card.label}
            </p>
            <p className="font-headline-md text-headline-md text-primary truncate">
              {card.value}
            </p>
            <p className="text-[11px] text-green-600 font-semibold mt-2">{card.trend}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">{card.caption}</p>
          </div>
        ))}
      </section>

      {/* OVERVIEW CONTENT */}
      {!selectedPlatform && (
        <>
          <section className="grid grid-cols-1 gap-lg xl:grid-cols-2 mb-xl">
            {/* Reach by Platform */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5 shadow-sm">
              <h3 className="text-lg font-medium text-on-surface mb-5">Reach by platform</h3>
              <div className="space-y-4">
                {reachByPlatform.map((platform) => {
                  const style = PLATFORM_STYLES[platform.platform] || PLATFORM_STYLES.instagram;
                  return (
                    <div key={platform.platform} className="grid grid-cols-[80px_1fr_44px] items-center gap-3">
                      <span className={`text-sm ${style.accentText}`}>{platform.label}</span>
                      <div className={`h-2.5 overflow-hidden rounded-full ${style.track}`}>
                        <div
                          className={`h-full rounded-full ${style.fill}`}
                          style={{ width: `${Math.max(platform.percent, platform.value > 0 ? 8 : 0)}%` }}
                        ></div>
                      </div>
                      <span className="text-right text-sm text-on-surface font-semibold">{platform.percent}%</span>
                    </div>
                  );
                })}
                {platforms.length === 0 && (
                  <p className="text-sm text-on-surface-variant italic">Connect platforms to compare reach here.</p>
                )}
              </div>
            </div>

            {/* Engagement Split */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5 shadow-sm">
              <h3 className="text-lg font-medium text-on-surface mb-5">Engagement split</h3>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
                <div
                  className="relative flex h-32 w-32 items-center justify-center rounded-full"
                  style={{ background: engagementBreakdown.gradient }}
                >
                  <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-surface-container-lowest">
                    <span className="text-[10px] text-on-surface-variant uppercase">Total</span>
                    <span className="text-lg font-bold text-on-surface">{formatNumber(engagementBreakdown.total)}</span>
                  </div>
                </div>
                <div className="w-full space-y-3 sm:max-w-[200px]">
                  {engagementBreakdown.segments.map((segment) => (
                    <div key={segment.label} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }}></span>
                        <span className="text-sm text-on-surface">{segment.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-on-surface">{segment.percent}%</span>
                    </div>
                  ))}
                  {engagementBreakdown.segments.length === 0 && (
                    <p className="text-sm text-on-surface-variant italic">Engagement metrics will appear once accounts are active.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Weekly Publishing Activity */}
          <section className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container mb-xl">
            <div className="flex justify-between items-center mb-lg">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Weekly Publishing Activity</h3>
                <p className="text-sm text-on-surface-variant">Posts created in your app over the last 7 days.</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                {weeklyPosts.reduce((sum, item) => sum + item.count, 0)} posts
              </span>
            </div>

            <div className="flex items-end justify-between h-44 gap-xs pb-sm overflow-x-auto no-scrollbar">
              {weeklyPosts.map((bar, index) => {
                const count = bar?.count ?? 0;
                const height = Math.max(18, Math.round((count / peakWeeklyCount) * 140));
                return (
                  <div key={bar?.date ?? index} className="flex flex-col items-center gap-2 flex-1 min-w-[36px]">
                    <div
                      className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                      style={{ height: `${height}px` }}
                    ></div>
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      {bar?.label ?? ''}
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* PLATFORM SPECIFIC CONTENT */}
      {selectedPlatform && selectedStyle && (
        <>
          {/* Header/Connection status for the chosen platform */}
          <section className={`rounded-2xl border ${selectedStyle.accentBorder} bg-surface-container-lowest p-5 shadow-sm mb-xl`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedStyle.accentSoft} ${selectedStyle.accentText}`}>
                    {selectedPlatform.label}
                  </span>
                  <span className="text-sm text-on-surface-variant font-medium">{selectedPlatform.account_name}</span>
                </div>
                <h3 className="text-2xl font-bold text-on-surface">{selectedPlatform.label} Analytics</h3>
              </div>
              {selectedPlatform.page_link && (
                <a
                  href={selectedPlatform.page_link}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedStyle.accentSoft} ${selectedStyle.accentText} ${selectedStyle.accentBorder} hover:opacity-80`}
                >
                  Open Page
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>

            {selectedPlatform.warnings?.map((warning) => (
              <div
                key={warning}
                className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">warning</span>
                <span>{warning}</span>
              </div>
            ))}
          </section>

          {/* Metric details card grid for this specific platform */}
          <section className="grid grid-cols-2 gap-md mb-xl sm:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((card) => (
              <div key={card.key} className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
                <p className="text-xs font-medium text-on-surface-variant">{card.label}</p>
                <p className="mt-1 text-[28px] font-bold text-on-surface leading-none">{card.value}</p>
                <p className="mt-2 text-xs text-green-600 font-semibold">{card.change}</p>
                <p className="mt-1 text-[10px] text-on-surface-variant">{card.note}</p>
              </div>
            ))}
          </section>

          {/* Charts/Activity Trend & Posting Cadence Heatmap */}
          <section className="grid grid-cols-1 gap-lg lg:grid-cols-2 mb-xl">
            {/* Weekly Trend (SVG chart) */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-on-surface">Weekly trend</h3>
                  <p className="text-xs text-on-surface-variant">Likes, engagement and posts trend</p>
                </div>
                <div className="text-right text-xs text-on-surface-variant">
                  <p className="font-semibold text-on-surface">{selectedPlatform.label}</p>
                  <p>{trendData.reduce((sum, item) => sum + item.posts, 0)} posts total</p>
                </div>
              </div>

              <div className="rounded-xl bg-surface p-4 border border-outline-variant">
                <div className="mb-3 flex flex-wrap gap-4">
                  {TREND_SERIES.map((series) => (
                    <div key={series.key} className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }}></span>
                      <span>{series.label}</span>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <svg width={chartWidth} height={chartHeight} className="mx-auto">
                    {[0, 1, 2, 3].map((line) => (
                      <line
                        key={line}
                        x1={chartPadding}
                        y1={chartPadding + line * ((chartHeight - chartPadding * 2) / 3)}
                        x2={chartWidth - chartPadding}
                        y2={chartPadding + line * ((chartHeight - chartPadding * 2) / 3)}
                        stroke="rgba(0, 0, 0, 0.05)"
                        strokeDasharray="4 4"
                      />
                    ))}
                    <path d={activityPath} fill="none" stroke="#5b53c5" strokeWidth="3" strokeLinecap="round" />
                    <path d={engagementPath} fill="none" stroke="#19a38c" strokeWidth="3" strokeLinecap="round" />
                    <path d={likesPath} fill="none" stroke="#f2a126" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-on-surface-variant">
                  {trendData.map((day) => (
                    <span key={day.date} className="font-semibold">{day.label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Posting cadence heatmap */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-medium text-on-surface">Posting Cadence</h3>
                <p className="text-xs text-on-surface-variant">Engagement levels by publishing hours</p>
              </div>

              {heatmap && (
                <>
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="grid min-w-[320px] grid-cols-[44px_repeat(7,1fr)] gap-2">
                      <div></div>
                      {DAY_LABELS.map((day) => (
                        <div key={day} className="text-center text-xs font-bold text-on-surface-variant">{day}</div>
                      ))}

                      {HEATMAP_SLOTS.map((slot, rowIndex) => (
                        <div key={slot.label} className="contents">
                          <div className="self-center text-xs font-medium text-on-surface-variant">{slot.label}</div>
                          {heatmap.matrix[rowIndex].map((value, columnIndex) => {
                            const intensity = value > 0 ? Math.max(0.15, value / heatmap.maxValue) : 0;
                            return (
                              <div
                                key={`${slot.label}-${columnIndex}`}
                                className="h-7 rounded-md border border-outline-variant/30"
                                style={{
                                  backgroundColor: `rgba(91, 83, 197, ${intensity})`,
                                }}
                                title={`${value} engagement points`}
                              ></div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span>Low Activity</span>
                    <div className="flex gap-1">
                      {[0.2, 0.4, 0.6, 0.8].map((opacity) => (
                        <span
                          key={opacity}
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: `rgba(91, 83, 197, ${opacity})` }}
                        ></span>
                      ))}
                    </div>
                    <span>High Activity</span>
                  </div>

                  <p className="mt-4 text-sm text-on-surface">
                    Best slots:
                    <span className="ml-1 text-primary font-bold">
                      {heatmap.summary.length ? heatmap.summary.join(', ') : 'Not enough data'}
                    </span>
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Recent Activity & Connection permissions used */}
          <section className="grid grid-cols-1 gap-lg lg:grid-cols-2 mb-xl">
            {/* Recent Activity */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h3 className="text-lg font-medium text-on-surface mb-5">Recent Activity</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {recentActivity.map((item) => (
                  <div key={item.id} className="grid grid-cols-[12px_1fr] gap-3">
                    <div className="flex justify-center pt-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedStyle.accentColor }}></span>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-xs">
                      <p className="text-sm font-semibold text-on-surface line-clamp-2">{item.title}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{item.subtitle}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                        <div className="rounded-lg bg-surface-container-low p-2">
                          <p className="text-on-surface-variant text-[10px]">Likes</p>
                          <p className="font-bold text-on-surface">{formatNumber(item.likes)}</p>
                        </div>
                        <div className="rounded-lg bg-surface-container-low p-2">
                          <p className="text-on-surface-variant text-[10px]">Comments</p>
                          <p className="font-bold text-on-surface">{formatNumber(item.comments)}</p>
                        </div>
                        <div className="rounded-lg bg-surface-container-low p-2">
                          <p className="text-on-surface-variant text-[10px]">Engagement</p>
                          <p className="font-bold text-on-surface">{formatNumber(item.engagement)}</p>
                        </div>
                      </div>
                      {item.permalink && (
                        <a
                          href={item.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-3 inline-flex items-center gap-0.5 text-xs font-bold transition hover:opacity-85`}
                          style={{ color: selectedStyle.accentColor }}
                        >
                          View Post
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-on-surface-variant italic">No recent activity detected.</p>
                )}
              </div>
            </div>

            {/* Connection/Meta Permissions details */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h3 className="text-lg font-medium text-on-surface mb-5">Meta Integration Details</h3>
              <div className="space-y-3">
                <div className="rounded-xl border border-outline-variant bg-surface p-4">
                  <p className="text-sm font-semibold text-on-surface">Connection info</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{selectedStyle.permissionCaption}</p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-4">
                  <p className="text-sm font-semibold text-on-surface">Metrics scope</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Audience, likes, comments, engagement split, recent content, and platform warnings are updated in real-time.
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-4">
                  <p className="text-sm font-semibold text-on-surface">Status</p>
                  <p className="mt-1 text-xs text-on-surface-variant font-medium">
                    {selectedPlatform.warnings?.length ? selectedPlatform.warnings[0] : 'Fully Operational - No warnings detected'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Empty State when no platforms are connected */}
      {!loading && platforms.length === 0 && (
        <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center shadow-xs mb-xl">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">insights</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">No Connected Channels</h3>
          <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-4">
            Connect your Facebook, Instagram, or YouTube profile in Settings to enable real-time audience and engagement analytics.
          </p>
        </section>
      )}

      {/* Platform API warnings / Errors summary */}
      {platformErrors.length > 0 && (
        <section className="space-y-3 mb-xl">
          {platformErrors.map((platformError, idx) => (
            <div
              key={`${platformError.platform}-${idx}`}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">warning</span>
              <span>{platformError.platform.toUpperCase()}: {platformError.message}</span>
            </div>
          ))}
        </section>
      )}
    </Wrapper>
  );
}
