import { useState, useEffect } from 'react';
import ClientLayout from '../components/ClientLayout';
import { apiRequest } from '../services/api';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('Client');
  const [metrics, setMetrics] = useState({
    publishedPosts: 0,
    totalAudience: 0,
    recentEngagement: 0,
  });
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const clientId = user?.client_id;
        const query = clientId ? `?client_id=${clientId}` : '';

        const [profileData, analyticsData, connectedData] = await Promise.all([
          apiRequest(`/client-profile/${query}`),
          apiRequest(`/client-analytics/${query}`),
          apiRequest(`/connected-platforms/${query}`),
        ]);

        if (profileData && profileData.full_name) {
          setClientName(profileData.full_name);
        } else if (profileData && profileData.organization_name) {
          setClientName(profileData.organization_name);
        }

        if (analyticsData && analyticsData.overview) {
          setMetrics({
            publishedPosts: analyticsData.overview.published_posts ?? 0,
            totalAudience: analyticsData.overview.total_audience ?? 0,
            recentEngagement: analyticsData.overview.recent_engagement_total ?? 0,
          });
        }

        if (connectedData) {
          // Filter platforms that are connected
          const connected = connectedData.filter(p => p.connected);
          setPlatforms(connected);
        }
      } catch (err) {
        console.error('Error loading client dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <ClientLayout>
      <section className="mb-xl">
        <h2 className="font-headline-xl text-headline-xl text-on-background mb-xs">
          Welcome back, {clientName}
        </h2>
        <p className="font-body-md text-on-surface-variant">
          Here is your agency performance summary.
        </p>
      </section>

      {/* METRICS CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-primary mb-sm text-3xl">edit_square</span>
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">
            Published Posts
          </p>
          <p className="font-stat-lg text-stat-lg text-primary my-xs">
            {loading ? '—' : metrics.publishedPosts}
          </p>
          <p className="text-xs text-on-surface-variant/70">Total successfully posted content</p>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-success mb-sm text-3xl">groups</span>
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">
            Total Audience
          </p>
          <p className="font-stat-lg text-stat-lg text-success my-xs">
            {loading ? '—' : metrics.totalAudience.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant/70">Combined followers & fans across networks</p>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-error mb-sm text-3xl">favorite</span>
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">
            Recent Engagement
          </p>
          <p className="font-stat-lg text-stat-lg text-error my-xs">
            {loading ? '—' : metrics.recentEngagement.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant/70">Likes, reactions, and comments</p>
        </div>
      </section>

      {/* CONNECTED PLATFORMS */}
      <section className="mb-xl">
        <h3 className="font-headline-md text-headline-md text-primary mb-md">Connected Platforms</h3>
        {loading ? (
          <div className="flex gap-md">
            <div className="h-14 w-32 bg-surface-container rounded-lg animate-pulse" />
            <div className="h-14 w-32 bg-surface-container rounded-lg animate-pulse" />
          </div>
        ) : platforms.length > 0 ? (
          <div className="flex flex-wrap gap-md">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-surface-container-lowest px-lg py-md rounded-xl border border-surface-variant flex items-center gap-sm shadow-sm hover:border-primary transition-all duration-200"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                <div className="flex flex-col">
                  <span className="font-label-bold text-label-bold text-on-surface capitalize">
                    {platform.value}
                  </span>
                  {platform.account_username && (
                    <span className="text-[10px] text-on-surface-variant">
                      @{platform.account_username}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-lg bg-surface-container-lowest rounded-xl border border-dashed border-surface-variant text-center">
            <span className="material-symbols-outlined text-outline text-3xl mb-xs">link_off</span>
            <p className="text-on-surface-variant font-medium">No social media accounts connected.</p>
            <p className="text-xs text-on-surface-variant/70 mt-xs">Connect your accounts in Settings to start scheduling posts.</p>
          </div>
        )}
      </section>
    </ClientLayout>
  );
}
