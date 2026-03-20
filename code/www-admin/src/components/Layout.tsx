import {useState} from "react";
import {NavLink, useNavigate} from "react-router";
import PurgeButton from "./PurgeButton";

const navItems = [
    {to: "/", label: "Tableau de bord"},
    {to: "/users", label: "Utilisateurs"},
    {to: "/teams", label: "Équipes"},
];

export default function Layout({children}: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    function logout() {
        localStorage.removeItem("admin_token");
        navigate("/login");
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    onKeyDown={() => {
                    }}
                />
            )}

            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="p-5 border-b border-slate-800">
                    <h1 className="text-xl font-bold">
                        <span className="text-amber-500">Hive</span> Admin
                    </h1>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            onClick={() => setSidebarOpen(false)}
                            className={({isActive}) =>
                                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-amber-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={logout}
                        className="w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-left transition-colors"
                    >
                        Deconnexion
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
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
                    <span className="font-bold">
            <span className="text-amber-500">Hive</span> Admin
          </span>
                </header>

                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
            <PurgeButton/>
        </div>
    );
}
