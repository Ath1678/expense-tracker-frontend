import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, Repeat, CheckCircle, AlertCircle, Calendar, CreditCard, Clock, Search, Filter, ShieldCheck, ArrowRight, XCircle } from "lucide-react";
import RecurringService from "../services/RecurringService";

export default function Recurring() {
    const [recurringItems, setRecurringItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    
    // States
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemToPay, setItemToPay] = useState(null);
    const [statusInfo, setStatusInfo] = useState({ type: 'success', message: '' });
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");

    // Form State
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Subscription");
    const [dayOfMonth, setDayOfMonth] = useState("1");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search Debouncer
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
        setLoading(true);
        try {
            const data = await RecurringService.getRecurring();
            setRecurringItems(Array.isArray(data) ? data : []);
        } catch (err) {}
        setLoading(false);
    };

    // OPTIMISTIC UI: INSTANT TRACKER CREATION
    const addRecurring = async (e) => {
        e.preventDefault();
        const tempId = Date.now();
        const newItem = { 
            id: tempId, 
            title, 
            amount: Number(amount), 
            category, 
            dayOfMonth: Number(dayOfMonth),
            optimistic: true 
        };

        const original = [...recurringItems];
        setRecurringItems([newItem, ...recurringItems]);
        setShowModal(false);
        resetForm();
        triggerStatus('success', 'Establishing tracker hook...');

        try {
            const saved = await RecurringService.addRecurring(newItem);
            setRecurringItems(prev => prev.map(i => i.id === tempId ? saved : i));
            triggerStatus('success', 'Tracker online.');
        } catch (err) {
            setRecurringItems(original);
            triggerStatus('error', 'Communication link failed.');
        }
    };

    const triggerDelete = (id) => {
        setItemToDelete(id);
        setShowDeleteModal(true);
    };

    // OPTIMISTIC UI: INSTANT REMOVAL
    const executeDelete = async () => {
        if (!itemToDelete) return;
        const original = [...recurringItems];
        setRecurringItems(recurringItems.filter(i => i.id !== itemToDelete));
        setShowDeleteModal(false);
        triggerStatus('success', 'Severing link...');

        try {
            await RecurringService.deleteRecurring(itemToDelete);
            triggerStatus('success', 'Tracker deactivated.');
        } catch (err) {
            setRecurringItems(original);
            triggerStatus('error', 'Deactivation failed.');
        } finally {
            setItemToDelete(null);
        }
    };

    const triggerPayment = (id, title) => {
        setItemToPay({ id, title });
        setShowPaymentModal(true);
    };

    // OPTIMISTIC UI: INSTANT PAYMENT APPROVAL
    const executePayment = async () => {
        if (!itemToPay) return;
        const original = [...recurringItems];
        
        // Instant state change to "Paid"
        const now = new Date();
        setRecurringItems(prev => prev.map(item => 
            item.id === itemToPay.id 
                ? { ...item, lastPaidDate: now.toISOString(), optimisticPay: true } 
                : item
        ));
        setShowPaymentModal(false);
        triggerStatus('success', 'Authorizing payout...');

        try {
            await RecurringService.processPayment(itemToPay.id);
            triggerStatus('success', 'Payment verified.');
        } catch (error) {
            setRecurringItems(original);
            triggerStatus('error', 'Authorization denied.');
        } finally {
            setItemToPay(null);
        }
    };

    const triggerStatus = useCallback((type, message) => {
        setStatusInfo({ type, message });
        setShowStatusModal(true);
        setTimeout(() => setShowStatusModal(false), 2000);
    }, []);

    const resetForm = () => {
        setTitle(""); setAmount(""); setCategory("Subscription"); setDayOfMonth("1");
    };

    const isPaidThisMonth = (lastPaidDateStr) => {
        if (!lastPaidDateStr) return false;
        const paid = new Date(lastPaidDateStr);
        const now = new Date();
        return paid.getMonth() === now.getMonth() && paid.getFullYear() === now.getFullYear();
    };

    const filteredItems = useMemo(() => {
        return (recurringItems || []).filter(item => {
            const matchesSearch = (item.title || "").toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesCat = filterCategory === "All" || item.category === filterCategory;
            return matchesSearch && matchesCat;
        });
    }, [recurringItems, debouncedSearch, filterCategory]);

    const totalMonthly = useMemo(() => recurringItems.reduce((sum, item) => sum + (item.amount || 0), 0), [recurringItems]);
    const pendingCount = useMemo(() => recurringItems.filter(i => !isPaidThisMonth(i.lastPaidDate)).length, [recurringItems]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12 px-2 md:px-0">
            {/* Premium Header */}
            <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 rounded-3xl md:rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-3 md:gap-4 mb-6">
                            <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border border-white/20">
                                <Repeat size={28} className="text-indigo-200" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-4xl font-black tracking-tighter">Recurring Hub</h2>
                                <p className="text-indigo-100/80 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Subscription Matrix Active</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 text-center hover:bg-white/20 transition-all">
                            <p className="text-[9px] md:text-[10px] uppercase font-black text-indigo-200 mb-1 md:mb-2 tracking-widest">Total Commitment</p>
                            <p className="text-xl md:text-3xl font-black tabular-nums">₹{totalMonthly.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 text-center hover:bg-white/20 transition-all">
                            <p className="text-[9px] md:text-[10px] uppercase font-black text-indigo-200 mb-1 md:mb-2 tracking-widest">Pending Sync</p>
                            <p className="text-xl md:text-3xl font-black tabular-nums">{pendingCount}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full -ml-48 -mb-48 blur-[120px] pointer-events-none"></div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
                <div className="flex w-full md:w-auto gap-3 md:gap-4 flex-1 max-w-2xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input type="text" placeholder="Search Matrix..." className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all shadow-sm font-black text-sm md:text-base"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select className="bg-white border border-slate-200 pl-11 pr-10 py-3.5 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-100 appearance-none cursor-pointer shadow-sm font-black text-sm"
                            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                            <option value="All">All</option><option value="Subscription">Subscription</option><option value="Rent">Rent</option><option value="Bills">Bills</option><option value="Health">Health</option><option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <button onClick={() => setShowModal(true)} className="w-full md:w-auto bg-indigo-600 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95 text-sm md:text-base">
                    <Plus size={22} /> INJECT TRACKER
                </button>
            </div>

            {/* Main Grid - Lightning Interaction */}
            {loading && recurringItems.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white h-72 rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse"></div>)}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-24 text-center border border-dashed border-slate-200 border-2">
                    <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100"><Repeat size={40} className="text-slate-200" /></div>
                    <h3 className="text-xl font-black text-slate-800">No Trackers Operational</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Initialize your first periodic record</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredItems.map(item => {
                        const paid = isPaidThisMonth(item.lastPaidDate);
                        return (
                            <div key={item.id} className={`bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden ${item.optimistic ? 'opacity-50 grayscale' : ''}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50 transition-colors pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`p-4 rounded-2xl ${paid ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} shadow-sm`}><CreditCard size={28} /></div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] block mb-1">Due Cycle</span>
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <Calendar size={14} className="text-indigo-500" />
                                                <span className="text-2xl font-black text-slate-800 tabular-nums">{item.dayOfMonth}<sup className="text-[10px] lowercase font-bold">th</sup></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-8">
                                        <h4 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{item.title}</h4>
                                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{item.category}</p>
                                    </div>
                                    <div className="flex items-end justify-between mb-8">
                                        <div><span className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] block mb-1">Commitment</span><span className="text-3xl font-black text-slate-900">₹{item.amount.toLocaleString()}</span></div>
                                        <div className="flex flex-col items-end">{paid ? <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100"><ShieldCheck size={14} /> AUTHORIZED</span> : <span className="flex items-center gap-2 text-[10px] font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 animate-pulse"><Clock size={14} /> PENDING</span>}</div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => triggerPayment(item.id, item.title)} disabled={paid || item.optimistic} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${paid ? "bg-slate-50 text-slate-300 shadow-inner" : "bg-indigo-600 text-white hover:bg-slate-900 shadow-xl shadow-indigo-100 hover:shadow-none active:scale-95"}`}>
                                            {paid ? "SETTLED" : "APPROVE PAY"}{!paid && <ArrowRight size={18} />}
                                        </button>
                                        <button 
                                            onClick={() => triggerDelete(item.id)} 
                                            className="p-4 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-all scale-100 hover:scale-110 active:scale-95 border border-rose-100 shadow-sm"
                                            title="Deactivate Tracker"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Premium Add Modal - Instant Feedback */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-hide">
                        <div className="px-10 pt-10 pb-6 border-b border-slate-50 flex justify-between items-start">
                            <div><h3 className="text-3xl font-black text-slate-900">New Tracker</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Periodic Commitment Initialization</p></div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 font-bold">×</button>
                        </div>
                        <form onSubmit={addRecurring} className="p-10 pt-8 space-y-6">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tracker Identifier</label><input required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 font-black" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AWS Multi-Region" /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Value (₹)</label><input required type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 font-black" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cycle Day (1-31)</label><input required type="number" min="1" max="31" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 font-black" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} /></div>
                            </div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label><select className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 font-black appearance-none" value={category} onChange={e => setCategory(e.target.value)}><option>Subscription</option><option>Rent</option><option>Bills</option><option>Health</option><option>Other</option></select></div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black order-2 sm:order-1 transition-all">STANDBY</button><button type="submit" className="flex-2 sm:flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95 order-1 sm:order-2">EXECUTE INITIALIZATION</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium Confirm Modals - Instant */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-100 shadow-sm"><Trash2 size={40} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 whitespace-nowrap">Purge Tracker?</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed italic">Warning: This action severes the subscription link permanently.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black">ABORT</button>
                            <button onClick={executeDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200">PURGE</button>
                        </div>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 border border-indigo-100 shadow-sm"><Repeat size={40} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Authorize Payout?</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed italic">{itemToPay?.title}</p>
                        <div className="flex gap-4"><button onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black">ABORT</button><button onClick={executePayment} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200">AUTHORIZE</button></div>
                    </div>
                </div>
            )}

            {/* Status Toast - High Performance */}
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

const resetForm = () => {
    // Note: This was incorrectly placed outside in previous versions or scope
};
