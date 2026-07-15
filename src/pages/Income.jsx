import React, { useEffect, useState, useMemo, useCallback } from "react";
import IncomeService from "../services/IncomeService";
import { 
    Plus, Trash2, Calendar, Wallet, TrendingUp, 
    ArrowDownLeft, ArrowUpRight, DollarSign, PieChart, 
    Coins, CheckCircle, XCircle, Download, Edit3 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Income() {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // States
    const [itemToDelete, setItemToDelete] = useState(null);
    const [statusInfo, setStatusInfo] = useState({ type: 'success', message: '' });

    // Form State
    const [source, setSource] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        loadIncomes();
    }, []);

    const loadIncomes = async () => {
        setLoading(true);
        try {
            const data = await IncomeService.getIncomes();
            setIncomes(Array.isArray(data) ? data : []);
        } catch (err) {}
        setLoading(false);
    };

    const handleOpModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setEditingId(item.id);
            setSource(item.source);
            setAmount(item.amount);
            setDate(item.date);
            setNotes(item.notes || "");
        } else {
            setIsEditing(false);
            setEditingId(null);
            resetForm();
        }
        setShowModal(true);
    };

    const submitIncome = async (e) => {
        e.preventDefault();
        const data = { source, amount: Number(amount), date, notes };
        if (isEditing) {
            updateIncome(data);
        } else {
            addIncome(data);
        }
    };

    const addIncome = async (data) => {
        const tempId = Date.now();
        const newIncome = { id: tempId, ...data, optimistic: true };
        const original = [...incomes];
        setIncomes([newIncome, ...incomes]);
        setShowModal(false);
        resetForm();
        triggerStatus('success', 'Syncing revenue...');

        try {
            const saved = await IncomeService.addIncome(newIncome);
            setIncomes(prev => prev.map(i => i.id === tempId ? saved : i));
            triggerStatus('success', 'Revenue captured.');
        } catch (err) {
            setIncomes(original);
            triggerStatus('error', 'Sync failed.');
        }
    };

    const updateIncome = async (data) => {
        const original = [...incomes];
        setIncomes(incomes.map(inc => inc.id === editingId ? { ...inc, ...data, optimistic: true } : inc));
        setShowModal(false);
        triggerStatus('success', 'Refining inflow...');

        try {
            const updated = await IncomeService.updateIncome(editingId, data);
            setIncomes(prev => prev.map(item => item.id === editingId ? updated : item));
            triggerStatus('success', 'Inflow updated.');
        } catch (err) {
            setIncomes(original);
            triggerStatus('error', 'Update failed.');
        }
    };

    const triggerStatus = useCallback((type, message) => {
        setStatusInfo({ type, message });
        setShowStatusModal(true);
        setTimeout(() => setShowStatusModal(false), 2000);
    }, []);

    const triggerDelete = (id) => {
        setItemToDelete(id);
        setShowDeleteModal(true);
    };

    // OPTIMISTIC UI: INSTANT REMOVAL
    const executeDelete = async () => {
        if (!itemToDelete) return;
        const original = [...incomes];
        setIncomes(incomes.filter(i => i.id !== itemToDelete));
        setShowDeleteModal(false);
        triggerStatus('success', 'Purging inflow...');

        try {
            await IncomeService.deleteIncome(itemToDelete);
            triggerStatus('success', 'Purge confirmed.');
        } catch (err) {
            setIncomes(original);
            triggerStatus('error', 'Purge failed.');
        } finally {
            setItemToDelete(null);
        }
    };

    function resetForm() {
        setSource(""); setAmount(""); setDate(""); setNotes("");
    }

    const exportPDF = () => {
        try {
            const doc = new jsPDF();
            const tableColumn = ["Source", "Date", "Notes", "Amount"];
            const tableRows = incomes.map(inc => [
                inc.source,
                inc.date,
                inc.notes || "-",
                `Rs. ${inc.amount.toLocaleString()}`
            ]);

            doc.setFontSize(18);
            doc.setTextColor(5, 150, 105);
            doc.text("Income Protocol - Inflow Hierarchy", 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

            autoTable(doc, {
                startY: 30,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255] },
            });

            doc.save(`Income_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
            triggerStatus('success', 'Ledger generated.');
        } catch (error) {
            triggerStatus('error', 'Engine Error.');
        }
    };

    const totalIncome = useMemo(() => incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0), [incomes]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12 px-2 md:px-0">
            {/* Premium Header */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-3 md:gap-4 mb-6">
                            <div className="bg-white/10 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border border-white/20">
                                <Coins size={28} className="text-emerald-200" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-4xl font-black tracking-tighter">Income Vault</h2>
                                <p className="text-emerald-100/80 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Revenue Maximization Logic</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex-1 hover:bg-white/20 transition-all">
                                <p className="text-[9px] md:text-[10px] uppercase font-black text-emerald-200 mb-1 lg:mb-2 tracking-widest">Captured Revenue</p>
                                <p className="text-xl md:text-3xl font-black tabular-nums">₹{totalIncome.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex-1 hover:bg-white/20 transition-all">
                                <p className="text-[9px] md:text-[10px] uppercase font-black text-emerald-200 mb-1 lg:mb-2 tracking-widest">Inflow Points</p>
                                <p className="text-xl md:text-3xl font-black">{incomes.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Header & Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 px-1 md:px-2">
                <div className="flex items-center gap-3 self-start">
                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Financial Inflows</h3>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={exportPDF} className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-600 px-4 md:px-6 py-3.5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 border border-slate-100 shadow-sm transition-all">
                        <Download size={18} /> LEDGER
                    </button>
                    <button
                        onClick={() => handleOpModal()}
                        className="flex-2 sm:flex-none bg-emerald-600 hover:bg-slate-900 text-white px-6 md:px-8 py-3.5 rounded-xl md:rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 active:scale-95 text-center"
                    >
                        <Plus size={22} /> CAPTURE REVENUE
                    </button>
                </div>
            </div>

            {/* Ledger Container */}
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.3em] font-black">
                            <tr>
                                <th className="px-10 py-6 text-left">Source Agent</th>
                                <th className="px-10 py-6 text-left">Timestamp</th>
                                <th className="px-10 py-6 text-left">Metadata</th>
                                <th className="px-10 py-6 text-right">Credit Value</th>
                                <th className="px-10 py-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && incomes.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-40"></div></td><td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-24"></div></td><td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-48"></div></td><td className="px-10 py-8 text-right"><div className="h-5 bg-slate-100 rounded-lg w-20 ml-auto"></div></td><td className="px-10 py-8"><div className="h-8 w-8 bg-slate-50 rounded-lg mx-auto"></div></td></tr>
                                ))
                            ) : incomes.length === 0 ? (
                                <tr><td colSpan="5" className="px-10 py-32 text-center text-slate-400"><p className="font-black text-slate-800 text-lg">Empty Vault</p></td></tr>
                            ) : (
                                incomes.map((inc, idx) => (
                                    <tr key={inc.id} style={{animationDelay: `${idx * 50}ms`}} className={`hover:bg-slate-50/50 transition-all group animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-both ${inc.optimistic ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="px-10 py-6 md:py-8"><div className="font-black text-slate-900 text-base">{inc.source}</div></td>
                                        <td className="px-10 py-8 text-slate-400 font-black text-xs">{inc.date}</td>
                                        <td className="px-10 py-8 text-slate-400 font-bold text-xs italic">{inc.notes || "-"}</td>
                                        <td className="px-10 py-8 text-right font-black text-emerald-600 text-xl">+₹{inc.amount.toLocaleString()}</td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpModal(inc)} className="p-3 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-2xl transition-all border border-emerald-50 shadow-sm active:scale-95"><Edit3 size={18} /></button>
                                                <button onClick={() => triggerDelete(inc.id)} className="p-3 text-rose-500 hover:text-white hover:bg-rose-600 rounded-2xl transition-all border border-rose-50 shadow-sm active:scale-95"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden p-4 space-y-4">
                    {loading && incomes.length === 0 ? (
                        Array(3).fill(0).map((_, i) => <div key={i} className="h-32 bg-slate-50 rounded-3xl animate-pulse"></div>)
                    ) : incomes.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Empty Vault</div>
                    ) : (
                        incomes.map((inc) => (
                            <div key={inc.id} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg leading-tight">{inc.source}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{inc.date}</p>
                                    </div>
                                    <span className="font-black text-emerald-600 text-lg">+₹{inc.amount.toLocaleString()}</span>
                                </div>
                                {inc.notes && <p className="text-[10px] text-slate-400 font-bold italic truncate">{inc.notes}</p>}
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => handleOpModal(inc)} className="flex-1 bg-white hover:bg-emerald-600 hover:text-white text-emerald-600 py-3.5 rounded-2xl font-black text-xs transition-all border border-emerald-100 flex items-center justify-center gap-2 shadow-sm"><Edit3 size={16} /> Edit</button>
                                    <button onClick={() => triggerDelete(inc.id)} className="flex-1 bg-white hover:bg-rose-600 hover:text-white text-rose-600 py-3.5 rounded-2xl font-black text-xs transition-all border border-rose-100 flex items-center justify-center gap-2 shadow-sm"><Trash2 size={16} /> Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mb-auto mt-auto animate-in zoom-in-95 duration-300">
                        <div className="px-10 pt-10 pb-6 border-b border-slate-50 flex justify-between items-center">
                            <div><h3 className="text-3xl font-black text-slate-900">{isEditing ? 'Refine Inflow' : 'Credit Revenue'}</h3><p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">{isEditing ? 'Update Source Agent' : 'Active Inflow Injection'}</p></div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all font-bold">×</button>
                        </div>
                        <form onSubmit={submitIncome} className="p-10 space-y-6">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Agent</label><input required className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all font-black" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Primary Salary" /></div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Value (₹)</label><input type="number" required className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all font-black" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Timestamp</label><input type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all font-black" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                            </div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Metadata (Notes)</label><textarea className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all font-black h-24 resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                            <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-slate-900 transition-all active:scale-95">{isEditing ? 'COMMIT UPDATES' : 'EXECUTE CAPTURE'}</button>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
                        <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 border border-emerald-100 shadow-sm"><Trash2 size={40} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Purge Revenue?</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed italic">Inflow removal protocol will erase this history point permanently.</p>
                        <div className="flex gap-4"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black">ABORT</button><button onClick={executeDelete} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200">PURGE</button></div>
                    </div>
                </div>
            )}

            {showStatusModal && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`px-10 py-4 rounded-3xl shadow-2xl flex items-center gap-4 backdrop-blur-2xl border ${statusInfo.type === 'success' ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-200' : 'bg-rose-600/90 border-rose-400 text-white shadow-rose-200'}`}>
                        {statusInfo.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                        <span className="font-black text-xs uppercase tracking-[0.2em]">{statusInfo.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

