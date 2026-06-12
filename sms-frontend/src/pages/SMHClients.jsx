import { useState, useRef, useEffect } from "react";
import SMHLayout from "../components/SMHLayout";
import { generateHashtags } from "../services/authService";
import { apiRequest } from "../services/api";
import { updatePost, deletePost } from "../services/postService";
import ClientAnalytics from "./ClientAnalytics";

function formatNumber(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat('en', {
    notation: numericValue >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(numericValue);
}

const isVideoUrl = (url) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.mov') || cleanUrl.startsWith('data:video/');
};

function EditHashtagGenerator({ topic, platform, onApply }) {
  const [prompt, setPrompt]         = useState(topic || "");
  const [selectedPlatforms, setSelectedPlatforms] = useState(platform ? [platform] : ["instagram"]);
  const [tone, setTone]             = useState("Professional");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const platforms = [
    { value: "instagram", label: "Instagram", icon: "photo_camera" },
    { value: "facebook",  label: "Facebook",  icon: "thumb_up" },
    { value: "linkedin",  label: "LinkedIn",  icon: "business_center" },
    { value: "twitter",   label: "Twitter/X", icon: "close" },
    { value: "youtube",   label: "YouTube",   icon: "play_circle" },
    { value: "pinterest", label: "Pinterest", icon: "push_pin" },
  ];
  const tones = ["Professional", "Casual", "Witty", "Inspirational", "Promotional"];

  const togglePlatform = (val) =>
    setSelectedPlatforms(prev =>
      prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]
    );

  const handleGenerate = async () => {
    if (!prompt.trim() || selectedPlatforms.length === 0) return;
    setError(""); setResult(null); setLoading(true);
    try {
      const data = await generateHashtags({ prompt, platform: selectedPlatforms[0], tone: tone.toLowerCase() });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-xl bg-[#031B4E]/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#031B4E] text-[16px]">auto_awesome</span>
        </div>
        <h3 className="font-bold text-[#031B4E] text-base">AI Generate Description & Hashtags</h3>
      </div>

      {/* Topic */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Topic</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={2}
          className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#031B4E] transition resize-none bg-white"
          placeholder="Describe the post topic..."
        />
      </div>

      {/* Platforms */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Platforms</label>
        <div className="grid grid-cols-3 gap-2">
          {platforms.map(p => {
            const selected = selectedPlatforms.includes(p.value);
            return (
              <button key={p.value} onClick={() => togglePlatform(p.value)}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl border-2 transition text-xs font-bold relative ${selected ? "border-[#031B4E] bg-[#031B4E]/5 text-[#031B4E]" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                {selected && <span className="absolute top-1 right-1 w-3 h-3 bg-[#031B4E] rounded-full flex items-center justify-center"><span className="text-white text-[7px]">✓</span></span>}
                <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Tone</label>
        <div className="flex flex-wrap gap-1.5">
          {tones.map(t => (
            <button key={t} onClick={() => setTone(t)}
              className={`px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition ${tone === t ? "border-[#031B4E] bg-[#031B4E] text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={loading || !prompt.trim() || selectedPlatforms.length === 0}
        className="w-full h-11 bg-[#031B4E] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? (
          <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Generating...</>
        ) : (
          <><span className="material-symbols-outlined text-[16px]">bolt</span>Generate</>
        )}
      </button>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#031B4E] uppercase tracking-wide">Description</span>
              <button
                onClick={() => onApply(result.description, result.hashtags)}
                className="flex items-center gap-1 px-3 py-1 bg-[#031B4E] text-white rounded-lg text-xs font-bold hover:opacity-90 transition"
              >
                <span className="material-symbols-outlined text-[13px]">check</span>Apply to Post
              </button>
            </div>
            <p className="text-gray-700 text-xs leading-relaxed">{result.description}</p>
          </div>

          {/* Hashtags */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <span className="text-xs font-bold text-[#031B4E] uppercase tracking-wide block mb-2">Hashtags</span>
            <div className="flex flex-wrap gap-1.5">
              {result.hashtags.split(/\s+/).filter(t => t.startsWith("#")).map((tag, i) => (
                <span key={i} className="bg-[#031B4E]/5 text-[#031B4E] px-2 py-1 rounded-full text-xs font-semibold border border-[#031B4E]/10">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HashtagGeneratorSection({ clientName, initialPrompt = "", initialPlatforms = [] }) {
  const [prompt, setPrompt]         = useState(initialPrompt);
  const [selectedPlatforms, setSelectedPlatforms] = useState(
    initialPlatforms.length > 0 ? initialPlatforms : ["instagram"]
  );
  const [tone, setTone]             = useState("Professional");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState("");

  const platforms = [
    { value: "instagram", label: "Instagram", icon: "photo_camera" },
    { value: "facebook",  label: "Facebook",  icon: "thumb_up" },
    { value: "linkedin",  label: "LinkedIn",  icon: "business_center" },
    { value: "twitter",   label: "Twitter/X", icon: "close" },
    { value: "youtube",   label: "YouTube",   icon: "play_circle" },
    { value: "pinterest", label: "Pinterest", icon: "push_pin" },
  ];
  const tones = ["Professional", "Casual", "Witty", "Inspirational", "Promotional"];

  const togglePlatform = (val) => {
    setSelectedPlatforms(prev =>
      prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || selectedPlatforms.length === 0) return;
    setError(""); setResult(null); setLoading(true);
    try {
      // Generate for all selected platforms, use first as primary
      const data = await generateHashtags({
        prompt,
        platform: selectedPlatforms[0],
        tone: tone.toLowerCase(),
        platforms: selectedPlatforms,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="mt-8 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-[#031B4E]/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#031B4E]">tag</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#031B4E]">AI Hashtag Generator</h2>
          <p className="text-gray-500 text-sm">Generate hashtags and post description for {clientName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT: Input */}
        <div className="flex flex-col gap-6">
          {/* Topic */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Post Topic or Idea</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Summer fashion collection launch with bold colours and beach vibes..."
              rows={4}
              className="w-full border-2 border-gray-200 rounded-2xl p-4 text-base outline-none focus:border-[#031B4E] transition resize-none"
            />
          </div>

          {/* Platform — multi-select */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Target Platforms</label>
              <span className="text-xs text-gray-400">{selectedPlatforms.length} selected — select multiple</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map(p => {
                const selected = selectedPlatforms.includes(p.value);
                return (
                  <button key={p.value} onClick={() => togglePlatform(p.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition relative ${selected ? "border-[#031B4E] bg-[#031B4E]/5 text-[#031B4E]" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#031B4E] rounded-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">✓</span>
                      </span>
                    )}
                    <span className="material-symbols-outlined text-[20px]">{p.icon}</span>
                    <span className="text-xs font-bold">{p.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedPlatforms.length === 0 && (
              <p className="text-red-500 text-xs mt-2">Select at least one platform</p>
            )}
          </div>

          {/* Tone */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Tone of Voice</label>
            <div className="flex flex-wrap gap-2">
              {tones.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition ${tone === t ? "border-[#031B4E] bg-[#031B4E] text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading || !prompt.trim() || selectedPlatforms.length === 0}
            className="w-full h-14 bg-[#031B4E] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#031B4E]/20">
            {loading ? (
              <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Generating...</>
            ) : (
              <><span className="material-symbols-outlined">bolt</span>Generate for {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? "s" : ""}</>
            )}
          </button>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl text-sm">{error}</div>}
        </div>

        {/* RIGHT: Output */}
        <div className="flex flex-col gap-5">
          {!result && !loading && (
            <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
              <span className="material-symbols-outlined text-gray-300 text-[40px] mb-4">tag</span>
              <p className="font-bold text-gray-400 mb-1">Results will appear here</p>
              <p className="text-gray-400 text-sm">Fill in the topic, pick platforms and tone, then hit Generate.</p>
            </div>
          )}
          {loading && (
            <div className="bg-gray-50 rounded-3xl border border-gray-200 flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
              <div className="w-14 h-14 rounded-3xl bg-[#031B4E]/10 flex items-center justify-center mb-4 animate-pulse">
                <span className="material-symbols-outlined text-[#031B4E] text-[28px]">auto_awesome</span>
              </div>
              <p className="font-bold text-[#031B4E] mb-1">AI is thinking...</p>
              <p className="text-gray-400 text-sm">Crafting hashtags and description</p>
            </div>
          )}
          {result && (
            <>
              {/* Selected platforms chips */}
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map(p => {
                  const meta = platforms.find(x => x.value === p);
                  return (
                    <span key={p} className="flex items-center gap-1.5 bg-[#031B4E]/5 text-[#031B4E] px-3 py-1.5 rounded-full text-xs font-bold border border-[#031B4E]/10">
                      <span className="material-symbols-outlined text-[14px]">{meta?.icon}</span>
                      {meta?.label}
                    </span>
                  );
                })}
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">description</span>
                    </div>
                    <h3 className="font-bold text-[#031B4E]">Post Description</h3>
                  </div>
                  <button onClick={() => handleCopy(result.description, "desc")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-[15px]">{copied === "desc" ? "check" : "content_copy"}</span>
                    {copied === "desc" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{result.description}</p>
              </div>

              {/* Hashtags */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-600 text-[18px]">tag</span>
                    </div>
                    <h3 className="font-bold text-[#031B4E]">Hashtags</h3>
                  </div>
                  <button onClick={() => handleCopy(result.hashtags, "tags")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-[15px]">{copied === "tags" ? "check" : "content_copy"}</span>
                    {copied === "tags" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.hashtags.split(/\s+/).filter(t => t.startsWith("#")).map((tag, i) => (
                    <span key={i} className="bg-[#031B4E]/5 text-[#031B4E] px-3 py-1.5 rounded-full text-sm font-semibold border border-[#031B4E]/10">{tag}</span>
                  ))}
                </div>
              </div>

              <button onClick={handleGenerate}
                className="w-full h-11 border-2 border-[#031B4E] text-[#031B4E] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#031B4E]/5 transition">
                <span className="material-symbols-outlined text-[18px]">refresh</span>Regenerate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const CLIENTS_PER_PAGE = 3;
const SCHEDULE_PER_PAGE = 5;

export default function SMHClients() {
  const [activeView, setActiveView]           = useState("clients"); // "clients" | "analytics" | "schedule"
  const [selectedClient, setSelectedClient]   = useState(null);
  const [showPostPopup, setShowPostPopup]     = useState(false);
  const [selectedPost, setSelectedPost]       = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery]         = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [schedulePage, setSchedulePage]       = useState(1);

  // Dynamic clients state
  const [clients, setClients]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);

  // Hashtag generator pre-fill from pending post
  const [hashtagPrompt]       = useState("");
  const [hashtagPlatforms] = useState([]);
  const hashtagRef = useRef(null);

  // Edit/delete for pending posts in schedule view
  const [editPost, setEditPost]               = useState(null);
  const [showEditPopup, setShowEditPopup]     = useState(false);
  const [deletePostItem, setDeletePostItem]   = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Per-post real analytics
  const [postAnalytics, setPostAnalytics]           = useState(null);
  const [loadingPostAnalytics, setLoadingPostAnalytics] = useState(false);

  const fetchClients = async (updateSelectedId = null) => {
    setLoading(true);
    try {
      const response = await apiRequest("/clients/");
      setClients(response);
      if (updateSelectedId) {
        const updatedSelected = response.find(c => c.id === updateSelectedId);
        if (updatedSelected) {
          setSelectedClient(updatedSelected);
        }
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setError("Failed to load clients data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const getClientPosts = (client) => {
    if (!client) return [];
    return client.posts || [];
  };

  const saveEdit = async () => {
    try {
      await updatePost(editPost.id, {
        title: editPost.topic,
        caption: editPost.description,
        scheduled_time: editPost.raw_scheduled_time
      });
      await fetchClients(selectedClient.id);
      setShowEditPopup(false);
    } catch (err) {
      console.error("Failed to save edit:", err);
      alert("Failed to save post changes: " + err.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePost(deletePostItem.id);
      await fetchClients(selectedClient.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Failed to delete post: " + err.message);
    }
  };

  // Filtered + paginated clients
  const filtered = clients.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchesName = c.name?.toLowerCase().includes(query);
    const matchesCategory = c.category?.toLowerCase().includes(query);
    const matchesPlatform = c.platforms?.some(p => p.name?.toLowerCase().includes(query));
    return matchesName || matchesCategory || matchesPlatform;
  });
  const totalPages = Math.ceil(filtered.length / CLIENTS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * CLIENTS_PER_PAGE, currentPage * CLIENTS_PER_PAGE);

  const openAnalytics = (client) => {
    setSelectedClient(client);
    setActiveView("analytics");
  };
  const openSchedule  = (client) => { setSelectedClient(client); setActiveView("schedule"); setSchedulePage(1); };
  const backToClients = ()       => { setActiveView("clients"); setSelectedClient(null); };
  const openPostPopup = async (post) => {
    setSelectedPost(post);
    setShowPostPopup(true);
    setPostAnalytics(null);

    // Only fetch real analytics for published posts
    if (post.status === 'success' && post.id) {
      setLoadingPostAnalytics(true);
      try {
        const data = await apiRequest(`/posts/${post.id}/analytics/`);
        setPostAnalytics(data);
      } catch (err) {
        console.warn('Could not load post analytics:', err);
        setPostAnalytics({ available: false, reason: err.message || 'Failed to load analytics.' });
      } finally {
        setLoadingPostAnalytics(false);
      }
    }
  };

  // Breadcrumb label
  const breadcrumbSub = activeView === "analytics" ? "Analytics"
    : activeView === "schedule" ? "Schedule" : null;

  return (
    <SMHLayout>
      <main className="p-8 min-h-screen bg-[#f7f7fb]">

        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-10">
          <div className="relative w-full max-w-2xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Search clients, platforms, categories..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-14 pr-5 shadow-sm outline-none focus:border-[#031B4E] transition"
            />
          </div>
          <div className="flex items-center gap-6 ml-6">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <span className="material-symbols-outlined text-[#031B4E]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50">
                  <h3 className="font-bold text-lg text-[#031B4E] mb-4">Notifications</h3>
                  <div className="space-y-3">
                    <div className="bg-orange-50 border-l-4 border-orange-400 rounded-xl p-4"><h4 className="font-semibold text-orange-700">API Token Expiring</h4><p className="text-sm text-orange-600 mt-1">Instagram token for Luxe Hotels expires in 2 days.</p></div>
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4"><h4 className="font-semibold text-blue-700">New Campaign</h4><p className="text-sm text-blue-600 mt-1">TechNova added 12 new assets to the library.</p></div>
                    <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-4"><h4 className="font-semibold text-green-700">Post Published</h4><p className="text-sm text-green-600 mt-1">Elite Fashion's Instagram post went live successfully.</p></div>
                  </div>
                </div>
              )}
            </div>
            {/* Profile */}
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-2xl transition">
                <div className="w-10 h-10 rounded-full bg-[#031B4E] text-white flex items-center justify-center font-bold text-sm">SR</div>
                <div className="text-left hidden sm:block"><p className="font-semibold text-[#031B4E] text-sm leading-tight">Sarah Rogers</p><p className="text-xs text-gray-400">SMH Manager</p></div>
                <span className="material-symbols-outlined text-gray-400 text-[20px]">expand_more</span>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100"><p className="font-bold text-[#031B4E]">Sarah Rogers</p><p className="text-sm text-gray-400">sarahrogers@smh.com</p></div>
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-[#031B4E] flex items-center gap-3"><span className="material-symbols-outlined text-[18px]">person</span>Profile</button>
                    <button className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-[#031B4E] flex items-center gap-3"><span className="material-symbols-outlined text-[18px]">settings</span>Settings</button>
                    <button className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm font-medium text-red-500 flex items-center gap-3"><span className="material-symbols-outlined text-[18px]">logout</span>Logout</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BREADCRUMBS */}
        <div className="flex items-center gap-2 text-base text-gray-500 mb-8">
          {breadcrumbSub ? (
            <>
              <button onClick={backToClients} className="hover:text-[#031B4E] hover:underline transition">Clients</button>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              <span className="text-[#031B4E] font-bold">{breadcrumbSub} — {selectedClient?.name}</span>
            </>
          ) : (
            <span className="text-[#031B4E] font-bold">Clients</span>
          )}
        </div>

        {/* ══════════════════════════════
            CLIENTS LIST VIEW
        ══════════════════════════════ */}
        {activeView === "clients" && (
          <>
            {/* PAGE HEADER */}
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-[48px] font-bold text-[#001b5e]">Clients Management</h1>
                <p className="text-gray-500 text-lg mt-1">View connected clients and social media accounts.</p>
              </div>
            </div>

            {/* CLIENT CARDS — 3 per page */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {loading ? (
                <div className="col-span-full py-20 text-center">
                  <div className="animate-spin w-10 h-10 border-4 border-[#031B4E] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500 font-semibold">Loading clients data...</p>
                </div>
              ) : error ? (
                <div className="col-span-full py-20 text-center bg-red-50 border border-red-200 rounded-3xl">
                  <span className="material-symbols-outlined text-red-500 text-[40px] mb-2">error</span>
                  <p className="text-red-600 font-bold">{error}</p>
                </div>
              ) : paginated.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                  <span className="material-symbols-outlined text-gray-400 text-[40px] mb-2">people</span>
                  <p className="text-gray-500 font-semibold">No clients found.</p>
                </div>
              ) : (
                paginated.map((client) => (
                  <div key={client.id} className="bg-white border border-gray-200 rounded-[28px] p-8 shadow-sm flex flex-col">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ${client.color}`}>
                        {client.avatar}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[#001b5e] leading-tight">{client.name}</h2>
                        <p className="text-gray-500 text-sm">{client.category}</p>
                        <span className="inline-block mt-1 bg-green-100 text-green-700 px-3 py-0.5 rounded-full text-xs font-bold">Active</span>
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="mb-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Connected Platforms</p>
                      <div className="flex gap-2 flex-wrap">
                        {client.platforms.map((p, idx) => (
                          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
                            <img src={p.icon} alt={p.name} className="w-5 h-5" />
                            <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-[#031B4E]">{client.posts.length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Posts</p>
                      </div>
                      <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-[#031B4E]">{client.posts.filter(p => p.status === "success").length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Published</p>
                      </div>
                      <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-[#031B4E]">{client.posts.filter(p => p.status === "pending").length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Pending</p>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-auto">
                      <button onClick={() => openAnalytics(client)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">analytics</span>Analytics
                      </button>
                      <button onClick={() => openSchedule(client)} className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>Schedule
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition ${
                      currentPage === page
                        ? "bg-[#031B4E] text-white shadow"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
                <span className="text-sm text-gray-400 ml-2">Page {currentPage} of {totalPages}</span>
              </div>
            )}
          </>
        )}
        {/* ══════════════════════════════
            ANALYTICS VIEW
        ══════════════════════════════ */}
        {activeView === "analytics" && selectedClient && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-[42px] font-bold text-[#001b5e]">{selectedClient.name}</h1>
                <p className="text-gray-500 text-lg mt-1">Live analytics overview for this client.</p>
              </div>
              <button onClick={backToClients} className="flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-2xl font-semibold text-gray-600 hover:bg-gray-100 transition">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>Back to Clients
              </button>
            </div>

            <ClientAnalytics overrideClientId={selectedClient.id} hideLayout={true} />
          </div>
        )}

        {/* ══════════════════════════════
            SCHEDULE VIEW
        ══════════════════════════════ */}
        {activeView === "schedule" && selectedClient && (
          <div>
            {/* SCHEDULE HEADER — Back to Clients LEFT, Date filter RIGHT */}
            <div className="flex justify-between items-center mb-8">
              <button onClick={backToClients} className="flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-2xl font-semibold text-gray-600 hover:bg-gray-100 transition">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>Back to Clients
              </button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">calendar_today</span>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">From</label>
                  <input type="date" className="outline-none text-sm text-[#031B4E] font-semibold bg-transparent" />
                </div>
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">event</span>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">To</label>
                  <input type="date" className="outline-none text-sm text-[#031B4E] font-semibold bg-transparent" />
                </div>
              </div>
            </div>
            <div className="mb-8">
              <h1 className="text-[42px] font-bold text-[#001b5e]">{selectedClient.name} — Schedule</h1>
              <p className="text-gray-500 text-lg mt-1">Complete publishing timeline and campaign tracking.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F4F6FB]">
                  <tr>
                    {["Date","Topic","Description","Image","Platform","Analytics","Status","Actions"].map(h => (
                      <th key={h} className="px-6 py-5 text-left text-[#031B4E] font-bold text-sm uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allSchedulePosts = getClientPosts(selectedClient);
                    const paginatedSchedule = allSchedulePosts.slice((schedulePage - 1) * SCHEDULE_PER_PAGE, schedulePage * SCHEDULE_PER_PAGE);
                    return paginatedSchedule.map((post, idx) => (
                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer" onClick={() => openPostPopup(post)}>
                      <td className="px-6 py-6 font-bold text-[#031B4E]">{post.date}</td>
                      <td className="px-6 py-6 font-semibold text-[#031B4E]">{post.topic}</td>
                      <td className="px-6 py-6 text-gray-600 text-sm max-w-[200px]">{post.description}</td>
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
                          {post.platform_statuses && post.platform_statuses.length > 0 ? (
                            post.platform_statuses.map((ps, idx) => (
                              <div key={idx} className="relative w-fit" onClick={() => openPostPopup(post)}>
                                <img
                                  src={ps.icon}
                                  alt={ps.platform}
                                  className="w-10 h-10 rounded-xl hover:scale-110 transition object-contain"
                                />
                                {ps.status === "Posted" && (
                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-white bg-green-500">
                                    ✓
                                  </div>
                                )}
                                {(ps.status === "Pending" || ps.status === "Failed" || ps.status === "Scheduled") && (
                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-white bg-orange-500">
                                    !
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="relative w-fit" onClick={() => openPostPopup(post)}>
                              <img src={post.icon} alt="" className="w-12 h-12 rounded-xl hover:scale-110 transition" />
                              <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold border-2 border-white ${post.status === "success" ? "bg-green-500" : "bg-orange-500"}`}>
                                {post.status === "success" ? "✓" : "!"}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {post.status === "success" ? (
                          <button
                            onClick={e => { e.stopPropagation(); openPostPopup(post); }}
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
                      {/* Actions — only for pending */}
                      <td className="px-6 py-6" onClick={e => e.stopPropagation()}>
                        {post.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditPost({ ...post, originalTopic: post.topic, originalDate: post.date }); setShowEditPopup(true); }}
                              className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                              title="Edit post"
                            >
                              <span className="material-symbols-outlined text-blue-600 text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => { setDeletePostItem(post); setShowDeleteConfirm(true); }}
                              className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition"
                              title="Delete post"
                            >
                              <span className="material-symbols-outlined text-red-500 text-[18px]">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* SCHEDULE PAGINATION */}
            {(() => {
              const totalSchedulePages = Math.ceil(getClientPosts(selectedClient).length / SCHEDULE_PER_PAGE);
              if (totalSchedulePages <= 1) return null;
              return (
                <div className="flex items-center justify-center gap-2 mt-6 mb-8">
                  <button
                    onClick={() => setSchedulePage(p => Math.max(1, p - 1))}
                    disabled={schedulePage === 1}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  {Array.from({ length: totalSchedulePages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setSchedulePage(page)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition ${
                        schedulePage === page
                          ? "bg-[#031B4E] text-white shadow"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setSchedulePage(p => Math.min(totalSchedulePages, p + 1))}
                    disabled={schedulePage === totalSchedulePages}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                  <span className="text-sm text-gray-400 ml-2">Page {schedulePage} of {totalSchedulePages}</span>
                </div>
              );
            })()}

            {/* HASHTAG GENERATOR */}
            <div ref={hashtagRef}>
              <HashtagGeneratorSection
                clientName={selectedClient.name}
                initialPrompt={hashtagPrompt}
                initialPlatforms={hashtagPlatforms}
              />
            </div>

          </div>
        )}

        {/* ══════════════════════════════
            EDIT POPUP (pending posts)
        ══════════════════════════════ */}
        {showEditPopup && editPost && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto">
            <div className="bg-white rounded-[32px] shadow-2xl w-[95vw] max-w-[1300px] min-h-[85vh] p-12 flex flex-col">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold text-[#031B4E]">Edit Pending Post</h2>
                <button onClick={() => setShowEditPopup(false)} className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl">×</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1">
                {/* LEFT — Post fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      value={editPost.raw_scheduled_time ? editPost.raw_scheduled_time.slice(0, 16) : ""}
                      onChange={e => setEditPost({ ...editPost, raw_scheduled_time: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#031B4E] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Topic</label>
                    <input type="text" value={editPost.topic} onChange={e => setEditPost({...editPost, topic: e.target.value})} className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#031B4E] transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Description</label>
                    <textarea value={editPost.description} onChange={e => setEditPost({...editPost, description: e.target.value})} rows={8} className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#031B4E] transition resize-none" />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowEditPopup(false)} className="px-8 py-4 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold text-base hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={saveEdit} className="ml-auto px-10 py-4 bg-[#031B4E] text-white rounded-2xl font-bold text-base hover:opacity-90 transition flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">save</span>Save Changes
                    </button>
                  </div>
                </div>

                {/* RIGHT — Inline AI generator */}
                <EditHashtagGenerator
                  topic={editPost.topic}
                  platform={editPost.platform}
                  onApply={(desc, hashtags) => setEditPost(prev => ({
                    ...prev,
                    description: desc + "\n\n" + hashtags,
                  }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            DELETE CONFIRM
        ══════════════════════════════ */}
        {showDeleteConfirm && deletePostItem && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[440px] p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-red-500 text-[28px]">delete</span>
              </div>
              <h2 className="text-xl font-bold text-[#031B4E] mb-2">Delete Post?</h2>
              <p className="text-gray-500 mb-1">You are about to delete:</p>
              <p className="text-gray-700 font-semibold mb-6">"{deletePostItem.topic}"</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            POST DETAIL POPUP
        ══════════════════════════════ */}
        {showPostPopup && selectedPost && (
          <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-6 overflow-auto">
            <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl w-full max-w-[900px]">
              <div className="flex items-center gap-4 p-6 border-b">
                <img src={selectedPost.icon} alt="" className="w-12 h-12 rounded-xl" />
                <div>
                  <h3 className="font-bold text-2xl text-[#031B4E]">{selectedClient?.name}</h3>
                  <p className="text-gray-500">{selectedPost.status === "success" ? "Posted Successfully" : "Pending Post"}</p>
                </div>
                <button onClick={() => setShowPostPopup(false)} className="ml-auto w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl">×</button>
              </div>
              {selectedPost.image ? (
                isVideoUrl(selectedPost.image) ? (
                  <video src={selectedPost.image} className="w-full h-[320px] object-cover" controls muted />
                ) : (
                  <img src={selectedPost.image} alt="" className="w-full h-[320px] object-cover" />
                )
              ) : (
                <div className="w-full h-[320px] bg-gray-100 flex items-center justify-center text-gray-400">
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

                    {/* Real metrics grid */}
                    {!loadingPostAnalytics && postAnalytics?.available && (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                          {[
                            { label: 'Likes',    value: postAnalytics.totals.likes,    icon: 'favorite',   color: 'text-pink-500',   bg: 'bg-pink-50',   border: 'border-pink-100' },
                            { label: 'Comments', value: postAnalytics.totals.comments, icon: 'chat_bubble', color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100' },
                            { label: 'Shares',   value: postAnalytics.totals.shares,   icon: 'share',       color: 'text-green-500',  bg: 'bg-green-50',  border: 'border-green-100' },
                            { label: 'Reach',    value: postAnalytics.totals.reach,    icon: 'visibility',  color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
                          ].map(s => (
                            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 text-center`}>
                              <span className={`material-symbols-outlined text-[28px] ${s.color}`}>{s.icon}</span>
                              <p className="text-gray-500 text-xs mt-2 font-semibold uppercase tracking-wide">{s.label}</p>
                              <p className="text-2xl font-bold text-[#031B4E] mt-1">{formatNumber(s.value)}</p>
                            </div>
                          ))}
                        </div>

                        {/* Per-platform breakdown */}
                        {postAnalytics.platforms?.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Platform Breakdown</p>
                            {postAnalytics.platforms.map((plat, i) => {
                              const PLAT_COLORS = {
                                instagram: { bg: 'bg-pink-50',   text: 'text-pink-700',   badge: 'bg-pink-100' },
                                facebook:  { bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100' },
                                youtube:   { bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100'  },
                              };
                              const pc = PLAT_COLORS[plat.platform] || { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100' };

                              if (!plat.available) {
                                return (
                                  <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                    <span className="material-symbols-outlined text-amber-500 text-[18px]">info</span>
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${pc.badge} ${pc.text}`}>{plat.platform}</span>
                                    <span className="text-xs text-amber-700">{plat.reason}</span>
                                  </div>
                                );
                              }

                              return (
                                <div key={i} className={`${pc.bg} border border-opacity-50 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap`}>
                                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${pc.badge} ${pc.text}`}>{plat.platform}</span>
                                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                    <span className="material-symbols-outlined text-pink-400 text-[14px]">favorite</span>{formatNumber(plat.likes)}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                    <span className="material-symbols-outlined text-blue-400 text-[14px]">chat_bubble</span>{formatNumber(plat.comments)}
                                  </div>
                                  {plat.shares > 0 && (
                                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                      <span className="material-symbols-outlined text-green-400 text-[14px]">share</span>{formatNumber(plat.shares)}
                                    </div>
                                  )}
                                  {(plat.reach || plat.views) > 0 && (
                                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                      <span className="material-symbols-outlined text-purple-400 text-[14px]">visibility</span>{formatNumber(plat.reach || plat.views)}
                                    </div>
                                  )}
                                  {plat.permalink && (
                                    <a href={plat.permalink} target="_blank" rel="noreferrer"
                                      className="ml-auto flex items-center gap-1 text-xs font-bold text-[#031B4E] hover:underline"
                                    >
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
                          {postAnalytics.platforms?.some(p => !p.available) && (
                            <div className="mt-3 space-y-1">
                              {postAnalytics.platforms.filter(p => !p.available).map((p, i) => (
                                <p key={i} className="text-xs text-amber-600">• {p.platform.toUpperCase()}: {p.reason}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* No data fetched yet (initial) */}
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

      </main>
    </SMHLayout>
  );
}
