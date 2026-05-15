import SMHLayout from '../components/SMHLayout';

export default function SMHContentQueue() {
  return (
    <SMHLayout>
      <main className="p-xl flex flex-col lg:flex-row gap-xl">
        {/* Left Side: Content Queue & Main Feed */}
        <div className="flex-1 space-y-xl">
          {/* Page Title & Primary Actions */}
          <div className="flex justify-between items-end">
            <div className="space-y-xs">
              <h1 className="font-headline-xl text-headline-xl text-primary">Content Queue</h1>
              <p className="text-on-surface-variant font-body-md">Manage and schedule your social media presence across all platforms.</p>
            </div>
            <button className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-bold text-label-bold flex items-center gap-sm hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">add</span>
              + Create Post
            </button>
          </div>

          {/* Filters & Views */}
          <section className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex items-center justify-between gap-md">
            <div className="flex items-center gap-md">
              <div className="flex items-center gap-xs">
                <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-[10px]">Platforms</span>
                <div className="flex -space-x-1">
                  {[
                    { name: 'Instagram', icon: 'photo_camera' },
                    { name: 'Facebook', icon: 'thumb_up' },
                    { name: 'LinkedIn', icon: 'work', active: true },
                    { name: 'Twitter', icon: 'flutter_dash' },
                  ].map((p, i) => (
                    <button key={i} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-surface-container-lowest transition-colors ${p.active ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container'}`} title={p.name}>
                      <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-px h-8 bg-outline-variant mx-sm"></div>
              <select className="bg-transparent border-none font-body-md text-on-surface focus:ring-0 cursor-pointer">
                <option>All Statuses</option>
                <option>Scheduled</option>
                <option>Published</option>
                <option>Failed</option>
                <option>Draft</option>
              </select>
            </div>
            <div className="flex bg-surface-container-high p-xs rounded-lg">
              <button className="px-md py-xs rounded-md bg-surface-container-lowest text-primary font-label-bold text-label-bold shadow-sm">List</button>
              <button className="px-md py-xs rounded-md text-on-surface-variant font-label-bold text-label-bold hover:bg-surface-container transition-colors">Calendar</button>
            </div>
          </section>

          {/* Content Feed */}
          <div className="space-y-md">
            {[
              {
                client: 'Lumina Tech Solutions',
                status: 'SCHEDULED',
                content: "Excited to announce our new partnership with Global Innovations! 🚀 Stay tuned for what's coming next in the world of decentralized architecture... #TechPartnership #Innovation",
                date: 'Oct 24, 2023',
                time: '10:30 AM',
                platforms: ['work', 'flutter_dash'],
                img: 'https://lh3.googleusercontent.com/aida/ADBb0ujKwsanRkXbzZCQusaDz-_CSHISAe6etTFauis1hwR7LCfLX2w7FhlibgvuvJJD1YdbOEw06R_jz673DTK3i2mI1EmFKQtLcx3eIZRUN1To9apWENwOYyjOfm9PDG6x9yT2MwwRr_BW4rl8ILysYNoCbIo1_JiJV3QNItoX0-c8n8V_VBikY904NU-ZLWSAT_mZXVB-0YhIFngMIKZJCBNkaeY5EIepGlzWq7TkYpGDQNXUneW38oVKFC5mMgWRzH_lg7p0bRriG8s'
              },
              {
                client: 'GreenPulse Agency',
                status: 'PUBLISHED',
                content: 'Monday morning essentials. How do you start your week for maximum focus? ☕️🌿 #MondayMotivation #WorkLifeBalance',
                date: 'Oct 23, 2023',
                time: '09:00 AM',
                platforms: ['photo_camera'],
                img: 'https://lh3.googleusercontent.com/aida/ADBb0ugqfWogcGLE4ojN81MmozfsXsQdbJEltA9F6c0fQnKtQ0IVSCdECvH93geqtGoZQdvHRSRXS3vVaauBPaTKnGGOMfvx6hR8-SbaDWxXKk8aoLMzFR-QQIhq-sc-PZf6bxOqMiTB0lNKASZFJqGjVKgWcz5pfrS_2cvtQs9KNljNnApETKpM7Xvit5DHIutTvro1BOrdVo9ldEn3jOgMn92J2wqn_YYlL54tkdRLOmQ2PcNuwpnCDQhMSzIk8a4FQHE0NtM-ZiyHvzE',
                reached: '4.2k'
              },
              {
                client: 'Creative Flux Co.',
                status: 'FAILED',
                content: 'Behind the scenes of our latest brainstorm session. Great ideas are brewing! 🧠✨ #Teamwork #CreativeProcess',
                date: 'Oct 22, 2023',
                time: '02:00 PM',
                platforms: ['thumb_up'],
                img: 'https://lh3.googleusercontent.com/aida/ADBb0ujLIo2tXXOSmsvcPByJg4RmDdJCtaUS19xFpDcM1D4WOF_6fK-e8zAAdFwr5OQa3PBM9aItSY9ZihrjEaTVHYf6H1H9Fw22UqTZvTIrpo5BWGiwuoPg_y0G7bxp5CXAEwCy9k9_0exfDPZUOtFuBVcyB4awS2IaSxQYNwMJUVuP58AGaCGvewf0GhQ2ejmDOAZQi8JXHln78s3kRuLLi14nKKbRPC6qvyf_IIlE131rW_KrgQjdSi1bDxOGYTKHG12YjfTreIisozA',
                error: 'API Authentication Error'
              },
            ].map((post, idx) => (
              <article key={idx} className={`bg-surface-container-lowest p-lg rounded-xl border ${post.status === 'FAILED' ? 'border-error/20 hover:border-error/40' : 'border-outline-variant hover:border-primary/20'} shadow-sm flex gap-lg group transition-all ${post.status === 'PUBLISHED' ? 'opacity-80' : ''}`}>
                <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative">
                  <img alt="Post Thumbnail" className={`w-full h-full object-cover ${post.status === 'FAILED' ? 'grayscale opacity-50' : ''}`} src={post.img} />
                  {post.status === 'FAILED' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-error text-[32px]">error</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-sm mb-xs">
                        <span className="font-label-bold text-label-bold text-on-surface-variant">{post.client}</span>
                        <span className="text-outline-variant text-[10px]">•</span>
                        <span className={`${post.status === 'SCHEDULED' ? 'text-primary-container bg-primary-fixed-dim/20' : post.status === 'PUBLISHED' ? 'text-on-secondary-container bg-secondary-container' : 'text-on-error-container bg-error-container'} px-sm py-[2px] rounded-full font-label-bold text-label-bold text-[10px] flex items-center gap-xs`}>
                          <span className={`w-2 h-2 rounded-full ${post.status === 'SCHEDULED' ? 'bg-primary-container' : post.status === 'PUBLISHED' ? 'bg-secondary' : 'bg-error'}`}></span>
                          {post.status}
                        </span>
                      </div>
                      <p className="font-body-md text-on-surface line-clamp-2">{post.content}</p>
                    </div>
                    <div className="flex gap-xs">
                      {post.platforms.map((plat, i) => (
                        <div key={i} className="p-xs bg-surface-container-high rounded"><span className="material-symbols-outlined text-[18px]">{plat}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-md">
                    <div className="flex items-center gap-xl">
                      <div className="flex items-center gap-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <span className="text-body-md">{post.date}</span>
                      </div>
                      <div className="flex items-center gap-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        <span className="text-body-md">{post.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      {post.error && (
                        <div className="flex items-center gap-xs text-error mr-md">
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                          <span className="text-body-md font-label-bold">{post.error}</span>
                        </div>
                      )}
                      {post.reached && <span className="text-on-surface-variant font-label-bold text-label-bold mr-md">Reached {post.reached} people</span>}
                      <div className="flex gap-xs mr-md">
                        <button className="p-sm text-on-surface-variant hover:bg-surface-container hover:text-primary rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                        <button className="p-sm text-on-surface-variant hover:bg-error-container hover:text-error rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                      </div>
                      {post.status === 'SCHEDULED' && <button className="px-md py-sm border border-primary text-primary font-label-bold text-label-bold rounded-lg hover:bg-primary hover:text-on-primary transition-colors">Publish now</button>}
                      {post.status === 'PUBLISHED' && <button className="px-md py-sm text-on-surface-variant font-label-bold text-label-bold rounded-lg hover:bg-surface-container transition-colors">View Analytics</button>}
                      {post.status === 'FAILED' && <button className="px-md py-sm bg-error text-on-error font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-opacity">Retry Post</button>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-[320px] space-y-xl">
          <section className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
            <h2 className="font-headline-md text-headline-md text-primary mb-lg">October 2023</h2>
            <div className="grid grid-cols-7 gap-y-md text-center text-on-surface">
              {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] font-label-bold text-on-surface-variant uppercase">{d}</div>)}
              {Array.from({length: 28}, (_, i) => (
                <div key={i} className={`h-8 flex items-center justify-center font-body-md relative ${i + 1 === 23 ? 'bg-primary text-on-primary rounded-full' : ''}`}>
                  {i + 1}
                  {[5, 13, 24].includes(i+1) && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></span>}
                  {[9].includes(i+1) && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-secondary"></span>}
                  {[18].includes(i+1) && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-error"></span>}
                </div>
              ))}
            </div>
            <div className="mt-lg pt-lg border-t border-outline-variant grid grid-cols-2 gap-sm">
              {['Scheduled','Published','Failed','Draft'].map((s, i) => (
                <div key={i} className="flex items-center gap-xs">
                  <span className={`w-2 h-2 rounded-full ${i===0?'bg-primary':i===1?'bg-secondary':i===2?'bg-error':'bg-outline-variant'}`}></span>
                  <span className="text-[10px] font-label-bold text-on-surface uppercase">{s}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-primary p-lg rounded-xl text-on-primary space-y-md">
            <span className="material-symbols-outlined text-[32px]">tips_and_updates</span>
            <h3 className="font-headline-md text-headline-md">Optimization Hint</h3>
            <p className="text-body-md opacity-90">Based on your LinkedIn engagement data, the best time to post tomorrow is <span className="font-bold underline">2:15 PM</span>.</p>
            <button className="w-full py-md bg-white text-primary rounded-lg font-label-bold text-label-bold hover:opacity-90 transition-opacity">Apply Suggestions</button>
          </section>
        </aside>
      </main>
    </SMHLayout>
  );
}
