import React, { useState, useEffect, useCallback } from 'react';
import SMHLayout from '../components/SMHLayout';
import PlatformLogo from '../components/PlatformLogo';
import { generateAICaptions, saveAIDraft, getAIHistory } from '../services/smhService';

const TONES = ['Professional', 'Casual', 'Witty', 'Promotional'];
const LENGTHS = ['Short', 'Medium', 'Long'];
const PLATFORMS = [
  { name: 'Instagram', key: 'instagram' },
  { name: 'Facebook', key: 'facebook' },
  { name: 'Twitter/X', key: 'twitter' },
  { name: 'LinkedIn', key: 'linkedin' },
  { name: 'YouTube', key: 'youtube' },
  { name: 'Pinterest', key: 'pinterest' },
];

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-24 right-4 z-[60] flex items-center gap-sm px-lg py-md rounded-xl shadow-xl border ${
      type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <span className="material-symbols-outlined">{type === 'success' ? 'check_circle' : 'error'}</span>
      <span className="font-label-bold">{message}</span>
    </div>
  );
}

function SavedProjectsModal({ open, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getAIHistory().then(data => setHistory(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-md backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border border-outline-variant shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center p-lg border-b border-outline-variant shrink-0">
          <h3 className="font-headline-md text-primary">Saved Drafts</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-xs hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-lg space-y-md">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : history.length === 0 ? (
            <p className="text-on-surface-variant text-center py-10">No saved drafts yet. Generate and save a caption to see it here.</p>
          ) : (
            history.map(h => (
              <div key={h.id} className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
                <div className="flex items-center gap-sm mb-sm">
                  {h.platforms.map((p, i) => <PlatformLogo key={i} platform={p} size={14} variant="badge" />)}
                  <span className="text-[10px] text-on-surface-variant ml-auto">{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-body-md text-on-surface line-clamp-3 whitespace-pre-wrap">{h.caption}</p>
                {h.hashtags && <p className="text-primary text-[12px] font-label-bold mt-xs">{h.hashtags}</p>}
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end p-lg border-t border-outline-variant shrink-0">
          <button onClick={onClose} className="px-lg py-sm border border-outline text-on-surface rounded-xl font-label-bold hover:bg-surface-container-high transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function SMHAIStudio() {
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium');
  const [audience, setAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  const [brand, setBrand] = useState('');
  const [industry, setIndustry] = useState('');
  const [variations, setVariations] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [savingIdx, setSavingIdx] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  const handleGenerate = async () => {
    if (!keywords.trim()) { setError('Please enter keywords or a topic.'); return; }
    setError(null);
    setGenerating(true);
    try {
      const res = await generateAICaptions({
        platform,
        tone: tone.toLowerCase(),
        keywords: keywords.trim(),
        audience: audience.trim(),
        length: length.toLowerCase(),
        brand: brand.trim(),
        industry: industry.trim(),
      });
      setVariations(res.variations || []);
      if (res.variations?.length) {
        showToast('Caption variations generated!');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate captions.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Caption copied to clipboard!')).catch(() => showToast('Failed to copy.', 'error'));
  };

  const handleSaveDraft = async (variation) => {
    setSavingIdx(variation.label);
    try {
      const platList = platform ? [platform] : [];
      await saveAIDraft({
        caption: variation.content,
        hashtags: variation.hashtags,
        platforms: platList,
      });
      showToast('Draft saved successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save draft.', 'error');
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <SMHLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <SavedProjectsModal open={showHistory} onClose={() => setShowHistory(false)} />
      <main className="p-xl max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg mb-xl">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-primary">AI Caption Studio</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Generate AI-powered captions and social media creatives instantly.</p>
          </div>
          <div className="flex items-center gap-md">
            <button onClick={() => setShowHistory(true)} className="px-lg py-sm border border-primary text-primary font-bold rounded-lg hover:bg-surface-container-high transition-colors">
              Saved Projects
            </button>
            <button onClick={handleGenerate} disabled={generating} className="px-lg py-sm bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-sm disabled:opacity-60">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Generate Content
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-xl items-start">
          <section className="flex flex-col gap-lg">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="font-headline-md text-headline-md text-primary">Content Generator</h3>
              </div>
              <div className="space-y-xl">
                <div>
                  <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">TARGET PLATFORM</label>
                  <div className="grid grid-cols-3 gap-sm">
                    {PLATFORMS.map(p => {
                      const active = platform === p.key;
                      return (
                        <button key={p.key} onClick={() => setPlatform(p.key)}
                          className={`flex flex-col items-center justify-center p-sm border rounded-lg transition-all group ${
                            active ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/30'
                          }`}>
                          <PlatformLogo platform={p.key} size={20} />
                          <span className={`text-[10px] font-bold mt-1 ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">TONE OF VOICE</label>
                    <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded-lg p-md text-body-md focus:ring-primary focus:border-primary">
                      {TONES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">LENGTH</label>
                    <select value={length} onChange={e => setLength(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded-lg p-md text-body-md focus:ring-primary focus:border-primary">
                      {LENGTHS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">TARGET AUDIENCE</label>
                  <input value={audience} onChange={e => setAudience(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded-lg p-md text-body-md focus:ring-primary focus:border-primary" placeholder="e.g. Tech Entrepreneurs, Small Business Owners" type="text" />
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">BRAND NAME</label>
                    <input value={brand} onChange={e => setBrand(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded-lg p-md text-body-md focus:ring-primary focus:border-primary" placeholder="e.g. SocialManager Pro" type="text" />
                  </div>
                  <div>
                    <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">INDUSTRY</label>
                    <input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded-lg p-md text-body-md focus:ring-primary focus:border-primary" placeholder="e.g. SaaS, Hospitality" type="text" />
                  </div>
                </div>
                <div>
                  <label className="font-label-bold text-label-bold text-on-surface-variant block mb-sm">KEYWORDS / TOPIC</label>
                  <textarea value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded-lg p-md text-body-md focus:ring-primary focus:border-primary" placeholder="What is this post about?" rows="3" />
                </div>
                <button onClick={handleGenerate} disabled={generating}
                  className="w-full py-md bg-primary text-on-primary font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-md disabled:opacity-60">
                  {generating ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-on-primary"></div> Generating...</>
                  ) : (
                    <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span> Generate AI Content</>
                  )}
                </button>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Generated Content Results</h3>
              <div className="flex items-center gap-sm">
                <span className="text-on-surface-variant text-body-md">{variations.length > 0 ? `Showing ${variations.length} variations` : ''}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-md rounded-xl flex items-center gap-sm">
                <span className="material-symbols-outlined">error</span>
                <span className="font-label-bold">{error}</span>
              </div>
            )}

            {generating && variations.length === 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col items-center justify-center py-16 gap-md">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-on-surface-variant font-label-bold">Generating caption variations...</p>
              </div>
            )}

            {!generating && variations.length === 0 && !error && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col items-center justify-center py-16 gap-md">
                <span className="material-symbols-outlined text-[64px] text-outline">auto_awesome</span>
                <h3 className="font-headline-md text-on-surface">Ready to create</h3>
                <p className="text-on-surface-variant text-center max-w-sm">Fill in the fields on the left and click "Generate AI Content" to see caption suggestions here.</p>
              </div>
            )}

            {variations.map((v, i) => (
              <div key={v.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
                <div className="flex flex-col md:flex-row gap-lg">
                  <div className="md:w-1/2 flex flex-col">
                    <div className="flex justify-between items-start mb-md">
                      <span className={`px-sm py-xs ${i === 0 ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface-variant'} text-[11px] font-bold rounded uppercase tracking-wider`}>
                        {v.label}
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-lg mb-md flex-grow">
                      <p className="text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">{v.content}</p>
                      {v.cta && (
                        <div className="mt-md flex items-start gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">ads_click</span>
                          <p className="text-body-md text-on-surface font-label-bold">{v.cta}</p>
                        </div>
                      )}
                      {v.hashtags && (
                        <p className="text-primary font-bold mt-md text-sm">{v.hashtags}</p>
                      )}
                    </div>
                    {v.emoji_caption && (
                      <details className="group mb-md">
                        <summary className="cursor-pointer select-none flex items-center gap-sm text-primary font-bold text-sm hover:opacity-80">
                          <span className="material-symbols-outlined text-[18px]">emoji_emotions</span>
                          Emoji Version
                        </summary>
                        <p className="mt-sm bg-surface-container-low p-md rounded-lg text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">{v.emoji_caption}</p>
                      </details>
                    )}
                    <div className="grid grid-cols-2 gap-sm">
                      <button onClick={() => handleCopy(v.content + (v.cta ? '\n\n' + v.cta : '') + (v.hashtags ? '\n\n' + v.hashtags : ''))}
                        className="flex items-center justify-center gap-xs py-sm border border-outline-variant rounded-lg font-bold text-sm hover:bg-surface-container-high">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span> Copy
                      </button>
                      <button onClick={() => handleGenerate()}
                        className="flex items-center justify-center gap-xs py-sm border border-outline-variant rounded-lg font-bold text-sm hover:bg-surface-container-high">
                        <span className="material-symbols-outlined text-[18px]">refresh</span> Re-Gen
                      </button>
                      <button onClick={() => handleSaveDraft(v)} disabled={savingIdx === v.label}
                        className="flex items-center justify-center gap-xs py-sm bg-primary text-on-primary rounded-lg font-bold text-sm hover:opacity-90 col-span-2 disabled:opacity-60">
                        {savingIdx === v.label ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-primary"></div> Saving...</>
                        ) : (
                          <><span className="material-symbols-outlined text-[18px]">save</span> Save as Draft</>
                        )}
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
