import React, { useEffect, useState, useMemo, useCallback } from "react";
import IncomeService from "../services/IncomeService";
import { 
    Plus, Trash2, Calendar, Wallet, TrendingUp, 
    ArrowDownLeft, ArrowUpRight, DollarSign, PieChart, 
    Coins, CheckCircle, XCircle, Download 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Income() {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    
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

    // OPTIMISTIC UI: INSTANT ADDITION
    const addIncome = async (e) => {
        e.preventDefault();
        const tempId = Date.now();
        const newIncome = { 
            id: tempId, 
            source, 
            amount: Number(amount), 
            date, 
            notes,
            optimistic: true 
        };

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
                        onClick={() => setShowModal(true)}
                        className="flex-2 sm:flex-none bg-emerald-600 hover:bg-slate-900 text-white px-6 md:px-8 py-3.5 rounded-xl md:rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 active:scale-95"
                    >
                        <Plus size={22} /> CAPTURE REVENUE
                    </button>
                </div>
            </div>

            {/* Ledger Container */}
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-slate-50/50 text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-black">
                            <tr>
                                <th className="px-6 md:px-10 py-6 text-left">Source Agent</th>
                                <th className="px-6 md:px-10 py-6 text-left">Timestamp</th>
                                <th className="px-6 md:px-10 py-6 text-left">Metadata</th>
                                <th className="px-6 md:px-10 py-6 text-right">Credit Value</th>
                                <th className="px-6 md:px-10 py-6 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && incomes.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-40"></div></td>
                                        <td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-24"></div></td>
                                        <td className="px-10 py-8"><div className="h-5 bg-slate-100 rounded-lg w-48"></div></td>
                                        <td className="px-10 py-8 text-right"><div className="h-5 bg-slate-100 rounded-lg w-20 ml-auto"></div></td>
                                        <td className="px-10 py-8"><div className="h-8 w-8 bg-slate-50 rounded-lg mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : incomes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-32 text-center text-slate-400">
                                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <TrendingUp size={32} className="text-slate-200" />
                                        </div>
                                        <p className="font-black text-slate-800 text-lg">Empty Vault</p>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Ready for Initial Inflow</p>
                                    </td>
                                </tr>
                            ) : (
                                incomes.map((inc) => (
                                    <tr key={inc.id} className={`hover:bg-slate-50/50 transition-all group ${inc.optimistic ? 'opacity-50 animate-pulse' : ''}`}>
                                        <td className="px-6 md:px-10 py-6 md:py-8">
                                            <div className="font-black text-slate-900 text-base flex items-center gap-2">
                                                {inc.source}
                                                {inc.optimistic && <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black border border-emerald-100">SYNCING</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-10 py-6 md:py-8 text-slate-400 font-black text-[10px] md:text-xs">{inc.date}</td>
                                        <td className="px-6 md:px-10 py-6 md:py-8 text-slate-400 font-bold text-xs italic">{inc.notes || "-"}</td>
                                        <td className="px-6 md:px-10 py-6 md:py-8 text-right font-black text-emerald-600 text-lg md:text-xl">
                                            +₹{inc.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 md:px-10 py-6 md:py-8 text-center transition-all">
                                            <button
                                                onClick={() => triggerDelete(inc.id)}
                                                className="p-3 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-all scale-100 hover:scale-110 active:scale-95 shadow-sm border border-rose-100"
                                                title="Purge Record"
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

            {/* Premium Add Modal - Responsive */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-hide">
                        <div className="px-8 md:px-10 pt-8 md:pt-10 pb-6 border-b border-slate-50 flex justify-between items-start">
                            <div><h3 className="text-2xl md:text-3xl font-black text-slate-900">Credit Revenue</h3><p className="text-sm text-slate-500 font-bold uppercase tracking-tight">Active Inflow Injection</p></div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 font-bold">×</button>
                        </div>
                        <form onSubmit={addIncome} className="p-8 md:p-10 pt-8 space-y-6">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Source Agent</label><input required className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all font-black placeholder:text-slate-300" placeholder="e.g. Primary Salary" value={source} onChange={(e) => setSource(e.target.value)} /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Value (₹)</label><input type="number" required className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all font-black" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Timestamp</label><input type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all font-black" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                            </div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Metadata (Notes)</label><textarea className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white px-6 py-4 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all font-black h-24 md:h-32 resize-none placeholder:text-slate-300" placeholder="Transaction references..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl font-black order-2 sm:order-1 transition-all">STANDBY</button><button type="submit" className="flex-2 sm:flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-slate-900 transition-all hover:-translate-y-1 order-1 sm:order-2">EXECUTE CAPTURE</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Confirm Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
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

