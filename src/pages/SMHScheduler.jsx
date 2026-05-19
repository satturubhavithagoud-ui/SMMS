import { useEffect, useMemo, useState } from 'react';
import SMHLayout from '../components/SMHLayout';

const PLATFORMS = [
  {
    value: 'facebook',
    label: 'Facebook',
    color: 'bg-[#1877F2]',
    icon: 'facebook',
  },
  {
    value: 'instagram',
    label: 'Instagram',
    color: 'bg-pink-600',
    icon: 'photo_camera',
  },
  {
    value: 'linkedin',
    label: 'LinkedIn',
    color: 'bg-[#0077B5]',
    icon: 'groups',
  },
  {
    value: 'twitter',
    label: 'Twitter/X',
    color: 'bg-black',
    icon: 'close',
  },
  {
    value: 'youtube',
    label: 'YouTube',
    color: 'bg-red-600',
    icon: 'play_circle',
  },
  {
    value: 'pinterest',
    label: 'Pinterest',
    color: 'bg-[#E60023]',
    icon: 'push_pin',
  },
];

export default function SMHScheduler() {

  const [showModal, setShowModal] = useState(false);

  const [clients, setClients] = useState([]);

  const [posts, setPosts] = useState([]);

  const [loadingClients, setLoadingClients] = useState(true);

  const [loadingPosts, setLoadingPosts] = useState(true);

  const [selectedClient, setSelectedClient] = useState('');

  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  const [caption, setCaption] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);

  const [preview, setPreview] = useState(null);

  const [postType, setPostType] = useState('now');

  const [scheduleDate, setScheduleDate] = useState('');

  const [scheduleTime, setScheduleTime] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [platformPosts, setPlatformPosts] = useState({});

  // =========================================================
  // FETCH CLIENTS
  // =========================================================

  useEffect(() => {

    async function fetchClients() {

      try {

        const response = await fetch(
          'http://127.0.0.1:8000/api/clients/'
        );

        const data = await response.json();

        setClients(data);

      } catch (error) {

        console.error('Error fetching clients:', error);

      } finally {

        setLoadingClients(false);
      }
    }

    fetchClients();

  }, []);

  // =========================================================
  // FETCH POSTS
  // =========================================================

  async function fetchPosts() {

    try {

      setLoadingPosts(true);

      const response = await fetch(
        'http://127.0.0.1:8000/api/posts/'
      );

      const data = await response.json();

      setPosts(data);

    } catch (error) {

      console.error('Error fetching posts:', error);

    } finally {

      setLoadingPosts(false);
    }
  }

  useEffect(() => {

    fetchPosts();

  }, []);

  // =========================================================
  // TOGGLE PLATFORM
  // =========================================================

  function togglePlatform(platform) {

    setSelectedPlatforms((prev) => {

      if (prev.includes(platform)) {

        const updated = prev.filter((p) => p !== platform);

        const copy = { ...platformPosts };

        delete copy[platform];

        setPlatformPosts(copy);

        return updated;
      }

      setPlatformPosts((prevPosts) => ({
        ...prevPosts,
        [platform]: {
          caption: '',
          media: null,
          preview: null,
        },
      }));

      return [...prev, platform];
    });
  }

  // =========================================================
  // COMMON MEDIA
  // =========================================================

  function handleCommonFile(e) {

    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);

    const imageUrl = URL.createObjectURL(file);

    setPreview(imageUrl);
  }

  // =========================================================
  // PLATFORM MEDIA
  // =========================================================

  function handlePlatformFile(platform, file) {

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setPlatformPosts((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        media: file,
        preview: imageUrl,
      },
    }));
  }

  // =========================================================
  // PLATFORM CAPTION
  // =========================================================

  function handlePlatformCaption(platform, value) {

    setPlatformPosts((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        caption: value,
      },
    }));
  }

  // =========================================================
  // RESET FORM
  // =========================================================

  function resetForm() {

    setSelectedClient('');

    setSelectedPlatforms([]);

    setCaption('');

    setSelectedFile(null);

    setPreview(null);

    setPostType('now');

    setScheduleDate('');

    setScheduleTime('');

    setPlatformPosts({});
  }

  // =========================================================
  // CREATE POST
  // =========================================================

  async function handleCreatePost() {

    if (!selectedClient) {

      alert('Please select client');

      return;
    }

    if (selectedPlatforms.length === 0) {

      alert('Select at least one platform');

      return;
    }

    if (
      !caption.trim() &&
      Object.values(platformPosts).every(
        (p) => !p.caption?.trim()
      )
    ) {

      alert('Add at least one caption');

      return;
    }

    if (
      postType === 'schedule' &&
      (!scheduleDate || !scheduleTime)
    ) {

      alert('Select schedule date and time');

      return;
    }

    try {

      setSubmitting(true);

      const formData = new FormData();

      formData.append(
        'caption',
        caption
      );

      formData.append(
        'mode',
        postType === 'schedule'
          ? 'later'
          : 'now'
      );

      formData.append(
        'client_ids',
        selectedClient
      );

      selectedPlatforms.forEach((platform) => {

        formData.append(
          'platforms',
          platform
        );
      });

      // COMMON MEDIA

      if (selectedFile) {

        formData.append(
          'media',
          selectedFile
        );
      }

      // PLATFORM SPECIFIC DATA

      selectedPlatforms.forEach((platform) => {

        const post = platformPosts[platform];

        if (post?.caption) {

          formData.append(
            `${platform}_caption`,
            post.caption
          );
        }

        if (post?.media) {

          formData.append(
            `${platform}_media`,
            post.media
          );
        }
      });

      if (postType === 'schedule') {

        const scheduledDateTime =
          `${scheduleDate}T${scheduleTime}:00`;

        formData.append(
          'scheduled_time',
          scheduledDateTime
        );
      }

      const response = await fetch(
        'http://127.0.0.1:8000/api/smh/posts/create/',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.error || 'Failed to create post'
        );
      }

      alert(
        postType === 'schedule'
          ? 'Post scheduled successfully'
          : 'Post published successfully'
      );

      resetForm();

      setShowModal(false);

      fetchPosts();

    } catch (error) {

      console.error(error);

      alert(error.message || 'Failed to create post');

    } finally {

      setSubmitting(false);
    }
  }

  // =========================================================
  // CLIENT NAME
  // =========================================================

  const selectedClientName = useMemo(() => {

    const client = clients.find(
      (c) => c.id === Number(selectedClient)
    );

    return client?.name || '';

  }, [selectedClient, clients]);

  return (

    <SMHLayout>

      <main className="p-xl max-w-7xl mx-auto w-full">

        {/* HEADER */}

        <div className="flex items-end justify-between mb-xl">

          <div>

            <h2 className="font-headline-xl text-headline-xl text-on-surface mb-2">
              Scheduler
            </h2>

            <p className="text-on-surface-variant font-body-md">
              Manage your cross-platform content timeline.
            </p>

          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white font-label-bold px-lg py-sm rounded-xl flex items-center gap-2"
          >

            <span className="material-symbols-outlined">
              add
            </span>

            Add Post

          </button>
        </div>

        {/* ========================================================= */}
        {/* MODAL */}
        {/* ========================================================= */}

        {showModal && (

          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">

            <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between px-8 py-6 border-b">

                <div>

                  <h3 className="text-2xl font-bold">
                    Create New Post
                  </h3>

                  <p className="text-sm text-on-surface-variant mt-1">
                    Multi-platform publishing
                  </p>

                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >

                  <span className="material-symbols-outlined">
                    close
                  </span>

                </button>
              </div>

              {/* BODY */}

              <div className="p-8 overflow-y-auto max-h-[80vh] space-y-8">

                {/* CLIENT DROPDOWN */}

                <div>

                  <h4 className="font-bold text-lg mb-3">
                    Select Client
                  </h4>

                  <select
                    value={selectedClient}
                    onChange={(e) =>
                      setSelectedClient(e.target.value)
                    }
                    className="w-full border rounded-2xl px-4 py-4 outline-none focus:border-primary"
                  >

                    <option value="">
                      Select Client
                    </option>

                    {clients.map((client) => (

                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.name}
                      </option>
                    ))}
                  </select>

                  {selectedClientName && (

                    <div className="mt-3 inline-flex bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                      {selectedClientName}
                    </div>
                  )}
                </div>

                {/* PLATFORM SELECTION */}

                <div>

                  <h4 className="font-bold text-lg mb-4">
                    Select Platforms
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                    {PLATFORMS.map((platform) => {

                      const active =
                        selectedPlatforms.includes(
                          platform.value
                        );

                      return (

                        <button
                          key={platform.value}
                          type="button"
                          onClick={() =>
                            togglePlatform(platform.value)
                          }
                          className={`border rounded-2xl p-4 transition-all ${
                            active
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200'
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <div
                              className={`w-10 h-10 rounded-xl ${platform.color} flex items-center justify-center text-white`}
                            >

                              <span className="material-symbols-outlined text-[18px]">
                                {platform.icon}
                              </span>
                            </div>

                            <div className="text-left">

                              <p className="font-semibold text-sm">
                                {platform.label}
                              </p>

                              <p className="text-xs text-gray-500">
                                Platform
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COMMON POST */}

                <div className="border rounded-3xl p-6 bg-surface-container-low">

                  <div className="flex items-center gap-3 mb-5">

                    <span className="material-symbols-outlined text-primary">
                      public
                    </span>

                    <h4 className="font-bold text-lg">
                      Common Post For Multiple Platforms
                    </h4>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">

                    {/* COMMON CAPTION */}

                    <div>

                      <label className="block text-sm font-semibold mb-2">
                        Common Caption
                      </label>

                      <textarea
                        value={caption}
                        onChange={(e) =>
                          setCaption(e.target.value)
                        }
                        placeholder="This caption will be used for all selected platforms..."
                        className="w-full h-52 border rounded-2xl p-4 resize-none outline-none focus:border-primary"
                      />
                    </div>

                    {/* COMMON MEDIA */}

                    <div>

                      <label className="block text-sm font-semibold mb-2">
                        Common Media
                      </label>

                      <label className="border-2 border-dashed rounded-2xl h-52 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">

                        {!preview ? (

                          <>

                            <span className="material-symbols-outlined text-5xl text-primary mb-2">
                              cloud_upload
                            </span>

                            <p className="font-semibold">
                              Upload Media
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              Same media for multiple platforms
                            </p>
                          </>

                        ) : (

                          <img
                            src={preview}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                        )}

                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/*"
                          onChange={handleCommonFile}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* INDIVIDUAL PLATFORM POSTS */}

                {selectedPlatforms.length > 0 && (

                  <div className="space-y-6">

                    <h4 className="font-bold text-xl">
                      Individual Platform Posts
                    </h4>

                    {selectedPlatforms.map((platform) => {

                      const currentPlatform =
                        PLATFORMS.find(
                          (p) => p.value === platform
                        );

                      const post =
                        platformPosts[platform];

                      return (

                        <div
                          key={platform}
                          className="border rounded-3xl p-6"
                        >

                          <div className="flex items-center gap-3 mb-5">

                            <div
                              className={`w-12 h-12 rounded-xl ${currentPlatform.color} flex items-center justify-center text-white`}
                            >

                              <span className="material-symbols-outlined">
                                {currentPlatform.icon}
                              </span>
                            </div>

                            <div>

                              <h5 className="font-bold text-lg">
                                {currentPlatform.label}
                              </h5>

                              <p className="text-sm text-gray-500">
                                Custom caption & media
                              </p>
                            </div>
                          </div>

                          <div className="grid lg:grid-cols-2 gap-6">

                            {/* PLATFORM CAPTION */}

                            <div>

                              <label className="block text-sm font-semibold mb-2">
                                Caption
                              </label>

                              <textarea
                                value={post?.caption || ''}
                                onChange={(e) =>
                                  handlePlatformCaption(
                                    platform,
                                    e.target.value
                                  )
                                }
                                placeholder={`Write custom caption for ${currentPlatform.label}`}
                                className="w-full h-44 border rounded-2xl p-4 resize-none outline-none focus:border-primary"
                              />
                            </div>

                            {/* PLATFORM MEDIA */}

                            <div>

                              <label className="block text-sm font-semibold mb-2">
                                Media
                              </label>

                              <label className="border-2 border-dashed rounded-2xl h-44 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">

                                {!post?.preview ? (

                                  <>

                                    <span className="material-symbols-outlined text-5xl text-primary mb-2">
                                      add_photo_alternate
                                    </span>

                                    <p className="font-semibold">
                                      Upload Media
                                    </p>

                                  </>

                                ) : (

                                  <img
                                    src={post.preview}
                                    alt="preview"
                                    className="w-full h-full object-cover"
                                  />
                                )}

                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*,video/*"
                                  onChange={(e) =>
                                    handlePlatformFile(
                                      platform,
                                      e.target.files?.[0]
                                    )
                                  }
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* POST OPTIONS */}

                <div>

                  <h4 className="font-bold text-lg mb-4">
                    Publishing Options
                  </h4>

                  <div className="grid md:grid-cols-2 gap-5">

                    <button
                      type="button"
                      onClick={() => setPostType('now')}
                      className={`border rounded-2xl p-5 text-left ${
                        postType === 'now'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200'
                      }`}
                    >

                      <div className="flex items-center gap-3 mb-2">

                        <span className="material-symbols-outlined text-primary">
                          send
                        </span>

                        <h5 className="font-bold">
                          Post Now
                        </h5>
                      </div>

                      <p className="text-sm text-gray-500">
                        Publish immediately
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPostType('schedule')
                      }
                      className={`border rounded-2xl p-5 text-left ${
                        postType === 'schedule'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200'
                      }`}
                    >

                      <div className="flex items-center gap-3 mb-2">

                        <span className="material-symbols-outlined text-primary">
                          schedule
                        </span>

                        <h5 className="font-bold">
                          Schedule Post
                        </h5>
                      </div>

                      <p className="text-sm text-gray-500">
                        Publish later
                      </p>
                    </button>
                  </div>

                  {postType === 'schedule' && (

                    <div className="grid md:grid-cols-2 gap-5 mt-5">

                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) =>
                          setScheduleDate(e.target.value)
                        }
                        className="border rounded-2xl px-4 py-3"
                      />

                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) =>
                          setScheduleTime(e.target.value)
                        }
                        className="border rounded-2xl px-4 py-3"
                      />
                    </div>
                  )}
                </div>

                {/* FOOTER */}

                <div className="flex justify-end gap-4">

                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 rounded-2xl border font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleCreatePost}
                    disabled={submitting}
                    className="px-8 py-3 rounded-2xl bg-primary text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                  >

                    <span className="material-symbols-outlined text-[18px]">
                      publish
                    </span>

                    {submitting
                      ? 'Processing...'
                      : postType === 'schedule'
                      ? 'Schedule Post'
                      : 'Publish Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POSTS */}

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200">

          <div className="px-6 py-5 border-b flex items-center justify-between">

            <div>

              <h3 className="font-bold text-xl">
                Recent & Scheduled Posts
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Latest publishing activity
              </p>
            </div>

            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-2 rounded-full">
              {posts.length} Posts
            </span>
          </div>

          <div className="divide-y">

            {loadingPosts ? (

              <div className="p-10 text-center text-gray-500">
                Loading posts...
              </div>

            ) : posts.length === 0 ? (

              <div className="p-10 text-center text-gray-500">
                No posts available
              </div>

            ) : (

              posts.map((post) => (

                <div
                  key={post.id}
                  className="p-6 hover:bg-gray-50 transition-all flex items-start gap-5"
                >

                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">

                    {post.media_url ? (

                      <img
                        src={post.media_url}
                        alt="post"
                        className="w-full h-full object-cover"
                      />

                    ) : (

                      <div className="w-full h-full flex items-center justify-center">

                        <span className="material-symbols-outlined text-3xl text-gray-400">
                          image
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-2 mb-2 flex-wrap">

                      {post.platforms?.map((platform) => (

                        <span
                          key={platform}
                          className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-1 rounded-full"
                        >
                          {platform}
                        </span>
                      ))}

                      <span className="ml-auto text-xs font-semibold text-gray-500">
                        {post.status}
                      </span>
                    </div>

                    <h4 className="font-semibold line-clamp-1">
                      {post.title}
                    </h4>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {post.caption}
                    </p>

                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(
                        post.created_at
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </SMHLayout>
  );
}