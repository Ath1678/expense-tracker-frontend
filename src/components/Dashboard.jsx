import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ExpenseService from "../services/ExpenseService";
import { 
    Plus, Trash2, Calendar, Tag, DollarSign, FileText, Search, 
    TrendingUp, Filter, Target, ArrowUp, Download, Wallet, 
    ArrowDownRight, LayoutPanelTop, CheckCircle, XCircle, Edit3 
} from "lucide-react";

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals Control
    const [showModal, setShowModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Status Feedback
    const [statusInfo, setStatusInfo] = useState({ type: 'success', message: '' });
    
    const [itemToDelete, setItemToDelete] = useState(null);
    const [monthlyLimit, setMonthlyLimit] = useState(() => Number(localStorage.getItem('expenseLimit')) || 50000);
    const [newLimit, setNewLimit] = useState("");

    // Form State
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("General");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");

    // Filter Stats
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const data = await ExpenseService.getExpenses();
            setExpenses(Array.isArray(data) ? data : []);
        } catch (err) {}
        setLoading(false);
    };

    const handleOpModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setEditingId(item.id);
            setTitle(item.title);
            setAmount(item.amount);
            setCategory(item.category);
            setDate(item.date);
            setNotes(item.notes || "");
        } else {
            setIsEditing(false);
            setEditingId(null);
            resetForm();
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setTitle("");
        setAmount("");
        setCategory("General");
        setDate(new Date().toISOString().split('T')[0]);
        setNotes("");
    };

    const submitExpense = async (e) => {
        e.preventDefault();
        const expenseData = { title, amount: Number(amount), category, date, notes };
        
        if (isEditing) {
            updateExpense(expenseData);
        } else {
            addExpense(expenseData);
        }
    };

    const addExpense = async (data) => {
        const tempId = Date.now();
        const newExpense = { id: tempId, ...data, optimistic: true };
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
            triggerStatus('error', 'Sync failed.');
        }
    };

    const updateExpense = async (data) => {
        const originalExpenses = [...expenses];
        setExpenses(expenses.map(exp => exp.id === editingId ? { ...exp, ...data, optimistic: true } : exp));
        setShowModal(false);
        triggerStatus('success', 'Updating record...');

        try {
            const updated = await ExpenseService.updateExpense(editingId, data);
            setExpenses(prev => prev.map(item => item.id === editingId ? updated : item));
            triggerStatus('success', 'Record updated.');
        } catch (err) {
            setExpenses(originalExpenses);
            triggerStatus('error', 'Update failed.');
        }
    };

    const triggerDelete = async () => {
        if (!itemToDelete) return;
        const original = [...expenses];
        setExpenses(expenses.filter(e => e.id !== itemToDelete));
        setShowDeleteModal(false);
        triggerStatus('success', 'Purging record...');

        try {
            await ExpenseService.deleteExpense(itemToDelete);
            triggerStatus('success', 'Record purged.');
        } catch (err) {
            setExpenses(original);
            triggerStatus('error', 'Purge failed.');
        }
    };

    const updateLimit = () => {
        const limitValue = Number(newLimit);
        if (limitValue > 0) {
            setMonthlyLimit(limitValue);
            localStorage.setItem('expenseLimit', limitValue);
            setShowLimitModal(false);
            setNewLimit("");
            triggerStatus('success', 'Budget calibration complete.');
        }
    };

    const triggerStatus = useCallback((type, message) => {
        setStatusInfo({ type, message });
        setShowStatusModal(true);
        setTimeout(() => setShowStatusModal(false), 2000);
    }, []);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = filterCategory === "All" || exp.category === filterCategory;
            return matchesSearch && matchesCat;
        });
    }, [expenses, searchTerm, filterCategory]);

    const stats = useMemo(() => {
        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTotal = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + Number(e.amount), 0);
        return { total, todayTotal };
    }, [expenses]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20 px-2 md:px-0">
            {/* Premium Header */}
            <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                            <div className="bg-white/10 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border border-white/20">
                                <LayoutPanelTop size={28} className="text-blue-200" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black tracking-tighter">Financial Nexus</h1>
                                <p className="text-blue-100/80 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs mt-1 md:mt-2">Active Intelligence Monitoring</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 hover:bg-white/20 transition-all">
                                <p className="text-[9px] md:text-[10px] uppercase font-black text-blue-200 mb-1 lg:mb-2 tracking-widest">Global Outflow</p>
                                <p className="text-xl md:text-3xl font-black tabular-nums">₹{stats.total.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 hover:bg-white/20 transition-all">
                                <p className="text-[9px] md:text-[10px] uppercase font-black text-blue-200 mb-1 lg:mb-2 tracking-widest">Cycle Threshold</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xl md:text-3xl font-black tabular-nums">₹{(monthlyLimit/1000).toFixed(0)}k</p>
                                    <button onClick={() => setShowLimitModal(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"><Target size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:block relative">
                        <div className="bg-white/5 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/10 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-xs font-black uppercase tracking-widest text-blue-200">System Integrity</p>
                                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/30">OPERATIONAL</span>
                            </div>
                            <div className="space-y-4">
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400" style={{width: `${Math.min((stats.total/monthlyLimit)*100, 100)}%`}}></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-200/60 font-sans">
                                    <span>Vector Load</span>
                                    <span>{Math.round((stats.total/monthlyLimit)*100)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1 md:px-2">
                <div className="flex gap-4 w-full md:w-auto flex-1 max-w-2xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                        <input type="text" placeholder="Search Vectors..." className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-100 transition-all shadow-sm font-black text-sm md:text-base placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => handleOpModal()} className="bg-slate-900 text-white p-3.5 rounded-2xl md:hidden">
                        <Plus size={24} />
                    </button>
                    <div className="hidden md:block relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select className="bg-white border border-slate-200 pl-11 pr-10 py-3.5 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-100 appearance-none cursor-pointer shadow-sm font-black text-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="All">All Categories</option><option>Food</option><option>Travel</option><option>Shopping</option><option>Entertainment</option><option>Bills</option><option>Health</option><option>General</option>
                        </select>
                    </div>
                </div>
                <button onClick={() => handleOpModal()} className="hidden md:flex bg-indigo-600 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black items-center gap-2 shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95">
                    <Plus size={22} /> CAPTURE FLOW
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-10">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.3em] font-black">
                            <tr>
                                <th className="px-10 py-6 text-left">Description</th>
                                <th className="px-10 py-6 text-left">Category</th>
                                <th className="px-10 py-6 text-left">Timestamp</th>
                                <th className="px-10 py-6 text-right">Value</th>
                                <th className="px-10 py-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && expenses.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-40"></div></td><td className="px-10 py-8"><div className="h-6 bg-slate-50 rounded-full w-20"></div></td><td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-24"></div></td><td className="px-10 py-8 text-right"><div className="h-5 bg-slate-100 rounded-lg w-20 ml-auto"></div></td><td className="px-10 py-8 text-center"><div className="h-8 w-8 bg-slate-50 rounded-lg mx-auto"></div></td></tr>
                                ))
                            ) : filteredExpenses.length === 0 ? (
                                <tr><td colSpan="5" className="px-10 py-24 text-center"><p className="font-black text-slate-800 text-lg">Empty Nexus</p></td></tr>
                            ) : (
                                filteredExpenses.map((exp, idx) => (
                                    <tr key={exp.id} style={{animationDelay: `${idx * 50}ms`}} className={`hover:bg-slate-50/50 transition-all group animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-both ${exp.optimistic ? 'opacity-60 grayscale' : ''}`}>
                                        <td className="px-10 py-6 md:py-8"><div className="font-black text-slate-900 text-base">{exp.title}</div>{exp.notes && <div className="text-[10px] text-slate-400 font-bold mt-1 truncate max-w-[200px]">{exp.notes}</div>}</td>
                                        <td className="px-10 py-8 font-bold text-xs"><span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-widest text-[10px]">{exp.category}</span></td>
                                        <td className="px-10 py-8 text-slate-400 font-black text-xs">{exp.date}</td>
                                        <td className="px-10 py-8 text-right font-black text-slate-900 text-xl">-₹{Number(exp.amount).toLocaleString()}</td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpModal(exp)} className="p-3 text-indigo-500 hover:text-white hover:bg-indigo-600 rounded-2xl transition-all border border-indigo-50 active:scale-95"><Edit3 size={18} /></button>
                                                <button onClick={() => { setItemToDelete(exp.id); setShowDeleteModal(true); }} className="p-3 text-rose-500 hover:text-white hover:bg-rose-600 rounded-2xl transition-all border border-rose-50 active:scale-95"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                    {loading && expenses.length === 0 ? (
                        Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-slate-50 rounded-3xl animate-pulse"></div>)
                    ) : filteredExpenses.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No entries found</div>
                    ) : (
                        filteredExpenses.map((exp) => (
                            <div key={exp.id} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden active:scale-[0.98] transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="max-w-[70%]">
                                        <h4 className="font-black text-slate-900 text-lg leading-tight truncate">{exp.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">{exp.category}</span>
                                            <span className="text-[9px] font-black text-slate-300 uppercase">{exp.date}</span>
                                        </div>
                                    </div>
                                    <span className="font-black text-slate-900 text-lg">-₹{Number(exp.amount).toLocaleString()}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => handleOpModal(exp)} className="flex-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 py-3 rounded-2xl font-black text-xs transition-all border border-indigo-100 flex items-center justify-center gap-2 shadow-sm"><Edit3 size={16} /> Edit</button>
                                    <button onClick={() => { setItemToDelete(exp.id); setShowDeleteModal(true); }} className="flex-1 bg-white hover:bg-rose-600 hover:text-white text-rose-600 py-3 rounded-2xl font-black text-xs transition-all border border-rose-100 flex items-center justify-center gap-2 shadow-sm"><Trash2 size={16} /> Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300 my-auto">
                        <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900">{isEditing ? 'Modify Entry' : 'Record Entry'}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-1">{isEditing ? 'Update Financial Vectors' : 'Inject Capital Flow'}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all font-bold">×</button>
                        </div>
                        <form onSubmit={submitExpense} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identifier</label>
                                <input required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all font-black" placeholder="Where did it go?" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capital (₹)</label>
                                    <input type="number" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all font-black" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tag</label>
                                    <select className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all font-black" value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option>General</option><option>Food</option><option>Travel</option><option>Shopping</option><option>Entertainment</option><option>Bills</option><option>Health</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Timestamp</label>
                                <input type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all font-black" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all hover:-translate-y-1 active:scale-95">{isEditing ? 'COMMIT CHANGES' : 'EXECUTE RECORD'}</button>
                        </form>
                    </div>
                </div>
            )}

            {showLimitModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 border border-blue-100"><Target size={32} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Nexus Threshold</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">Redefine global budget vector</p>
                        <input type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 px-6 py-4 rounded-2xl outline-none mb-6 font-black text-center text-xl" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} placeholder="0.00" />
                        <div className="flex gap-4">
                            <button onClick={() => setShowLimitModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black">ABORT</button>
                            <button onClick={updateLimit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200">RECALIBRATE</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-100 shadow-sm"><Trash2 size={32} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Purge Vector?</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 italic">This action will erase the financial snapshot permanently.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black">ABORT</button>
                            <button onClick={triggerDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200">PURGE</button>
                        </div>
                    </div>
                </div>
            )}

            {showStatusModal && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`px-10 py-4 rounded-3xl shadow-2xl flex items-center gap-4 backdrop-blur-2xl border ${statusInfo.type === 'success' ? 'bg-indigo-600/90 border-indigo-400 text-white' : 'bg-rose-600/90 border-rose-400 text-white'}`}>
                        {statusInfo.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        <span className="font-black text-[10px] uppercase tracking-[0.2em]">{statusInfo.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
