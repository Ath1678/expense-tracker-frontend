import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { LogIn, ShieldCheck, ArrowRight, Lock, User, CheckCircle, XCircle, Sparkles } from "lucide-react";

const API_URL = "/api/auth/signin";

export default function Login() {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const contentType = res.headers.get("Content-Type");
            let data;

            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                data = { message: await res.text() || res.statusText };
            }

            if (!res.ok) {
                throw new Error(data.message || "Authentication failed. Please check your credentials.");
            }

            login(data);
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe] p-6 md:p-8 overflow-hidden relative">
            {/* Professional Background Accents */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-[140px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/40 rounded-full -ml-32 -mb-32 blur-[140px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-[480px] animate-premium">
                <div className="bg-white rounded-[2.5rem] shadow-[0_32px_80px_-20px_rgba(79,70,229,0.12)] border border-slate-100/50 overflow-hidden">
                    
                    {/* Premium Header Branding */}
                    <div className="bg-gradient-to-br from-[#4f46e5] via-[#3b82f6] to-[#6366f1] p-10 md:p-12 text-white text-center relative">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden shadow-2xl mb-4 border-4 border-white/20 backdrop-blur-sm">
                                <img src="/logo.png" alt="Expensify Logo" className="w-full h-full object-cover" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-[900] tracking-tighter mb-2">Expensify</h1>
                            <p className="text-blue-50/80 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs opacity-90">Professional Financial Hub</p>
                        </div>
                        {/* Elegant Light Effects */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                    </div>

                    <div className="p-10 md:p-12 pt-10">
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                                <XCircle className="text-rose-500 shrink-0" size={20} />
                                <p className="text-rose-600 text-xs font-black uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-all" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50/80 border-2 border-transparent focus:border-blue-100 focus:bg-white pl-14 pr-8 py-4.5 rounded-[1.5rem] outline-none focus:ring-[12px] focus:ring-blue-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-all" size={18} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-50/80 border-2 border-transparent focus:border-blue-100 focus:bg-white pl-14 pr-8 py-4.5 rounded-[1.5rem] outline-none focus:ring-[12px] focus:ring-blue-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#4f46e5] hover:bg-slate-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg mt-4 group"
                            >
                                {loading ? "Authenticating..." : "Sign In"}
                                {!loading && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>

                        <div className="mt-14 text-center">
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em]"><span className="bg-white px-4 text-slate-300">Authentication Protocol</span></div>
                            </div>
                            <p className="mt-8 text-slate-500 font-bold text-[13px]">
                                New to Expensify?{" "}
                                <Link to="/register" className="text-blue-600 font-black hover:text-indigo-700 transition-all relative inline-block group ml-1">
                                    Register Now
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Standardized Micro Footer */}
                <div className="mt-10 flex items-center justify-center gap-8 opacity-25 font-black text-[9px] uppercase tracking-[0.3em] text-slate-400">
                    <span className="flex items-center gap-2"><ShieldCheck size={12} /> Encrypted Access</span>
                    <span className="flex items-center gap-2">v2.0 Premium Hub</span>
                </div>
            </div>
        </div>
    );
}
