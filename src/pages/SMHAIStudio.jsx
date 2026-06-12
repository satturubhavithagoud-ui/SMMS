import { useState } from 'react';
import SMHLayout from '../components/SMHLayout';
import { generateHashtags } from '../services/authService';

export default function SMHAIStudio() {
  const [activeTab, setActiveTab] = useState('caption');

  return (
    <SMHLayout>
      <main className="p-8 min-h-screen bg-[#F6F5FA]">

        {/* PAGE HEADER */}
        <header className="mb-8">
          <h2 className="text-[42px] font-bold text-[#031B4E]">AI Studio</h2>
          <p className="text-gray-500 text-lg mt-1">Generate AI-powered captions, descriptions and hashtags instantly.</p>
        </header>

        {/* TABS */}
        <div className="flex gap-2 mb-8 bg-white border border-gray-200 rounded-2xl p-1.5 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('caption')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'caption'
                ? 'bg-[#031B4E] text-white shadow'
                : 'text-gray-500 hover:text-[#031B4E]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Caption Studio
          </button>
          <button
            onClick={() => setActiveTab('hashtag')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'hashtag'
                ? 'bg-[#031B4E] text-white shadow'
                : 'text-gray-500 hover:text-[#031B4E]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tag</span>
            Hashtag Generator
          </button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'caption' && <CaptionStudio />}
        {activeTab === 'hashtag' && <HashtagGenerator />}

      </main>
    </SMHLayout>
  );
}

/* ─────────────────────────────────────────
   CAPTION STUDIO TAB
───────────────────────────────────────── */
function CaptionStudio() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 items-start">

      {/* Left: Generator Form */}
      <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-[#031B4E]">edit_note</span>
          <h3 className="text-xl font-bold text-[#031B4E]">Content Generator</h3>
        </div>

        {/* Platform */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Target Platform</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'Instagram', icon: 'photo_camera' },
              { name: 'Facebook', icon: 'social_leaderboard' },
              { name: 'Twitter/X', icon: 'close' },
              { name: 'LinkedIn', icon: 'business' },
              { name: 'YouTube', icon: 'play_circle' },
              { name: 'Pinterest', icon: 'push_pin' },
            ].map((p) => (
              <button key={p.name} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-[#031B4E] hover:bg-[#031B4E]/5 transition group">
                <span className="material-symbols-outlined text-[22px] text-gray-400 group-hover:text-[#031B4E]">{p.icon}</span>
                <span className="text-[10px] font-bold mt-1 text-gray-500 group-hover:text-[#031B4E]">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone + Length */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Tone of Voice</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#031B4E]">
              <option>Professional</option>
              <option>Casual</option>
              <option>Witty</option>
              <option>Promotional</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Length</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#031B4E]">
              <option>Short</option>
              <option>Medium</option>
              <option>Long</option>
            </select>
          </div>
        </div>

        {/* Audience */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Target Audience</label>
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#031B4E]" placeholder="e.g. Tech Entrepreneurs, Small Business Owners" type="text" />
        </div>

        {/* Topic */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Keywords / Topic</label>
          <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#031B4E] resize-none" placeholder="What is this post about?" rows="3" />
        </div>

        <button className="w-full h-13 py-4 bg-[#031B4E] text-white font-bold rounded-2xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-[#031B4E]/20">
          <span className="material-symbols-outlined text-[20px]">bolt</span>
          Generate AI Caption
        </button>
      </section>

      {/* Right: Results */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#031B4E]">Generated Content Results</h3>
          <span className="text-gray-400 text-sm">Showing 2 variations</span>
        </div>

        {[
          {
            label: 'Variation A', score: '92% Engagement Score', scoreColor: 'text-emerald-600', dotColor: 'bg-emerald-500', active: true,
            content: "Transform your morning routine into a high-performance ritual. ☕️ ✨ Our new AI tools are designed to streamline your workflow so you can focus on what truly matters: creativity and growth. Ready to level up?",
            hashtags: "#Marketing #AIContent #GrowthStrategy #SocialMedia #BrandAwareness",
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY3hPZd9GMTmZUrBfRIXYCP55KYqioQFbVIPhXoggfl9D4CsV6SCNA03ZaIn28knV2gUS4kRjQMXYZECSoMTFn7ZpBenBzXH9BUDTNxjAbs7CPhOcyzMueUxVVGvxIicCgJ2GErRfEHvp80uyZbHjuD8dCTTQs92ChLPmlinLb0NJRdPkGB7bbDpdc_AE35z1J9RpIDLWtJBtf05f8YFVTp9PglBiLjS9NvJwTpPkhQUS18t64Plw-q43SXWJKFus5eTDeiCg7hHrz'
          },
          {
            label: 'Variation B', score: '85% Engagement Score', scoreColor: 'text-orange-600', dotColor: 'bg-orange-500', active: false,
            content: "Stop guessing and start growing. 🚀 The secret to viral social media content isn't luck—it's data-driven strategy. Our AI Caption Studio analyzes trending topics in real-time to ensure your brand stays ahead of the curve.",
            hashtags: "#DigitalStrategy #ContentMarketing #Innovation #SMH #FutureOfWork",
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcr9IFcdAyQGtJHC6WomFgIEIl8L-cglPeXRiDjjOySdlTllyJ0cn9iZRslpNEjolw8UQG8wszu8NFCIwytgo0eM4XIaodX3PMmrulUVjhLbKWB7m19wQWZUMjrM97iE4bcxQgVZ4bqd76MKcr_mYl-2aLHtEwWMZNA1YyhznX6AkeYMRNYGi3yu6MubNLkKZ2zTQzFuo-20iVud2YsekRsIJKU0REHhHVOemw8XC7h0PPbWs-k7pWPfoOH1STOLznsQBiBJnJvFjA'
          },
        ].map((v, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <img alt="AI Preview" className="w-full aspect-square object-cover rounded-2xl shadow-sm" src={v.img} />
              </div>
              <div className="md:w-1/2 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 ${v.active ? 'bg-[#031B4E] text-white' : 'bg-gray-100 text-gray-500'} text-[11px] font-bold rounded-full uppercase tracking-wider`}>{v.label}</span>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${v.dotColor}`}></span>
                    <span className={`text-xs font-bold ${v.scoreColor}`}>{v.score}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl mb-4 flex-grow">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {v.content}<br /><br />
                    <span className="text-[#031B4E] font-bold">{v.hashtags}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span> Copy
                  </button>
                  <button className="flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-[16px]">download</span> Image
                  </button>
                  <button className="flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-[16px]">refresh</span> Re-Gen
                  </button>
                  <button className="flex items-center justify-center gap-1 py-2 bg-[#031B4E] text-white rounded-xl text-sm font-bold hover:opacity-90 transition">
                    <span className="material-symbols-outlined text-[16px]">save</span> Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────
   HASHTAG GENERATOR TAB
───────────────────────────────────────── */
function HashtagGenerator() {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: 'photo_camera' },
    { value: 'facebook', label: 'Facebook', icon: 'thumb_up' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'business_center' },
    { value: 'twitter', label: 'Twitter/X', icon: 'close' },
    { value: 'youtube', label: 'YouTube', icon: 'play_circle' },
    { value: 'pinterest', label: 'Pinterest', icon: 'push_pin' },
  ];

  const tones = ['Professional', 'Casual', 'Witty', 'Inspirational', 'Promotional'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const data = await generateHashtags({ prompt, platform, tone: tone.toLowerCase() });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

      {/* LEFT: Input */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col gap-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#031B4E]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#031B4E]">tag</span>
          </div>
          <h3 className="text-xl font-bold text-[#031B4E]">Content Brief</h3>
        </div>

        {/* Topic */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Post Topic or Idea</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Summer fashion collection launch with bold colours and beach vibes..."
            rows={5}
            className="w-full border-2 border-gray-200 rounded-2xl p-4 text-base outline-none focus:border-[#031B4E] transition resize-none"
          />
        </div>

        {/* Platform */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Target Platform</label>
          <div className="grid grid-cols-3 gap-3">
            {platforms.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border-2 transition ${
                  platform === p.value
                    ? 'border-[#031B4E] bg-[#031B4E]/5 text-[#031B4E]'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{p.icon}</span>
                <span className="text-xs font-bold">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Tone of Voice</label>
          <div className="flex flex-wrap gap-2">
            {tones.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-5 py-2 rounded-full border-2 text-sm font-semibold transition ${
                  tone === t
                    ? 'border-[#031B4E] bg-[#031B4E] text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full h-14 bg-[#031B4E] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#031B4E]/20"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">bolt</span>
              Generate Hashtags & Description
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl text-sm">{error}</div>
        )}
      </div>

      {/* RIGHT: Output */}
      <div className="flex flex-col gap-6">
        {!result && !loading && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-16 text-center min-h-[420px]">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-gray-300 text-[36px]">tag</span>
            </div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">Results will appear here</h3>
            <p className="text-gray-400 text-sm max-w-xs">Fill in your topic, pick a platform and tone, then hit Generate.</p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-3xl border border-gray-200 flex flex-col items-center justify-center p-16 text-center min-h-[420px]">
            <div className="w-16 h-16 rounded-3xl bg-[#031B4E]/10 flex items-center justify-center mb-5 animate-pulse">
              <span className="material-symbols-outlined text-[#031B4E] text-[32px]">auto_awesome</span>
            </div>
            <h3 className="text-lg font-bold text-[#031B4E] mb-2">AI is thinking...</h3>
            <p className="text-gray-400 text-sm">Crafting your hashtags and description</p>
          </div>
        )}

        {result && (
          <>
            {/* Description Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">description</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#031B4E]">Post Description</h3>
                </div>
                <button
                  onClick={() => handleCopy(result.description, 'desc')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">{copied === 'desc' ? 'check' : 'content_copy'}</span>
                  {copied === 'desc' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">{result.description}</p>
            </div>

            {/* Hashtags Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 text-[20px]">tag</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#031B4E]">Hashtags</h3>
                </div>
                <button
                  onClick={() => handleCopy(result.hashtags, 'tags')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">{copied === 'tags' ? 'check' : 'content_copy'}</span>
                  {copied === 'tags' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.hashtags
                  .split(/\s+/)
                  .filter((tag) => tag.startsWith('#'))
                  .map((tag, i) => (
                    <span key={i} className="bg-[#031B4E]/5 text-[#031B4E] px-4 py-2 rounded-full text-sm font-semibold border border-[#031B4E]/10">
                      {tag}
                    </span>
                  ))}
              </div>
            </div>

            {/* Regenerate */}
            <button
              onClick={handleGenerate}
              className="w-full h-12 border-2 border-[#031B4E] text-[#031B4E] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#031B4E]/5 transition"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Regenerate
            </button>
          </>
        )}
      </div>
    </div>
  );
}
