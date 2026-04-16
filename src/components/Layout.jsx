import React, { useContext, useState } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import {
    LayoutDashboard,
    LogOut,
    Menu,
    Wallet,
    TrendingUp,
    Repeat,
    X,
    ChevronRight,
    ShieldCheck
} from "lucide-react";

export default function Layout() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        { name: "Financial Hub", path: "/dashboard", icon: LayoutDashboard },
        { name: "Income Vault", path: "/income", icon: TrendingUp },
        { name: "Recurring Hub", path: "/recurring", icon: Repeat },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <div className="h-full flex flex-col p-6">
                    {/* Brand */}
                    <div className="flex items-center gap-4 mb-10 px-2 mt-2">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-100 border-2 border-white">
                            <img src="/logo.png" alt="Expensify Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tighter text-slate-900 leading-none">Expensify</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-1">Premium Hub</span>
                        </div>
                        {/* Close button for mobile */}
                        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Master Controls</p>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`group flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 ${active
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <Icon size={20} className={`${active ? 'text-white' : 'group-hover:text-indigo-600'} transition-colors`} />
                                        <span className="font-bold text-sm">{item.name}</span>
                                    </div>
                                    {active && <ChevronRight size={16} className="opacity-50" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile Area */}
                    <div className="mt-auto pt-6 border-t border-slate-50">
                        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50 flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-md">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate">{user?.username || "Authorized User"}</p>
                                <p className="text-[10px] text-slate-400 font-bold truncate tracking-tight">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Secure Exit"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                        <div className="mt-4 px-4 flex items-center gap-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            <ShieldCheck size={12} />
                            Security Protocol Active
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile blur */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Content Scaffolding */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Mobile Header - High End */}
                <header className="md:hidden bg-white/80 backdrop-blur-xl px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-100 border border-white">
                            <img src="/logo.png" alt="Expensify Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-indigo-600 uppercase">Expensify</span>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                    >
                        <Menu size={20} />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 md:pt-10 scrollbar-hide">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
