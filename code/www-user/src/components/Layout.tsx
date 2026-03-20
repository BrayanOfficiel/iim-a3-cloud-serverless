import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useUser } from "../context/UserContext";
import PurgeButton from "./PurgeButton";

const navItems = [
	{
		to: "/",
		label: "Tableau de bord",
		icon: (
			<svg
				className="w-5 h-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
				/>
			</svg>
		),
	},
	{
		to: "/teams",
		label: "Mes équipes",
		icon: (
			<svg
				className="w-5 h-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
				/>
			</svg>
		),
	},
	{
		to: "/invitations",
		label: "Invitations",
		icon: (
			<svg
				className="w-5 h-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
				/>
			</svg>
		),
	},
	{
		to: "/profile",
		label: "Mon profil",
		icon: (
			<svg
				className="w-5 h-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
				/>
			</svg>
		),
	},
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
		<div className="min-h-screen bg-surface text-white flex">
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black/70 z-20 lg:hidden"
					onClick={() => setSidebarOpen(false)}
					onKeyDown={() => {}}
				/>
			)}

			<aside
				className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-surface-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="p-5 border-b border-border">
					<h1 className="text-xl font-bold text-accent tracking-tight flex items-center gap-2">
						<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.36 7.5 12 10.82 5.64 7.5 12 4.18zM5 8.82l6 3.33v7.03l-6-3.33V8.82zm8 10.36V12.15l6-3.33v7.03l-6 3.33z" />
						</svg>
						Hive
					</h1>
					{user && (
						<p className="text-sm text-muted mt-1 truncate">{user.name}</p>
					)}
				</div>

				<nav className="flex-1 p-3 space-y-0.5">
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.to === "/"}
							onClick={() => setSidebarOpen(false)}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
									isActive
										? "bg-accent text-white"
										: "text-neutral-400 hover:bg-surface-elevated hover:text-white"
								}`
							}
						>
							{item.icon}
							{item.label}
						</NavLink>
					))}
				</nav>

				<div className="p-3 border-t border-border">
					<button
						type="button"
						onClick={logout}
						className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-500 hover:text-red-400 hover:bg-surface-elevated rounded-lg text-left transition-colors"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
							/>
						</svg>
						Deconnexion
					</button>
				</div>
			</aside>

			<div className="flex-1 flex flex-col min-w-0">
				<header className="lg:hidden bg-surface-card border-b border-border px-4 py-3 flex items-center gap-3">
					<button
						type="button"
						onClick={() => setSidebarOpen(true)}
						className="text-neutral-400 hover:text-white"
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
					<span className="font-bold text-accent flex items-center gap-2">
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.36 7.5 12 10.82 5.64 7.5 12 4.18zM5 8.82l6 3.33v7.03l-6-3.33V8.82zm8 10.36V12.15l6-3.33v7.03l-6 3.33z" />
						</svg>
						Hive
					</span>
				</header>

				<main className="flex-1 overflow-auto p-6">{children}</main>
			</div>
			<PurgeButton />
		</div>
	);
}
