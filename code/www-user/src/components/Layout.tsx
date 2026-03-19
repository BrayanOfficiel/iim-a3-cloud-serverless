import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useUser } from "../context/UserContext";

const navItems = [
  { to: "/", label: "Tableau de bord" },
  { to: "/teams", label: "Mes équipes" },
  { to: "/invitations", label: "Invitations" },
  { to: "/profile", label: "Mon profil" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={() => {}}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 border-r border-slate-700 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-xl font-bold text-indigo-400">Launchpad</h1>
          {user && (
            <p className="text-sm text-slate-400 mt-1 truncate">{user.name}</p>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            type="button"
            onClick={logout}
            className="w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-left transition-colors"
          >
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="lg:hidden bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-300 hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Menu</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-bold text-indigo-400">Launchpad</span>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
