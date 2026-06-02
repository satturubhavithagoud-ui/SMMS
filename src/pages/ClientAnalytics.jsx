import { useEffect, useState } from 'react';
import ClientLayout from '../components/ClientLayout';
import { getClientAnalytics } from '../services/analyticsService';

const PLATFORM_STYLES = {
  instagram: {
    label: 'Instagram',
    accent: '#5b53c5',
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
    accent: '#2167ae',
    accentSoft: 'bg-[#eef5ff]',
    accentText: 'text-[#2167ae]',
    accentBorder: 'border-[#d8e8ff]',
    track: 'bg-[#e7eef8]',
    fill: 'bg-[#2167ae]',
    icon: 'thumb_up',
    permissionCaption: 'Uses pages_show_list, pages_read_engagement, and page-level post access.',
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
    notation: numericValue >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(numericValue);
}

function formatDateTime(value) {
  if (!value) {
    return '';
  }

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
      trend: `${formatNumber(overview.connected_platforms)} platforms connected`,
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
      caption: `${formatNumber(overview.scheduled_posts)} scheduled in queue`,
      trend: `${formatNumber(overview.draft_posts)} drafts still pending`,
    },
    {
      label: 'Platform Mix',
      value: formatNumber(overview.connected_platforms),
      caption: 'Channels currently active',
      trend: `${platforms.length ? platforms.map((item) => item.label).join(' + ') : 'No platforms yet'}`,
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
      color: PLATFORM_STYLES[platform.platform]?.accent || '#5b53c5',
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
  const metrics = platform?.metrics || {};
  return [
    {
      key: 'followers',
      label: 'Followers',
      value: formatNumber(metrics.followers_count),
      visible: 'followers_count' in metrics,
      note: platform?.platform === 'instagram' ? platform.account_name : 'Audience size',
      change: `Recent media: ${formatNumber(metrics.recent_media_count || metrics.media_count || 0)}`,
    },
    {
      key: 'reach',
      label: 'Page Likes',
      value: formatNumber(metrics.fan_count),
      visible: 'fan_count' in metrics,
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
  const recentMedia = platform?.recent_media || [];
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
    if (!item.timestamp) {
      return;
    }
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
    if (!item.timestamp) {
      return;
    }
    const date = new Date(item.timestamp);
    const hour = date.getHours();
    const dayIndex = (date.getDay() + 6) % 7;
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

export default function ClientAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlatformKey, setSelectedPlatformKey] = useState('overview');

  useEffect(() => {
    const clientId = getClientId();
    let mounted = true;

    async function loadAnalytics() {
      setLoading(true);
      setError('');
      try {
        const response = await getClientAnalytics(clientId);
        if (mounted) {
          setAnalytics(response);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message || 'Unable to load analytics.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  const overview = analytics?.overview ?? {
    total_audience: 0,
    recent_engagement_total: 0,
    published_posts: 0,
    scheduled_posts: 0,
    connected_platforms: 0,
    draft_posts: 0,
  };
  const weeklyPosts = analytics?.weekly_posts ?? [];
  const platforms = analytics?.platforms ?? [];
  const platformErrors = analytics?.errors ?? [];

  const selectedPlatform = selectedPlatformKey === 'overview'
    ? null
    : platforms.find((platform) => platform.platform === selectedPlatformKey) || platforms[0] || null;
  const effectiveSelectedPlatformKey = selectedPlatform?.platform || 'overview';
  const selectedStyle = selectedPlatform ? PLATFORM_STYLES[selectedPlatform.platform] || PLATFORM_STYLES.instagram : PLATFORM_STYLES.instagram;
  const overviewCards = buildOverviewCards(overview, platforms);
  const reachByPlatform = buildReachByPlatform(platforms);
  const engagementBreakdown = buildEngagementBreakdown(platforms);
  const metricCards = buildPlatformMetricCards(selectedPlatform);
  const recentActivity = buildRecentActivity(selectedPlatform);
  const trendData = buildWeeklyTrend(weeklyPosts, selectedPlatform);
  const heatmap = buildHeatmap(selectedPlatform);
  const chartWidth = 420;
  const chartHeight = 180;
  const chartPadding = 18;
  const activityPath = getLinePath(trendData.map((item) => item.posts), chartWidth, chartHeight, chartPadding);
  const engagementPath = getLinePath(trendData.map((item) => item.engagement), chartWidth, chartHeight, chartPadding);
  const likesPath = getLinePath(trendData.map((item) => item.likes), chartWidth, chartHeight, chartPadding);

  return (
    <ClientLayout>
      <section className="mb-xl">
        <div className="rounded-[28px] border border-[#e7e4df] bg-gradient-to-br from-[#fbfaf7] to-[#f4f0ea] p-6 shadow-[0_10px_30px_rgba(28,25,23,0.04)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {selectedPlatform ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatformKey('overview')}
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7f73] transition hover:text-[#2d2924]"
                  >
                    Analytics Overview
                  </button>
                  <span className="text-[#b8b0a5]">/</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d2924]">
                    {selectedPlatform.label}
                  </span>
                </>
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7f73]">
                  Analytics Overview
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-[#736c64]">
              <span>Select platform</span>
              <select
                value={effectiveSelectedPlatformKey}
                onChange={(event) => setSelectedPlatformKey(event.target.value)}
                className="rounded-xl border border-[#ddd7cf] bg-white px-3 py-2 text-sm text-[#2d2924] outline-none transition focus:border-[#c8bfb4]"
              >
                <option value="overview">Overview</option>
                {platforms.map((platform) => (
                  <option key={platform.platform} value={platform.platform}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-sm sm:grid-cols-4 xl:grid-cols-4">
            {overviewCards.map((card) => (
              <div key={card.label} className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-medium text-[#756f67]">{card.label}</p>
                <p className="mt-2 text-[34px] font-semibold leading-none text-[#221f1a]">{loading ? '...' : card.value}</p>
                <p className="mt-2 text-xs text-[#1f9d78]">{card.trend}</p>
                <p className="mt-1 text-[11px] text-[#8d867d]">{card.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="mb-xl rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {!selectedPlatform ? (
        <>
          <section className="mb-xl grid grid-cols-1 gap-lg xl:grid-cols-[1.1fr_1.2fr]">
            <div className="rounded-[24px] border border-[#e4dfd7] bg-white px-5 py-5 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-medium text-[#3d3a35]">Reach by platform</h3>
              </div>
              <div className="space-y-4">
                {reachByPlatform.map((platform) => {
                  const style = PLATFORM_STYLES[platform.platform] || PLATFORM_STYLES.instagram;
                  return (
                    <div key={platform.platform} className="grid grid-cols-[66px_1fr_44px] items-center gap-3">
                      <span className={`text-sm ${style.accentText}`}>{platform.label}</span>
                      <div className={`h-2.5 overflow-hidden rounded-full ${style.track}`}>
                        <div
                          className={`h-full rounded-full ${style.fill}`}
                          style={{ width: `${Math.max(platform.percent, platform.value > 0 ? 8 : 0)}%` }}
                        ></div>
                      </div>
                      <span className="text-right text-sm text-[#3d3a35]">{platform.percent}%</span>
                    </div>
                  );
                })}
                {!loading && !reachByPlatform.length ? (
                  <p className="text-sm text-[#8d867d]">Connect platforms to compare reach here.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e4dfd7] bg-white px-5 py-5 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-medium text-[#3d3a35]">Engagement split</h3>
              </div>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: engagementBreakdown.gradient }}>
                  <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-[11px] text-[#8d867d]">Total</span>
                    <span className="text-lg font-semibold text-[#2f2b26]">{formatNumber(engagementBreakdown.total)}</span>
                  </div>
                </div>
                <div className="w-full space-y-3 sm:max-w-[240px]">
                  {engagementBreakdown.segments.map((segment) => (
                    <div key={segment.label} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }}></span>
                        <span className="text-sm text-[#46413a]">{segment.label}</span>
                      </div>
                      <span className="text-sm text-[#46413a]">{segment.percent}%</span>
                    </div>
                  ))}
                  {!loading && !engagementBreakdown.segments.length ? (
                    <p className="text-sm text-[#8d867d]">Recent engagement will appear when platforms are connected.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
      {selectedPlatform ? (
        <section className="mb-xl">
          <div className="space-y-lg">
            <>
              <section className={`rounded-[24px] border ${selectedStyle.accentBorder} bg-white p-5 shadow-sm`}>
                <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedStyle.accentSoft} ${selectedStyle.accentText}`}>
                        {selectedPlatform.label}
                      </span>
                      <span className="text-sm text-[#615b54]">{selectedPlatform.account_name}</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-[#2b2823]">{selectedPlatform.label} analytics</h3>
                    {selectedPlatform.page_link ? (
                      <a
                        href={selectedPlatform.page_link}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-medium ${selectedStyle.accentBorder} ${selectedStyle.accentText} ${selectedStyle.accentSoft}`}
                      >
                        Open page
                      </a>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 xl:min-w-[420px]">
                    {metricCards.map((card) => (
                      <div key={card.key} className="rounded-[20px] border border-[#efe8df] bg-[#fbfaf7] px-4 py-4">
                        <p className="text-sm text-[#666059]">{card.label}</p>
                        <p className="mt-1 text-[34px] font-semibold leading-none text-[#24211d]">{card.value}</p>
                        <p className="mt-2 text-xs text-[#1f9d78]">{card.change}</p>
                        <p className="mt-1 text-[11px] text-[#8d867d]">{card.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedPlatform.warnings || []).map((warning) => (
                  <div
                    key={warning}
                    className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    {warning}
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 gap-lg xl:grid-cols-[1.25fr_0.95fr]">
                <div className="rounded-[24px] border border-[#e4dfd7] bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-[#3d3a35]">Weekly trend</h3>
                    </div>
                    <div className="text-right text-sm text-[#6c665f]">
                      <p>{selectedPlatform.label}</p>
                      <p>{formatNumber(trendData.reduce((sum, item) => sum + item.posts, 0))} posts</p>
                    </div>
                  </div>

                  <div className="rounded-[20px] bg-[#fbfaf7] p-4">
                    <div className="mb-3 flex flex-wrap gap-4">
                      {TREND_SERIES.map((series) => (
                        <div key={series.key} className="flex items-center gap-2 text-xs text-[#5d5750]">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }}></span>
                          <span>{series.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <svg width={chartWidth} height={chartHeight} className="min-w-full">
                        {[0, 1, 2, 3].map((line) => (
                          <line
                            key={line}
                            x1={chartPadding}
                            y1={chartPadding + line * ((chartHeight - chartPadding * 2) / 3)}
                            x2={chartWidth - chartPadding}
                            y2={chartPadding + line * ((chartHeight - chartPadding * 2) / 3)}
                            stroke="#e9e3dc"
                            strokeDasharray="4 4"
                          />
                        ))}
                        <path d={activityPath} fill="none" stroke="#5b53c5" strokeWidth="3" strokeLinecap="round" />
                        <path d={engagementPath} fill="none" stroke="#19a38c" strokeWidth="3" strokeLinecap="round" />
                        <path d={likesPath} fill="none" stroke="#f2a126" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-[#736c64]">
                      {trendData.map((day) => (
                        <span key={day.date}>{day.label}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#e4dfd7] bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-lg font-medium text-[#3d3a35]">
                      Posting cadence ({selectedPlatform.label})
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="grid min-w-[320px] grid-cols-[40px_repeat(7,1fr)] gap-2">
                      <div></div>
                      {DAY_LABELS.map((day) => (
                        <div key={day} className="text-center text-xs text-[#746d66]">{day}</div>
                      ))}

                      {HEATMAP_SLOTS.map((slot, rowIndex) => (
                        <div key={slot.label} className="contents">
                          <div className="self-center text-xs text-[#746d66]">{slot.label}</div>
                          {heatmap.matrix[rowIndex].map((value, columnIndex) => {
                            const intensity = value > 0 ? Math.max(0.15, value / heatmap.maxValue) : 0;
                            return (
                              <div
                                key={`${slot.label}-${columnIndex}`}
                                className="h-7 rounded-md border border-white"
                                style={{
                                  backgroundColor: `rgba(91, 83, 197, ${intensity})`,
                                }}
                              ></div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[#8d867d]">
                    <span>Low activity</span>
                    <div className="flex gap-1">
                      {[0.2, 0.4, 0.6, 0.8].map((opacity) => (
                        <span
                          key={opacity}
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: `rgba(91, 83, 197, ${opacity})` }}
                        ></span>
                      ))}
                    </div>
                    <span>High activity</span>
                  </div>

                  <p className="mt-4 text-sm text-[#5e5850]">
                    Best slots:
                    <span className="ml-1 text-[#2e2a25]">
                      {heatmap.summary.length ? heatmap.summary.join(', ') : 'Not enough recent timestamps yet'}
                    </span>
                  </p>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-lg xl:grid-cols-[1fr_1fr]">
                <div className="rounded-[24px] border border-[#e4dfd7] bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-lg font-medium text-[#3d3a35]">Recent activity</h3>
                  </div>
                  <div className="space-y-4">
                    {recentActivity.length ? recentActivity.map((item) => (
                      <div key={item.id} className="grid grid-cols-[14px_1fr] gap-3">
                        <div className="flex justify-center pt-1">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedStyle.accent }}></span>
                        </div>
                        <div className="rounded-[18px] border border-[#eee7de] bg-[#fbfaf7] px-4 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-[#2d2924] line-clamp-2">{item.title}</p>
                              <p className="text-xs text-[#7f786f]">{item.subtitle}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="rounded-xl bg-white px-2 py-2">
                                <p className="text-[#8d867d]">Likes</p>
                                <p className="mt-1 font-medium text-[#2f2b26]">{formatNumber(item.likes)}</p>
                              </div>
                              <div className="rounded-xl bg-white px-2 py-2">
                                <p className="text-[#8d867d]">Comments</p>
                                <p className="mt-1 font-medium text-[#2f2b26]">{formatNumber(item.comments)}</p>
                              </div>
                              <div className="rounded-xl bg-white px-2 py-2">
                                <p className="text-[#8d867d]">Eng.</p>
                                <p className="mt-1 font-medium text-[#2f2b26]">{formatNumber(item.engagement)}</p>
                              </div>
                            </div>
                          </div>
                          {item.permalink ? (
                            <a
                              href={item.permalink}
                              target="_blank"
                              rel="noreferrer"
                              className={`mt-3 inline-block text-xs font-medium ${selectedStyle.accentText}`}
                            >
                              View post
                            </a>
                          ) : null}
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-[18px] border border-dashed border-[#ddd7cf] bg-[#fbfaf7] px-4 py-8 text-center text-sm text-[#8d867d]">
                        Recent activity will appear here when this platform has fetched posts/media.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#e4dfd7] bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-lg font-medium text-[#3d3a35]">Meta permissions used</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[18px] border border-[#eee7de] bg-[#fbfaf7] px-4 py-4">
                      <p className="text-sm font-medium text-[#2d2924]">Connection</p>
                      <p className="mt-1 text-sm text-[#6b655d]">{selectedStyle.permissionCaption}</p>
                    </div>
                    <div className="rounded-[18px] border border-[#eee7de] bg-[#fbfaf7] px-4 py-4">
                      <p className="text-sm font-medium text-[#2d2924]">Metrics shown</p>
                      <p className="mt-1 text-sm text-[#6b655d]">
                        Audience, likes, comments, engagement, recent content, and platform warnings.
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[#eee7de] bg-[#fbfaf7] px-4 py-4">
                      <p className="text-sm font-medium text-[#2d2924]">Status</p>
                      <p className="mt-1 text-sm text-[#6b655d]">
                        {selectedPlatform.warnings?.length ? selectedPlatform.warnings[0] : 'No platform warnings'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          </div>
        </section>
      ) : null}

      {platformErrors.length ? (
        <section className="space-y-3">
          {platformErrors.map((platformError) => (
            <div
              key={`${platformError.platform}-${platformError.message}`}
              className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {platformError.platform}: {platformError.message}
            </div>
          ))}
        </section>
      ) : null}
    </ClientLayout>
  );
}
