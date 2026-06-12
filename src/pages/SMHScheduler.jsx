import { useState, useEffect, useMemo } from "react";
import SMHLayout from "../components/SMHLayout";
import { updatePost, deletePost } from "../services/postService";

const PLATFORMS = [
  { value: "facebook", label: "Facebook", color: "bg-[#1877F2]", icon: "facebook" },
  { value: "instagram", label: "Instagram", color: "bg-pink-600", icon: "photo_camera" },
  { value: "linkedin", label: "LinkedIn", color: "bg-[#0077B5]", icon: "groups" },
  { value: "twitter", label: "Twitter/X", color: "bg-black", icon: "close" },
  { value: "youtube", label: "YouTube", color: "bg-red-600", icon: "play_circle" },
  { value: "pinterest", label: "Pinterest", color: "bg-[#E60023]", icon: "push_pin" },
];

const PLATFORM_ICONS = {
  facebook:  "https://cdn.simpleicons.org/facebook/1877F2",
  instagram: "https://cdn.simpleicons.org/instagram/E4405F",
  twitter:   "https://cdn.simpleicons.org/x/000000",
  linkedin:  "https://cdn.simpleicons.org/linkedin/0A66C2",
  youtube:   "https://cdn.simpleicons.org/youtube/FF0000",
  pinterest: "https://cdn.simpleicons.org/pinterest/E60023",
};

const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = [".mp4", ".mov", ".avi", ".webm", ".ogg", ".mkv", ".m4v", ".3gp"];
  const cleanUrl = url.split("?")[0].toLowerCase();
  return videoExtensions.some(ext => cleanUrl.endsWith(ext));
};

const mapBackendPost = (bp) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  let displayStatus = "pending";
  if (bp.status === "POSTED") {
    displayStatus = "success";
  }

  const clientName = bp.clients && bp.clients.length > 0
    ? bp.clients.map(c => c.name).join(", ")
    : "—";

  const platformData = (bp.platform_statuses && bp.platform_statuses.length > 0)
    ? bp.platform_statuses.map((ps) => ({
        platform: ps.platform,
        status: ps.status,
      }))
    : (bp.platforms || []).map((p) => {
        const pLower = p.toLowerCase();
        let status = "Pending";
        if (bp.status === "POSTED") status = "Posted";
        else if (bp.status === "FAILED") status = "Failed";
        else if (bp.status === "SCHEDULED") status = "Scheduled";
        return {
          platform: pLower,
          status: status,
        };
      });

  return {
    id: bp.id,
    client: clientName,
    clientsList: bp.clients || [],
    date: formatDate(bp.scheduled_time || bp.posted_time || bp.created_at),
    rawDate: bp.scheduled_time || bp.posted_time || bp.created_at,
    topic: bp.title || (bp.caption ? bp.caption.substring(0, 50) : "Untitled Post"),
    description: bp.caption || "",
    image: bp.media_url || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7",
    platforms: bp.platforms || [],
    platformData: platformData,
    status: displayStatus,
    rawBackendPost: bp
  };
};

export default function SMHScheduler() {
  const [viewMode, setViewMode]           = useState("list");
  const [filterDate, setFilterDate]       = useState("");
  const [filterClient, setFilterClient]   = useState("All Clients");
  const [filterCount, setFilterCount]     = useState("All Posts");
  const [filterStatus, setFilterStatus]   = useState("All Status");
  const [selectedPost, setSelectedPost]   = useState(null);
  const [showPostPopup, setShowPostPopup] = useState(false);

  // Per-post real analytics
  const [postAnalytics, setPostAnalytics]               = useState(null);
  const [loadingPostAnalytics, setLoadingPostAnalytics] = useState(false);

  // Add Post States
  const [showModal, setShowModal]                   = useState(false);
  const [clients, setClients]                       = useState([]);
  const [posts, setPosts]                           = useState([]);
  const [selectedClient, setSelectedClient]         = useState("");
  const [clientConnectedPlatforms, setClientConnectedPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms]   = useState([]);
  const [postingMode, setPostingMode]               = useState("common");
  const [postType, setPostType]                     = useState("now");
  const [scheduleDate, setScheduleDate]             = useState("");
  const [scheduleTime, setScheduleTime]             = useState("");
  const [submitting, setSubmitting]                 = useState(false);

  // Common Post States
  const [commonCaption, setCommonCaption]           = useState("");
  const [commonMedia, setCommonMedia]               = useState(null);
  const [commonPreview, setCommonPreview]           = useState(null);

  // Individual Post States
  const [platformPosts, setPlatformPosts]           = useState({});

  // Edit/Delete States
  const [editPost, setEditPost]           = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [deletePostObj, setDeletePostObj] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Content Calendar Navigation
  const [calendarDate, setCalendarDate]   = useState(new Date());
  const [currentPage, setCurrentPage]     = useState(1);

  // API calls
  const fetchClients = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/clients/");
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/posts/");
      const data = await res.json();
      const mapped = data.map(mapBackendPost);
      setPosts(mapped);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchPosts();
  }, []);

  // Fetch connected platforms dynamically
  useEffect(() => {
    async function fetchConnectedPlatforms() {
      if (!selectedClient) {
        setClientConnectedPlatforms([]);
        setSelectedPlatforms([]);
        return;
      }
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/connected-platforms/?client_id=${selectedClient}`
        );
        const data = await response.json();
        const connected = data.filter(p => p.connected).map(p => p.value);
        setClientConnectedPlatforms(connected);
        setSelectedPlatforms(prev => prev.filter(p => connected.includes(p)));
      } catch (error) {
        console.error(error);
      }
    }
    fetchConnectedPlatforms();
  }, [selectedClient]);

  const clientNames = useMemo(() => {
    return ["All Clients", ...clients.map(c => c.name)];
  }, [clients]);

  // Filtering logic
  const filtered = useMemo(() => {
    return posts.filter(p => {
      // Date filter
      if (filterDate) {
        const postDate = new Date(p.rawDate);
        const selected = new Date(filterDate);
        if (postDate < selected) return false;
      }
      // Client filter
      if (filterClient !== "All Clients" && p.client !== filterClient) return false;
      // Status filter
      if (filterStatus === "Posted"  && p.status !== "success") return false;
      if (filterStatus === "Pending" && p.status !== "pending") return false;
      return true;
    });
  }, [posts, filterDate, filterClient, filterStatus]);

  // No. of Posts filter
  const countFiltered = useMemo(() => {
    if (filterCount === "1-5")  return filtered.slice(0, 5);
    if (filterCount === "5-10") return filtered.slice(0, 10);
    if (filterCount === "10+")  return filtered.slice(0, 20);
    return filtered;
  }, [filtered, filterCount]);

  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterClient, filterCount, filterStatus]);

  const totalPages = Math.ceil(countFiltered.length / itemsPerPage);
  const paginatedPosts = useMemo(() => {
    return countFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [countFiltered, currentPage]);

  const openPost = async (post) => {
    setSelectedPost(post);
    setShowPostPopup(true);
    setPostAnalytics(null);

    if (post.status === 'success' && post.id) {
      setLoadingPostAnalytics(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/posts/${post.id}/analytics/`);
        const data = await res.json();
        setPostAnalytics(data);
      } catch (err) {
        console.warn('Could not load post analytics:', err);
        setPostAnalytics({ available: false, reason: 'Failed to load analytics.' });
      } finally {
        setLoadingPostAnalytics(false);
      }
    }
  };

  const resetFilters = () => {
    setFilterDate("");
    setFilterClient("All Clients");
    setFilterCount("All Posts");
    setFilterStatus("All Status");
  };

  const hasActiveFilters = filterDate || filterClient !== "All Clients" || filterCount !== "All Posts" || filterStatus !== "All Status";

  // Form toggles and handlers
  function togglePlatform(platform) {
    setSelectedPlatforms((prev) => {
      const exists = prev.includes(platform);
      if (exists) {
        return prev.filter((p) => p !== platform);
      }
      return [...prev, platform];
    });

    if (!platformPosts[platform]) {
      setPlatformPosts((prev) => ({
        ...prev,
        [platform]: {
          caption: "",
          media: null,
          preview: null,
        },
      }));
    }
  }

  function handleCommonMedia(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommonMedia(file);
    setCommonPreview(URL.createObjectURL(file));
  }

  function handlePlatformMedia(platform, file) {
    if (!file) return;
    setPlatformPosts((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        media: file,
        preview: URL.createObjectURL(file),
      },
    }));
  }

  function handlePlatformThumbnail(platform, file) {
    if (!file) return;
    setPlatformPosts((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        thumbnail: file,
        thumbnailPreview: URL.createObjectURL(file),
      },
    }));
  }

  function handlePlatformCaption(platform, value) {
    setPlatformPosts((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        caption: value,
      },
    }));
  }

  function handlePlatformMetadata(platform, key, value) {
    setPlatformPosts((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        metadata: {
          ...(prev[platform]?.metadata || {}),
          [key]: value
        }
      }
    }));
  }

  function resetForm() {
    setSelectedClient("");
    setSelectedPlatforms([]);
    setPostingMode("common");
    setPostType("now");
    setScheduleDate("");
    setScheduleTime("");
    setCommonCaption("");
    setCommonMedia(null);
    setCommonPreview(null);
    setPlatformPosts({});
  }

  async function handleCreatePost() {
    if (!selectedClient) {
      alert("Select client");
      return;
    }
    if (selectedPlatforms.length === 0) {
      alert("Select platforms");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      formData.append("client_id", selectedClient);
      formData.append("posting_mode", postingMode);
      formData.append("mode", postType === "schedule" ? "later" : "now");

      // COMMON MODE
      if (postingMode === "common") {
        if (!commonCaption.trim()) {
          alert("Caption required");
          setSubmitting(false);
          return;
        }
        formData.append("common_caption", commonCaption);
        if (commonMedia) {
          formData.append("common_media", commonMedia);
        }
        selectedPlatforms.forEach((platform) => {
          formData.append("common_platforms", platform);
        });
      }
      // INDIVIDUAL MODE
      else {
        selectedPlatforms.forEach((platform) => {
          formData.append("individual_platforms", platform);
          formData.append(`${platform}_caption`, platformPosts[platform]?.caption || "");

          if (platformPosts[platform]?.media) {
            formData.append(`${platform}_media`, platformPosts[platform].media);
          }

          if (platform === "youtube" && platformPosts[platform]?.thumbnail) {
            formData.append("youtube_thumbnail", platformPosts[platform].thumbnail);
          }

          if (platformPosts[platform]?.metadata) {
            formData.append(`${platform}_metadata`, JSON.stringify(platformPosts[platform].metadata));
          }
        });
      }

      // SCHEDULE
      if (postType === "schedule") {
        if (!scheduleDate || !scheduleTime) {
          alert("Select schedule date and time");
          setSubmitting(false);
          return;
        }
        const scheduledDateTime = `${scheduleDate}T${scheduleTime}:00`;
        formData.append("scheduled_time", scheduledDateTime);
      }

      const response = await fetch("http://127.0.0.1:8000/api/smh/posts/create/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      alert(postType === "schedule" ? "Post Scheduled successfully" : "Post Published successfully");
      resetForm();
      setShowModal(false);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Edit handlers
  const openEdit = (post, e) => {
    e.stopPropagation();
    const scheduledDateTime = post.rawBackendPost.scheduled_time
      ? post.rawBackendPost.scheduled_time.slice(0, 16)
      : new Date().toISOString().slice(0, 16);
    setEditPost({
      ...post,
      scheduledDateTime,
    });
    setShowEditPopup(true);
  };

  const saveEdit = async () => {
    try {
      let isoStr = null;
      if (editPost.scheduledDateTime) {
        isoStr = new Date(editPost.scheduledDateTime).toISOString();
      }
      await updatePost(editPost.id, {
        title: editPost.topic,
        caption: editPost.description,
        scheduled_time: isoStr,
        status: editPost.rawBackendPost.status
      });
      alert("Post updated successfully!");
      setShowEditPopup(false);
      fetchPosts();
    } catch (err) {
      alert("Failed to update post: " + err.message);
    }
  };

  // Delete handlers
  const openDelete = (post, e) => {
    e.stopPropagation();
    setDeletePostObj(post);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePost(deletePostObj.id);
      alert("Post deleted successfully!");
      setShowDeleteConfirm(false);
      fetchPosts();
    } catch (err) {
      alert("Failed to delete post: " + err.message);
    }
  };

  // Calendar cells generation
  const calendarCells = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, date: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d, date: new Date(year, month, d) });
    }
    return cells;
  }, [calendarDate]);

  const monthName = calendarDate.toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCalendarDate(new Date());
  };

  const selectedClientName = useMemo(() => {
    const client = clients.find(c => c.id === Number(selectedClient));
    return client?.name || client?.organization || client?.username || "";
  }, [selectedClient, clients]);

  return (
    <SMHLayout>
      <main className="w-full min-h-screen p-8 bg-[#F6F5FA]">

        {/* PAGE HEADER */}
        <div className="flex items-end justify-between mb-10 w-full">
          <div>
            <h2 className="text-[42px] font-bold text-[#031B4E] mb-2">Scheduler</h2>
            <p className="text-gray-500 text-lg">Manage your cross-platform content timeline and campaign distribution.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-gray-200 rounded-xl p-1 flex gap-1">
              <button onClick={() => setViewMode("list")} className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${viewMode === "list" ? "bg-white shadow text-[#031B4E]" : "text-gray-500"}`}>List View</button>
              <button onClick={() => setViewMode("calendar")} className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${viewMode === "calendar" ? "bg-white shadow text-[#031B4E]" : "text-gray-500"}`}>Calendar View</button>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-[#031B4E] text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">add</span>Add Post
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 mb-10 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-bold mb-3 text-[#031B4E]">Filter by Date (from)</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-3 text-[#031B4E]">Client</label>
              <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition">
                {clientNames.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-3 text-[#031B4E]">No. of Posts</label>
              <select value={filterCount} onChange={e => setFilterCount(e.target.value)} className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition">
                <option>All Posts</option>
                <option>1-5</option>
                <option>5-10</option>
                <option>10+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-3 text-[#031B4E]">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition">
                <option>All Status</option>
                <option>Posted</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing <span className="font-bold text-[#031B4E]">{countFiltered.length}</span> of <span className="font-bold text-[#031B4E]">{posts.length}</span> posts
              </p>
              <button onClick={resetFilters} className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition">
                <span className="material-symbols-outlined text-[16px]">close</span>Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* LIST VIEW — TABLE */}
        {viewMode === "list" && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200 w-full mb-10">
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-[28px] font-bold text-[#031B4E]">Posts Overview</h3>
              <span className="bg-[#031B4E] text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide">
                {countFiltered.filter(p => p.status === "pending").length} Pending
              </span>
            </div>

            <table className="w-full">
              <thead className="bg-[#F4F6FB]">
                <tr>
                  {["Client","Date","Topic","Description","Image","Platform","Analytics","Status","Actions"].map(h => (
                    <th key={h} className="px-6 py-5 text-left text-[#031B4E] font-bold text-sm uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => openPost(post)}
                  >
                    <td className="px-6 py-6 font-semibold text-[#031B4E] text-sm whitespace-nowrap">{post.client}</td>
                    <td className="px-6 py-6 font-bold text-[#031B4E] whitespace-nowrap">{post.date}</td>
                    <td className="px-6 py-6 font-semibold text-[#031B4E]">{post.topic}</td>
                    <td className="px-6 py-6 text-gray-600 text-sm max-w-[180px] truncate">{post.description}</td>
                    <td className="px-6 py-6">
                      {post.image ? (
                        isVideoUrl(post.image) ? (
                          <video src={post.image} className="w-24 h-16 rounded-xl object-cover border border-gray-100" muted preload="metadata" />
                        ) : (
                          <img src={post.image} alt="" className="w-24 h-16 rounded-xl object-cover" />
                        )
                      ) : (
                        <div className="w-24 h-16 bg-gray-100 flex items-center justify-center rounded-xl text-gray-400">
                          <span className="material-symbols-outlined text-[20px]">image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {post.platformData.map((pd, idx) => (
                          <div key={idx} className="relative w-fit" onClick={() => openPost(post)}>
                            <img src={PLATFORM_ICONS[pd.platform] || PLATFORM_ICONS.instagram} alt={pd.platform} className="w-10 h-10 rounded-xl hover:scale-110 transition object-contain" />
                            {pd.status === "Posted" && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-white bg-green-500">
                                ✓
                              </div>
                            )}
                            {(pd.status === "Pending" || pd.status === "Failed" || pd.status === "Scheduled") && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-white bg-orange-500">
                                !
                              </div>
                            )}
                          </div>
                        ))}
                        {post.platformData.length === 0 && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                        {post.status === "success" ? (
                          <button
                            onClick={e => { e.stopPropagation(); openPost(post); }}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#031B4E] bg-[#031B4E]/5 hover:bg-[#031B4E]/10 border border-[#031B4E]/10 px-3 py-1.5 rounded-xl transition"
                          >
                            <span className="material-symbols-outlined text-[14px]">analytics</span>
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 font-semibold">—</span>
                        )}
                      </td>
                    <td className="px-6 py-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${post.status === "success" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {post.status === "success" ? "Posted" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-6" onClick={e => e.stopPropagation()}>
                      {post.status !== "success" && (
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => openEdit(post, e)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition" title="Edit">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={(e) => openDelete(post, e)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition" title="Delete">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {countFiltered.length === 0 && (
                  <tr><td colSpan={9} className="px-8 py-12 text-center text-gray-400 text-lg">No posts match the selected filters.</td></tr>
                )}
              </tbody>
            </table>

            {/* PAGINATION BAR */}
            {totalPages > 1 && (
              <div className="px-8 py-5 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
                <span className="text-sm text-gray-500 font-medium">
                  Showing <span className="font-semibold text-[#031B4E]">{Math.min((currentPage - 1) * itemsPerPage + 1, countFiltered.length)}</span> to{" "}
                  <span className="font-semibold text-[#031B4E]">{Math.min(currentPage * itemsPerPage, countFiltered.length)}</span> of{" "}
                  <span className="font-semibold text-[#031B4E]">{countFiltered.length}</span> posts
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="flex items-center gap-1 px-4 py-2 border rounded-xl font-semibold text-sm transition hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent text-[#031B4E] bg-white"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span> Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-semibold text-sm transition flex items-center justify-center border ${
                        currentPage === page ? "bg-[#031B4E] text-white border-[#031B4E]" : "bg-white hover:bg-gray-100 text-[#031B4E] border-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="flex items-center gap-1 px-4 py-2 border rounded-xl font-semibold text-sm transition hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent text-[#031B4E] bg-white"
                  >
                    Next <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CALENDAR VIEW */}
        {viewMode === "calendar" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-10 mb-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[32px] font-bold text-[#031B4E]">{monthName}</h2>
              <div className="flex gap-4">
                <button onClick={prevMonth} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 transition rounded-xl font-semibold">Previous</button>
                <button onClick={goToToday} className="px-5 py-2 bg-[#031B4E] text-white rounded-xl font-semibold">Today</button>
                <button onClick={nextMonth} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 transition rounded-xl font-semibold">Next</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => (
                <div key={day} className="bg-[#031B4E] text-white py-4 rounded-2xl text-center font-bold">{day}</div>
              ))}
              {calendarCells.map((cell, idx) => {
                if (!cell.day) {
                  return <div key={`empty-${idx}`} className="h-[140px] bg-gray-50 border border-gray-100 rounded-2xl p-3" />;
                }
                const dayPosts = posts.filter(p => {
                  if (!p.rawDate) return false;
                  const d = new Date(p.rawDate);
                  return d.getDate() === cell.day &&
                         d.getMonth() === calendarDate.getMonth() &&
                         d.getFullYear() === calendarDate.getFullYear();
                });

                return (
                  <div key={`day-${cell.day}`} className="h-[140px] bg-gray-50 border border-gray-200 rounded-2xl p-3 hover:border-[#031B4E] transition-all overflow-y-auto">
                    <div className="font-bold text-[#031B4E] mb-2">{cell.day}</div>
                    {dayPosts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => openPost(p)}
                        className={`text-[11px] p-1.5 rounded-lg font-semibold truncate mb-1 cursor-pointer transition ${p.status === "success" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                        title={p.topic}
                      >
                        {p.platforms.map(plat => plat.charAt(0).toUpperCase()).join("/")}: {p.topic}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CREATE POST MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
              {/* HEADER */}
              <div className="flex items-center justify-between px-8 py-6 border-b">
                <div>
                  <h3 className="text-2xl font-bold text-[#031B4E]">Create New Post</h3>
                  <p className="text-sm text-gray-500 mt-1">Multi-platform campaign and social timeline scheduling</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl">×</button>
              </div>

              {/* BODY */}
              <div className="p-8 overflow-y-auto max-h-[80vh] space-y-8">
                
                {/* SELECT CLIENT */}
                <div>
                  <label className="block text-base font-bold mb-3 text-[#031B4E]">Select Client</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full border rounded-2xl px-5 py-4 border-gray-300 outline-none focus:border-[#031B4E] transition"
                  >
                    <option value="">Choose Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name || client.organization || client.username}
                      </option>
                    ))}
                  </select>
                  {selectedClientName && (
                    <div className="mt-3 inline-flex bg-blue-50 text-[#031B4E] px-4 py-2 rounded-full text-sm font-semibold border border-blue-100">
                      Active: {selectedClientName}
                    </div>
                  )}
                </div>

                {/* POSTING TYPE */}
                <div>
                  <h3 className="font-bold text-lg mb-4 text-[#031B4E]">Posting Type</h3>
                  <div className="grid md:grid-cols-2 gap-5">
                    <button
                      type="button"
                      onClick={() => setPostingMode("common")}
                      className={`border rounded-2xl p-5 text-left transition ${postingMode === "common" ? "border-[#031B4E] bg-blue-50/30" : "border-gray-200"}`}
                    >
                      <h4 className="font-bold text-[#031B4E]">One Post → Multiple Platforms</h4>
                      <p className="text-sm text-gray-500 mt-2">Publish same caption & media files across chosen accounts</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostingMode("individual")}
                      className={`border rounded-2xl p-5 text-left transition ${postingMode === "individual" ? "border-[#031B4E] bg-blue-50/30" : "border-gray-200"}`}
                    >
                      <h4 className="font-bold text-[#031B4E]">Separate Platform Posts</h4>
                      <p className="text-sm text-gray-500 mt-2">Specify unique captions, link tags, thumbnails for each platform</p>
                    </button>
                  </div>
                </div>

                {/* SELECT PLATFORMS */}
                <div>
                  <h3 className="font-bold text-lg mb-4 text-[#031B4E]">Select Platforms</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {!selectedClient ? (
                      <p className="text-gray-500 col-span-full py-4 text-center border border-dashed rounded-2xl">
                        Please select a client to see their connected platforms.
                      </p>
                    ) : clientConnectedPlatforms.length === 0 ? (
                      <p className="text-gray-500 col-span-full py-4 text-center border border-dashed rounded-2xl">
                        This client has no connected social media platforms.
                      </p>
                    ) : (
                      PLATFORMS.filter(p => clientConnectedPlatforms.includes(p.value)).map((platform) => {
                        const active = selectedPlatforms.includes(platform.value);
                        return (
                          <button
                            key={platform.value}
                            type="button"
                            onClick={() => togglePlatform(platform.value)}
                            className={`border rounded-2xl p-4 transition-all ${active ? "border-[#031B4E] bg-blue-50/40" : "border-gray-200"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden p-1.5 shadow-sm">
                                <img src={PLATFORM_ICONS[platform.value]} alt={platform.label} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <p className="font-semibold text-left text-[#031B4E]">{platform.label}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COMMON POST FORM */}
                {postingMode === "common" && (
                  <div className="border rounded-3xl p-6 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="material-symbols-outlined text-[#031B4E]">public</span>
                      <h4 className="font-bold text-lg text-[#031B4E]">Common Post Fields</h4>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold mb-2 text-[#031B4E]">Common Caption</label>
                        <textarea
                          value={commonCaption}
                          onChange={(e) => setCommonCaption(e.target.value)}
                          placeholder="This caption will be used as default for selected platforms..."
                          className="w-full h-52 border border-gray-300 rounded-2xl p-4 resize-none outline-none focus:border-[#031B4E]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 text-[#031B4E]">Common Media</label>
                        <label className="border-2 border-dashed rounded-2xl h-52 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative border-gray-300 hover:border-[#031B4E] transition">
                          {!commonPreview ? (
                            <>
                              <span className="material-symbols-outlined text-5xl text-[#031B4E] mb-2">cloud_upload</span>
                              <p className="font-bold text-[#031B4E]">Upload Media File</p>
                              <p className="text-xs text-gray-500 mt-1">Image or Video support</p>
                            </>
                          ) : (
                            <>
                              {commonMedia && commonMedia.type.startsWith("video/") ? (
                                <video src={commonPreview} className="w-full h-full object-cover" controls={false} muted />
                              ) : (
                                <img src={commonPreview} alt="preview" className="w-full h-full object-cover" />
                              )}
                            </>
                          )}
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={handleCommonMedia} />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* INDIVIDUAL POST FORM */}
                {postingMode === "individual" && selectedPlatforms.length > 0 && (
                  <div className="space-y-8">
                    <h4 className="font-bold text-xl text-[#031B4E]">Platform-Specific Configurations</h4>
                    {selectedPlatforms.map((platform) => {
                      const cur = PLATFORMS.find(p => p.value === platform);
                      const post = platformPosts[platform];
                      return (
                        <div key={platform} className="border rounded-3xl p-6 border-gray-200 bg-white shadow-sm">
                          <div className="flex items-center gap-3 mb-5 border-b pb-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden p-2 shadow-sm">
                              <img src={PLATFORM_ICONS[platform]} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <h5 className="font-bold text-lg text-[#031B4E] capitalize">{platform} Details</h5>
                              <p className="text-sm text-gray-500">Configure parameters for {cur.label}</p>
                            </div>
                          </div>

                          <div className="grid lg:grid-cols-2 gap-8">
                            {/* FACEBOOK CONFIGS */}
                            {platform === "facebook" && (
                              <div className="lg:col-span-2 grid gap-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-bold mb-2 text-[#031B4E]">Post Type</label>
                                    <select
                                      className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                      value={post?.metadata?.post_type || "Feed Post"}
                                      onChange={(e) => handlePlatformMetadata(platform, "post_type", e.target.value)}
                                    >
                                      <option>Feed Post</option>
                                      <option>Photo Post</option>
                                      <option>Video Post</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold mb-2 text-[#031B4E]">Place ID</label>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                      placeholder="e.g. 109823719"
                                      value={post?.metadata?.place || ""}
                                      onChange={(e) => handlePlatformMetadata(platform, "place", e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Message / Caption</label>
                                  <textarea
                                    value={post?.caption || ""}
                                    onChange={(e) => handlePlatformCaption(platform, e.target.value)}
                                    placeholder="Write caption for Facebook..."
                                    className="w-full h-32 border border-gray-300 rounded-2xl p-4 resize-none outline-none focus:border-[#031B4E] transition"
                                  />
                                </div>

                                {post?.metadata?.post_type === "Video Post" && (
                                  <div>
                                    <label className="block text-sm font-bold mb-2 text-[#031B4E]">Video Title</label>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                      placeholder="Facebook Video Title"
                                      value={post?.metadata?.title || ""}
                                      onChange={(e) => handlePlatformMetadata(platform, "title", e.target.value)}
                                    />
                                  </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-6">
                                  {post?.metadata?.post_type === "Feed Post" && (
                                    <div>
                                      <label className="block text-sm font-bold mb-2 text-[#031B4E]">Link URL</label>
                                      <input
                                        type="url"
                                        className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                        placeholder="https://example.com"
                                        value={post?.metadata?.link || ""}
                                        onChange={(e) => handlePlatformMetadata(platform, "link", e.target.value)}
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <label className="block text-sm font-bold mb-2 text-[#031B4E]">Tags (comma separated)</label>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                      placeholder="marketing, social"
                                      value={post?.metadata?.tags || ""}
                                      onChange={(e) => handlePlatformMetadata(platform, "tags", e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* INSTAGRAM CONFIGS */}
                            {platform === "instagram" && (
                              <div className="lg:col-span-2 grid gap-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-bold mb-2 text-[#031B4E]">Post Type</label>
                                    <select
                                      className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                      value={post?.metadata?.post_type || "Image"}
                                      onChange={(e) => handlePlatformMetadata(platform, "post_type", e.target.value)}
                                    >
                                      <option>Image</option>
                                      <option>Reel</option>
                                      <option>Video</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold mb-2 text-[#031B4E]">Location ID</label>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                      placeholder="Instagram Location ID"
                                      value={post?.metadata?.location_id || ""}
                                      onChange={(e) => handlePlatformMetadata(platform, "location_id", e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Caption</label>
                                  <textarea
                                    value={post?.caption || ""}
                                    onChange={(e) => handlePlatformCaption(platform, e.target.value)}
                                    placeholder="Write caption for Instagram..."
                                    className="w-full h-32 border border-gray-300 rounded-2xl p-4 resize-none outline-none focus:border-[#031B4E] transition"
                                  />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-bold mb-2 text-[#031B4E]">User Tags (comma separated)</label>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                      placeholder="tag_user1, tag_user2"
                                      value={post?.metadata?.user_tags || ""}
                                      onChange={(e) => handlePlatformMetadata(platform, "user_tags", e.target.value)}
                                    />
                                  </div>
                                  {["Reel", "Video"].includes(post?.metadata?.post_type) && (
                                    <div className="flex flex-col justify-center">
                                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input
                                          type="checkbox"
                                          className="w-5 h-5 rounded border-gray-300 text-[#031B4E]"
                                          checked={post?.metadata?.share_to_feed !== false}
                                          onChange={(e) => handlePlatformMetadata(platform, "share_to_feed", e.target.checked)}
                                        />
                                        <span className="font-bold text-sm text-[#031B4E]">Share to Feed</span>
                                      </label>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-[#031B4E]">Thumb Offset (ms):</span>
                                        <input
                                          type="number"
                                          className="border border-gray-300 rounded-xl p-2 w-24 outline-none focus:border-[#031B4E]"
                                          value={post?.metadata?.thumb_offset || ""}
                                          onChange={(e) => handlePlatformMetadata(platform, "thumb_offset", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* YOUTUBE CONFIGS */}
                            {platform === "youtube" && (
                              <div className="lg:col-span-2 grid gap-6">
                                <div>
                                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Video Title</label>
                                  <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                    placeholder="Enter YouTube title..."
                                    value={post?.metadata?.title || ""}
                                    onChange={(e) => handlePlatformMetadata(platform, "title", e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Description</label>
                                  <textarea
                                    value={post?.caption || ""}
                                    onChange={(e) => handlePlatformCaption(platform, e.target.value)}
                                    placeholder="Write YouTube description..."
                                    className="w-full h-32 border border-gray-300 rounded-2xl p-4 resize-none outline-none focus:border-[#031B4E] transition"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Tags (comma separated)</label>
                                  <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                                    placeholder="tutorial, react, technology"
                                    value={post?.metadata?.tags || ""}
                                    onChange={(e) => handlePlatformMetadata(platform, "tags", e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Video Thumbnail</label>
                                  <label className="border-2 border-dashed rounded-3xl h-32 flex flex-col items-center justify-center overflow-hidden cursor-pointer border-gray-300 hover:border-[#031B4E] transition relative">
                                    {!post?.thumbnailPreview ? (
                                      <div className="text-center p-4">
                                        <span className="material-symbols-outlined text-3xl text-gray-400">image</span>
                                        <p className="mt-1 font-bold text-gray-500 text-xs">Upload Custom Thumbnail</p>
                                        <p className="text-[10px] text-gray-400">JPG or PNG (Recommended: 1280x720)</p>
                                      </div>
                                    ) : (
                                      <img src={post.thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                                    )}
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/jpeg,image/png"
                                      onChange={(e) => handlePlatformThumbnail(platform, e.target.files?.[0])}
                                    />
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* OTHER GENERIC CONFIGS */}
                            {!["facebook", "instagram", "youtube"].includes(platform) && (
                              <div className="lg:col-span-2">
                                <label className="block text-sm font-bold mb-2 text-[#031B4E]">Caption</label>
                                <textarea
                                  value={post?.caption || ""}
                                  onChange={(e) => handlePlatformCaption(platform, e.target.value)}
                                  placeholder={`Write ${platform} caption...`}
                                  className="w-full h-32 border border-gray-300 rounded-2xl p-4 resize-none outline-none focus:border-[#031B4E] transition"
                                />
                              </div>
                            )}

                            {/* MEDIA UPLOAD BOX FOR INDIVIDUAL PLATFORM */}
                            {!(platform === "facebook" && post?.metadata?.post_type === "Feed Post") && (
                              <div className="lg:col-span-2">
                                <label className="block text-sm font-bold mb-2 text-[#031B4E]">Media Upload</label>
                                <label className="border-2 border-dashed rounded-3xl h-40 flex flex-col items-center justify-center overflow-hidden cursor-pointer border-gray-300 hover:border-[#031B4E] transition relative">
                                  {!post?.preview ? (
                                    <div className="text-center">
                                      <span className="material-symbols-outlined text-4xl text-gray-400">cloud_upload</span>
                                      <p className="mt-2 font-bold text-gray-500 text-sm">Upload Media</p>
                                    </div>
                                  ) : (
                                    <>
                                      {post.media?.type?.startsWith("video/") ? (
                                        <video src={post.preview} className="w-full h-full object-cover" controls={false} muted />
                                      ) : (
                                        <img src={post.preview} alt="" className="w-full h-full object-cover" />
                                      )}
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,video/*"
                                    onChange={(e) => handlePlatformMedia(platform, e.target.files?.[0])}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PUBLISHING OPTIONS */}
                <div>
                  <h4 className="font-bold text-lg mb-4 text-[#031B4E]">Publishing Options</h4>
                  <div className="grid md:grid-cols-2 gap-5">
                    <button
                      type="button"
                      onClick={() => setPostType("now")}
                      className={`border rounded-2xl p-5 text-left transition ${postType === "now" ? "border-[#031B4E] bg-blue-50/30" : "border-gray-200"}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-[#031B4E]">send</span>
                        <h5 className="font-bold text-[#031B4E]">Post Now</h5>
                      </div>
                      <p className="text-sm text-gray-500">Publish immediately to the selected platforms</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType("schedule")}
                      className={`border rounded-2xl p-5 text-left transition ${postType === "schedule" ? "border-[#031B4E] bg-blue-50/30" : "border-gray-200"}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-[#031B4E]">schedule</span>
                        <h5 className="font-bold text-[#031B4E]">Schedule Post</h5>
                      </div>
                      <p className="text-sm text-gray-500">Publish later at a selected date and time</p>
                    </button>
                  </div>
                  {postType === "schedule" && (
                    <div className="grid md:grid-cols-2 gap-5 mt-5">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="border rounded-2xl px-5 py-4 border-gray-300 outline-none focus:border-[#031B4E]"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="border rounded-2xl px-5 py-4 border-gray-300 outline-none focus:border-[#031B4E]"
                      />
                    </div>
                  )}
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-4 border-t pt-6">
                  <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-2xl border font-semibold border-gray-300 hover:bg-gray-50 transition">Cancel</button>
                  <button
                    onClick={handleCreatePost}
                    disabled={submitting}
                    className="px-8 py-3 rounded-2xl bg-[#031B4E] text-white font-semibold flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">publish</span>
                    {submitting ? "Processing..." : postType === "schedule" ? "Schedule Post" : "Publish Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POST DETAIL POPUP */}
        {showPostPopup && selectedPost && (
          <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-6 overflow-auto">
            <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl w-full max-w-[900px]">
              <div className="flex items-center gap-4 p-6 border-b">
                <div className="flex gap-2">
                  {selectedPost.platforms.map((plat) => (
                    <img key={plat} src={PLATFORM_ICONS[plat]} alt="" className="w-10 h-10 rounded-xl object-contain" />
                  ))}
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-[#031B4E]">{selectedPost.client}</h3>
                  <p className="text-gray-500">{selectedPost.status === "success" ? "Posted Successfully" : "Pending Post"}</p>
                </div>
                <button onClick={() => setShowPostPopup(false)} className="ml-auto w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl">×</button>
              </div>

              {selectedPost.image ? (
                isVideoUrl(selectedPost.image) ? (
                  <video src={selectedPost.image} className="w-full h-[300px] object-cover" controls muted />
                ) : (
                  <img src={selectedPost.image} alt="" className="w-full h-[300px] object-cover" />
                )
              ) : (
                <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-[50px]">image</span>
                </div>
              )}

              <div className="p-8">
                <h2 className="text-3xl font-bold text-[#031B4E] mb-3">{selectedPost.topic}</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">{selectedPost.description}</p>

                {selectedPost.status === "success" && (
                  <div>
                    {/* Analytics header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#031B4E]/10 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#031B4E] text-[18px]">analytics</span>
                        </div>
                        <h3 className="font-bold text-[#031B4E] text-lg">Live Post Analytics</h3>
                      </div>
                      {postAnalytics?.available && (
                        <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Live
                        </span>
                      )}
                    </div>

                    {/* Loading */}
                    {loadingPostAnalytics && (
                      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 flex flex-col items-center gap-3">
                        <div className="animate-spin w-8 h-8 border-4 border-[#031B4E] border-t-transparent rounded-full"></div>
                        <p className="text-gray-500 text-sm font-semibold">Fetching live metrics from platform APIs...</p>
                      </div>
                    )}

                    {/* Real metrics */}
                    {!loadingPostAnalytics && postAnalytics?.available && (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                          {[
                            { label: 'Likes',    value: postAnalytics.totals.likes,    icon: 'favorite',    color: 'text-pink-500',   bg: 'bg-pink-50',   border: 'border-pink-100' },
                            { label: 'Comments', value: postAnalytics.totals.comments, icon: 'chat_bubble', color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100' },
                            { label: 'Shares',   value: postAnalytics.totals.shares,   icon: 'share',       color: 'text-green-500',  bg: 'bg-green-50',  border: 'border-green-100' },
                            { label: 'Views / Reach', value: postAnalytics.totals.reach, icon: 'visibility', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
                          ].map(s => (
                            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 text-center`}>
                              <span className={`material-symbols-outlined text-[28px] ${s.color}`}>{s.icon}</span>
                              <p className="text-gray-500 text-xs mt-2 font-semibold uppercase tracking-wide">{s.label}</p>
                              <p className="text-2xl font-bold text-[#031B4E] mt-1">{s.value.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>

                        {/* Per-platform breakdown */}
                        {postAnalytics.platforms?.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Platform Breakdown</p>
                            {postAnalytics.platforms.map((plat, i) => {
                              const PLAT_COLORS = {
                                instagram: { bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100' },
                                facebook:  { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
                                youtube:   { bg: 'bg-red-50',  text: 'text-red-700',  badge: 'bg-red-100'  },
                              };
                              const pc = PLAT_COLORS[plat.platform] || { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100' };
                              if (!plat.available) return (
                                <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                  <span className="material-symbols-outlined text-amber-500 text-[18px]">info</span>
                                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${pc.badge} ${pc.text}`}>{plat.platform}</span>
                                  <span className="text-xs text-amber-700">{plat.reason}</span>
                                </div>
                              );
                              return (
                                <div key={i} className={`${pc.bg} border border-opacity-50 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap`}>
                                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${pc.badge} ${pc.text}`}>{plat.platform}</span>
                                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                    <span className="material-symbols-outlined text-pink-400 text-[14px]">favorite</span>{plat.likes?.toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                    <span className="material-symbols-outlined text-blue-400 text-[14px]">chat_bubble</span>{plat.comments?.toLocaleString()}
                                  </div>
                                  {plat.shares > 0 && (
                                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                      <span className="material-symbols-outlined text-green-400 text-[14px]">share</span>{plat.shares?.toLocaleString()}
                                    </div>
                                  )}
                                  {(plat.reach || plat.views) > 0 && (
                                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                      <span className="material-symbols-outlined text-purple-400 text-[14px]">visibility</span>{(plat.reach || plat.views)?.toLocaleString()}
                                    </div>
                                  )}
                                  {plat.permalink && (
                                    <a href={plat.permalink} target="_blank" rel="noreferrer"
                                      className="ml-auto flex items-center gap-1 text-xs font-bold text-[#031B4E] hover:underline">
                                      View post
                                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {/* Not available fallback */}
                    {!loadingPostAnalytics && postAnalytics && !postAnalytics.available && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
                        <span className="material-symbols-outlined text-amber-500 text-[24px]">info</span>
                        <div>
                          <h4 className="font-bold text-amber-800 mb-1">Analytics Not Yet Available</h4>
                          <p className="text-amber-700 text-sm">
                            {postAnalytics.reason || 'This post was published before per-post analytics tracking was enabled. New posts will show real metrics.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Initial / no data */}
                    {!loadingPostAnalytics && !postAnalytics && (
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex gap-4">
                        <span className="material-symbols-outlined text-gray-400 text-[24px]">analytics</span>
                        <p className="text-gray-500 text-sm">Analytics data unavailable.</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedPost.status === "pending" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex gap-4">
                    <span className="material-symbols-outlined text-yellow-500 text-[28px]">warning</span>
                    <div>
                      <h4 className="font-bold text-yellow-700 text-lg mb-1">Pending Post</h4>
                      <p className="text-yellow-600">This content is scheduled and has not yet been posted.</p>
                    </div>
                  </div>
                )}

                <button onClick={() => setShowPostPopup(false)} className="mt-8 w-full h-12 bg-[#031B4E] text-white rounded-2xl font-bold hover:opacity-90 transition">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT POPUP */}
        {showEditPopup && editPost && (
          <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-6 overflow-auto">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-[650px] overflow-hidden">
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-[#031B4E]">Edit Scheduled Post</h3>
                <button onClick={() => setShowEditPopup(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl">×</button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Topic/Title</label>
                  <input
                    type="text"
                    value={editPost.topic}
                    onChange={e => setEditPost({ ...editPost, topic: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Caption/Description</label>
                  <textarea
                    value={editPost.description}
                    onChange={e => setEditPost({ ...editPost, description: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-[#031B4E]">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editPost.scheduledDateTime || ""}
                    onChange={e => setEditPost({ ...editPost, scheduledDateTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-[#031B4E] transition"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowEditPopup(false)} className="flex-1 h-12 border border-gray-300 rounded-2xl font-bold hover:bg-gray-50 transition">Cancel</button>
                  <button onClick={saveEdit} className="flex-1 h-12 bg-[#031B4E] text-white rounded-2xl font-bold hover:opacity-90 transition">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM */}
        {showDeleteConfirm && deletePostObj && (
          <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-6">
            <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-[450px] overflow-hidden p-8 text-center">
              <span className="material-symbols-outlined text-red-500 text-6xl mb-4">delete_forever</span>
              <h3 className="text-2xl font-bold text-[#031B4E] mb-2">Delete Post</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-12 border border-gray-300 rounded-2xl font-bold hover:bg-gray-50 transition">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 h-12 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition">Delete</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </SMHLayout>
  );
}
