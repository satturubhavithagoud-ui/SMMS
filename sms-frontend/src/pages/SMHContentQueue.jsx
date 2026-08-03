import React, { useEffect, useState, useMemo, useCallback } from 'react';
import SMHLayout from '../components/SMHLayout';
import PlatformLogo, { PLATFORM_FILTER_LIST, PLATFORM_EDIT_LIST } from '../components/PlatformLogo';
import { useSearch } from '../context/SearchContext';
import { getSMHContentQueue, deletePost, publishPost, retryPost, editPost } from '../services/postService';

const CAPTION_MAX = 2200;

function statusDotColor(status) {
  if (status === 'SCHEDULED') return 'bg-primary';
  if (status === 'PUBLISHED') return 'bg-emerald-500';
  if (status === 'FAILED') return 'bg-red-500';
  return 'bg-outline-variant';
}

function statusBadgeClass(status) {
  if (status === 'SCHEDULED') return 'text-primary bg-primary/10';
  if (status === 'PUBLISHED') return 'text-emerald-700 bg-emerald-50';
  return 'text-red-700 bg-red-50';
}

function ContentQueueContent() {
  const { searchQuery } = useSearch();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  const [toast, setToast] = useState(null);

  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editPlatforms, setEditPlatforms] = useState([]);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getBackendStatus = (statusStr) => {
    if (statusStr === 'All Statuses') return '';
    if (statusStr === 'Scheduled') return 'SCHEDULED';
    if (statusStr === 'Published') return 'PUBLISHED';
    if (statusStr === 'Failed') return 'FAILED';
    if (statusStr === 'Draft') return 'DRAFT';
    return '';
  };

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = getBackendStatus(selectedStatus);
      const data = await getSMHContentQueue(statusParam, selectedPlatform || '');
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch content queue');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedPlatform]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Close edit modal on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && editingPost) setEditingPost(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editingPost]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      await deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
      showToast('Post deleted successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete post.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishNow = async (postId) => {
    setActionLoading(true);
    try {
      const response = await publishPost(postId);
      const publishFail = response.publish_results?.some((r) => r.status !== 'published');
      showToast(
        publishFail ? 'Publishing failed on one or more platforms.' : 'Post published successfully!',
        publishFail ? 'error' : 'success'
      );
      fetchQueue();
    } catch (err) {
      showToast(err.message || 'Failed to publish post.', 'error');
      fetchQueue();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async (postId) => {
    setActionLoading(true);
    try {
      const response = await retryPost(postId);
      const publishFail = response.publish_results?.some((r) => r.status !== 'published');
      showToast(
        publishFail ? 'Retry failed to publish to platforms.' : 'Post retried and published successfully!',
        publishFail ? 'error' : 'success'
      );
      fetchQueue();
    } catch (err) {
      showToast(err.message || 'Failed to retry post publishing.', 'error');
      fetchQueue();
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (post) => {
    setEditingPost(post);
    setEditCaption(post.caption || '');
    setEditHashtags(post.hashtags || '');
    setEditPlatforms(post.platforms || []);
    if (post.scheduled_time) {
      const d = new Date(post.scheduled_time);
      if (!isNaN(d.getTime())) {
        setEditDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        setEditTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
    } else {
      setEditDate('');
      setEditTime('');
    }
    setEditError(null);
  };

  const toggleEditPlatform = (platVal) => {
    setEditPlatforms((current) =>
      current.includes(platVal) ? current.filter((p) => p !== platVal) : [...current, platVal]
    );
  };

  const handleSaveEdit = async () => {
    if (!editCaption.trim()) {
      setEditError('Caption is required.');
      return;
    }
    if (editPlatforms.length === 0) {
      setEditError('Please select at least one platform.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const formData = new FormData();
      formData.append('caption', editCaption);
      formData.append('hashtags', editHashtags);
      editPlatforms.forEach((p) => formData.append('platforms', p.toUpperCase()));
      formData.append('scheduled_time', editDate && editTime ? `${editDate}T${editTime}:00` : '');
      await editPost(editingPost.id, formData);
      setEditingPost(null);
      showToast('Post updated successfully.', 'success');
      fetchQueue();
    } catch (err) {
      setEditError(err.message || 'Failed to update post');
    } finally {
      setEditSaving(false);
    }
  };

  const formatDateTime = (post) => {
    const timeStr = post.scheduled_time || post.posted_time || post.created_at;
    if (!timeStr) return { date: 'N/A', time: 'N/A' };
    const dateObj = new Date(timeStr);
    if (isNaN(dateObj.getTime())) return { date: 'N/A', time: 'N/A' };
    return {
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  };

  const now = new Date();
  const currentMonthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const calendarMarkers = useMemo(() => {
    const markers = {};
    posts.forEach((post) => {
      const timeStr = post.scheduled_time || post.posted_time || post.created_at;
      if (!timeStr) return;
      const d = new Date(timeStr);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
      const day = d.getDate();
      if (!markers[day]) markers[day] = new Set();
      markers[day].add(post.status);
    });
    return markers;
  }, [posts, now.getMonth(), now.getFullYear()]);

  const filteredPosts = posts.filter((post) => {
    if (selectedCalendarDay) {
      const postDate = new Date(post.scheduled_time || post.posted_time || post.created_at);
      if (postDate.getDate() !== selectedCalendarDay) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (post.client_name && post.client_name.toLowerCase().includes(q)) ||
      (post.caption && post.caption.toLowerCase().includes(q)) ||
      (post.hashtags && post.hashtags.toLowerCase().includes(q)) ||
      (post.status && post.status.toLowerCase().includes(q)) ||
      (post.platforms && post.platforms.some((p) => p.toLowerCase().includes(q)))
    );
  });

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-24 right-4 z-[60] flex items-center gap-sm px-lg py-md rounded-xl shadow-xl border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-label-bold">{toast.message}</span>
        </div>
      )}

      {actionLoading && (
        <div className="fixed inset-0 z-[60] bg-black/10 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm px-lg py-md rounded-xl shadow-lg border border-outline-variant flex items-center gap-md">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-body-md font-label-bold text-primary">Processing request...</span>
          </div>
        </div>
      )}

      {/* Two-column layout — no nested scroll, flows with page */}
      <div className="flex flex-col xl:flex-row gap-xl max-w-[1600px] mx-auto w-full">
        {/* Left: feed */}
        <div className="flex-1 min-w-0 space-y-lg">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary">Content Queue</h1>
            <p className="text-on-surface-variant font-body-md mt-xs">
              Manage and schedule your social media presence across all platforms.
            </p>
          </div>

          {/* Filters */}
          <section className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex flex-wrap items-center gap-md">
            <span className="font-label-bold text-on-surface-variant uppercase tracking-wider text-[10px]">
              Platforms
            </span>
            <div className="flex flex-wrap gap-xs">
              {PLATFORM_FILTER_LIST.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setSelectedPlatform(selectedPlatform === p.value ? null : p.value)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border border-outline-variant transition-all hover:scale-105 ${
                    selectedPlatform === p.value
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                  title={p.name}
                >
                  <PlatformLogo platform={p.value} size={16} />
                </button>
              ))}
            </div>
            <div className="hidden sm:block w-px h-8 bg-outline-variant"></div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none font-body-md text-on-surface focus:ring-0 cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Published">Published</option>
              <option value="Failed">Failed</option>
              <option value="Draft">Draft</option>
            </select>
            {searchQuery && (
              <span className="text-[10px] bg-primary/10 text-primary px-sm py-[2px] rounded-full font-bold ml-auto">
                Filtered by search
              </span>
            )}
          </section>

          {/* Posts */}
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant">
              <div className="flex flex-col items-center gap-md">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <span className="text-on-surface-variant font-label-bold">Loading content queue...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-xl rounded-xl text-center space-y-md">
              <span className="material-symbols-outlined text-[48px] text-red-500">error</span>
              <p>{error}</p>
              <button
                onClick={fetchQueue}
                className="bg-red-600 text-white px-lg py-md rounded-lg font-label-bold hover:bg-red-700 transition-colors"
              >
                Retry loading
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-surface-container-lowest py-16 rounded-xl border border-outline-variant text-center space-y-md">
              <span className="material-symbols-outlined text-[64px] text-outline">post_add</span>
              <h3 className="font-headline-md text-on-surface">No posts found</h3>
              <p className="text-on-surface-variant max-w-md mx-auto">
                There are no posts matching your filters or search keywords.
              </p>
            </div>
          ) : (
            <div className="space-y-md">
              {filteredPosts.map((post) => {
                const { date, time } = formatDateTime(post);
                return (
                  <article
                    key={post.id}
                    className={`bg-surface-container-lowest p-md lg:p-lg rounded-xl border shadow-sm flex flex-col sm:flex-row gap-md lg:gap-lg transition-all ${
                      post.status === 'FAILED'
                        ? 'border-red-200 hover:border-red-300'
                        : 'border-outline-variant hover:border-primary/20'
                    } ${post.status === 'PUBLISHED' ? 'opacity-90' : ''}`}
                  >
                    <div className="w-full sm:w-28 lg:w-32 h-28 sm:h-32 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative mx-auto sm:mx-0">
                      <img
                        alt="Post Media"
                        className={`w-full h-full object-cover ${post.status === 'FAILED' ? 'grayscale opacity-60' : ''}`}
                        src={post.media_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150'}
                      />
                      {post.status === 'FAILED' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <span className="material-symbols-outlined text-red-600 text-[36px]">error</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-md">
                        <div className="min-w-0">
                          <div className="flex items-center gap-sm mb-xs flex-wrap">
                            <span className="font-label-bold text-on-surface-variant">{post.client_name}</span>
                            <span className="text-outline-variant text-[10px]">•</span>
                            <span
                              className={`px-sm py-[2px] rounded-full font-label-bold text-[10px] flex items-center gap-xs ${statusBadgeClass(post.status)}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${statusDotColor(post.status)}`}></span>
                              {post.status}
                            </span>
                          </div>
                          <p className="font-body-md text-on-surface line-clamp-2">{post.caption}</p>
                          {post.hashtags && (
                            <p className="text-primary text-body-sm font-label-bold mt-xs line-clamp-1">
                              {post.hashtags}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-xs flex-shrink-0">
                          {post.platforms.map((plat, i) => (
                            <PlatformLogo key={i} platform={plat} size={14} variant="badge" />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-md gap-sm">
                        <div className="flex items-center gap-lg flex-wrap">
                          <div className="flex items-center gap-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            <span className="text-body-md">{date}</span>
                          </div>
                          <div className="flex items-center gap-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            <span className="text-body-md">{time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-sm flex-wrap">
                          {post.error && (
                            <div className="flex items-center gap-xs text-red-600 text-sm">
                              <span className="material-symbols-outlined text-[18px]">warning</span>
                              <span className="font-label-bold truncate max-w-[120px]">{post.error}</span>
                            </div>
                          )}
                          <div className="flex gap-xs">
                            {post.status !== 'PUBLISHED' && (
                              <button
                                onClick={() => startEdit(post)}
                                className="p-sm text-on-surface-variant hover:bg-surface-container hover:text-primary rounded-lg transition-colors"
                                title="Edit post"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-sm text-on-surface-variant hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete post"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                          {post.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handlePublishNow(post.id)}
                              className="px-md py-sm border border-primary text-primary font-label-bold rounded-lg hover:bg-primary hover:text-on-primary transition-colors text-sm"
                            >
                              Publish now
                            </button>
                          )}
                          {post.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetry(post.id)}
                              className="px-md py-sm bg-red-600 text-white font-label-bold rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Retry Post
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="w-full xl:w-[300px] flex-shrink-0 space-y-lg xl:sticky xl:top-24 xl:self-start">
          <section className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
            <div className="flex justify-between items-center mb-lg">
              <h2 className="font-headline-md text-primary">{currentMonthYear}</h2>
              {selectedCalendarDay && (
                <button
                  onClick={() => setSelectedCalendarDay(null)}
                  className="text-[10px] bg-primary/10 text-primary px-sm py-[2px] rounded-full hover:bg-primary/20 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-on-surface">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] font-label-bold text-on-surface-variant uppercase">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const markers = calendarMarkers[day];
                const isToday = day === now.getDate();
                const isSelected = selectedCalendarDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedCalendarDay(isSelected ? null : day)}
                    className={`h-8 flex items-center justify-center font-body-md rounded-full relative transition-all hover:bg-primary/5 text-sm
                      ${isToday && !isSelected ? 'bg-primary/10 text-primary font-bold' : ''}
                      ${isSelected ? '!bg-primary text-on-primary font-bold ring-2 ring-primary' : ''}
                    `}
                  >
                    {day}
                    {markers && (
                      <span className="absolute bottom-0.5 flex gap-[2px]">
                        {markers.has('SCHEDULED') && (
                          <span className="w-1 h-1 rounded-full bg-primary"></span>
                        )}
                        {markers.has('PUBLISHED') && (
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        )}
                        {markers.has('FAILED') && (
                          <span className="w-1 h-1 rounded-full bg-red-500"></span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-lg pt-lg border-t border-outline-variant grid grid-cols-2 gap-sm">
              {[
                { label: 'Scheduled', color: 'bg-primary' },
                { label: 'Published', color: 'bg-emerald-500' },
                { label: 'Failed', color: 'bg-red-500' },
                { label: 'Draft', color: 'bg-outline-variant' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-xs">
                  <span className={`w-2 h-2 rounded-full ${s.color}`}></span>
                  <span className="text-[10px] font-label-bold text-on-surface uppercase">{s.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-primary p-lg rounded-xl text-on-primary space-y-md">
            <span className="material-symbols-outlined text-[32px]">tips_and_updates</span>
            <h3 className="font-headline-md">Optimization Hint</h3>
            <p className="text-body-md opacity-90">
              Posts scheduled between 1–3 PM tend to see higher engagement on LinkedIn and Instagram.
            </p>
          </section>
        </aside>
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-md backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setEditingPost(null)}
        >
          <div className="bg-surface-container-lowest w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border border-outline-variant shadow-2xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start p-lg border-b border-outline-variant shrink-0">
              <div>
                <h3 className="font-headline-md text-primary">Edit Post</h3>
                <div className="flex items-center gap-sm mt-xs flex-wrap">
                  <span className="text-sm text-on-surface-variant">{editingPost.client_name}</span>
                  <span
                    className={`px-sm py-[2px] rounded-full font-label-bold text-[10px] ${statusBadgeClass(editingPost.status)}`}
                  >
                    {editingPost.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="text-on-surface-variant hover:text-on-surface p-xs hover:bg-surface-container rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-lg space-y-lg">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-sm rounded-lg text-sm flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {editError}
                </div>
              )}

              {editingPost.media_url && (
                <div>
                  <label className="block text-label-bold text-on-surface-variant mb-xs">Media Preview</label>
                  <div className="rounded-xl border border-outline-variant overflow-hidden bg-surface-container flex items-center justify-center">
                    <img
                      src={editingPost.media_url}
                      alt="Media Preview"
                      className="max-h-44 w-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-xs">
                  <label className="text-label-bold text-on-surface-variant">Caption</label>
                  <span
                    className={`text-[10px] font-label-bold ${editCaption.length > CAPTION_MAX ? 'text-red-600' : 'text-on-surface-variant'}`}
                  >
                    {editCaption.length}/{CAPTION_MAX}
                  </span>
                </div>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={5}
                  maxLength={CAPTION_MAX + 100}
                  className="w-full bg-surface-container-high border border-outline rounded-xl p-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Write your caption..."
                />
              </div>

              <div>
                <label className="block text-label-bold text-on-surface-variant mb-xs">Hashtags</label>
                <input
                  type="text"
                  value={editHashtags}
                  onChange={(e) => setEditHashtags(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline rounded-xl p-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="#Innovation #SocialMedia"
                />
              </div>

              <div>
                <label className="block text-label-bold text-on-surface-variant mb-sm">Target Platforms</label>
                <div className="flex flex-wrap gap-sm">
                  {PLATFORM_EDIT_LIST.map((plat) => {
                    const active = editPlatforms.includes(plat.value);
                    return (
                      <button
                        type="button"
                        key={plat.value}
                        onClick={() => toggleEditPlatform(plat.value)}
                        className={`flex items-center gap-sm px-md py-sm border rounded-xl font-label-bold transition-all ${
                          active
                            ? 'bg-primary border-primary text-on-primary shadow-sm'
                            : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        <PlatformLogo platform={plat.value} size={14} />
                        {plat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div>
                  <label className="block text-label-bold text-on-surface-variant mb-xs">Scheduled Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline rounded-xl p-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-label-bold text-on-surface-variant mb-xs">Scheduled Time</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline rounded-xl p-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-sm p-lg border-t border-outline-variant shrink-0 bg-surface-container-lowest rounded-b-2xl">
              <button
                onClick={() => setEditingPost(null)}
                className="px-lg py-sm border border-outline text-on-surface rounded-xl font-label-bold hover:bg-surface-container-high transition-colors"
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-lg py-sm bg-primary text-on-primary rounded-xl font-label-bold hover:opacity-90 transition-opacity flex items-center gap-sm disabled:opacity-60"
                disabled={editSaving}
              >
                {editSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-primary"></div>
                )}
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SMHContentQueue() {
  return (
    <SMHLayout>
      <ContentQueueContent />
    </SMHLayout>
  );
}
