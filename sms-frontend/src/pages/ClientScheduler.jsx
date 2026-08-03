import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import ClientLayout from '../components/ClientLayout';
import PlatformLogo from '../components/PlatformLogo';
import { PageHeader, SectionCard, EmptyState, StatusBadge, statusDotColor } from '../components/ui';
import { getPlatforms, getConnectedPlatforms } from '../services/authService';
import {
  createPost,
  getPosts,
  deletePost,
  publishPost,
  retryPost,
  editPost,
} from '../services/postService';

function getUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function formatDateTime(dateString, options) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, options);
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-[70] flex items-center gap-2 rounded-xl border px-4 py-3 shadow-popover transition-all ${
        toast.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
      <span className="text-sm font-semibold">{toast.message}</span>
    </div>
  );
}

/* -------------------- Add Post Modal -------------------- */

function AddPostModal({ open, platforms, onClose, onCreated, initialMode = 'now' }) {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [publishMode, setPublishMode] = useState(initialMode);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCaption('');
      setSelectedPlatforms([]);
      setImageFile(null);
      setImagePreview(null);
      setPublishMode(initialMode);
      setScheduledDate('');
      setScheduledTime('');
      setFormError('');
    }
  }, [open, initialMode]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  if (!open) return null;

  const togglePlatform = (value) => {
    setSelectedPlatforms((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!caption.trim()) {
      setFormError('Caption is required.');
      return;
    }
    if (publishMode !== 'draft' && selectedPlatforms.length === 0) {
      setFormError('Select at least one platform.');
      return;
    }
    if (publishMode === 'later' && (!scheduledDate || !scheduledTime)) {
      setFormError('Please choose a date and time for scheduling.');
      return;
    }

    const formData = new FormData();
    formData.append('caption', caption.trim());
    formData.append('mode', publishMode);
    if (imageFile) formData.append('media', imageFile);

    selectedPlatforms.forEach((platform) => formData.append('platforms', platform));

    if (publishMode === 'later') {
      formData.append('scheduled_time', `${scheduledDate}T${scheduledTime}`);
    }

    setSubmitting(true);
    try {
      const response = await createPost(formData, getUser().client_id);
      if (response.publish_results) {
        const failed = response.publish_results.filter((item) => item.status !== 'published');
        if (failed.length > 0) {
          const details = failed.map((item) => `${item.platform}: ${item.message || item.status}`).join('; ');
          setFormError(`Post saved but failed to publish: ${details}`);
          onCreated('Post created but publishing failed.', 'error');
        } else {
          onCreated('Post published successfully!', 'success');
        }
      } else if (publishMode === 'draft') {
        onCreated('Draft saved successfully!', 'success');
      } else {
        onCreated('Post scheduled successfully!', 'success');
      }
      onClose();
    } catch (error) {
      setFormError(error.message || 'Unable to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div className="card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-surface-variant/60 px-6 py-5">
          <div>
            <h3 className="card-heading">Create New Post</h3>
            <p className="mt-0.5 text-sm text-on-surface-variant">Choose platforms, upload an image, and schedule or post immediately.</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-2" aria-label="Close">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form className="space-y-6 overflow-y-auto px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="add-caption">Caption</label>
              <textarea
                id="add-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="input h-32 resize-none"
                placeholder="Write your post caption or message here..."
              />
            </div>
            <div>
              <span className="field-label">Upload Image</span>
              <label className="flex min-h-[176px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low/40 px-4 text-center text-on-surface-variant transition-colors hover:border-primary hover:bg-primary/5">
                <span className="material-symbols-outlined text-4xl text-primary/60">photo_camera</span>
                <span className="text-sm font-medium">Click to choose an image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-xl border border-surface-variant/60">
                  <img src={imagePreview} alt="Preview" className="max-h-48 w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-variant/60 bg-surface-container-low/40 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-on-surface">Select Platforms</span>
              <span className="text-xs text-on-surface-variant">{publishMode === 'draft' ? 'Optional for drafts' : 'Choose one or more'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.value);
                return (
                  <button
                    type="button"
                    key={platform.value}
                    onClick={() => togglePlatform(platform.value)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-surface-variant bg-surface text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <PlatformLogo platform={platform.value} size={20} />
                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { key: 'now', label: 'Post Now', desc: 'Publish immediately', icon: 'bolt' },
              { key: 'later', label: 'Schedule for Later', desc: 'Pick date and time', icon: 'schedule' },
              { key: 'draft', label: 'Save as Draft', desc: 'Edit and publish later', icon: 'description' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPublishMode(opt.key)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  publishMode === opt.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-surface-variant bg-surface text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined mb-2 text-[22px]">{opt.icon}</span>
                <p className="text-sm font-bold">{opt.label}</p>
                <p className="mt-0.5 text-xs text-on-surface-variant">{opt.desc}</p>
              </button>
            ))}
          </div>

          {publishMode === 'later' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="field-label">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(event) => setScheduledTime(event.target.value)}
                  className="input"
                />
              </div>
            </div>
          )}

          {formError && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">{formError}</p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting
                ? 'Saving...'
                : publishMode === 'later'
                ? 'Schedule Post'
                : publishMode === 'draft'
                ? 'Save Draft'
                : 'Post Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- Edit Post Modal -------------------- */

function EditPostModal({ post, platforms, onClose, onSaved }) {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '');
      setHashtags(post.hashtags || '');
      setSelectedPlatforms(post.platforms || []);
      if (post.scheduled_time) {
        const d = new Date(post.scheduled_time);
        if (!Number.isNaN(d.getTime())) {
          setScheduledDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
          setScheduledTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
        }
      } else {
        setScheduledDate('');
        setScheduledTime('');
      }
      setMediaFile(null);
      setMediaPreview(null);
      setFormError('');
    }
  }, [post]);

  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  if (!post) return null;

  const togglePlatform = (value) => {
    setSelectedPlatforms((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!caption.trim()) {
      setFormError('Caption is required.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setFormError('Select at least one platform.');
      return;
    }

    const formData = new FormData();
    formData.append('caption', caption.trim());
    formData.append('hashtags', hashtags);
    selectedPlatforms.forEach((p) => formData.append('platforms', p.toUpperCase()));
    if (mediaFile) formData.append('media', mediaFile);
    formData.append('scheduled_time', scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}` : '');

    setSubmitting(true);
    try {
      await editPost(post.id, formData);
      onSaved('Post updated successfully.', 'success');
      onClose();
    } catch (error) {
      setFormError(error.message || 'Failed to update post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div className="card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-surface-variant/60 px-6 py-5">
          <div>
            <h3 className="card-heading">Edit Post</h3>
            <p className="mt-0.5 text-sm text-on-surface-variant">Update caption, platforms, media or schedule time.</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-2" aria-label="Close">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form className="space-y-6 overflow-y-auto px-6 py-6" onSubmit={handleSubmit}>
          {(post.media_url || mediaPreview) && (
            <div>
              <label className="field-label">Current Media</label>
              <div className="overflow-hidden rounded-2xl border border-surface-variant/60 bg-surface-container-low/40 p-3">
                <img
                  src={mediaPreview || post.media_url}
                  alt="Media Preview"
                  className="max-h-44 w-full rounded-xl object-contain"
                />
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="edit-caption">Caption</label>
              <textarea
                id="edit-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="input h-32 resize-none"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="edit-hashtags">Hashtags</label>
              <input
                id="edit-hashtags"
                value={hashtags}
                onChange={(event) => setHashtags(event.target.value)}
                className="input"
                placeholder="#Innovation #SocialMedia"
              />
              <span className="field-label mt-4">Replace Media</span>
              <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low/40 px-4 text-center text-on-surface-variant transition-colors hover:border-primary hover:bg-primary/5">
                <span className="material-symbols-outlined text-3xl text-primary/60">photo_camera</span>
                <span className="text-sm font-medium">Click to choose a new image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleMediaChange} />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-variant/60 bg-surface-container-low/40 p-5">
            <span className="mb-4 block text-sm font-semibold text-on-surface">Target Platforms</span>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.value);
                return (
                  <button
                    type="button"
                    key={platform.value}
                    onClick={() => togglePlatform(platform.value)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-surface-variant bg-surface text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <PlatformLogo platform={platform.value} size={20} />
                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Schedule Date (clear to remove)</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="field-label">Schedule Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
                className="input"
              />
            </div>
          </div>

          {formError && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">{formError}</p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- Calendar -------------------- */

function Calendar({ posts, selectedDay, viewDate, onSelectDay, onViewChange }) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const markers = useMemo(() => {
    const m = {};
    posts.forEach((post) => {
      const ts = post.scheduled_time || post.posted_time || post.created_at;
      if (!ts) return;
      const d = new Date(ts);
      if (d.getMonth() !== month || d.getFullYear() !== year) return;
      const day = d.getDate();
      if (!m[day]) m[day] = new Set();
      m[day].add(post.status);
    });
    return m;
  }, [posts, month, year]);

  const dayPosts = useMemo(() => {
    if (!selectedDay) return [];
    return posts.filter((post) => {
      const ts = post.scheduled_time || post.posted_time || post.created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year;
    });
  }, [posts, selectedDay, month, year]);

  const monthLabel = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const goMonth = (delta) => {
    onViewChange(new Date(year, month + delta, 1));
    onSelectDay(null);
  };

  const goToday = () => {
    onViewChange(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDay(null);
  };

  return (
    <SectionCard
      title="Calendar"
      subtitle="Click a day to view its posts"
      icon="calendar_month"
      action={
        <div className="flex items-center gap-1">
          <button onClick={() => goMonth(-1)} className="btn btn-ghost p-1.5" aria-label="Previous month">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button onClick={goToday} className="btn btn-ghost p-1.5" aria-label="Today">
            <span className="material-symbols-outlined text-[18px]">today</span>
          </button>
          <button onClick={() => goMonth(1)} className="btn btn-ghost p-1.5" aria-label="Next month">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      }
    >
      <p className="mb-4 text-center font-manrope text-base font-bold text-on-surface">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="pb-2 text-[11px] font-bold tracking-wider text-on-surface-variant uppercase">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const m = markers[day];
          const isToday = isCurrentMonth && day === now.getDate();
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className={`relative flex h-11 flex-col items-center justify-center rounded-xl text-sm transition-all hover:bg-primary/5 ${
                isSelected
                  ? 'bg-primary font-bold text-on-primary shadow-card hover:bg-primary'
                  : isToday
                  ? 'bg-primary/10 font-bold text-primary'
                  : 'text-on-surface'
              }`}
            >
              <span>{day}</span>
              {m && !isSelected && (
                <span className="absolute bottom-1 flex gap-[3px]">
                  {m.has('POSTED') && <span className="h-1 w-1 rounded-full bg-emerald-500" />}
                  {m.has('SCHEDULED') && <span className="h-1 w-1 rounded-full bg-primary" />}
                  {m.has('FAILED') && <span className="h-1 w-1 rounded-full bg-red-500" />}
                  {m.has('DRAFT') && <span className="h-1 w-1 rounded-full bg-outline-variant" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-variant/60 pt-4">
        {[
          { label: 'Published', color: 'bg-emerald-500' },
          { label: 'Scheduled', color: 'bg-primary' },
          { label: 'Failed', color: 'bg-red-500' },
          { label: 'Draft', color: 'bg-outline-variant' },
        ].map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${s.color}`} />
            <span className="text-[11px] font-semibold text-on-surface-variant">{s.label}</span>
          </span>
        ))}
      </div>

      {selectedDay && (
        <div className="mt-4 rounded-xl border border-surface-variant/60 bg-surface-container-low/50 p-4">
          <p className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">
            <span>
              {new Date(year, month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => onSelectDay(null)} className="font-semibold tracking-normal text-primary normal-case hover:underline">
              Clear
            </button>
          </p>
          {dayPosts.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No posts on this day.</p>
          ) : (
            <ul className="space-y-2">
              {dayPosts.map((post) => (
                <li key={post.id} className="flex items-center gap-2 text-sm">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotColor(post.status)}`} />
                  <span className="min-w-0 truncate text-on-surface">{post.caption || 'Untitled post'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}

/* -------------------- Week Chart -------------------- */

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e4e2e5',
  fontSize: 12,
  boxShadow: '0 12px 40px -12px rgba(16,24,40,0.3)',
};

function WeekChart({ posts }) {
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), published: 0, scheduled: 0 });
    }
    posts.forEach((post) => {
      const ts = post.status === 'POSTED' ? post.posted_time || post.updated_at || post.created_at : post.scheduled_time;
      if (!ts) return;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return;
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      if (d < start || d > now) return;
      const idx = Math.floor((d - start) / (1000 * 60 * 60 * 24));
      if (idx >= 0 && idx < 7) {
        if (post.status === 'POSTED') days[idx].published += 1;
        else if (post.status === 'SCHEDULED') days[idx].scheduled += 1;
      }
    });
    return days;
  }, [posts]);

  const hasData = chartData.some((d) => d.published > 0 || d.scheduled > 0);

  return (
    <SectionCard
      title="Posts This Week"
      subtitle="Distribution of published and scheduled content"
      icon="bar_chart"
      className="lg:col-span-2"
      bodyClassName="py-6"
    >
      {!hasData ? (
        <EmptyState icon="bar_chart" title="No activity this week" message="Published and scheduled posts will appear here." />
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={6} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efedf0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#44474e' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#44474e' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(3,22,53,0.05)' }} contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="published" name="Published" fill="#031635" radius={[6, 6, 0, 0]} maxBarSize={30} />
              <Bar dataKey="scheduled" name="Scheduled" fill="#b6c6ef" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

/* -------------------- Page -------------------- */

export default function ClientScheduler() {
  const [showAddPost, setShowAddPost] = useState(false);
  const [addInitialMode, setAddInitialMode] = useState('now');
  const [editingPost, setEditingPost] = useState(null);
  const [platformOptions, setPlatformOptions] = useState([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadPlatforms = useCallback(async () => {
    try {
      const data = await getPlatforms();
      if (Array.isArray(data) && data.length > 0) {
        setPlatformOptions(data);
      }
    } catch {
      // Non-fatal; fall back to empty
    }
  }, []);

  const loadConnectedPlatforms = useCallback(async () => {
    try {
      const data = await getConnectedPlatforms();
      if (Array.isArray(data)) setConnectedPlatforms(data);
    } catch {
      setConnectedPlatforms([]);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPosts(getUser().client_id);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatforms();
    loadConnectedPlatforms();
    loadPosts();
  }, [loadPlatforms, loadConnectedPlatforms, loadPosts]);

  const handleDelete = async (post) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      await deletePost(post.id);
      showToast('Post deleted successfully.', 'success');
      loadPosts();
    } catch (err) {
      showToast(err.message || 'Failed to delete post.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (post) => {
    setActionLoading(true);
    try {
      const response = await publishPost(post.id);
      const failed = response.publish_results?.some((r) => r.status !== 'published');
      showToast(
        failed ? 'Publishing failed on one or more platforms.' : 'Post published successfully!',
        failed ? 'error' : 'success'
      );
      loadPosts();
    } catch (err) {
      showToast(err.message || 'Failed to publish post.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async (post) => {
    setActionLoading(true);
    try {
      const response = await retryPost(post.id);
      const failed = response.publish_results?.some((r) => r.status !== 'published');
      showToast(
        failed ? 'Retry failed to publish to platforms.' : 'Post retried and published successfully!',
        failed ? 'error' : 'success'
      );
      loadPosts();
    } catch (err) {
      showToast(err.message || 'Failed to retry post.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreated = (message, type) => {
    showToast(message, type);
    loadPosts();
    loadConnectedPlatforms();
  };

  const handleSaved = (message, type) => {
    showToast(message, type);
    loadPosts();
  };

  const selectablePlatforms = useMemo(() => {
    if (connectedPlatforms.length > 0) {
      return platformOptions.filter((p) =>
        connectedPlatforms.some((c) => c.value === p.value && c.connected)
      );
    }
    return platformOptions;
  }, [platformOptions, connectedPlatforms]);

  const filteredPosts = useMemo(() => {
    if (!selectedCalendarDay) return posts;
    return posts.filter((post) => {
      const ts = post.scheduled_time || post.posted_time || post.created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return d.getDate() === selectedCalendarDay && d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear();
    });
  }, [posts, selectedCalendarDay, calendarMonth]);

  const selectedDayLabel = selectedCalendarDay
    ? new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), selectedCalendarDay).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const connectedCount = connectedPlatforms.filter((p) => p.connected).length;

  return (
    <ClientLayout>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {actionLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10">
          <div className="card flex items-center gap-3 px-5 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
            <span className="text-sm font-semibold text-primary">Processing request...</span>
          </div>
        </div>
      )}

      <PageHeader
        title="Scheduler"
        subtitle="Manage and organize your scheduled social media content."
        actions={
          <>
            <button
              onClick={() => {
                setAddInitialMode('draft');
                setShowAddPost(true);
              }}
              className="btn btn-outline"
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              Save Draft
            </button>
            <button
              onClick={() => {
                setAddInitialMode('now');
                setShowAddPost(true);
              }}
              className="btn btn-primary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Post
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Posts list */}
        <SectionCard
          title={selectedCalendarDay ? `Posts for ${selectedDayLabel}` : 'Upcoming & Recent Posts'}
          subtitle={selectedCalendarDay ? 'Showing content for the selected day' : 'All scheduled, published, and draft content'}
          icon="post_add"
          className="lg:col-span-2"
          action={!loading && <span className="badge badge-neutral">{filteredPosts.length} post{filteredPosts.length === 1 ? '' : 's'}</span>}
        >
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card animate-pulse p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-surface-container-high" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-surface-container-high" />
                      <div className="h-3 w-1/2 rounded bg-surface-container-high" />
                    </div>
                  </div>
                  <div className="mt-4 h-3 w-full rounded bg-surface-container-high" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-surface-container-high" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-error">error</span>
              <div>
                <h3 className="card-heading">Unable to load posts</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
              </div>
              <button onClick={loadPosts} className="btn btn-primary">
                Try Again
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              icon="calendar_month"
              title={selectedCalendarDay ? 'No posts on this day' : 'No posts yet'}
              message={selectedCalendarDay ? 'Try selecting another day.' : 'Create a post or save a draft to get started.'}
              action={
                !selectedCalendarDay ? (
                  <button
                    onClick={() => {
                      setAddInitialMode('now');
                      setShowAddPost(true);
                    }}
                    className="btn btn-primary btn-sm mt-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Create your first post
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredPosts.map((post) => {
                const platform = Array.isArray(post.platforms) ? post.platforms[0] : null;
                const timeStr = post.scheduled_time || post.posted_time || post.created_at;
                return (
                  <div key={post.id} className="card flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                          {post.media_url ? (
                            <img src={post.media_url} alt="Post media" className="h-full w-full object-cover" />
                          ) : platform ? (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <PlatformLogo platform={platform} size={20} />
                            </span>
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-primary/50">
                              <span className="material-symbols-outlined text-[20px]">article</span>
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            {post.platforms.length > 0 ? (
                              post.platforms.map((p, i) => <PlatformLogo key={i} platform={p} size={16} />)
                            ) : (
                              <span className="text-xs text-on-surface-variant">No platforms</span>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {formatDateTime(timeStr, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>

                    <p className="line-clamp-2 text-sm leading-5 text-on-surface">{post.caption}</p>

                    <div className="flex items-center justify-between border-t border-surface-variant/60 pt-3">
                      <div className="flex gap-1">
                        {post.status !== 'POSTED' && (
                          <button
                            onClick={() => setEditingPost(post)}
                            className="btn btn-ghost p-1.5 text-on-surface-variant hover:text-primary"
                            title="Edit post"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(post)}
                          className="btn btn-ghost p-1.5 text-on-surface-variant hover:text-error"
                          title="Delete post"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {(post.status === 'SCHEDULED' || post.status === 'DRAFT') && (
                          <button onClick={() => handlePublish(post)} className="btn btn-primary btn-sm">
                            Publish now
                          </button>
                        )}
                        {post.status === 'FAILED' && (
                          <button onClick={() => handleRetry(post)} className="btn btn-danger btn-sm">
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Calendar */}
        <Calendar
          posts={posts}
          selectedDay={selectedCalendarDay}
          viewDate={calendarMonth}
          onSelectDay={setSelectedCalendarDay}
          onViewChange={setCalendarMonth}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Week chart */}
        <WeekChart posts={posts} />

        {/* Connected platforms */}
        <SectionCard
          title="Connected Platforms"
          subtitle="Accounts linked to your workspace"
          icon="link"
          action={<span className="badge badge-success">{connectedCount} connected</span>}
        >
          {connectedPlatforms.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Loading platform status...</p>
          ) : (
            <ul className="space-y-1">
              {connectedPlatforms.map((platform) => (
                <li
                  key={platform.value}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-container-low/60"
                >
                  <PlatformLogo platform={platform.value} size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">{platform.label}</p>
                    <p className="truncate text-[11px] text-on-surface-variant">
                      {platform.connected ? `@${platform.account_username || 'connected'}` : 'Not connected'}
                    </p>
                  </div>
                  {platform.connected ? (
                    <span className="badge badge-success shrink-0">Active</span>
                  ) : (
                    <Link to="/settings" className="btn btn-outline btn-sm shrink-0">
                      Connect
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <AddPostModal
        open={showAddPost}
        platforms={selectablePlatforms}
        initialMode={addInitialMode}
        onClose={() => setShowAddPost(false)}
        onCreated={handleCreated}
      />
      <EditPostModal
        post={editingPost}
        platforms={selectablePlatforms}
        onClose={() => setEditingPost(null)}
        onSaved={handleSaved}
      />
    </ClientLayout>
  );
}
