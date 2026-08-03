import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SMHLayout from '../components/SMHLayout';
import PlatformLogo, { PLATFORM_EDIT_LIST } from '../components/PlatformLogo';
import { getSMHContentQueue, createPost, getSMHPostDetail } from '../services/postService';
import { getSMHClients } from '../services/smhService';

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function toLocalDatetimeStr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

const PLATFORM_COLORS = {
  instagram: '#ee2a7b',
  facebook: '#1877F2',
  linkedin: '#0077B5',
  twitter: '#000',
  x: '#000',
  youtube: '#FF0000',
  pinterest: '#E60023',
};

const CAPTION_MAX = 2200;
const NOW = new Date();
const CURRENT_MONTH = NOW.getMonth();
const CURRENT_YEAR = NOW.getFullYear();
const DAYS_IN_MONTH = new Date(CURRENT_YEAR, CURRENT_MONTH + 1, 0).getDate();
const FIRST_DOW = new Date(CURRENT_YEAR, CURRENT_MONTH, 1).getDay();

function CalendarView({ posts, selectedDay, onSelectDay }) {
  const markers = useMemo(() => {
    const m = {};
    posts.forEach(post => {
      const ts = post.scheduled_time || post.posted_time || post.created_at;
      if (!ts) return;
      const d = new Date(ts);
      if (d.getMonth() !== CURRENT_MONTH || d.getFullYear() !== CURRENT_YEAR) return;
      const day = d.getDate();
      if (!m[day]) m[day] = new Set();
      m[day].add(post.status);
    });
    return m;
  }, [posts]);

  const dayPosts = useMemo(() => {
    if (!selectedDay) return [];
    return posts.filter(post => {
      const ts = post.scheduled_time || post.posted_time || post.created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return d.getDate() === selectedDay && d.getMonth() === CURRENT_MONTH && d.getFullYear() === CURRENT_YEAR;
    });
  }, [posts, selectedDay]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-surface-container-highest overflow-hidden">
      <div className="p-lg border-b border-surface-container-highest flex justify-between items-center">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          {new Date(CURRENT_YEAR, CURRENT_MONTH).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        {selectedDay && (
          <button onClick={() => onSelectDay(null)} className="text-[10px] bg-primary/10 text-primary px-sm py-[2px] rounded-full hover:bg-primary/20 font-bold">Clear</button>
        )}
      </div>
      <div className="p-lg">
        <div className="grid grid-cols-7 gap-y-2 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-[10px] font-label-bold text-on-surface-variant uppercase">{d}</div>
          ))}
          {Array.from({ length: FIRST_DOW }, (_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
            const day = i + 1;
            const m = markers[day];
            const isToday = day === NOW.getDate();
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => onSelectDay(isSelected ? null : day)}
                className={`h-10 flex items-center justify-center font-body-md rounded-full relative transition-all hover:bg-primary/5 text-sm
                  ${isToday && !isSelected ? 'bg-primary/10 text-primary font-bold' : ''}
                  ${isSelected ? '!bg-primary text-on-primary font-bold ring-2 ring-primary' : ''}
                `}
              >
                {day}
                {m && !isSelected && (
                  <span className="absolute bottom-0.5 flex gap-[2px]">
                    {m.has('SCHEDULED') && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                    {m.has('PUBLISHED') && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                    {m.has('FAILED') && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-lg pt-lg border-t border-surface-container-highest grid grid-cols-3 gap-sm">
          {[
            { label: 'Scheduled', color: 'bg-primary' },
            { label: 'Published', color: 'bg-emerald-500' },
            { label: 'Failed', color: 'bg-red-500' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-xs">
              <span className={`w-2 h-2 rounded-full ${s.color}`}></span>
              <span className="text-[10px] font-label-bold text-on-surface uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div className="border-t border-surface-container-higher divide-y divide-surface-container">
          <div className="px-lg py-md bg-surface-container-low font-label-bold text-on-surface-variant text-xs uppercase tracking-wider">
            Posts for {new Date(CURRENT_YEAR, CURRENT_MONTH, selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          {dayPosts.length === 0 ? (
            <div className="p-lg text-center text-on-surface-variant text-sm">No posts on this day.</div>
          ) : (
            dayPosts.map(post => (
              <div key={post.id} className="p-lg flex items-start gap-md">
                <PlatformLogo platform={post.platforms?.[0] || 'unknown'} size={12} variant="badge" />
                <div className="flex-1 min-w-0">
                  <p className="font-label-bold text-on-surface truncate">{post.title || post.caption?.slice(0, 60)}</p>
                  <p className="text-xs text-on-surface-variant">{fmtDate(post.scheduled_time || post.posted_time || post.created_at)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-label-bold text-[10px] ${
                  post.status === 'SCHEDULED' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-primary-fixed text-on-primary-fixed'
                }`}>{post.status}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AddPostModal({ open, onClose, onCreated }) {
  const [clients, setClients] = useState([]);
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [mode, setMode] = useState('now');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [clientId, setClientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      getSMHClients().then(setClients).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!caption.trim()) { setError('Caption is required.'); return; }
    if (platforms.length === 0) { setError('Select at least one platform.'); return; }
    if (!clientId) { setError('Select a client.'); return; }
    if (mode === 'later' && (!schedDate || !schedTime)) { setError('Set schedule date and time.'); return; }
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('mode', mode);
      platforms.forEach(p => formData.append('platforms', p.toUpperCase()));
      formData.append('client_id', clientId);
      if (mode === 'later') formData.append('scheduled_time', `${schedDate}T${schedTime}:00`);
      await createPost(formData, clientId);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setSaving(false);
    }
  };

  const togglePlat = (val) => {
    setPlatforms(prev => prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-md backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border border-outline-variant shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-start p-lg border-b border-outline-variant shrink-0">
          <h3 className="font-headline-md text-primary">Create New Post</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-xs hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-lg space-y-lg">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-sm rounded-lg text-sm flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          <div>
            <label className="block text-label-bold text-on-surface-variant mb-xs">Client</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full bg-surface-container-high border border-outline rounded-xl p-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Select a client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-xs">
              <label className="text-label-bold text-on-surface-variant">Caption</label>
              <span className={`text-[10px] font-label-bold ${caption.length > CAPTION_MAX ? 'text-red-600' : 'text-on-surface-variant'}`}>{caption.length}/{CAPTION_MAX}</span>
            </div>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={5} maxLength={CAPTION_MAX + 100}
              className="w-full bg-surface-container-high border border-outline rounded-xl p-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Write your caption..." />
          </div>
          <div>
            <label className="block text-label-bold text-on-surface-variant mb-sm">Target Platforms</label>
            <div className="flex flex-wrap gap-sm">
              {PLATFORM_EDIT_LIST.map(plat => {
                const active = platforms.includes(plat.value);
                return (
                  <button key={plat.value} type="button" onClick={() => togglePlat(plat.value)}
                    className={`flex items-center gap-sm px-md py-sm border rounded-xl font-label-bold transition-all ${
                      active ? 'bg-primary border-primary text-on-primary shadow-sm' : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}>
                    <PlatformLogo platform={plat.value} size={14} />
                    {plat.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-label-bold text-on-surface-variant mb-sm">Schedule</label>
            <div className="flex gap-md">
              <button onClick={() => setMode('now')}
                className={`flex-1 p-md border rounded-xl font-label-bold transition-all ${mode === 'now' ? 'bg-primary border-primary text-on-primary shadow-sm' : 'bg-surface border-outline-variant text-on-surface-variant'}`}>
                Post Now
              </button>
              <button onClick={() => setMode('later')}
                className={`flex-1 p-md border rounded-xl font-label-bold transition-all ${mode === 'later' ? 'bg-primary border-primary text-on-primary shadow-sm' : 'bg-surface border-outline-variant text-on-surface-variant'}`}>
                Schedule Later
              </button>
            </div>
          </div>
          {mode === 'later' && (
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-bold text-on-surface-variant mb-xs">Date</label>
                <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline rounded-xl p-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-label-bold text-on-surface-variant mb-xs">Time</label>
                <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline rounded-xl p-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-sm p-lg border-t border-outline-variant shrink-0 bg-surface-container-lowest rounded-b-2xl">
          <button onClick={onClose} className="px-lg py-sm border border-outline text-on-surface rounded-xl font-label-bold hover:bg-surface-container-high transition-colors" disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-lg py-sm bg-primary text-on-primary rounded-xl font-label-bold hover:opacity-90 transition-opacity flex items-center gap-sm disabled:opacity-60"
            disabled={saving}>
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-primary"></div>}
            {saving ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostDetailModal({ postId, open, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && postId) {
      setLoading(true);
      getSMHPostDetail(postId)
        .then(setPost)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, postId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-md backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-outline-variant shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-start p-lg border-b border-outline-variant shrink-0">
          <h3 className="font-headline-md text-primary">Post Details</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-xs hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-lg space-y-lg">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !post ? (
            <p className="text-center text-on-surface-variant">Post not found.</p>
          ) : (
            <>
              {post.media_url && (
                <div className="rounded-xl border border-outline-variant overflow-hidden bg-surface-container flex items-center justify-center">
                  <img src={post.media_url} alt="Post Media" className="max-h-48 w-full object-contain" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Title</span>
                <p className="font-label-bold text-on-surface">{post.title || 'Untitled'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Caption</span>
                <p className="text-body-md text-on-surface mt-xs whitespace-pre-wrap">{post.caption}</p>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Status</span>
                  <p><span className={`px-sm py-xs rounded-full font-label-bold text-[10px] ${
                    post.status === 'SCHEDULED' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 
                    post.status === 'PUBLISHED' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-red-50 text-red-700'
                  }`}>{post.status}</span></p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Client</span>
                  <p className="font-label-bold text-on-surface">{post.client_name || '—'}</p>
                </div>
              </div>
              {post.platforms && post.platforms.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Platforms</span>
                  <div className="flex gap-sm mt-xs">
                    {post.platforms.map((p, i) => (
                      <PlatformLogo key={i} platform={p} size={14} variant="badge" />
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-md">
                {post.scheduled_time && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Scheduled</span>
                    <p className="text-body-md">{fmtDate(post.scheduled_time)}</p>
                  </div>
                )}
                {post.posted_time && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Posted</span>
                    <p className="text-body-md">{fmtDate(post.posted_time)}</p>
                  </div>
                )}
              </div>
              {post.hashtags && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Hashtags</span>
                  <p className="text-primary font-label-bold mt-xs">{post.hashtags}</p>
                </div>
              )}
              {post.error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-sm rounded-lg text-sm flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  {post.error}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end p-lg border-t border-outline-variant shrink-0">
          <button onClick={onClose} className="px-lg py-sm border border-outline text-on-surface rounded-xl font-label-bold hover:bg-surface-container-high transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SMHScheduler() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    setError(null);
    getSMHContentQueue()
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { setError(err.message || 'Failed to load posts.'); setLoading(false); });
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const scheduledPosts = posts.filter(p => p.status === 'SCHEDULED');
  const pendingCount = scheduledPosts.length;
  const displayPosts = posts.slice(0, 10);

  const platCounts = useMemo(() => {
    const counts = {};
    posts.forEach(p => (p.platforms || []).forEach(pl => {
      const key = pl.toLowerCase().replace(/[^a-z]/g, '');
      counts[key] = (counts[key] || 0) + 1;
    }));
    return counts;
  }, [posts]);
  const totalPlatPosts = Object.values(platCounts).reduce((a, b) => a + b, 0) || 1;
  const topPlatforms = Object.entries(platCounts).slice(0, 3);

  if (loading) {
    return (
      <SMHLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </SMHLayout>
    );
  }

  if (error) {
    return (
      <SMHLayout>
        <div className="p-md bg-error-container text-on-error-container rounded-xl">
          <p className="font-bold">Error loading scheduler data</p>
          <p className="text-xs">{error}</p>
        </div>
      </SMHLayout>
    );
  }

  return (
    <SMHLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-xl">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface mb-2">Scheduler</h2>
            <p className="text-on-surface-variant font-body-md">Manage your cross-platform content timeline and campaign distribution.</p>
          </div>
          <div className="flex gap-md items-center">
            <div className="bg-surface-container-high rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('list')}
                className={`px-md py-sm text-sm font-label-bold rounded transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-md py-sm text-sm font-label-bold rounded transition-all ${
                  viewMode === 'calendar' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Calendar
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white font-label-bold px-lg py-sm rounded-lg flex items-center gap-2 hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Post
            </button>
          </div>
        </div>

        <div className="space-y-xl">
          {viewMode === 'calendar' ? (
            <CalendarView posts={posts} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-surface-container-highest">
              <div className="px-lg py-md border-b border-surface-container-highest flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-on-surface">Recent & Scheduled Posts</h3>
                <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">{pendingCount} Pending</span>
              </div>

              <div className="divide-y divide-surface-container">
                {displayPosts.length === 0 ? (
                  <div className="p-lg text-center text-on-surface-variant">No posts found.</div>
                ) : (
                  displayPosts.map((post) => {
                    const plat = post.platforms?.[0] || 'unknown';
                    const isScheduled = post.status === 'SCHEDULED';
                    return (
                      <div
                        key={post.id}
                        onClick={() => setDetailPostId(post.id)}
                        className="p-lg hover:bg-surface-container-low transition-colors group flex items-start gap-md cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative">
                          {post.media_url ? (
                            <img alt="Preview" className="w-full h-full object-cover" src={post.media_url} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-outline">article</span>
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 rounded shadow">
                            <PlatformLogo platform={plat} size={10} variant="badge" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-sm mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                              {isScheduled ? fmtDate(post.scheduled_time) : fmtDate(post.posted_time || post.created_at)}
                            </span>
                            <div className="flex items-center gap-1 ml-auto">
                              <span className={`${isScheduled ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-primary-fixed text-on-primary-fixed'} px-2 py-0.5 rounded-full font-label-bold text-[10px]`}>
                                {post.status === 'PUBLISHED' ? 'POSTED' : post.status}
                              </span>
                              <div className={`w-2 h-2 ${isScheduled ? 'bg-orange-400' : 'bg-emerald-500'} rounded-full`}></div>
                            </div>
                          </div>
                          <h4 className="font-label-bold text-on-surface truncate">{post.title || post.caption?.slice(0, 60)}</h4>
                          <p className="text-body-md text-on-surface-variant truncate">{post.caption?.slice(0, 100)}</p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-surface-container-high rounded-full" onClick={e => { e.stopPropagation(); setDetailPostId(post.id); }}>
                          <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="bg-surface-container-low p-md flex justify-center">
                <button
                  onClick={() => setViewMode('calendar')}
                  className="text-primary font-label-bold flex items-center gap-2 hover:underline"
                >
                  View Full Content Calendar
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-surface-container-highest p-lg">
            <h4 className="font-headline-md text-headline-md text-on-surface mb-md">Campaign Distribution</h4>
            <div className="space-y-md">
              {topPlatforms.length === 0 ? (
                <p className="text-on-surface-variant text-center py-md">No platform data available.</p>
              ) : (
                topPlatforms.map(([plat, count]) => {
                  const pct = Math.round((count / totalPlatPosts) * 100);
                  const color = PLATFORM_COLORS[plat] || '#888';
                  return (
                    <div key={plat} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase">
                        <span className="capitalize">{plat}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <AddPostModal open={showAddModal} onClose={() => setShowAddModal(false)} onCreated={fetchPosts} />
      <PostDetailModal postId={detailPostId} open={detailPostId !== null} onClose={() => setDetailPostId(null)} />
    </SMHLayout>
  );
}
