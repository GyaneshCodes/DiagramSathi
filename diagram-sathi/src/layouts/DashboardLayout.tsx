import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { UserCircle, Home, FileText, FolderOpen, Trash2 } from "lucide-react";

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Profile", path: "/profile", icon: UserCircle },
    { name: "Home", path: "/home", icon: Home },
    { name: "Drafts", path: "/drafts", icon: FileText },
    { name: "All Diagrams", path: "/projects", icon: FolderOpen },
    { name: "Trash", path: "/trash", icon: Trash2 },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] text-neutral font-sans selection:bg-primary/30">
      {/* ── ALBIENT BG ── */}
      <div className="absolute inset-0 pointer-events-none hero-ambient-bg opacity-40 mix-blend-screen" />

      {/* ── LEFT SIDEBAR ── */}
      <aside className="relative z-10 w-64 h-full border-r border-white/5 bg-[#0E0E11] flex flex-col pt-6 pb-6 shadow-2xl shrink-0">
        {/* <div className="px-6 mb-10 flex items-center gap-3">
          <img
            src="/logo2.png"
            alt="DiagramSathi"
            className="h-16 w-auto object-contain drop-shadow-[0_0_8px_rgba(128,59,255,0.4)]"
          />
        </div> */}

        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (location.pathname === "/" && item.path === "/home");
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5"
                    : "text-neutral/50 hover:bg-white/5 hover:text-neutral/90"
                }`}
              >
                <item.icon
                  className={`w-[18px] h-[18px] ${
                    isActive ? "text-primary" : "text-neutral/40"
                  }`}
                />
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto px-10 py-12 flex flex-col gap-14">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
