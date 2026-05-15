export default function AIStudio() {
  const tools = [
    { name: 'Caption Generator', icon: 'edit_note', desc: 'Generate engaging captions for any platform.' },
    { name: 'Image Enhancer', icon: 'auto_fix_high', desc: 'Upscale and optimize images for social feeds.' },
    { name: 'Strategy Planner', icon: 'psychology', desc: 'AI-powered content strategy based on your niche.' },
    { name: 'Hashtag Finder', icon: 'tag', desc: 'Discover trending hashtags for maximum reach.' },
  ];

  return (
    <div className="p-xl max-w-6xl mx-auto">
      <div className="mb-xl">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs">AI Studio</h1>
        <p className="text-body-md text-outline">Powerful AI tools to elevate your content creation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {tools.map(tool => (
          <div key={tool.name} className="bg-surface-container-lowest p-xl rounded-xl border border-surface-variant shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center mb-md group-hover:bg-primary group-hover:text-on-primary transition-all">
              <span className="material-symbols-outlined text-[32px]">{tool.icon}</span>
            </div>
            <h3 className="font-headline-md text-on-surface mb-xs">{tool.name}</h3>
            <p className="text-body-md text-outline mb-lg">{tool.desc}</p>
            <button className="text-primary font-label-bold flex items-center gap-xs hover:gap-md transition-all">
              Get Started <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-xl bg-primary text-on-primary p-xl rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-xl relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <span className="bg-inverse-primary text-primary px-sm py-unit rounded-full text-[10px] font-bold w-fit mb-md uppercase tracking-wider">Premium Feature</span>
          <h2 className="font-headline-xl text-headline-xl mb-md">AI Video Creator</h2>
          <p className="text-on-primary/70 text-body-lg mb-xl max-w-md">Turn your text prompts into high-quality short-form videos optimized for Reels, TikTok, and Shorts.</p>
          <button className="bg-white text-primary px-lg py-md rounded-lg font-bold hover:bg-surface-container transition-colors shadow-lg">Try Beta</button>
        </div>
        <div className="w-full md:w-1/3 flex justify-center relative z-10">
          <span className="material-symbols-outlined text-[120px] opacity-20">movie_filter</span>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  );
}
