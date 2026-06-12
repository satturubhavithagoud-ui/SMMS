import { useState, useEffect } from 'react';
import SMHLayout from '../components/SMHLayout';
import { apiRequest } from '../services/api';

export default function SMHDashboard() {

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: 'Active clients', value: '—', growth: '', icon: 'groups' },
    { title: 'Posts published today', value: '—', growth: '', icon: 'send' },
    { title: 'Posts scheduled', value: '—', growth: '', icon: 'calendar_month' },
    { title: 'Total reach', value: '—', growth: '', icon: 'visibility' },
  ]);
  const [chartData, setChartData] = useState([70, 55, 90, 65, 80, 30, 40]);
  const [chartScheduled, setChartScheduled] = useState([60, 60, 60, 60, 60, 60, 60]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await apiRequest('/smh/dashboard/');
        const s = data.stats || {};

        setStats([
          {
            title: 'Active clients',
            value: String(s.active_clients ?? 0),
            growth: s.total_clients ? `${s.active_clients} of ${s.total_clients}` : '',
            icon: 'groups',
          },
          {
            title: 'Posts published today',
            value: String(s.posted_today ?? 0),
            growth: s.total_posts ? `${s.total_posts} total` : '',
            icon: 'send',
          },
          {
            title: 'Posts scheduled',
            value: String(s.scheduled_posts ?? 0),
            growth: s.draft_posts ? `+${s.draft_posts} drafts` : '',
            icon: 'calendar_month',
          },
          {
            title: 'Total reach',
            value: String(s.connected_accounts ?? 0),
            growth: `${(data.platform_breakdown || []).length} platforms`,
            icon: 'visibility',
          },
        ]);

        // Weekly chart
        const weekly = data.weekly_chart || [];
        if (weekly.length > 0) {
          // Coerce missing values to 0 to avoid NaN in Math operations
          const maxVal = Math.max(...weekly.map(d => Math.max(d?.published ?? 0, d?.scheduled ?? 0, d?.created ?? 0, 1)));
          const scale = 100 / (maxVal || 1);
          setChartData(weekly.map(d => Math.max((Number(d?.published ?? 0) || 0) * scale, 10)));
          setChartScheduled(weekly.map(d => Math.max((Number(d?.scheduled ?? 0) || 0) * scale, 10)));
        }

        // Alerts
        const alertItems = data.alerts || [];
        setAlerts(alertItems);

      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (

    <SMHLayout>

      {/* HEADER */}
      <div className="mb-10">

        <h1 className="text-5xl font-bold text-[#031B4E] mb-3">
          Handler Overview
        </h1>

        <p className="text-gray-500 text-lg">
          All clients and platform activity — {todayStr}
        </p>

      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

        {stats.map((item) => (

          <div
            key={item.title}
            className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm"
          >

            <div className="flex justify-between items-start mb-6">

              <div>

                <p className="text-gray-500 text-sm mb-3">
                  {item.title}
                </p>

                <h2 className="text-5xl font-bold text-[#031B4E]">
                  {loading ? '—' : item.value}
                </h2>

              </div>

              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">

                <span className="material-symbols-outlined text-[#031B4E]">
                  {item.icon}
                </span>

              </div>

            </div>

            <div className="flex items-center gap-1 text-green-600 font-semibold">

              <span className="material-symbols-outlined text-sm">
                trending_up
              </span>

              {item.growth}

            </div>

          </div>

        ))}

      </div>

      {/* CHART + ALERTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* CHART */}
        <div className="xl:col-span-2 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">

          <div className="flex justify-between items-center mb-8">

            <h2 className="text-3xl font-bold text-[#031B4E]">
              Posts published vs scheduled
            </h2>

            <div className="flex gap-5 text-sm">

              <div className="flex items-center gap-2">

                <div className="w-3 h-3 rounded-full bg-[#031B4E]"></div>

                Published

              </div>

              <div className="flex items-center gap-2">

                <div className="w-3 h-3 rounded-full bg-[#BFC9EA]"></div>

                Scheduled

              </div>

            </div>

          </div>

          {/* GRAPH */}
          <div className="flex items-end gap-3 h-[320px]">

            {chartData.map((value, index) => (

              <div
                key={index}
                className="flex-1 flex flex-col justify-end"
              >

                <div
                  className="bg-[#BFC9EA] rounded-t-xl"
                  style={{
                    height: `${(chartScheduled[index] || 60) + 60}px`
                  }}
                ></div>

                <div
                  className="bg-[#031B4E]"
                  style={{
                    height: `${value}px`
                  }}
                ></div>

              </div>

            ))}

          </div>

        </div>

        {/* ALERTS */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">

          <h2 className="text-3xl font-bold text-[#031B4E] mb-8">
            Alerts & Notifications
          </h2>

          <div className="space-y-5">

            {loading ? (
              <p className="text-gray-400 text-sm">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <div className="bg-green-50 border-l-4 border-green-400 rounded-2xl p-5">
                <h3 className="font-bold text-green-700 mb-2">
                  All Clear
                </h3>
                <p className="text-green-600 text-sm">
                  No alerts or warnings at this time.
                </p>
              </div>
            ) : (
              alerts.map((alert, idx) => {
                const colorMap = {
                  warning: { bg: 'bg-orange-50', border: 'border-orange-400', title: 'text-orange-700', msg: 'text-orange-600' },
                  critical: { bg: 'bg-red-50', border: 'border-red-400', title: 'text-red-700', msg: 'text-red-600' },
                  info: { bg: 'bg-blue-50', border: 'border-blue-500', title: 'text-blue-700', msg: 'text-blue-600' },
                };
                const style = colorMap[alert.severity] || colorMap.info;
                return (
                  <div key={`${alert.type}-${idx}`} className={`${style.bg} border-l-4 ${style.border} rounded-2xl p-5`}>
                    <h3 className={`font-bold ${style.title} mb-2`}>
                      {alert.title}
                    </h3>
                    <p className={`${style.msg} text-sm`}>
                      {alert.message}
                    </p>
                  </div>
                );
              })
            )}

          </div>

        </div>

      </div>

    </SMHLayout>

  );

}