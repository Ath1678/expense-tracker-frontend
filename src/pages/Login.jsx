import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { LogIn, ShieldCheck, ArrowRight, Lock, User, CheckCircle, XCircle } from "lucide-react";

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
                throw new Error(data.message || "Invalid credentials. Please verify your data.");
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 md:p-8 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full -mr-64 -mt-64 blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full -ml-64 -mb-64 blur-[120px]"></div>

            <div className="relative z-10 w-full max-w-lg">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border border-white overflow-hidden animate-in fade-in zoom-in duration-700">
                    <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 p-10 md:p-12 text-white text-center relative">
                        <div className="relative z-10">
                            <div className="bg-white/10 backdrop-blur-xl w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-inner">
                                <ShieldCheck size={36} className="text-blue-200" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Gatekeeper</h2>
                            <p className="text-blue-100/70 font-bold uppercase tracking-widest text-[10px]">Financial Hub Identity</p>
                        </div>
                        {/* Abstract overlays */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
                    </div>

                    <div className="p-10 md:p-12 pt-10">
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                                <XCircle className="text-rose-500 shrink-0" size={20} />
                                <p className="text-rose-600 text-sm font-black uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identity Token</label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white pl-14 pr-8 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 transition-all font-bold placeholder:text-slate-300"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Secure Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white pl-14 pr-8 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 transition-all font-bold placeholder:text-slate-300"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                            >
                                {loading ? "Authenticating..." : "Establish Link"}
                                {!loading && <ArrowRight size={22} />}
                            </button>
                        </form>

                        <div className="mt-12 text-center">
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]"><span className="bg-white px-4 text-slate-300">Vault Access Request</span></div>
                            </div>
                            <p className="mt-6 text-slate-500 font-medium">
                                No profile yet?{" "}
                                <Link to="/register" className="text-blue-600 font-black hover:text-indigo-700 transition-colors relative inline-block group">
                                    Join the Hub
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Micro Footer */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 font-black text-[9px] uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> Encrypted Access</span>
                    <span className="flex items-center gap-1.5">v2.0 Premium Hub</span>
                </div>
            </div>
        </div>
    );
}
