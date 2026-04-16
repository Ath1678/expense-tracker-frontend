import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import ExpenseService from "../services/ExpenseService";
import AuthContext from "../context/AuthContext";
import UserService from "../services/UserService";
import { 
    Plus, Trash2, Calendar, Tag, DollarSign, FileText, Search, 
    TrendingUp, Filter, Target, ArrowUp, Download, Wallet, 
    ArrowDownRight, LayoutPanelTop, CheckCircle, XCircle 
} from "lucide-react";
import ExpensePieChart from "./Charts/ExpensePieChart";
import MonthlyTrendChart from "./Charts/MonthlyTrendChart";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Performance-optimized Charts
const MemoizedPieChart = React.memo(ExpensePieChart);
const MemoizedTrendChart = React.memo(MonthlyTrendChart);

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals Control
    const [showModal, setShowModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    
    // Status Feedback
    const [statusInfo, setStatusInfo] = useState({ type: 'success', message: '' });
    
    const [itemToDelete, setItemToDelete] = useState(null);
    const [monthlyLimit, setMonthlyLimit] = useState(0);
    const [newLimit, setNewLimit] = useState("");

    // Form State
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("General");
    const [date, setDate] = useState("");
    const [notes, setNotes] = useState("");

    // Filtering & Search
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [sortBy, setSortBy] = useState("Newest");

    // Search Debouncer Logic - Makes UI lightning fast while typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 200);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [expData, userData] = await Promise.all([
                ExpenseService.getExpenses(),
                UserService.getProfile()
            ]);
            setExpenses(Array.isArray(expData) ? expData : []);
            if (userData) setMonthlyLimit(userData.monthlyLimit || 0);
        } catch (error) {
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredExpenses = useMemo(() => {
        const list = Array.isArray(expenses) ? expenses : [];
        let result = list.filter(e => {
            if (!e) return false;
            const matchesSearch = (e.title || "").toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesCategory = filterCategory === "All" || e.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        return result.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (sortBy === "Highest") return Number(b.amount || 0) - Number(a.amount || 0);
            if (sortBy === "Lowest") return Number(a.amount || 0) - Number(b.amount || 0);
            if (sortBy === "Oldest") return dateA - dateB;
            return dateB - dateA;
        });
    }, [expenses, debouncedSearch, filterCategory, sortBy]);

    // OPTIMISTIC UPDATES - INSTANT FEEDBACK
    const addExpense = async (e) => {
        e.preventDefault();
        const tempId = Date.now();
        const newExpense = { 
            id: tempId, 
            title, 
            amount: Number(amount), 
            category, 
            date, 
            notes,
            optimistic: true 
        };

        const originalExpenses = [...expenses];
        setExpenses([newExpense, ...expenses]);
        setShowModal(false);
        resetForm();
        triggerStatus('success', 'Syncing with vault...');

        try {
            const savedItem = await ExpenseService.addExpense(newExpense);
            setExpenses(prev => prev.map(item => item.id === tempId ? savedItem : item));
            triggerStatus('success', 'Transaction verified.');
        } catch (err) {
            setExpenses(originalExpenses);
            triggerStatus('error', 'Sync failed. Vault offline.');
        }
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        const originalExpenses = [...expenses];
        setExpenses(expenses.filter(i => i.id !== itemToDelete));
        setShowDeleteModal(false);
        triggerStatus('success', 'Purging record...');

        try {
            await ExpenseService.deleteExpense(itemToDelete);
            triggerStatus('success', 'Vault purged.');
        } catch (err) {
            setExpenses(originalExpenses);
            triggerStatus('error', 'Purge failed.');
        } finally {
            setItemToDelete(null);
        }
    };

    const updateLimit = async (e) => {
        e.preventDefault();
        const oldLimit = monthlyLimit;
        setMonthlyLimit(Number(newLimit));
        setShowLimitModal(false);
        triggerStatus('success', 'Calibrating budget...');
        try {
            await UserService.updateLimit(Number(newLimit));
            setNewLimit("");
        } catch (err) {
            setMonthlyLimit(oldLimit);
            triggerStatus('error', 'Calibration failed.');
        }
    };

    const triggerStatus = useCallback((type, message) => {
        setStatusInfo({ type, message });
        setShowStatusModal(true);
        setTimeout(() => setShowStatusModal(false), 2000);
    }, []);

    const resetForm = () => {
        setTitle(""); setAmount(""); setCategory("General"); setDate(""); setNotes("");
    };

    const exportPDF = () => {
        try {
            const doc = new jsPDF();
            const tableColumn = ["Title", "Category", "Date", "Amount"];
            const tableRows = (filteredExpenses || []).map(exp => [
                exp.title,
                exp.category,
                exp.date,
                `Rs. ${exp.amount.toLocaleString()}`
            ]);

            doc.setFontSize(18);
            doc.setTextColor(79, 70, 229);
            doc.text("Expense Tracker - Transaction Report", 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated by: ${user?.username || 'Authorized User'}`, 14, 22);

            autoTable(doc, {
                startY: 30,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
            });

            doc.save(`Expensify_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            triggerStatus('success', 'PDF Engine Activated.');
        } catch (error) {
            triggerStatus('error', 'Report generation failed.');
        }
    };

    const total = expenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
    const categories = [...new Set(expenses.map(e => e?.category || "General"))];
    const progress = monthlyLimit > 0 ? (total / monthlyLimit) * 100 : 0;
    const isOverBudget = progress > 100;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12 px-2 md:px-0">
            {/* Premium Header */}
            <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-3 md:gap-4 mb-6">
                            <div className="bg-white/10 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border border-white/20">
                                <Wallet size={28} className="text-blue-200" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-4xl font-black tracking-tighter">Financial Nexus</h2>
                                <p className="text-blue-100/80 font-bold uppercase tracking-widest text-[10px] md:text-xs">Security Protocol Active</p>
                            </div>
                        </div>
                        <div className="flex gap-3 md:gap-4">
                            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex-1 transition-all hover:bg-white/20">
                                <p className="text-[9px] md:text-[10px] uppercase font-black text-blue-200 mb-1 lg:mb-2 tracking-widest">Total Spent</p>
                                <p className="text-xl md:text-3xl font-black tabular-nums">₹{total.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex-1 transition-all hover:bg-white/20">
                                <p className="text-[9px] md:text-[10px] uppercase font-black text-blue-200 mb-1 lg:mb-2 tracking-widest">Efficiency</p>
                                <p className={`text-lg md:text-xl font-black ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {isOverBudget ? "Critical" : "Stable"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs md:text-sm font-black text-blue-100 italic tracking-widest">BUDGET ENGINE</span>
                            <button onClick={() => setShowLimitModal(true)} className="bg-white/10 hover:bg-indigo-600 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black transition-all border border-white/10 shadow-lg">CALIBRATE</button>
                        </div>
                        <div className="flex justify-between text-3xl md:text-4xl font-black mb-4">
                            <span className="tabular-nums">{Math.min(progress, 100).toFixed(0)}%</span>
                            <span className="text-lg md:text-xl font-medium text-blue-200/60 pt-2 lg:pt-3">/ ₹{monthlyLimit.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-blue-900/40 rounded-full h-3 md:h-4 p-1 overflow-hidden relative shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${isOverBudget ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {expenses.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <MemoizedPieChart expenses={expenses} />
                    <MemoizedTrendChart expenses={expenses} />
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 items-center justify-between">
                 <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 flex-1 max-w-4xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find logs..."
                            className="w-full bg-white border border-slate-200 pl-11 lg:pl-14 pr-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm md:text-base shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative group">
                        <Filter className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select 
                            className="w-full sm:w-auto bg-white border border-slate-200 pl-11 lg:pl-14 pr-10 py-3.5 md:py-4 rounded-xl md:rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none cursor-pointer font-bold text-sm md:text-base shadow-sm"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 md:gap-4 w-full xl:w-auto">
                    <button onClick={exportPDF} className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-600 px-4 lg:px-6 py-3.5 md:py-4 rounded-xl md:rounded-[1.5rem] font-black text-xs md:text-sm flex items-center justify-center gap-2 border border-slate-100 shadow-sm transition-all">
                        <Download size={18} /> REPORT
                    </button>
                    <button onClick={() => setShowModal(true)} className="flex-2 sm:flex-none bg-blue-600 hover:bg-slate-900 text-white px-6 lg:px-8 py-3.5 md:py-4 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95">
                        <Plus size={22} /> ADD ENTRY
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-slate-50 text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-black">
                            <tr>
                                <th className="px-6 md:px-10 py-6 text-left">Description</th>
                                <th className="px-6 md:px-10 py-6 text-left">Category</th>
                                <th className="px-6 md:px-10 py-6 text-left">Timestamp</th>
                                <th className="px-6 md:px-10 py-6 text-right">Value</th>
                                <th className="px-6 md:px-10 py-6 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-40"></div></td>
                                        <td className="px-10 py-8"><div className="h-6 bg-slate-50 rounded-full w-20"></div></td>
                                        <td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-24"></div></td>
                                        <td className="px-10 py-8 text-right"><div className="h-5 bg-slate-100 rounded-lg w-20 ml-auto"></div></td>
                                        <td className="px-10 py-8 text-center"><div className="h-8 w-8 bg-slate-50 rounded-lg mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-24 text-center">
                                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <LayoutPanelTop size={32} className="text-slate-200" />
                                        </div>
                                        <p className="font-black text-slate-800 text-lg">Empty Nexus</p>
                                        <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mt-1">Ready for Initial Inflow</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((exp) => (
                                    <tr key={exp.id} className={`hover:bg-slate-50/50 transition-all group ${exp.optimistic ? 'opacity-60 animate-pulse' : ''}`}>
                                        <td className="px-6 md:px-10 py-6 md:py-8">
                                            <div className="font-black text-slate-900 text-sm md:text-base flex items-center gap-2">
                                                {exp.title}
                                                {exp.optimistic && <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400 tracking-widest font-black uppercase">Syncing</span>}
                                            </div>
                                            {exp.notes && <div className="text-[10px] text-slate-400 font-bold mt-1 truncate max-w-[200px]">{exp.notes}</div>}
                                        </td>
                                        <td className="px-6 md:px-10 py-6 md:py-8 text-slate-500 font-bold text-xs">
                                            <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-widest text-[10px]">{exp.category}</span>
                                        </td>
                                        <td className="px-6 md:px-10 py-6 md:py-8 text-slate-400 font-black text-[10px] md:text-xs">{exp.date}</td>
                                        <td className="px-6 md:px-10 py-6 md:py-8 text-right font-black text-slate-900 text-base md:text-xl">-₹{exp.amount.toLocaleString()}</td>
                                        <td className="px-6 md:px-10 py-6 md:py-8 text-center transition-all">
                                            <button 
                                                onClick={() => { setItemToDelete(exp.id); setShowDeleteModal(true); }} 
                                                className="p-3 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-all scale-100 hover:scale-110 active:scale-95 shadow-sm border border-rose-100"
                                                title="Delete Entry"
                                            >
                                                <Trash2 size={22} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals with responsive heights */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-hide">
                        <div className="px-8 md:px-10 pt-8 md:pt-10 pb-6 border-b border-slate-50 flex justify-between items-start">
                            <div><h3 className="text-2xl md:text-3xl font-black text-slate-900">Record Entry</h3><p className="text-sm text-slate-500 font-bold uppercase tracking-tight">Active Inflow Injection</p></div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold">×</button>
                        </div>
                        <form onSubmit={addExpense} className="p-8 md:p-10 pt-8 space-y-6">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description</label><input required className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 transition-all font-black placeholder:text-slate-300" placeholder="Source of outflow..." value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Value (₹)</label><input type="number" required className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 transition-all font-black" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tag</label><select className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 transition-all font-black appearance-none cursor-pointer" value={category} onChange={(e) => setCategory(e.target.value)}><option>General</option><option>Food</option><option>Travel</option><option>Shopping</option><option>Entertainment</option><option>Bills</option><option>Health</option></select></div>
                            </div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Timestamp</label><input type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 transition-all font-black" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black order-2 sm:order-1 outline-none">STANDBY</button><button type="submit" className="flex-2 sm:flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all hover:-translate-y-1 order-1 sm:order-2 outline-none">INSTANT RECORD</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Confirm Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-100 shadow-sm"><Trash2 size={40} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 whitespace-nowrap">Purge Record?</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed italic">Warning: Irreversible deletion protocol will be executed.</p>
                        <div className="flex gap-4"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black">ABORT</button><button onClick={executeDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200">PURGE</button></div>
                    </div>
                </div>
            )}

            {showLimitModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="px-4 pt-4 pb-4 border-b border-slate-50 mb-6">
                            <h3 className="text-2xl font-black text-slate-900">Calibrate System</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Strategic Limit Phase</p>
                        </div>
                        <form onSubmit={updateLimit} className="space-y-6">
                            <input type="number" required className="w-full bg-slate-50 border-none px-6 py-4 rounded-xl outline-none focus:ring-8 focus:ring-blue-500/5 font-black text-center text-xl" value={newLimit} onChange={e => setNewLimit(e.target.value)} placeholder="Limit Amount" />
                            <div className="flex gap-4"><button type="button" onClick={() => setShowLimitModal(false)} className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black">CANCEL</button><button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100">COMMIT</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showStatusModal && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`px-10 py-4 rounded-3xl shadow-2xl flex items-center gap-4 backdrop-blur-2xl border ${statusInfo.type === 'success' ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-indigo-200' : 'bg-rose-600/90 border-rose-400 text-white shadow-rose-200'}`}>
                        {statusInfo.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                        <span className="font-black text-xs uppercase tracking-[0.2em]">{statusInfo.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function WalletIcon() {
    return <Wallet size={20} />;
}
