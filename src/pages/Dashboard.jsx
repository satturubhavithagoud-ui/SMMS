import { Link } from 'react-router-dom';

export default function Dashboard() {
  const metrics = [
    { name: 'Posts this month', value: '24', trend: '+4.2%', icon: 'edit_square', iconColor: 'text-primary' },
    { name: 'Total likes', value: '12.8k', trend: '+8.1%', icon: 'favorite', iconColor: 'text-error' },
    { name: 'Total reach', value: '45.2k', trend: '-1.4%', icon: 'groups', iconColor: 'text-on-tertiary-container' },
    { name: 'Scheduled', value: '8', trend: 'Next in 2h', icon: 'calendar_today', iconColor: 'text-primary-container' },
  ];

  const platforms = [
    { name: 'Instagram', color: 'bg-teal-500' },
    { name: 'Facebook', color: 'bg-teal-500' },
    { name: 'Twitter/X', color: 'bg-teal-500' },
    { name: 'LinkedIn', color: 'bg-orange-400', muted: true },
  ];

  const posts = [
    {
      title: 'Maximize your engagement with these 5 simple tips for 2024...',
      time: 'Tomorrow, 10:00 AM',
      status: 'Scheduled',
      statusColor: 'bg-orange-100 text-orange-700',
      icon: 'photo_camera',
      iconColor: 'text-[#E4405F]',
      img: 'https://lh3.googleusercontent.com/aida/ADBb0ujKwsanRkXbzZCQusaDz-_CSHISAe6etTFauis1hwR7LCfLX2w7FhlibgvuvJJD1YdbOEw06R_jz673DTK3i2mI1EmFKQtLcx3eIZRUN1To9apWENwOYyjOfm9PDG6x9yT2MwwRr_BW4rl8ILysYNoCbIo1_JiJV3QNItoX0-c8n8V_VBikY904NU-ZLWSAT_mZXVB-0YhIFngMIKZJCBNkaeY5EIepGlzWq7TkYpGDQNXUneW38oVKFC5mMgWRzH_lg7p0bRriG8s',
    },
    {
      title: 'We just reached a major milestone! 10k followers and counting...',
      time: '2 hours ago',
      status: 'Published',
      statusColor: 'bg-teal-100 text-teal-700',
      icon: 'thumb_up',
      iconColor: 'text-[#1877F2]',
      likes: '452',
      img: 'https://lh3.googleusercontent.com/aida/ADBb0uiyDTxLulY7CukQTwM8-mLnxlzTnvYp78oUmWUPR5uaFksQWMfwL70VtiAXNX1Uzv_mxHse1c8WC7hRBMvwF-1DE3f07HnEko_0OjSmydCstYlKTwezwb7_0ylf3nmseUbLWIHIhKbIwflmxmct8nAC048wtTXy0HhXMZ9X295R9JaiDpMNeOC-Ipfi2IavvXFEKobHqNIITZC-GE7ccMNboECUFRQG4mh_l17AFzBd3UkltNJ393TSv93buaRTE5EJ6wbYTjv2ByY',
    },
    {
      title: 'New blog post: Why micro-influencers are the future of retail...',
      time: 'Yesterday',
      status: 'Published',
      statusColor: 'bg-teal-100 text-teal-700',
      icon: 'quickreply',
      iconColor: 'text-[#1DA1F2]',
      likes: '24',
      img: 'https://lh3.googleusercontent.com/aida/ADBb0ugqfWogcGLE4ojN81MmozfsXsQdbJEltA9F6c0fQnKtQ0IVSCdECvH93geqtGoZQdvHRSRXS3vVaauBPaTKnGGOMfvx6hR8-SbaDWxXKk8aoLMzFR-QQIhq-sc-PZf6bxOqMiTB0lNKASZFJqGjVKgWcz5pfrS_2cvtQs9KNljNnApETKpM7Xvit5DHIutTvro1BOrdVo9ldEn3jOgMn92J2wqn_YYlL54tkdRLOmQ2PcNuwpnCDQhMSzIk8a4FQHE0NtM-ZiyHvzE',
    },
  ];

  return (
    <div className="p-xl max-w-6xl mx-auto">
      {/* Welcome Section */}
      <section className="mb-xl">
        <h2 className="font-headline-xl text-headline-xl text-on-background mb-xs">Welcome back, Sarah</h2>
        <p className="font-body-md text-on-surface-variant">Your agency performance is up 12% this week.</p>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
        {metrics.map((m) => (
          <div key={m.name} className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50">
            <span className={`material-symbols-outlined ${m.iconColor} mb-sm`}>{m.icon}</span>
            <p className="font-label-bold text-[11px] text-on-surface-variant uppercase tracking-wider">{m.name}</p>
            <p className="font-stat-lg text-stat-lg text-primary">{m.value}</p>
            <div className={`flex items-center gap-xs mt-xs ${m.trend.startsWith('+') ? 'text-teal-600' : 'text-error'} font-bold text-xs`}>
              {m.trend.includes('%') && (
                <span className="material-symbols-outlined text-[16px]">
                  {m.trend.startsWith('+') ? 'trending_up' : 'trending_down'}
                </span>
              )}
              <span>{m.trend}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Connected Platforms */}
      <section className="mb-xl">
        <div className="flex justify-between items-center mb-md">
          <h3 className="font-headline-md text-headline-md text-primary">Connected Platforms</h3>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
            add_circle
          </span>
        </div>
        <div className="flex gap-md overflow-x-auto pb-sm no-scrollbar">
          {platforms.map((p) => (
            <div
              key={p.name}
              className={`flex-shrink-0 bg-surface-container-lowest px-lg py-md rounded-lg border border-surface-variant flex items-center gap-sm ${
                p.muted ? 'opacity-70' : ''
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${p.color}`}></div>
              <span className="font-label-bold text-label-bold text-on-surface">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent & Scheduled Posts */}
      <section>
        <div className="flex justify-between items-center mb-md">
          <h3 className="font-headline-md text-headline-md text-primary">Recent & Scheduled</h3>
          <button className="text-primary font-label-bold text-label-bold hover:underline">View all</button>
        </div>
        <div className="space-y-md">
          {posts.map((post, i) => (
            <div key={i} className="bg-surface-container-lowest p-md rounded-xl border border-surface-variant flex gap-md hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img alt="Post content" className="w-full h-full object-cover" src={post.img} />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className={`material-symbols-outlined text-[18px] ${post.iconColor}`}>
                      {post.icon}
                    </span>
                    <span className={`${post.statusColor} text-[10px] font-bold px-sm py-xs rounded uppercase tracking-wider`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-body-md font-body-md line-clamp-1 mt-xs text-on-surface">{post.title}</p>
                </div>
                <div className="flex items-center gap-md">
                  <p className="text-[11px] text-on-surface-variant font-label-bold uppercase tracking-tight">{post.time}</p>
                  {post.likes && (
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px] text-on-surface-variant">favorite</span>
                      <span className="text-[11px] text-on-surface-variant">{post.likes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAB */}
      <button className="fixed bottom-lg right-lg bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
