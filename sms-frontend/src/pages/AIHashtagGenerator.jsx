import { useState } from "react";
import SMHLayout from "../components/SMHLayout";
import { generateHashtags } from "../services/authService";

export default function AIHashtagGenerator() {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const platforms = [
    { value: "instagram", label: "Instagram", icon: "photo_camera" },
    { value: "facebook", label: "Facebook", icon: "thumb_up" },
    { value: "linkedin", label: "LinkedIn", icon: "business_center" },
    { value: "twitter", label: "Twitter/X", icon: "close" },
    { value: "youtube", label: "YouTube", icon: "play_circle" },
    { value: "pinterest", label: "Pinterest", icon: "push_pin" },
  ];

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "witty", label: "Witty" },
    { value: "inspirational", label: "Inspirational" },
    { value: "promotional", label: "Promotional" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await generateHashtags({ prompt, platform, tone });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate content. Please try again.");
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
    <SMHLayout>
      <main className="p-8 min-h-screen bg-[#F6F5FA]">

        {/* HEADER */}
        <div className="mb-10">
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <span>Home</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span>Tools</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[#031B4E] font-bold">Hashtag Generator</span>
          </div>
          <h1 className="text-[42px] font-bold text-[#031B4E]">AI Hashtag Generator</h1>
          <p className="text-gray-500 text-lg mt-2">
            Generate trending hashtags and a compelling post description powered by AI.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* ── LEFT: INPUT PANEL ── */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col gap-7">

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#031B4E]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#031B4E]">edit_note</span>
              </div>
              <h2 className="text-2xl font-bold text-[#031B4E]">Content Brief</h2>
            </div>

            {/* Topic / Prompt */}
            <div>
              <label className="block text-sm font-bold text-[#031B4E] mb-3 uppercase tracking-wide">
                Post Topic or Idea
              </label>
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
              <label className="block text-sm font-bold text-[#031B4E] mb-3 uppercase tracking-wide">
                Target Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                {platforms.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border-2 transition ${
                      platform === p.value
                        ? "border-[#031B4E] bg-[#031B4E]/5 text-[#031B4E]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{p.icon}</span>
                    <span className="text-xs font-semibold">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-bold text-[#031B4E] mb-3 uppercase tracking-wide">
                Tone of Voice
              </label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`px-5 py-2 rounded-full border-2 text-sm font-semibold transition ${
                      tone === t.value
                        ? "border-[#031B4E] bg-[#031B4E] text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full h-14 bg-[#031B4E] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#031B4E]/20"
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
                  Generate Content
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl text-sm">
                {error}
              </div>
            )}
          </div>

          {/* ── RIGHT: OUTPUT PANEL ── */}
          <div className="flex flex-col gap-6">

            {!result && !loading && (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-16 text-center h-full min-h-[400px]">
                <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-gray-400 text-[32px]">tag</span>
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Results will appear here</h3>
                <p className="text-gray-400 text-sm max-w-xs">
                  Fill in your post topic, select a platform and tone, then hit Generate.
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-3xl border border-gray-200 flex flex-col items-center justify-center p-16 text-center h-full min-h-[400px]">
                <div className="w-16 h-16 rounded-3xl bg-[#031B4E]/10 flex items-center justify-center mb-5 animate-pulse">
                  <span className="material-symbols-outlined text-[#031B4E] text-[32px]">auto_awesome</span>
                </div>
                <h3 className="text-xl font-bold text-[#031B4E] mb-2">AI is thinking...</h3>
                <p className="text-gray-400 text-sm">Crafting your hashtags and description</p>
              </div>
            )}

            {result && (
              <>
                {/* Post Description */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-7">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">description</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#031B4E]">Post Description</h3>
                    </div>
                    <button
                      onClick={() => handleCopy(result.description, "desc")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copied === "desc" ? "check" : "content_copy"}
                      </span>
                      {copied === "desc" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                    {result.description}
                  </p>
                </div>

                {/* Hashtags */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-7">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-600 text-[20px]">tag</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#031B4E]">Hashtags</h3>
                    </div>
                    <button
                      onClick={() => handleCopy(result.hashtags, "tags")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copied === "tags" ? "check" : "content_copy"}
                      </span>
                      {copied === "tags" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags
                      .split(/\s+/)
                      .filter((tag) => tag.startsWith("#"))
                      .map((tag, i) => (
                        <span
                          key={i}
                          className="bg-[#031B4E]/5 text-[#031B4E] px-4 py-2 rounded-full text-sm font-semibold border border-[#031B4E]/10"
                        >
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
      </main>
    </SMHLayout>
  );
}
