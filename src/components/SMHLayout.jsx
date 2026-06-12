import { Link, useLocation } from "react-router-dom";

export default function SMHLayout({ children }) {

  const location = useLocation();

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

      <aside className="w-[240px] bg-[#031B4E] fixed left-0 top-0 h-screen text-white flex flex-col">

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

                      <span className="font-medium">
                        {item.name}
                      </span>

                    </Link>

                  ))}

              </div>

            </div>

          ))}

        </nav>

        {/* PROFILE */}

        <div className="p-6 border-t border-white/10 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-white text-[#031B4E] flex items-center justify-center font-bold">
            SR
          </div>

          <div>

            <p className="font-semibold text-sm">
              Sarah Rogers
            </p>

            <p className="text-xs text-gray-400">
              Online
            </p>

          </div>

        </div>

      </aside>

      {/* PAGE CONTENT */}

      <div className="ml-[240px] flex-1 min-h-screen p-10">

        {children}

      </div>

    </div>

  );

}