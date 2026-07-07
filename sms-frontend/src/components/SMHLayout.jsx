import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function SMHLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerLogout = () => {
    setMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem("user");
    navigate("/sign-in");
  };

  const navItems = [
    {
      name: "Dashboard",
      icon: "dashboard",
      path: "/smh-dashboard",
      section: "Workspace",
    },
    {
      name: "Schedule",
      icon: "calendar_month",
      path: "/smh-scheduler",
      section: "Workspace",
    },
    {
      name: "Clients",
      icon: "group",
      path: "/smh-clients",
      section: "Workspace",
    },
    {
      name: "Analytics",
      icon: "analytics",
      path: "/smh-analytics",
      section: "Tools",
    },
    {
      name: "Settings",
      icon: "settings",
      path: "/smh-settings",
      section: "Admin",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F5FA] flex">
      {/* SIDEBAR */}
      <aside className="w-[240px] bg-[#031B4E] fixed left-0 top-0 h-screen text-white flex flex-col z-50">
        {/* LOGO */}
        <div className="px-6 py-8 border-b border-white/10">
          <h1 className="text-3xl font-bold leading-tight">
            content <br />
            manager
          </h1>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {["Workspace", "Tools", "Admin"].map((section) => (
            <div key={section} className="mb-8">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-4 px-4">
                {section}
              </p>
              <div className="space-y-2">
                {navItems
                  .filter((item) => item.section === section)
                  .map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        location.pathname === item.path
                          ? "bg-white/10 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </nav>

        {/* PROFILE (BOTTOM LEFT) */}
        <div className="p-6 border-t border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-[#031B4E] flex items-center justify-center font-bold">
            SMH
          </div>
          <div>
            <p className="font-semibold text-sm">SMH</p>
            <p className="text-xs text-gray-400">Online</p>
          </div>
        </div>
      </aside>

      {/* PAGE CONTENT WRAPPER */}
      <div className="ml-[240px] flex-1 min-h-screen flex flex-col">
        {/* TOP BAR / HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 h-[72px] flex justify-end items-center px-10 shrink-0">
          <div className="flex items-center gap-6 relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 hover:bg-gray-150 px-3 py-2 rounded-2xl transition border-0 bg-transparent cursor-pointer outline-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#031B4E] text-white flex items-center justify-center font-bold text-sm">
                SMH
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-[#031B4E] text-sm leading-tight m-0">
                  SMH
                </p>
                <p className="text-xs text-gray-400 m-0">SMH Manager</p>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-[20px]">
                expand_more
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[55px] w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 py-2">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    triggerLogout();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm font-semibold text-red-500 flex items-center gap-3 border-0 bg-transparent cursor-pointer outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* PAGE BODY */}
        <div className="flex-1 p-10 bg-[#F6F5FA]">
          {children}
        </div>
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justify: "center",
            zIndex: 100,
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(4px)",
            }}
          ></div>

          {/* Modal Content */}
          <div
            className="relative bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
            style={{
              position: "relative",
              width: "380px",
              maxWidth: "90%",
              display: "block",
              backgroundColor: "#ffffff",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #f3f4f6",
              boxSizing: "border-box",
            }}
          >
            <div
              className="flex items-center gap-3 mb-3"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <div
                className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0"
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "9999px",
                  backgroundColor: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justify: "center",
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined text-red-600">
                  warning
                </span>
              </div>
              <h3
                className="text-lg font-bold text-gray-900"
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Exit Application
              </h3>
            </div>

            <p
              className="text-sm text-gray-500 mb-6 leading-relaxed"
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "1.5rem",
                lineHeight: 1.625,
                margin: "0.5rem 0",
              }}
            >
              Do you want to logout exit from this application?
            </p>

            <div
              className="flex items-center justify-end gap-3"
              style={{
                display: "flex",
                alignItems: "center",
                justify: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-gray-200 bg-white outline-none"
                style={{ cursor: "pointer", outline: "none" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer border-0 shadow-sm hover:shadow outline-none"
                style={{ cursor: "pointer", outline: "none" }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}