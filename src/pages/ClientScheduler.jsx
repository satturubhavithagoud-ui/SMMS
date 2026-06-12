import { useState, useEffect, useMemo } from "react";
import ClientLayout from "../components/ClientLayout";
import { getPosts, updatePost, deletePost } from "../services/postService";

const PLATFORM_ICONS = {
  instagram: "https://cdn.simpleicons.org/instagram/E4405F",
  facebook:  "https://cdn.simpleicons.org/facebook/1877F2",
  linkedin:  "https://cdn.simpleicons.org/linkedin/0A66C2",
  youtube:   "https://cdn.simpleicons.org/youtube/FF0000",
  twitter:   "https://cdn.simpleicons.org/x/000000",
  pinterest: "https://cdn.simpleicons.org/pinterest/E60023",
};

/* Platform icon with optional status badge */
function PlatformIcon({ platform, status, size = "w-10 h-10", showBadge = false }) {
  const isYoutube = platform === "youtube";
  const isTwitter = platform === "twitter";
  return (
    <div className="relative inline-flex">
      <img
        src={PLATFORM_ICONS[platform]}
        alt={platform}
        className={`${isYoutube ? "w-14 h-8 object-contain" : size} rounded-lg ${isTwitter ? "bg-black p-1" : ""}`}
      />
      {showBadge && status === "Posted" && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow">
          ✓
        </span>
      )}
      {showBadge && (status === "Pending" || status === "Failed") && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow">
          !
        </span>
      )}

    </div>
  );
}

const STATUS_STYLES = {
  Posted:    "bg-green-100 text-green-700",
  Pending:   "bg-orange-100 text-orange-700",
  Failed:    "bg-orange-100 text-orange-700",
  Scheduled: "bg-blue-100 text-blue-700",
};

/* Per-platform data: each platform can have its own status, stats, and pending reason */

const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg', '.mkv', '.m4v', '.3gp'];
  const cleanUrl = url.split('?')[0].toLowerCase();
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

  let displayStatus = "Pending";
  if (bp.status === "POSTED") {
    displayStatus = "Posted";
  } else if (bp.status === "SCHEDULED") {
    displayStatus = "Scheduled";
  } else if (bp.status === "FAILED") {
    displayStatus = "Failed";
  }

  // Prefer per-platform statuses from the backend when available
  const platformData = (bp.platform_statuses && bp.platform_statuses.length > 0)
    ? bp.platform_statuses.map((ps) => ({
        platform: ps.platform,
        status: ps.status,
        ...(ps.status === 'Pending' ? { pendingReason: bp.status === 'FAILED' ? 'Publish failed. Please check the network connectivity or API token.' : 'Awaiting approval or queue processing.' } : {})
      }))
    : (bp.platforms || []).map((p) => {
        const pLower = p.toLowerCase();
        const pendingReason = bp.status === "FAILED"
          ? "Publish failed. Please check the network connectivity or API token."
          : "Awaiting approval or queue processing.";
        return {
          platform: pLower,
          status: displayStatus,
          ...(displayStatus === "Pending" ? { pendingReason } : {})
        };
      });

  return {
    id: bp.id,
    date: formatDate(bp.scheduled_time || bp.posted_time || bp.created_at),
    caption: bp.title || (bp.caption ? bp.caption.substring(0, 60) + (bp.caption.length > 60 ? "..." : "") : "Untitled Post"),
    content: bp.caption || "",
    artwork: bp.media_url || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7",
    status: displayStatus,
    platformData,
    rawBackendPost: bp
  };
};

const PLATFORMS = [
  { value: "facebook", label: "Facebook", color: "bg-[#1877F2]", icon: "facebook" },
  { value: "instagram", label: "Instagram", color: "bg-pink-600", icon: "photo_camera" },
  { value: "linkedin", label: "LinkedIn", color: "bg-[#0077B5]", icon: "groups" },
  { value: "twitter", label: "Twitter/X", color: "bg-black", icon: "close" },
  { value: "youtube", label: "YouTube", color: "bg-red-600", icon: "play_circle" },
  { value: "pinterest", label: "Pinterest", color: "bg-[#E60023]", icon: "push_pin" },
];

export default function ClientScheduler() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [posts, setPosts] = useState([]);

  const [selectedPost, setSelectedPost]       = useState(null);
  const [showPostPopup, setShowPostPopup]     = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showPlatformPopup, setShowPlatformPopup] = useState(false);

  const [editPost, setEditPost]               = useState(null);
  const [showEditPopup, setShowEditPopup]     = useState(false);
  const [deletePostObj, setDeletePostObj]     = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Live per-post analytics
  const [postAnalytics, setPostAnalytics]               = useState(null);
  const [loadingPostAnalytics, setLoadingPostAnalytics] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo]     = useState("");
  const [currentPage, setCurrentPage]       = useState(1);

  const exportFilter = "all";
  const exportCount = 10;

  // Add Post States
  const [showModal, setShowModal]                   = useState(false);
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

  const loadPosts = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await getPosts(user.client_id);
      const mapped = res.map(mapBackendPost);
      setPosts(mapped);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Fetch connected platforms dynamically for this client
  useEffect(() => {
    async function fetchConnectedPlatforms() {
      if (!user.client_id) {
        setClientConnectedPlatforms([]);
        setSelectedPlatforms([]);
        return;
      }
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/connected-platforms/?client_id=${user.client_id}`
        );
        const data = await response.json();
        const connected = data.filter(p => p.connected).map(p => p.value);
        setClientConnectedPlatforms(connected);
        setSelectedPlatforms(prev => prev.filter(p => connected.includes(p)));
      } catch (error) {
        console.error("Error fetching connected platforms:", error);
      }
    }
    fetchConnectedPlatforms();
  }, [user.client_id]);

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
    if (!user.client_id) {
      alert("Client session not found. Please log in again.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      alert("Select platforms");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      formData.append("client_id", user.client_id);
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
      loadPosts();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const visiblePosts = posts
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.caption.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.date.toLowerCase().includes(q);
    })
    .filter(p => {
      if (!filterDateFrom && !filterDateTo) return true;
      const postDate = new Date(p.date);
      if (filterDateFrom && postDate < new Date(filterDateFrom)) return false;
      if (filterDateTo   && postDate > new Date(filterDateTo))   return false;
      return true;
    });

  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(visiblePosts.length / itemsPerPage);
  const paginatedPosts = useMemo(() => {
    return visiblePosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [visiblePosts, currentPage]);

  const fetchPostAnalytics = async (postId) => {
    setPostAnalytics(null);
    setLoadingPostAnalytics(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/analytics/`);
      const data = await res.json();
      setPostAnalytics(data);
    } catch (err) {
      console.warn('Could not load post analytics:', err);
      setPostAnalytics({ available: false, reason: 'Failed to load analytics.' });
    } finally {
      setLoadingPostAnalytics(false);
    }
  };

  const openPost = async (post) => {
    setSelectedPost(post);
    setShowPostPopup(true);
    if (post.status === 'Posted') fetchPostAnalytics(post.id);
  };
  const openPlatform = async (pd, post, e) => {
    e.stopPropagation();
    setSelectedPost(post);
    setSelectedPlatform(pd);
    setShowPlatformPopup(true);
    if (pd.status === 'Posted') fetchPostAnalytics(post.id);
  };
  const openEdit   = (post, e) => { e.stopPropagation(); setEditPost({ ...post }); setShowEditPopup(true); };
  const openDelete = (post, e) => { e.stopPropagation(); setDeletePostObj(post); setShowDeleteConfirm(true); };

  const saveEdit = async () => {
    try {
      let scheduledTimeISO = null;
      if (editPost.date) {
        const parsedDate = new Date(editPost.date);
        if (!isNaN(parsedDate.getTime())) {
          scheduledTimeISO = parsedDate.toISOString();
        }
      }

      await updatePost(editPost.id, {
        title: editPost.caption,
        caption: editPost.content,
        status: editPost.status === "Posted" ? "POSTED" : (editPost.status === "Scheduled" ? "SCHEDULED" : "PENDING_APPROVAL"),
        scheduled_time: scheduledTimeISO
      });

      await loadPosts();
      setShowEditPopup(false);
    } catch (err) {
      alert("Failed to save changes: " + err.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePost(deletePostObj.id);
      await loadPosts();
      setShowDeleteConfirm(false);
    } catch (err) {
      alert("Failed to delete post: " + err.message);
    }
  };

  const generatePDF = () => {
    // Filter posts based on selection
    let filtered = [...posts];
    if (exportFilter === "posted")   filtered = posts.filter(p => p.status === "Posted");
    if (exportFilter === "pending")  filtered = posts.filter(p => p.status === "Pending");
    if (exportFilter === "recent")   filtered = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    filtered = filtered.slice(0, exportCount);

    const rows = filtered.map(p => {
      const platforms = p.platformData.map(pd => `${pd.platform} (${pd.status})`).join(", ");
      const stats = p.platformData
        .filter(pd => pd.status === "Posted")
        .map(pd => `${pd.platform}: ♥${pd.likes} 💬${pd.comments} ↗${pd.shares}`)
        .join(" | ");
      const pending = p.platformData
        .filter(pd => pd.status === "Pending")
        .map(pd => `${pd.platform}: ${pd.pendingReason}`)
        .join(" | ");
      return { date: p.date, caption: p.caption, platforms, status: p.status, stats: stats || "—", pending: pending || "—" };
    });

    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Schedule Export — Content Manager</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #031B4E; padding-bottom: 20px; }
          .logo { font-size: 22px; font-weight: 800; color: #031B4E; }
          .logo span { font-size: 13px; font-weight: 400; color: #888; display: block; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #888; }
          .meta strong { display: block; font-size: 14px; color: #031B4E; }
          h2 { font-size: 18px; font-weight: 700; color: #031B4E; margin-bottom: 6px; }
          .subtitle { font-size: 12px; color: #888; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          thead tr { background: #031B4E; color: white; }
          thead th { padding: 12px 14px; text-align: left; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; font-size: 11px; }
          tbody tr { border-bottom: 1px solid #e8eaf0; }
          tbody tr:nth-child(even) { background: #f7f8fc; }
          tbody td { padding: 12px 14px; vertical-align: top; line-height: 1.5; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
          .badge-posted  { background: #dcfce7; color: #166534; }
          .badge-pending { background: #ffedd5; color: #9a3412; }
          .badge-scheduled { background: #dbeafe; color: #1e40af; }
          .stats { color: #059669; font-size: 11px; }
          .pending-reason { color: #c2410c; font-size: 11px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e8eaf0; font-size: 11px; color: #aaa; display: flex; justify-content: space-between; }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Content Manager <span>Social Media Management Platform</span></div>
          <div class="meta">
            <strong>Schedule Export Report</strong>
            Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}<br/>
            Filter: ${exportFilter === "all" ? "All Posts" : exportFilter === "posted" ? "Posted Only" : exportFilter === "pending" ? "Pending Only" : "Most Recent"}<br/>
            Total Posts: ${rows.length}
          </div>
        </div>

        <h2>Post Schedule</h2>
        <p class="subtitle">Showing ${rows.length} post${rows.length !== 1 ? "s" : ""} · ${exportFilter === "all" ? "All statuses" : exportFilter === "posted" ? "Posted posts only" : exportFilter === "pending" ? "Pending posts only" : "Most recent posts"}</p>

        <table>
          <thead>
            <tr>
              <th style="width:10%">Date</th>
              <th style="width:25%">Caption</th>
              <th style="width:18%">Platforms</th>
              <th style="width:8%">Status</th>
              <th style="width:20%">Stats (Posted)</th>
              <th style="width:19%">Pending Reason</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td><strong>${r.date}</strong></td>
                <td>${r.caption}</td>
                <td>${r.platforms}</td>
                <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
                <td class="stats">${r.stats}</td>
                <td class="pending-reason">${r.pending}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">
          <span>Content Manager — Confidential</span>
          <span>Exported on ${new Date().toLocaleString()}</span>
        </div>

        <br/><br/>
        <button onclick="window.print()" style="background:#031B4E;color:white;border:none;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
          🖨 Print / Save as PDF
        </button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <ClientLayout>
      <div className="w-full min-h-screen bg-[#F6F5FA] px-4 py-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-[#031B4E] mb-2">Scheduler</h1>
            <p className="text-gray-500 text-lg">Manage all your scheduled social media posts.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#031B4E] text-white px-8 py-4 rounded-2xl font-semibold hover:opacity-90 transition flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Add New Post
          </button>
        </div>

        {/* TABLE CARD */}
        <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            {/* Top row: title + export */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-4xl font-bold text-[#031B4E] mb-1">Scheduled Posts Table</h2>
                <p className="text-gray-500">Click a platform icon to see its individual status and stats.</p>
              </div>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 border border-[#031B4E] text-[#031B4E] px-6 py-3 rounded-2xl font-semibold hover:bg-[#031B4E] hover:text-white transition"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Schedule
              </button>
            </div>

            {/* Filter row: search + date pickers */}
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by caption, content or date..."
                  className="w-full border border-gray-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-[#031B4E] transition text-sm"
                />
              </div>
              {/* Date From */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-gray-400 text-[18px]">calendar_today</span>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="outline-none text-sm text-[#031B4E] font-semibold bg-transparent"
                />
              </div>
              {/* Date To */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-gray-400 text-[18px]">event</span>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  className="outline-none text-sm text-[#031B4E] font-semibold bg-transparent"
                />
              </div>
              {/* Clear */}
              {(searchQuery || filterDateFrom || filterDateTo) && (
                <button
                  onClick={() => { setSearchQuery(""); setFilterDateFrom(""); setFilterDateTo(""); }}
                  className="flex items-center gap-1 text-sm font-bold text-red-500 hover:text-red-600 transition px-3 py-3"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>Clear
                </button>
              )}
              {/* Results count */}
              <span className="text-sm text-gray-400 ml-auto">
                {visiblePosts.length} post{visiblePosts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-[#F4F6FB]">
              <tr>
                <th className="px-8 py-6 text-left text-[#031B4E] font-bold text-sm uppercase">Date</th>
                <th className="px-8 py-6 text-left text-[#031B4E] font-bold text-sm uppercase">Caption</th>
                <th className="px-8 py-6 text-left text-[#031B4E] font-bold text-sm uppercase">Content</th>
                <th className="px-8 py-6 text-left text-[#031B4E] font-bold text-sm uppercase">Artwork</th>
                <th className="px-8 py-6 text-left text-[#031B4E] font-bold text-sm uppercase">Platforms</th>
                <th className="px-8 py-6 text-left text-[#031B4E] font-bold text-sm uppercase">Status</th>
                <th className="px-8 py-6 text-left text-[#031B4E] font-bold text-sm uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPosts.map((post) => (
                <tr
                  key={post.id}
                  className="border-t border-gray-200 hover:bg-[#F9FAFB] transition cursor-pointer"
                  onClick={() => openPost(post)}
                >
                  <td className="px-8 py-8 align-top">
                    <p className="font-bold text-[#031B4E] text-lg">{post.date}</p>
                  </td>
                  <td className="px-8 py-8 align-top">
                    <p className="text-gray-700 text-[16px] leading-7">{post.caption}</p>
                  </td>
                  <td className="px-8 py-8 align-top">
                    <p className="text-gray-600 text-[16px] leading-7">{post.content}</p>
                  </td>
                  <td className="px-8 py-8 align-top">
                    {isVideoUrl(post.artwork) ? (
                      <video src={post.artwork} className="w-56 h-36 object-cover rounded-2xl border border-gray-200 shadow-sm" controls muted preload="metadata" />
                    ) : (
                      <img src={post.artwork} alt="artwork" className="w-56 h-36 object-cover rounded-2xl border border-gray-200 shadow-sm" />
                    )}
                  </td>

                  {/* PLATFORMS — each icon has its own badge */}
                  <td className="px-8 py-8 align-top">
                    <div className="flex flex-wrap gap-4">
                      {post.platformData.map((pd, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => openPlatform(pd, post, e)}
                          className="hover:scale-110 transition-transform"
                          title={`${pd.platform} — ${pd.status}`}
                        >
                          <PlatformIcon
                            platform={pd.platform}
                            status={pd.status}
                            size="w-11 h-11"
                            showBadge
                          />
                        </button>
                      ))}
                    </div>
                  </td>

                  <td className="px-8 py-8 align-top">
                    <span className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${STATUS_STYLES[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-8 py-8 align-top">
                    {post.status !== "Posted" && (
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => openEdit(post, e)} className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition" title="Edit">
                          <span className="material-symbols-outlined text-blue-600 text-[20px]">edit</span>
                        </button>
                        <button onClick={(e) => openDelete(post, e)} className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition" title="Delete">
                          <span className="material-symbols-outlined text-red-500 text-[20px]">delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION BAR */}
          {totalPages > 1 && (
            <div className="px-8 py-5 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
              <span className="text-sm text-gray-500 font-medium">
                Showing <span className="font-semibold text-[#031B4E]">{Math.min((currentPage - 1) * itemsPerPage + 1, visiblePosts.length)}</span> to{" "}
                <span className="font-semibold text-[#031B4E]">{Math.min(currentPage * itemsPerPage, visiblePosts.length)}</span> of{" "}
                <span className="font-semibold text-[#031B4E]">{visiblePosts.length}</span> posts
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
      </div>

      {/* ══════════════════════════════════════
          PLATFORM DETAIL POPUP
          (click individual platform icon)
      ══════════════════════════════════════ */}
      {showPlatformPopup && selectedPlatform && selectedPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-[600px] overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-100">
              <PlatformIcon platform={selectedPlatform.platform} status={selectedPlatform.status} size="w-12 h-12" showBadge />
              <div>
                <h3 className="font-bold text-2xl text-[#031B4E] capitalize">{selectedPlatform.platform}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{selectedPost.date}</p>
              </div>
              <span className={`ml-auto px-4 py-1.5 rounded-full text-sm font-bold uppercase ${STATUS_STYLES[selectedPlatform.status]}`}>
                {selectedPlatform.status}
              </span>
              <button onClick={() => setShowPlatformPopup(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-xl ml-2">×</button>
            </div>

            {/* Artwork */}
            {isVideoUrl(selectedPost.artwork) ? (
              <video src={selectedPost.artwork} className="w-full h-52 object-cover" controls muted preload="metadata" />
            ) : (
              <img src={selectedPost.artwork} alt="" className="w-full h-52 object-cover" />
            )}

            {/* Body */}
            <div className="p-8">
              <p className="text-gray-700 text-base leading-relaxed mb-6">{selectedPost.caption}</p>

              {/* POSTED — live analytics */}
              {selectedPlatform.status === "Posted" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#031B4E]/10 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#031B4E] text-[16px]">analytics</span>
                      </div>
                      <h4 className="font-bold text-[#031B4E]">Live Analytics</h4>
                    </div>
                    {postAnalytics?.available && (
                      <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Live
                      </span>
                    )}
                  </div>

                  {loadingPostAnalytics && (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-2 mb-4">
                      <div className="animate-spin w-7 h-7 border-4 border-[#031B4E] border-t-transparent rounded-full"></div>
                      <p className="text-gray-500 text-sm font-semibold">Fetching live metrics...</p>
                    </div>
                  )}

                  {!loadingPostAnalytics && postAnalytics?.available && (() => {
                    // Find this platform's data in the analytics response
                    const platData = postAnalytics.platforms?.find(p => p.platform === selectedPlatform.platform && p.available);
                    const likes    = platData ? platData.likes    : postAnalytics.totals.likes;
                    const comments = platData ? platData.comments : postAnalytics.totals.comments;
                    const shares   = platData ? platData.shares   : postAnalytics.totals.shares;
                    const reach    = platData ? (platData.reach || platData.views || 0) : postAnalytics.totals.reach;
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                          { label: 'Likes',    value: likes,    icon: 'favorite',    color: 'text-pink-500',   bg: 'bg-pink-50',   border: 'border-pink-100' },
                          { label: 'Comments', value: comments, icon: 'chat_bubble', color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100' },
                          { label: 'Shares',   value: shares,   icon: 'share',       color: 'text-green-500',  bg: 'bg-green-50',  border: 'border-green-100' },
                          { label: 'Reach',    value: reach,    icon: 'visibility',  color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
                        ].map(s => (
                          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
                            <span className={`material-symbols-outlined text-[24px] ${s.color}`}>{s.icon}</span>
                            <p className="text-gray-500 text-[10px] mt-1 font-bold uppercase tracking-wide">{s.label}</p>
                            <p className="text-xl font-bold text-[#031B4E] mt-0.5">{s.value.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {!loadingPostAnalytics && postAnalytics && !postAnalytics.available && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-4">
                      <span className="material-symbols-outlined text-amber-500 text-[20px]">info</span>
                      <div>
                        <p className="font-bold text-amber-800 text-sm mb-0.5">Analytics Not Yet Available</p>
                        <p className="text-amber-700 text-xs">{postAnalytics.reason || 'Published before analytics tracking was enabled.'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PENDING — reason */}
              {selectedPlatform.status === "Pending" && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex gap-4">
                  <span className="material-symbols-outlined text-orange-500 text-[28px] flex-shrink-0">warning</span>
                  <div>
                    <h4 className="font-bold text-orange-700 text-base mb-1">Pending — Action Required</h4>
                    <p className="text-orange-600 text-sm leading-relaxed">{selectedPlatform.pendingReason}</p>
                  </div>
                </div>
              )}

              {/* SCHEDULED */}
              {selectedPlatform.status === "Scheduled" && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
                  <span className="material-symbols-outlined text-blue-500 text-[28px] flex-shrink-0">schedule</span>
                  <div>
                    <h4 className="font-bold text-blue-700 text-base mb-1">Scheduled for Publishing</h4>
                    <p className="text-blue-600 text-sm">This post is queued and will be published on <strong>{selectedPost.date}</strong>.</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowPlatformPopup(false)}
                className="mt-6 w-full h-12 bg-[#031B4E] text-white rounded-2xl font-bold hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          POST DETAIL POPUP (row click)
      ══════════════════════════════════════ */}
      {showPostPopup && selectedPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6 overflow-auto">
          <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl w-full max-w-[900px]">

            <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-100">
              <div className="flex gap-3">
                {selectedPost.platformData.map((pd, i) => (
                  <PlatformIcon key={i} platform={pd.platform} status={pd.status} size="w-10 h-10" showBadge />
                ))}
              </div>
              <div className="ml-2">
                <h3 className="font-bold text-2xl text-[#031B4E]">{selectedPost.caption}</h3>
                <p className="text-gray-500 mt-1">{selectedPost.date}</p>
              </div>
              <button onClick={() => setShowPostPopup(false)} className="ml-auto w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl">×</button>
            </div>

            {isVideoUrl(selectedPost.artwork) ? (
              <video src={selectedPost.artwork} className="w-full h-[340px] object-cover" controls muted preload="metadata" />
            ) : (
              <img src={selectedPost.artwork} alt="Post artwork" className="w-full h-[340px] object-cover" />
            )}

            <div className="p-8">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">{selectedPost.content}</p>

              {/* Per-platform breakdown with live analytics */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Platform Breakdown</h4>
                {postAnalytics?.available && (
                  <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Live
                  </span>
                )}
              </div>

              {loadingPostAnalytics && (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 flex items-center gap-3 mb-4">
                  <div className="animate-spin w-6 h-6 border-4 border-[#031B4E] border-t-transparent rounded-full flex-shrink-0"></div>
                  <p className="text-gray-500 text-sm font-semibold">Fetching live metrics from platform APIs...</p>
                </div>
              )}

              {!loadingPostAnalytics && postAnalytics && !postAnalytics.available && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-4">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">info</span>
                  <p className="text-amber-700 text-sm">{postAnalytics.reason || 'Published before analytics tracking was enabled.'}</p>
                </div>
              )}

              <div className="space-y-3 mb-8">
                {selectedPost.platformData.map((pd, i) => {
                  const livePlat = postAnalytics?.available
                    ? postAnalytics.platforms?.find(p => p.platform === pd.platform)
                    : null;
                  return (
                    <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
                      <PlatformIcon platform={pd.platform} status={pd.status} size="w-9 h-9" showBadge />
                      <span className="capitalize font-semibold text-[#031B4E] w-24">{pd.platform}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[pd.status]}`}>{pd.status}</span>
                      {pd.status === "Posted" && livePlat?.available && (
                        <div className="flex items-center gap-4 ml-auto text-sm font-semibold text-gray-600">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-pink-500 text-[16px]">favorite</span>{livePlat.likes?.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-blue-500 text-[16px]">chat_bubble</span>{livePlat.comments?.toLocaleString()}</span>
                          {livePlat.shares > 0 && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-green-500 text-[16px]">share</span>{livePlat.shares?.toLocaleString()}</span>}
                          {(livePlat.reach || livePlat.views) > 0 && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-purple-500 text-[16px]">visibility</span>{(livePlat.reach || livePlat.views)?.toLocaleString()}</span>}
                        </div>
                      )}
                      {pd.status === "Posted" && !loadingPostAnalytics && (!livePlat || !livePlat.available) && (
                        <span className="ml-auto text-xs text-amber-600">Analytics not available for this post</span>
                      )}
                      {pd.status === "Pending" && (
                        <span className="ml-auto text-xs text-orange-600 max-w-xs text-right">{pd.pendingReason}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button onClick={(e) => { setShowPostPopup(false); openEdit(selectedPost, e); }} className="flex items-center gap-2 px-6 py-3 border-2 border-[#031B4E] text-[#031B4E] rounded-2xl font-bold hover:bg-[#031B4E]/5 transition">
                  <span className="material-symbols-outlined text-[18px]">edit</span> Edit Post
                </button>
                <button onClick={(e) => { setShowPostPopup(false); openDelete(selectedPost, e); }} className="flex items-center gap-2 px-6 py-3 border-2 border-red-300 text-red-500 rounded-2xl font-bold hover:bg-red-50 transition">
                  <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                </button>
                <button onClick={() => setShowPostPopup(false)} className="ml-auto px-6 py-3 bg-[#031B4E] text-white rounded-2xl font-bold hover:opacity-90 transition">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EDIT POPUP
      ══════════════════════════════════════ */}
      {showEditPopup && editPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6 overflow-auto">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-[700px] p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-[#031B4E]">Edit Post</h2>
              <button onClick={() => setShowEditPopup(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl">×</button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Date</label>
                <input type="text" value={editPost.date} onChange={(e) => setEditPost({ ...editPost, date: e.target.value })} className="w-full border-2 border-gray-200 rounded-2xl px-5 py-3 text-base outline-none focus:border-[#031B4E] transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Caption</label>
                <textarea value={editPost.caption} onChange={(e) => setEditPost({ ...editPost, caption: e.target.value })} rows={3} className="w-full border-2 border-gray-200 rounded-2xl px-5 py-3 text-base outline-none focus:border-[#031B4E] transition resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Content</label>
                <textarea value={editPost.content} onChange={(e) => setEditPost({ ...editPost, content: e.target.value })} rows={4} className="w-full border-2 border-gray-200 rounded-2xl px-5 py-3 text-base outline-none focus:border-[#031B4E] transition resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Status</label>
                <select value={editPost.status} onChange={(e) => setEditPost({ ...editPost, status: e.target.value })} className="w-full border-2 border-gray-200 rounded-2xl px-5 py-3 text-base outline-none focus:border-[#031B4E] transition">
                  <option>Scheduled</option>
                  <option>Posted</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setShowEditPopup(false)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={saveEdit} className="ml-auto px-8 py-3 bg-[#031B4E] text-white rounded-2xl font-bold hover:opacity-90 transition flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">save</span> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          DELETE CONFIRM
      ══════════════════════════════════════ */}
      {showDeleteConfirm && deletePostObj && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[480px] p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-red-500 text-[32px]">delete</span>
            </div>
            <h2 className="text-2xl font-bold text-[#031B4E] mb-3">Delete Post?</h2>
            <p className="text-gray-500 mb-2">You are about to delete:</p>
            <p className="text-gray-700 font-semibold mb-8 px-4">"{deletePostObj.caption}"</p>
            <p className="text-sm text-gray-400 mb-8">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
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
                  {clientConnectedPlatforms.length === 0 ? (
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
                <button onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-3 rounded-2xl border font-semibold border-gray-300 hover:bg-gray-50 transition">Cancel</button>
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

    </ClientLayout>
  );
}
