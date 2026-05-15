import SMHLayout from '../components/SMHLayout';

export default function SMHAIStudio() {
  return (
    <SMHLayout>
      <main className="p-xl max-w-7xl mx-auto">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg mb-xl">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-primary">AI Caption Studio</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Generate AI-powered captions and social media creatives instantly.</p>
          </div>
          <div className="flex items-center gap-md">
            <button className="px-lg py-sm border border-primary text-primary font-bold rounded-lg hover:bg-surface-container-high transition-colors">
              Saved Projects
            </button>
            <button className="px-lg py-sm bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-sm">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Generate Content
            </button>
          </div>
        </header>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-xl items-start">
          {/* Left Column: Content Generator */}
          <section className="flex flex-col gap-lg">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="font-headline-md text-headline-md text-primary">Content Generator</h3>
              </div>
              <div className="space-y-xl">
                {/* Platform Selection */}
                <div>
                  <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">TARGET PLATFORM</label>
                  <div className="grid grid-cols-3 gap-sm">
                    {[
                      { name: 'Instagram', icon: 'photo_camera', hover: 'hover:border-[#E1306C] hover:bg-[#E1306C]/5', hoverIcon: 'group-hover:text-[#E1306C]' },
                      { name: 'Facebook', icon: 'social_leaderboard', hover: 'hover:border-[#1877F2] hover:bg-[#1877F2]/5', hoverIcon: 'group-hover:text-[#1877F2]' },
                      { name: 'Twitter/X', icon: 'close', hover: 'hover:border-[#000000] hover:bg-[#000000]/5', hoverIcon: 'group-hover:text-[#000000]' },
                      { name: 'LinkedIn', icon: 'business', hover: 'hover:border-[#0A66C2] hover:bg-[#0A66C2]/5', hoverIcon: 'group-hover:text-[#0A66C2]' },
                      { name: 'YouTube', icon: 'play_circle', hover: 'hover:border-[#FF0000] hover:bg-[#FF0000]/5', hoverIcon: 'group-hover:text-[#FF0000]' },
                      { name: 'Pinterest', icon: 'push_pin', hover: 'hover:border-[#BD081C] hover:bg-[#BD081C]/5', hoverIcon: 'group-hover:text-[#BD081C]' },
                    ].map((p, i) => (
                      <button key={i} className={`flex flex-col items-center justify-center p-sm border border-outline-variant rounded-lg transition-all group ${p.hover}`}>
                        <span className={`material-symbols-outlined text-[24px] text-on-surface-variant ${p.hoverIcon}`}>{p.icon}</span>
                        <span className="text-[10px] font-bold mt-1">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Controls */}
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">TONE OF VOICE</label>
                    <select className="w-full bg-surface-container border-outline-variant rounded-lg text-body-md focus:ring-primary">
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Witty</option>
                      <option>Promotional</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">LENGTH</label>
                    <select className="w-full bg-surface-container border-outline-variant rounded-lg text-body-md focus:ring-primary">
                      <option>Short</option>
                      <option>Medium</option>
                      <option>Long</option>
                    </select>
                  </div>
                </div>
                {/* Inputs */}
                <div>
                  <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">TARGET AUDIENCE</label>
                  <input className="w-full bg-surface-container border-outline-variant rounded-lg text-body-md focus:ring-primary" placeholder="e.g. Tech Entrepreneurs, Small Business Owners" type="text" />
                </div>
                <div>
                  <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">KEYWORDS / TOPIC</label>
                  <textarea className="w-full bg-surface-container border-outline-variant rounded-lg text-body-md focus:ring-primary" placeholder="What is this post about?" rows="3"></textarea>
                </div>
                {/* CTA */}
                <button className="w-full py-md bg-primary text-on-primary font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-md">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  Generate AI Content
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Results */}
          <section className="flex flex-col gap-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Generated Content Results</h3>
              <div className="flex items-center gap-sm">
                <span className="text-on-surface-variant text-body-md">Showing 2 variations</span>
                <button className="p-2 hover:bg-surface-container-high rounded-full"><span className="material-symbols-outlined">sort</span></button>
              </div>
            </div>

            {[
              {
                label: 'Variation A',
                score: '92% Engagement Score',
                scoreColor: 'text-emerald-600',
                dotColor: 'bg-emerald-500',
                active: true,
                content: "Transform your morning routine into a high-performance ritual. ☕️ ✨ Our new AI tools are designed to streamline your workflow so you can focus on what truly matters: creativity and growth. Ready to level up?",
                hashtags: "#Marketing #AIContent #GrowthStrategy #SocialMedia #BrandAwareness",
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY3hPZd9GMTmZUrBfRIXYCP55KYqioQFbVIPhXoggfl9D4CsV6SCNA03ZaIn28knV2gUS4kRjQMXYZECSoMTFn7ZpBenBzXH9BUDTNxjAbs7CPhOcyzMueUxVVGvxIicCgJ2GErRfEHvp80uyZbHjuD8dCTTQs92ChLPmlinLb0NJRdPkGB7bbDpdc_AE35z1J9RpIDLWtJBtf05f8YFVTp9PglBiLjS9NvJwTpPkhQUS18t64Plw-q43SXWJKFus5eTDeiCg7hHrz'
              },
              {
                label: 'Variation B',
                score: '85% Engagement Score',
                scoreColor: 'text-orange-600',
                dotColor: 'bg-orange-500',
                content: "Stop guessing and start growing. 🚀 The secret to viral social media content isn't luck—it's data-driven strategy. Our AI Caption Studio analyzes trending topics in real-time to ensure your brand stays ahead of the curve.",
                hashtags: "#DigitalStrategy #ContentMarketing #Innovation #SMH #FutureOfWork",
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcr9IFcdAyQGtJHC6WomFgIEIl8L-cglPeXRiDjjOySdlTllyJ0cn9iZRslpNEjolw8UQG8wszu8NFCIwytgo0eM4XIaodX3PMmrulUVjhLbKWB7m19wQWZUMjrM97iE4bcxQgVZ4bqd76MKcr_mYl-2aLHtEwWMZNA1YyhznX6AkeYMRNYGi3yu6MubNLkKZ2zTQzFuo-20iVud2YsekRsIJKU0REHhHVOemw8XC7h0PPbWs-k7pWPfoOH1STOLznsQBiBJnJvFjA'
              },
            ].map((v, i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
                <div className="flex flex-col md:flex-row gap-lg">
                  <div className="md:w-1/2">
                    <img alt="AI Preview" className="w-full aspect-square object-cover rounded-xl shadow-sm" src={v.img} />
                  </div>
                  <div className="md:w-1/2 flex flex-col">
                    <div className="flex justify-between items-start mb-md">
                      <span className={`px-sm py-xs ${v.active ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface-variant'} text-[11px] font-bold rounded uppercase tracking-wider`}>{v.label}</span>
                      <div className="flex items-center gap-xs">
                        <span className={`w-2 h-2 rounded-full ${v.dotColor}`}></span>
                        <span className={`font-label-bold text-label-bold ${v.scoreColor}`}>{v.score}</span>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-lg mb-md flex-grow">
                      <p className="text-body-md text-on-surface leading-relaxed">
                        {v.content}
                        <br /><br />
                        <span className="text-on-primary-container font-bold">{v.hashtags}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-sm">
                      <button className="flex items-center justify-center gap-xs py-sm border border-outline-variant rounded-lg font-bold text-sm hover:bg-surface-container-high">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span> Copy
                      </button>
                      <button className="flex items-center justify-center gap-xs py-sm border border-outline-variant rounded-lg font-bold text-sm hover:bg-surface-container-high">
                        <span className="material-symbols-outlined text-[18px]">download</span> Image
                      </button>
                      <button className="flex items-center justify-center gap-xs py-sm border border-outline-variant rounded-lg font-bold text-sm hover:bg-surface-container-high">
                        <span className="material-symbols-outlined text-[18px]">refresh</span> Re-Gen
                      </button>
                      <button className="flex items-center justify-center gap-xs py-sm bg-primary text-on-primary rounded-lg font-bold text-sm hover:opacity-90">
                        <span className="material-symbols-outlined text-[18px]">save</span> Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </SMHLayout>
  );
}
