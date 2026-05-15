import { useEffect, useState } from 'react';
import ClientLayout from '../components/ClientLayout';
import { getPlatforms } from '../services/authService';
import { createPost, getPosts } from '../services/postService';

const FALLBACK_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter/X' },
];

const PLATFORM_ICON_MAP = {
  instagram: 'photo_camera',
  facebook: 'facebook',
  linkedin: 'groups',
  pinterest: 'push_pin',
  youtube: 'play_circle',
  twitter: 'close',
};

const PLATFORM_COLOR_MAP = {
  instagram: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
  facebook: 'bg-[#1877F2]',
  linkedin: 'bg-[#0077B5]',
  pinterest: 'bg-[#E60023]',
  youtube: 'bg-[#FF0000]',
  twitter: 'bg-black',
};

function renderPlatformIcon(platform) {
  switch (platform) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.5A4 4 0 0 0 3.5 7.5v9A4 4 0 0 0 7.5 20.5h9a4 4 0 0 0 4-4v-9a4 4 0 0 0-4-4h-9Zm9 2.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5ZM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 1.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M13.5 21V13.25h2.5l.375-2.875H13.5V8.5c0-.833.208-1.4 1.28-1.4h1.367V4.12A19.606 19.606 0 0 0 14.175 4C11.8 4 10 5.26 10 8.115V10.38H7.625v2.875H10V21h3.5Z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M22 5.92c-.8.36-1.66.61-2.56.72a4.48 4.48 0 0 0 1.96-2.48 8.95 8.95 0 0 1-2.84 1.08 4.47 4.47 0 0 0-7.62 4.07A12.7 12.7 0 0 1 3 4.93a4.47 4.47 0 0 0 1.38 5.97 4.45 4.45 0 0 1-2.02-.56v.06a4.47 4.47 0 0 0 3.58 4.38 4.5 4.5 0 0 1-2.01.08 4.47 4.47 0 0 0 4.17 3.1A8.95 8.95 0 0 1 2 19.54a12.64 12.64 0 0 0 6.86 2.01c8.24 0 12.75-6.83 12.75-12.75 0-.19-.01-.38-.02-.57A9.1 9.1 0 0 0 22 5.92Z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M6.94 21H2.78V8.99h4.16V21ZM4.86 7.45A2.41 2.41 0 1 1 7.27 5 2.4 2.4 0 0 1 4.86 7.45ZM21 21h-4.17v-5.5c0-1.31-.03-2.99-1.82-2.99-1.82 0-2.1 1.42-2.1 2.89V21h-4.16V8.99h4v1.63h.06a4.38 4.38 0 0 1 3.94-2.16c4.22 0 5 2.78 5 6.4V21Z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M21.8 7.2c-.2-.7-.8-1.3-1.6-1.4C18.36 5.5 12 5.5 12 5.5s-6.36 0-8.2.3c-.8.1-1.4.7-1.6 1.4C2 8.86 2 12 2 12s0 3.14.2 4.8c.2.7.8 1.3 1.6 1.4 1.84.3 8.2.3 8.2.3s6.36 0 8.2-.3c.8-.1 1.4-.7 1.6-1.4.2-1.66.2-4.8.2-4.8s0-3.14-.2-4.8ZM9.5 15.5V8.5l6 3.5-6 3.5Z" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 2.04C6.49 2.04 2.04 6.5 2.04 12c0 4.09 2.54 7.6 6.16 9.11-.08-.78-.15-1.98.03-2.83.17-.76 1.1-4.84 1.1-4.84s-.28-.56-.28-1.39c0-1.3.75-2.27 1.69-2.27.8 0 1.19.6 1.19 1.31 0 .8-.51 2-0.78 3.12-.22.94.46 1.7 1.37 1.7 1.64 0 2.91-1.73 2.91-4.23 0-2.21-1.59-3.77-3.86-3.77-2.63 0-4.17 1.97-4.17 4.01 0 .8.31 1.67.7 2.14.08.1.09.19.07.29-.08.32-.24 1-.27 1.14-.04.19-.13.23-.31.14-1.17-.54-1.9-2.24-1.9-3.6 0-2.92 2.12-5.58 6.12-5.58 3.22 0 5.72 2.3 5.72 5.36 0 3.2-2.02 5.78-4.82 5.78-0.94 0-1.82-.49-2.12-1.07l-.58 2.21c-.21.8-.78 1.8-1.16 2.41 1.03.32 2.12.49 3.26.49 5.51 0 9.96-4.46 9.96-9.96S17.51 2.04 12 2.04Z" />
        </svg>
      );
    default:
      return <span className="material-symbols-outlined text-lg">language</span>;
  }
}

const staticPosts = [
  {
    id: 'static-1',
    platforms: ['instagram'],
    type: 'Reel Publication',
    caption: 'Behind the scenes of our latest product launch! We’re so excited to finally show you what we’ve been working on...',
    date: 'May 12',
    time: '10:30 AM',
    prediction: 'High Engagement Predicted',
    platform: 'instagram',
    status: 'SCHEDULED',
    icon: 'camera',
    gradient: 'from-yellow-400 via-pink-500 to-purple-600',
  },
  {
    id: 'static-2',
    platforms: ['facebook'],
    type: 'Page Update',
    caption: 'Join our community webinar this Friday to learn how to master social media analytics with our new tools.',
    date: 'May 14',
    time: '02:00 PM',
    prediction: 'Stable Reach Prediction',
    platform: 'facebook',
    status: 'SCHEDULED',
    icon: 'facebook',
    bg: 'bg-[#1877F2]',
  },
  {
    id: 'static-3',
    platforms: ['twitter'],
    type: 'Thread',
    caption: '1/5 Why small businesses are failing at social media engagement and how to fix it in 3 easy steps. 🧵',
    date: 'May 15',
    time: '09:00 AM',
    prediction: 'Viral Potential Detected',
    platform: 'twitter',
    status: 'SCHEDULED',
    icon: 'close',
    bg: 'bg-black',
  },
  {
    id: 'static-4',
    platforms: ['linkedin'],
    type: 'Thought Leadership',
    caption: 'Deep dive into the 2026 Digital Marketing Trends report. Here are the 5 things you need to know today.',
    date: 'May 18',
    time: '11:15 AM',
    prediction: 'B2B Network Priority',
    platform: 'linkedin',
    status: 'SCHEDULED',
    icon: 'groups',
    bg: 'bg-[#0077B5]',
  },
];

function formatDateTime(dateString, options) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, options);
}

export default function ClientScheduler() {
  const [showAddPost, setShowAddPost] = useState(false);
  const [platformOptions, setPlatformOptions] = useState(FALLBACK_PLATFORMS);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [publishMode, setPublishMode] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(window.localStorage.getItem('user') || '{}');
    setClientId(user?.client_id || null);
    loadPlatforms();
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

  useEffect(() => {
    if (clientId !== null) {
      loadPosts();
    }
  }, [clientId]);

  async function loadPlatforms() {
    try {
      const data = await getPlatforms();
      if (Array.isArray(data) && data.length > 0) {
        setPlatformOptions(data);
      }
    } catch (error) {
      console.error('Unable to load platform options:', error);
    }
  }

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const posts = await getPosts(clientId);
      if (Array.isArray(posts)) {
        setScheduledPosts(posts);
      }
    } catch (error) {
      console.error('Unable to load scheduled posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  }

  function togglePlatform(value) {
    setSelectedPlatforms((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    }
  }

  function resetForm() {
    setCaption('');
    setSelectedPlatforms([]);
    setImageFile(null);
    setImagePreview(null);
    setPublishMode('now');
    setScheduledDate('');
    setScheduledTime('');
    setFormError('');
  }

  async function handleSubmit(event) {
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

    if (publishMode === 'later' && (!scheduledDate || !scheduledTime)) {
      setFormError('Please choose a date and time for scheduling.');
      return;
    }

    const formData = new FormData();
    formData.append('caption', caption.trim());
    formData.append('mode', publishMode);
    if (imageFile) {
      formData.append('media', imageFile);
    }

    selectedPlatforms.forEach((platform) => {
      formData.append('platforms', platform);
    });

    if (publishMode === 'later') {
      formData.append('scheduled_time', `${scheduledDate}T${scheduledTime}`);
    }

    setSubmitting(true);
    try {
      const response = await createPost(formData, clientId);
      if (response.publish_results) {
        const failed = response.publish_results.filter((item) => item.status === 'failed');
        if (failed.length > 0) {
          const details = failed.map((item) => `${item.platform}: ${item.message}`).join('; ');
          setFormError(`Post saved but failed to publish: ${details}`);
        }
      }
      resetForm();
      setShowAddPost(false);
      await loadPosts();
    } catch (error) {
      setFormError(error.message || 'Unable to create post.');
    } finally {
      setSubmitting(false);
    }
  }

  function buildCardData(post) {
    if (!post || typeof post !== 'object') return null;

    const platform = Array.isArray(post.platforms) ? post.platforms[0] : post.platform;
    const label = (Array.isArray(post.platforms) ? post.platforms[0] : platform) || 'Post';
    const icon = PLATFORM_ICON_MAP[platform] ?? 'post_add';
    const bg = PLATFORM_COLOR_MAP[platform] ?? 'bg-surface-container-lowest';
    const scheduledTime = post.scheduled_time || post.created_at;
    const status = post.status || 'SCHEDULED';

    return {
      id: post.id,
      platform: label,
      type: post.type || 'Social Post',
      content: post.caption || post.content || '',
      date: formatDateTime(scheduledTime, { month: 'short', day: 'numeric' }),
      time: formatDateTime(scheduledTime, { hour: '2-digit', minute: '2-digit' }),
      prediction:
        status === 'POSTED'
          ? 'Published Immediately'
          : status === 'FAILED'
          ? 'Publish Failed'
          : 'Scheduled for later',
      gradient: bg,
      icon,
      status,
    };
  }

  const postsToShow = scheduledPosts.length > 0 ? scheduledPosts.map(buildCardData) : staticPosts;

  return (
    <ClientLayout>
      <div className="flex justify-between items-end mb-xl px-xs">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary">Scheduler</h2>
          <p className="text-on-surface-variant font-body-lg">Manage and organize your scheduled social media content.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface-container-lowest border border-primary text-primary px-6 py-2 rounded-lg font-label-bold flex items-center gap-2 hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-sm">description</span>
            Save Draft
          </button>
          <button
            onClick={() => setShowAddPost(true)}
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-bold flex items-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Post
          </button>
        </div>
      </div>

      {showAddPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
              <div>
                <h3 className="font-headline-md text-headline-md">Create New Post</h3>
                <p className="text-on-surface-variant text-sm">Choose platforms, upload an image, and schedule or post immediately.</p>
              </div>
              <button
                onClick={() => {
                  setShowAddPost(false);
                  resetForm();
                }}
                className="rounded-full border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="space-y-6 px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }} onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <label className="font-label-bold text-label-bold">Caption</label>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    className="h-32 w-full rounded-3xl border border-outline-variant/50 bg-surface px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Write your post caption or message here..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="font-label-bold text-label-bold">Upload Image</label>
                  <label className="flex min-h-[190px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/50 bg-surface p-4 text-center text-on-surface-variant transition-colors hover:border-primary hover:bg-surface-container-low">
                    <span className="material-symbols-outlined text-4xl text-primary">photo_camera</span>
                    <span className="text-sm">Click to choose an image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imagePreview ? (
                    <div className="rounded-3xl border border-outline-variant/50 bg-surface p-3">
                      <img src={imagePreview} alt="Preview" className="max-h-48 w-full rounded-3xl object-cover" />
                    </div>
                  ) : imageFile ? (
                    <div className="rounded-3xl border border-outline-variant/50 bg-surface p-3 text-sm text-on-surface-variant">
                      Selected file: {imageFile.name}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-outline-variant/50 bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-label-bold">Select Platforms</span>
                  <span className="text-xs text-on-surface-variant">Choose one or more</span>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {platformOptions.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.value);
                    return (
                      <button
                        type="button"
                        key={platform.value}
                        onClick={() => togglePlatform(platform.value)}
                        className={`rounded-3xl border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-outline-variant/50 bg-surface text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center text-lg">
                            {renderPlatformIcon(platform.value)}
                          </span>
                          <span className="font-medium">{platform.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <label className="rounded-3xl border border-outline-variant/50 bg-surface p-4">
                  <input
                    type="radio"
                    checked={publishMode === 'now'}
                    onChange={() => setPublishMode('now')}
                    className="mr-2"
                  />
                  Post Now
                </label>
                <label className="rounded-3xl border border-outline-variant/50 bg-surface p-4">
                  <input
                    type="radio"
                    checked={publishMode === 'later'}
                    onChange={() => setPublishMode('later')}
                    className="mr-2"
                  />
                  Schedule for Later
                </label>
                {publishMode === 'later' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Date
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(event) => setScheduledDate(event.target.value)}
                        className="rounded-3xl border border-outline-variant/50 bg-white px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Time
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(event) => setScheduledTime(event.target.value)}
                        className="rounded-3xl border border-outline-variant/50 bg-white px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                  </div>
                )}
              </div>

              {formError && <p className="text-sm text-error">{formError}</p>}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPost(false);
                    resetForm();
                  }}
                  className="rounded-3xl border border-outline-variant/50 px-6 py-3 font-semibold text-on-surface hover:bg-surface-container-low transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-3xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : publishMode === 'later' ? 'Schedule Post' : 'Post Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-9 space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md">Upcoming Scheduled Posts</h3>
            <button className="text-primary text-sm font-semibold hover:underline">View Calendar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {loadingPosts ? (
              <div className="col-span-1 md:col-span-2 rounded-3xl border border-outline-variant/30 bg-white p-8 text-center text-on-surface-variant">
                Loading scheduled posts...
              </div>
            ) : postsToShow.length > 0 ? (
              postsToShow.map((post, idx) => (
                <div key={post.id ?? idx} className="bg-white p-lg rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${post.gradient ?? post.bg} flex items-center justify-center text-white`}>
                        <span className="material-symbols-outlined">{post.icon}</span>
                      </div>
                      <div>
                        <p className="font-label-bold">{Array.isArray(post.platforms) ? post.platforms[0] : post.platform}</p>
                        <p className="text-xs text-on-surface-variant">{post.type}</p>
                      </div>
                    </div>
                    <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {post.status === 'POSTED' ? 'Published' : post.status}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface-variant line-clamp-2">{post.caption || post.content}</p>
                  <div className="flex items-center gap-4 py-2 border-y border-outline-variant/20 text-xs font-semibold text-on-surface">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span> {post.date}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {post.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-on-tertiary-container bg-tertiary-fixed/30 px-2 py-1 rounded">
                      <span className="material-symbols-outlined text-xs">trending_up</span>
                      <span className="text-[10px] font-bold">{post.prediction}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">edit</span></button>
                      <button className="p-2 text-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 rounded-3xl border border-outline-variant/30 bg-white p-8 text-center text-on-surface-variant">
                No scheduled posts yet. Create a post using the Add Post button.
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-xl">
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-md border-b border-outline-variant/20">
              <h3 className="font-headline-md text-sm font-bold uppercase tracking-wide text-on-surface-variant">Connected Platforms</h3>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {[
                { name: 'Instagram', stats: '12.4k followers', color: 'text-pink-600', icon: 'camera', status: 'check_circle' },
                { name: 'Facebook', stats: '8.9k likes', color: 'text-blue-600', icon: 'facebook', status: 'check_circle' },
                { name: 'Twitter/X', stats: '42.1k followers', color: 'text-black', icon: 'close', status: 'check_circle' },
                { name: 'LinkedIn', stats: '156 Connections', color: 'text-[#0077B5]', icon: 'groups', status: 'pending' },
              ].map((p, idx) => (
                <div key={idx} className="px-md py-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${p.status === 'check_circle' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-orange-400'}`}></div>
                    <span className={`material-symbols-outlined ${p.color}`}>{p.icon}</span>
                    <div>
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{p.stats}</p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-sm ${p.status === 'check_circle' ? 'text-on-surface-variant' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: p.status === 'check_circle' ? "'FILL' 1" : "'FILL' 0" }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <div className="bg-white p-lg rounded-xl border border-outline-variant/30 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="font-headline-md text-headline-md">Posts This Week</h3>
                <p className="text-on-surface-variant text-sm">Distribution of content types across the week</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-primary"></div>
                  <span className="text-xs font-semibold">Published</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-inverse-primary"></div>
                  <span className="text-xs font-semibold">Scheduled</span>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between h-48 px-4 relative">
              {[
                { day: 'MON', p: 60, s: 30 },
                { day: 'TUE', p: 45, s: 15 },
                { day: 'WED', p: 80, s: 10 },
                { day: 'THU', p: 55, s: 40 },
                { day: 'FRI', p: 90, s: 10 },
                { day: 'SAT', p: 20, s: 60 },
                { day: 'SUN', p: 10, s: 75 },
              ].map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full max-w-[48px] flex items-end gap-1 px-1 h-full">
                    <div className="flex-1 bg-primary rounded-t-sm group-hover:opacity-80 transition-all" style={{ height: `${d.p}%` }}></div>
                    <div className="flex-1 bg-inverse-primary rounded-t-sm group-hover:opacity-80 transition-all" style={{ height: `${d.s}%` }}></div>
                  </div>
                  <span className="text-xs font-label-bold text-on-surface-variant">{d.day}</span>
                </div>
              ))}
              <div className="absolute inset-0 pointer-events-none -z-10 flex flex-col justify-between pt-0 pb-6 opacity-10">
                <div className="w-full border-t border-on-surface-variant"></div>
                <div className="w-full border-t border-on-surface-variant"></div>
                <div className="w-full border-t border-on-surface-variant"></div>
                <div className="w-full border-t border-on-surface-variant"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
