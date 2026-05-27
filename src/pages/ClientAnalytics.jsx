import { useEffect, useState } from 'react';
import ClientLayout from '../components/ClientLayout';
import { getClientAnalytics } from '../services/analyticsService';

const PLATFORM_STYLES = {
  instagram: {
    label: 'Instagram',
    accent: 'from-pink-500 via-orange-400 to-yellow-400',
    chip: 'bg-pink-50 text-pink-700',
  },
  facebook: {
    label: 'Facebook',
    accent: 'from-blue-600 to-blue-400',
    chip: 'bg-blue-50 text-blue-700',
  },
};

function formatNumber(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat('en', {
    notation: numericValue >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(numericValue);
}

function getClientId() {
  try {
    const user = JSON.parse(window.localStorage.getItem('user') || '{}');
    return user?.client_id || null;
  } catch {
    return null;
  }
}

function buildOverviewCards(overview) {
  return [
    {
      label: 'Total Audience',
      value: formatNumber(overview.total_audience),
      caption: 'Across connected platforms',
    },
    {
      label: 'Recent Engagement',
      value: formatNumber(overview.recent_engagement_total),
      caption: 'Instagram likes + comments',
    },
    {
      label: 'Published Posts',
      value: formatNumber(overview.published_posts),
      caption: `${formatNumber(overview.scheduled_posts)} scheduled`,
    },
    {
      label: 'Connected Platforms',
      value: formatNumber(overview.connected_platforms),
      caption: `${formatNumber(overview.draft_posts)} drafts in app`,
    },
  ];
}

export default function ClientAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  const peakWeeklyCount = Math.max(...weeklyPosts.map((item) => item.count), 1);
  const overviewCards = buildOverviewCards(overview);

  return (
    <ClientLayout>
      <section className="mb-xl px-xs">
        <h2 className="font-headline-xl text-headline-xl text-on-surface">Analytics</h2>
        <p className="font-body-md text-on-surface-variant">
          Live account metrics from your connected Instagram and Facebook profiles.
        </p>
      </section>

      {error ? (
        <section className="mb-xl rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

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
              {loading ? '...' : card.value}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-2">{card.caption}</p>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container mb-xl">
        <div className="flex justify-between items-center mb-lg">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Weekly Publishing Activity</h3>
            <p className="text-sm text-on-surface-variant">Posts created in your app over the last 7 days.</p>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant">
            {loading ? 'Syncing...' : `${weeklyPosts.reduce((sum, item) => sum + item.count, 0)} posts`}
          </span>
        </div>

        <div className="flex items-end justify-between h-44 gap-xs pb-sm overflow-x-auto no-scrollbar">
          {(loading ? Array.from({ length: 7 }) : weeklyPosts).map((bar, index) => {
            const count = bar?.count ?? 0;
            const height = loading ? 24 + (index % 4) * 18 : Math.max(18, Math.round((count / peakWeeklyCount) * 140));
            return (
              <div key={bar?.date ?? index} className="flex flex-col items-center gap-2 flex-1 min-w-[36px]">
                <div
                  className="w-full rounded-t-md bg-primary/85 transition-all"
                  style={{ height: `${height}px` }}
                ></div>
                <span className="text-[10px] font-label-bold text-on-surface-variant">
                  {bar?.label ?? ''}
                </span>
                {!loading ? (
                  <span className="text-[10px] text-on-surface-variant">{count}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-lg mb-xl">
        {platformErrors.map((platformError) => (
          <div
            key={`${platformError.platform}-${platformError.message}`}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {platformError.platform}: {platformError.message}
          </div>
        ))}

        {platforms.map((platform) => {
          const style = PLATFORM_STYLES[platform.platform] || PLATFORM_STYLES.facebook;
          const metrics = platform.metrics || {};
          const recentMedia = platform.recent_media || [];
          const warnings = platform.warnings || [];

          return (
            <div
              key={platform.platform}
              className="bg-surface-container-lowest rounded-3xl border border-surface-container shadow-sm overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${style.accent}`}></div>
              <div className="p-lg">
                <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between mb-lg">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${style.chip}`}>
                        {style.label}
                      </span>
                      <span className="text-sm text-on-surface-variant">{platform.account_name}</span>
                    </div>
                    {platform.page_link ? (
                      <a
                        href={platform.page_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open page
                      </a>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
                    {'followers_count' in metrics ? (
                      <div className="rounded-2xl border border-surface-container bg-white px-4 py-3">
                        <p className="text-[10px] font-label-bold uppercase text-on-surface-variant mb-1">Followers</p>
                        <p className="text-lg font-semibold text-on-surface">{formatNumber(metrics.followers_count)}</p>
                      </div>
                    ) : null}
                    {'fan_count' in metrics ? (
                      <div className="rounded-2xl border border-surface-container bg-white px-4 py-3">
                        <p className="text-[10px] font-label-bold uppercase text-on-surface-variant mb-1">Page Likes</p>
                        <p className="text-lg font-semibold text-on-surface">{formatNumber(metrics.fan_count)}</p>
                      </div>
                    ) : null}
                    {'media_count' in metrics ? (
                      <div className="rounded-2xl border border-surface-container bg-white px-4 py-3">
                        <p className="text-[10px] font-label-bold uppercase text-on-surface-variant mb-1">Media</p>
                        <p className="text-lg font-semibold text-on-surface">{formatNumber(metrics.media_count)}</p>
                      </div>
                    ) : null}
                    {'recent_likes' in metrics ? (
                      <div className="rounded-2xl border border-surface-container bg-white px-4 py-3">
                        <p className="text-[10px] font-label-bold uppercase text-on-surface-variant mb-1">Recent Likes</p>
                        <p className="text-lg font-semibold text-on-surface">{formatNumber(metrics.recent_likes)}</p>
                      </div>
                    ) : null}
                    {'recent_comments' in metrics ? (
                      <div className="rounded-2xl border border-surface-container bg-white px-4 py-3">
                        <p className="text-[10px] font-label-bold uppercase text-on-surface-variant mb-1">Recent Comments</p>
                        <p className="text-lg font-semibold text-on-surface">{formatNumber(metrics.recent_comments)}</p>
                      </div>
                    ) : null}
                    {'recent_engagement_total' in metrics ? (
                      <div className="rounded-2xl border border-surface-container bg-white px-4 py-3">
                        <p className="text-[10px] font-label-bold uppercase text-on-surface-variant mb-1">Recent Engagement</p>
                        <p className="text-lg font-semibold text-on-surface">{formatNumber(metrics.recent_engagement_total)}</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {warnings.map((warning) => (
                  <div
                    key={`${platform.platform}-${warning}`}
                    className="mb-md rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    {warning}
                  </div>
                ))}

                {recentMedia.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-md">
                      <h4 className="font-semibold text-on-surface">
                        {platform.platform === 'facebook' ? 'Recent Facebook Content' : 'Recent Instagram Content'}
                      </h4>
                      <span className="text-xs text-on-surface-variant">
                        {recentMedia.length} items
                      </span>
                    </div>
                    <div className="grid gap-sm md:grid-cols-2 xl:grid-cols-3">
                      {recentMedia.slice(0, 6).map((media) => (
                        <div
                          key={media.id}
                          className="rounded-2xl border border-surface-container bg-white px-4 py-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase text-on-surface-variant">
                              {media.media_type || 'MEDIA'}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                              {media.timestamp ? new Date(media.timestamp).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface line-clamp-3 min-h-[60px]">
                            {media.caption || 'No caption'}
                          </p>
                          <div className="flex gap-3 mt-4 text-sm text-on-surface-variant">
                            <span>Likes: {formatNumber(media.like_count)}</span>
                            <span>Comments: {formatNumber(media.comments_count)}</span>
                          </div>
                          {media.permalink ? (
                            <a
                              href={media.permalink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex mt-4 text-sm font-semibold text-primary hover:underline"
                            >
                              View post
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {!loading && platforms.length === 0 ? (
          <div className="rounded-3xl border border-surface-container bg-surface-container-lowest px-5 py-8 text-center text-on-surface-variant">
            Connect Instagram or Facebook in Settings to start seeing live analytics here.
          </div>
        ) : null}
      </section>
    </ClientLayout>
  );
}
