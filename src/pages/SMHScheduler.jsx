import SMHLayout from '../components/SMHLayout';

export default function SMHScheduler() {
  return (
    <SMHLayout>
      <main className="p-xl max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex items-end justify-between mb-xl">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface mb-2">Scheduler</h2>
            <p className="text-on-surface-variant font-body-md">Manage your cross-platform content timeline and campaign distribution.</p>
          </div>
          <div className="flex gap-md items-center">
            <div className="bg-surface-container-high rounded-lg p-1 flex">
              <button className="px-md py-sm bg-white shadow-sm rounded text-sm font-label-bold text-primary">List View</button>
              <button className="px-md py-sm text-sm font-label-bold text-on-surface-variant hover:text-primary transition-colors">Calendar</button>
            </div>
            <button className="bg-primary text-white font-label-bold px-lg py-sm rounded-lg flex items-center gap-2 hover:bg-primary-container transition-all">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Post
            </button>
          </div>
        </div>

        {/* Dashboard Content Layout */}
        <div className="space-y-xl">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-surface-container-highest">
            <div className="px-lg py-md border-b border-surface-container-highest flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">Recent & Scheduled Posts</h3>
              <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">12 Pending</span>
            </div>
            
            {/* Posts List */}
            <div className="divide-y divide-surface-container">
              {[
                {
                  platform: 'facebook',
                  icon: 'social_leaderboard',
                  platColor: 'bg-[#1877F2]',
                  date: 'Oct 24, 2023 • 09:15 AM',
                  status: 'SCHEDULED',
                  statusColor: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
                  dot: 'bg-orange-400',
                  title: 'Unlocking Creative Potential: Our New Agency Framework',
                  desc: 'We are excited to announce our newest initiative for Q4 content strategy...',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfI79OC8Wjlbbsu4cJJ-2YO98O4u3SpR5kdu-6slYDzC05EIz8Pf2-HFSGk3QMfyJ_8gZwP6TJL7e3YFHQKeAyVEG-CQI0fiUirX0bB4W9X-K4K9sQ_MROL_Lg8aIdo2MPZ055I5x3z-UCTCgxBOZjHgTHyzOT12JSH91W3UaY_vn-XtARnZUfAsW7cS7NB-FkwIfN_5ONsVsjp0KEacP54y30Yex9a9b9MVkKJzWr5AEkcV7SEKkydz8IZMJeMSX65JmlE1MB1C8a'
                },
                {
                  platform: 'instagram',
                  icon: 'photo_camera',
                  platColor: 'bg-pink-600',
                  date: 'Oct 23, 2023 • 05:30 PM',
                  status: 'POSTED',
                  statusColor: 'bg-primary-fixed text-on-primary-fixed',
                  dot: 'bg-emerald-500',
                  title: 'The Secret to Viral Instagram Reels in 2024',
                  desc: 'Watch our latest breakdown of the algorithm changes happening this week...',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM9QcAwR31KoXtBhJs7qHN1JdeXNgLJWdf5F9WehVc1ts5-5VcW_Ui-swMD5YxVk8xHbNwMTvjOj8mPDk4sQa5qk5bWXA8FVDFHew5SiUoMrir5chZocsLP8yGBD_BRMeeRIPe3vmnoD8KAbINBEr25g8kHl6MTGakuPx7SDrIayJ7dXCjmTvbvzE4OBU5helfqwDI1KNl6-bilKDVVHbK_KyTwZtKcBoY-HE9PWdGDnpokwl4tPPSvsc07Fh5N42b15oZZ_Ioaq4n'
                },
                {
                  platform: 'linkedin',
                  icon: 'group',
                  platColor: 'bg-[#0077B5]',
                  date: 'Oct 25, 2023 • 10:00 AM',
                  status: 'SCHEDULED',
                  statusColor: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
                  dot: 'bg-orange-400',
                  title: 'Building Trust in the Digital Era: A B2B Perspective',
                  desc: 'Our CEO shares insights on professional networking and brand authority on LinkedIn...',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvv4SWxsey-qTnQ7gXvIBG7GOEDrVljjG6VDNtiof8FL_nQPNHEpM5eGtlY_Y_XMtws7MBdJ8-lymqbJKYS7Ik1tv51ORaGt_OTQoIp3kVjRo7YKHL5Oy92KtbE9nBdtc787ng1DhUv5lmKso_qjhTIn-TMh2Y1SfXNV5KBsqfMNfUps-bRda1L_lrR1_CjS3aZqDFl6n4sJi38FIQANRaxjjgmCv72tPBspGRhG3swPbQ58gZAIx6R4LEmUsdIRawfVQbgQ6eWJAY'
                },
              ].map((post, idx) => (
                <div key={idx} className="p-lg hover:bg-surface-container-low transition-colors group flex items-start gap-md">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative">
                    <img alt="Preview" className="w-full h-full object-cover" src={post.img} />
                    <div className={`absolute bottom-1 right-1 ${post.platColor} p-0.5 rounded shadow`}>
                      <span className="material-symbols-outlined text-white text-[12px]">{post.icon}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{post.date}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <span className={`${post.statusColor} px-2 py-0.5 rounded-full font-label-bold text-[10px]`}>{post.status}</span>
                        <div className={`w-2 h-2 ${post.dot} rounded-full`}></div>
                      </div>
                    </div>
                    <h4 className="font-label-bold text-on-surface truncate">{post.title}</h4>
                    <p className="text-body-md text-on-surface-variant truncate">{post.desc}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-surface-container-high rounded-full">
                    <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-surface-container-low p-md flex justify-center">
              <button className="text-primary font-label-bold flex items-center gap-2 hover:underline">
                View Full Content Calendar
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-surface-container-highest p-lg">
            <h4 className="font-headline-md text-headline-md text-on-surface mb-md">Campaign Distribution</h4>
            <div className="space-y-md">
              {[
                { name: 'Instagram', val: 45, color: '#ee2a7b' },
                { name: 'Facebook', val: 30, color: '#1877F2' },
                { name: 'LinkedIn', val: 25, color: '#0077B5' },
              ].map((plat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase">
                    <span>{plat.name}</span>
                    <span>{plat.val}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${plat.val}%`, backgroundColor: plat.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </SMHLayout>
  );
}
