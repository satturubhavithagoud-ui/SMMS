import { useState, useEffect } from "react";
import SMHLayout from "../components/SMHLayout";
import { apiRequest } from "../services/api";

export default function SMHSettings() {

  const [activeTab, setActiveTab] = useState("General");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({ scheduled_posts: 0, connected_platforms: 0 });

  const [settings, setSettings] = useState({
    workspace_name: "Content Manager",
    timezone: "Asia/Kolkata",
    theme_color: "#031B4E",
    default_posting_time: "18:00",
    ai_caption_style: "Professional",
    default_platform: "Instagram"
  });

  const [loginAlerts, setLoginAlerts] = useState(true);
  const [failedAlerts, setFailedAlerts] = useState(true);
  const [scheduledAlerts, setScheduledAlerts] = useState(true);
  const [clientActivity, setClientActivity] = useState(false);
  const [campaignUpdates, setCampaignUpdates] = useState(true);
  const [reportAlerts, setReportAlerts] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, settingsRes] = await Promise.all([
          apiRequest('/smh/dashboard/'),
          apiRequest('/smh/settings/')
        ]);
        
        if (dashRes && dashRes.stats) {
            setDashboardStats({
                scheduled_posts: dashRes.stats.scheduled_posts || 0,
                connected_platforms: dashRes.stats.connected_accounts || 0
            });
        }
        
        if (settingsRes && !settingsRes.error) {
            setSettings({
                workspace_name: settingsRes.workspace_name || "Content Manager",
                timezone: settingsRes.timezone || "Asia/Kolkata",
                theme_color: settingsRes.theme_color || "#031B4E",
                default_posting_time: settingsRes.default_posting_time || "18:00",
                ai_caption_style: settingsRes.ai_caption_style || "Professional",
                default_platform: settingsRes.default_platform || "Instagram"
            });
        }
      } catch (err) {
        console.error("Failed to load settings data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
        await apiRequest('/smh/settings/', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
        alert('Settings saved successfully!');
    } catch (err) {
        console.error("Failed to save settings", err);
        alert('Failed to save settings.');
    } finally {
        setSaving(false);
    }
  };

  const tabs = [
    "General",
    "Notifications",
  ];

  return (

    <SMHLayout>

      <div className="p-8 bg-[#F6F5FA] min-h-screen">

        {/* PAGE HEADER */}

        <div className="mb-8">

          <h1 className="text-5xl font-bold text-[#031B4E] mb-3">
            Settings
          </h1>

          <p className="text-gray-500 text-lg">
            Manage your Social Media Handler workspace settings.
          </p>

        </div>

        {/* SETTINGS TABS */}

        <div className="mb-10">

          <div className="bg-white rounded-full shadow-sm border border-gray-200 p-2 inline-flex gap-2 flex-wrap">

            {tabs.map((tab, index) => (

              <button
                key={index}
                onClick={() => setActiveTab(tab)}
                className={`px-7 py-3 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-[#031B4E] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >

                {tab}

              </button>

            ))}

          </div>

        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-[#031B4E] border-t-transparent rounded-full mb-4"></div>
            <p className="text-[#031B4E] font-bold">Loading Settings...</p>
          </div>
        ) : (
          <>
            {/* =========================
                GENERAL TAB
            ========================= */}

            {activeTab === "General" && (

          <div className="space-y-8">

            {/* OVERVIEW CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* TOTAL POSTS */}

              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-gray-500 text-sm mb-2">
                      Total Scheduled Posts
                    </p>

                    <h2 className="text-5xl font-bold text-[#031B4E]">
                      {dashboardStats.scheduled_posts}
                    </h2>

                  </div>

                  <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center">

                    <span className="material-symbols-outlined text-[#031B4E] text-4xl">
                      post_add
                    </span>

                  </div>

                </div>

              </div>

              {/* TOTAL PLATFORMS */}

              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-gray-500 text-sm mb-2">
                      Connected Platforms
                    </p>

                    <h2 className="text-5xl font-bold text-[#031B4E]">
                      {dashboardStats.connected_platforms}
                    </h2>

                  </div>

                  <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center">

                    <span className="material-symbols-outlined text-green-700 text-4xl">
                      hub
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* WORKSPACE SETTINGS */}

            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">

              <div className="flex justify-between items-center mb-8">

                <div>

                  <h2 className="text-3xl font-bold text-[#031B4E] mb-2">
                    Workspace Settings
                  </h2>

                  <p className="text-gray-500">
                    Configure your SMH workspace and posting preferences.
                  </p>

                </div>

                <button 
                  onClick={saveSettings} 
                  disabled={saving}
                  className={`bg-[#031B4E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-900 transition-colors ${saving ? 'opacity-70' : ''}`}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* WORKSPACE NAME */}

                <div>

                  <label className="block text-sm font-semibold mb-2 text-[#031B4E]">
                    Workspace Name
                  </label>

                  <input
                    type="text"
                    name="workspace_name"
                    value={settings.workspace_name}
                    onChange={handleSettingChange}
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none"
                  />

                </div>

                {/* TIMEZONE */}

                <div>

                  <label className="block text-sm font-semibold mb-2 text-[#031B4E]">
                    Timezone
                  </label>

                  <select 
                    name="timezone"
                    value={settings.timezone}
                    onChange={handleSettingChange}
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none"
                  >

                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>

                  </select>

                </div>

                {/* THEME COLOR */}

                <div>

                  <label className="block text-sm font-semibold mb-2 text-[#031B4E]">
                    Brand Theme Color
                  </label>

                  <input
                    type="color"
                    name="theme_color"
                    value={settings.theme_color}
                    onChange={handleSettingChange}
                    className="w-full h-14 rounded-2xl border border-gray-300"
                  />

                </div>

                {/* DEFAULT POSTING TIME */}

                <div>

                  <label className="block text-sm font-semibold mb-2 text-[#031B4E]">
                    Default Posting Time
                  </label>

                  <input
                    type="time"
                    name="default_posting_time"
                    value={settings.default_posting_time}
                    onChange={handleSettingChange}
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none"
                  />

                </div>

                {/* AI CAPTION STYLE */}

                <div>

                  <label className="block text-sm font-semibold mb-2 text-[#031B4E]">
                    AI Caption Style
                  </label>

                  <select 
                    name="ai_caption_style"
                    value={settings.ai_caption_style}
                    onChange={handleSettingChange}
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none"
                  >

                    <option value="Professional">Professional</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Creative">Creative</option>

                  </select>

                </div>

                {/* DEFAULT PLATFORM */}

                <div>

                  <label className="block text-sm font-semibold mb-2 text-[#031B4E]">
                    Default Posting Platform
                  </label>

                  <select 
                    name="default_platform"
                    value={settings.default_platform}
                    onChange={handleSettingChange}
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none"
                  >

                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="YouTube">YouTube</option>

                  </select>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* =========================
            NOTIFICATIONS TAB
        ========================= */}

        {activeTab === "Notifications" && (

          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">

            <h2 className="text-3xl font-bold text-[#031B4E] mb-8">
              Notification Settings
            </h2>

            <div className="space-y-5">

              {[
                {
                  title: "Client Login Alerts",
                  state: loginAlerts,
                  setter: setLoginAlerts,
                },

                {
                  title: "Failed Post Alerts",
                  state: failedAlerts,
                  setter: setFailedAlerts,
                },

                {
                  title: "Scheduled Post Alerts",
                  state: scheduledAlerts,
                  setter: setScheduledAlerts,
                },

                {
                  title: "Client Activity Updates",
                  state: clientActivity,
                  setter: setClientActivity,
                },

                {
                  title: "Campaign Status Updates",
                  state: campaignUpdates,
                  setter: setCampaignUpdates,
                },

                {
                  title: "Weekly Report Notifications",
                  state: reportAlerts,
                  setter: setReportAlerts,
                },

              ].map((item, index) => (

                <div
                  key={index}
                  className="flex justify-between items-center border border-gray-200 rounded-2xl px-6 py-5"
                >

                  <div>

                    <h3 className="font-medium text-[#031B4E]">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Receive notifications related to {item.title.toLowerCase()}.
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      item.setter(!item.state)
                    }
                    className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${
                      item.state
                        ? "bg-[#031B4E] justify-end"
                        : "bg-gray-300 justify-start"
                    }`}
                  >

                    <div className="w-6 h-6 bg-white rounded-full"></div>

                  </button>

                </div>

              ))}

            </div>

          </div>

        )}
          </>
        )}

      </div>

    </SMHLayout>

  );

}