import SMHLayout from '../components/SMHLayout';

export default function SMHAnalytics() {
  return (
    <SMHLayout>
      <div>
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-md">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Analytics</h1>
            <p className="text-on-surface-variant font-body-md">Detailed performance insights across all managed accounts.</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex bg-surface-container-high rounded-lg p-xs">
              <button className="px-md py-xs text-label-bold font-label-bold bg-surface-container-lowest text-primary rounded shadow-sm">Last 30 Days</button>
              <button className="px-md py-xs text-label-bold font-label-bold text-on-surface-variant hover:text-primary">90 Days</button>
              <button className="px-md py-xs text-label-bold font-label-bold text-on-surface-variant hover:text-primary">1 Year</button>
            </div>
            <button className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg font-label-bold text-label-bold hover:bg-primary-container transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Report
            </button>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-md mb-xl">
          {[
            { label: 'Total Engagement', value: '1.2M', trend: '+12%', isTrend: true },
            { label: 'Reach', value: '5.4M', trend: '+8%', isTrend: true },
            { label: 'Followers Growth', value: '+45K', icon: 'trending_up', isTrend: false },
            { label: 'CTR', value: '3.4%', trend: 'Avg', isTrend: false },
            { label: 'Published Posts', value: '128', icon: 'post_add', isTrend: false },
          ].map((metric, idx) => (
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

        {/* Platforms Overview */}
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-container mb-xl">
          <h3 className="font-headline-md text-headline-md text-primary mb-lg">Connected Platforms Overview</h3>
          <div className="space-y-lg py-md">
            {[
              { name: 'Instagram', value: 18, color: '#E1306C', icon: 'camera_alt', width: '75%' },
              { name: 'Facebook', value: 12, color: '#1877F2', icon: 'facebook', width: '50%' },
              { name: 'Twitter/X', value: 9, color: 'currentColor', icon: 'close', width: '37.5%' },
              { name: 'LinkedIn', value: 7, color: '#0A66C2', icon: 'work', width: '29%' },
              { name: 'YouTube', value: 5, color: '#FF0000', icon: 'play_circle', width: '21%' },
              { name: 'Pinterest', value: 3, color: '#E60023', icon: 'push_pin', width: '12.5%' },
            ].map((platform, idx) => (
              <div key={idx} className="flex items-center gap-md">
                <div className="w-32 flex items-center gap-sm">
                  <span className="material-symbols-outlined" style={{ color: platform.color, fontVariationSettings: "'FILL' 1" }}>{platform.icon}</span>
                  <span className="font-body-md text-primary font-semibold">{platform.name}</span>
                </div>
                <div className="flex-grow bg-surface-container-low h-8 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: platform.width }}></div>
                </div>
                <div className="w-12 text-right">
                  <span className="font-stat-lg text-primary text-[20px]">{platform.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Performing Content */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
          <div className="p-lg border-b border-surface-container flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-primary">Best Performing Content</h3>
            <button className="text-primary font-label-bold text-label-bold hover:underline flex items-center gap-xs">
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
                <tr className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-md">
                    <div className="flex items-center gap-md">
                      <div className="w-12 h-12 bg-surface-container rounded overflow-hidden">
                        <img alt="Post Thumbnail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0ZxQEghkShOAVVgkrpR6i1R5gQRElCg-_mq_meE33eTRYoWUaJnmNRTsw9vgNkMaT235qO2RE6KUGK_qb8vh5TJZGsiHp9S6ObPomCy7F8CysLitpgj_xjFqWhCV9wxK6-QYYQxEdbSM_DPhyiGm6t0jl9trAq1ClRBD8G96IZtX_Zfh9RFRkKfZtncoN4D_agly3uHwtVS1HWvsDbgdoAUQaqtMm1YqUviTbRPN5Ox3VwfGiFDbAU9Qgwkseg8dKNQhereYG3zug" />
                      </div>
                      <span className="font-body-md text-primary font-semibold">Q4 Strategy Reveal</span>
                    </div>
                  </td>
                  <td className="p-md">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[#0A66C2]" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                      <span className="text-body-md">LinkedIn</span>
                    </div>
                  </td>
                  <td className="p-md font-label-bold text-primary">8.4%</td>
                  <td className="p-md text-body-md">245,000</td>
                  <td className="p-md text-body-md">1,240</td>
                  <td className="p-md">
                    <span className="bg-teal-100 text-teal-800 px-sm py-xs rounded-full text-[10px] font-bold uppercase tracking-wider">Top Performing</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SMHLayout>
  );
}
