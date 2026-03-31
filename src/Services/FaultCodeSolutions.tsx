import { useEffect, useState, useRef } from "react";
import { 
  CheckCircle, 
  Search, 
  Filter, 
  Activity, 
  Database,
  Layout,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 30;

const columns = [
    "ID",
    "DTC",
    "Solution",
    "Language",
    "Make",
    "Company ID",
    "Generic"
];

const FaultCodeSolutions = () => {
    const [solutionData, setSolutionData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [dtc, setDtc] = useState("");
    const [make, setMake] = useState("");
    const [generic, setGeneric] = useState("");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchSolutionData = async (
        targetPage = 1,
        searchDtc = "",
        searchMake = "",
        searchGeneric = ""
    ) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                limit: ITEMS_PER_PAGE.toString(),
                page: targetPage.toString()
            });

            if (searchDtc.trim()) params.append('dtc', searchDtc.trim());
            if (searchMake.trim()) params.append('make', searchMake.trim());
            if (searchGeneric !== "") params.append('generic', searchGeneric);

            const url = `${API_BASE_URL}api/FaultCodeSolutions?${params.toString()}`;
            const token = localStorage.getItem("token");

            const response = await fetch(url, {
                signal: abortControllerRef.current.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result && Array.isArray(result.data)) {
                setSolutionData(result.data);
                setTotal(result.total || 0);
                setPage(targetPage);
                
                if (result.data.length === 0) {
                    setError(searchDtc || searchMake || searchGeneric !== "" 
                        ? "No resolution procedures found for the specified criteria." 
                        : "No solution data available."
                    );
                }
            } else {
                setSolutionData([]);
                setTotal(0);
                setError("Invalid response format from server");
            }

        } catch (err:any) {
            if (err.name === 'AbortError') return;
            setSolutionData([]);
            setTotal(0);
            setError("Failed to fetch resolution repository. Please try again.");
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    useEffect(() => {
        fetchSolutionData(1, "", "", "");
    }, []);

    const handleSearch = (e:any) => {
        e.preventDefault();
        fetchSolutionData(1, dtc, make, generic);
    };

    const handlePageChange = (newPage:any) => {
        fetchSolutionData(newPage, dtc, make, generic);
    };

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const getVisiblePages = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, page - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);
            
            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
            <PageHeader 
                title="Resolution & Repair Procedures" 
                subtitle="Verified technical procedures and corrective actions for diagnostic maintenance"
                icon={CheckCircle}
            />

            {/* Filter Section */}
            <Card title="Procedure Selection" icon={Filter}>
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Input
                        label="Diagnostic Code"
                        placeholder="e.g. P1646"
                        value={dtc}
                        onChange={(e) => setDtc(e.target.value)}
                        icon={Zap}
                    />
                    <Input
                        label="Manufacturer"
                        placeholder="e.g. Ford"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        icon={Layout}
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Type</label>
                        <select
                            value={generic}
                            onChange={(e) => setGeneric(e.target.value)}
                            className="h-11 w-full bg-slate-50 border-none rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All Procedures</option>
                            <option value="true">Generic Protocol</option>
                            <option value="false">Factory Proprietary</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button 
                            variant="primary" 
                            className="w-full h-11" 
                            type="submit" 
                            isLoading={loading}
                            icon={Search}
                        >
                            Filter Library
                        </Button>
                    </div>
                </form>
            </Card>

            {error && (
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 text-center animate-shake">
                    <Database className="mx-auto text-red-500 mb-3" size={32} />
                    <p className="text-red-700 font-bold">{error}</p>
                </div>
            )}

            {/* Results Section */}
            <div className="space-y-6">
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-slate-400 font-bold italic tracking-widest animate-pulse">EXTRACTING REPAIR INTELLIGENCE...</p>
                    </div>
                ) : solutionData.length > 0 ? (
                    <Card title="Technician Protocols" icon={Activity} noPadding subtitle={`Total procedures: ${total}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        {columns.map((col) => (
                                            <th key={col} className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {solutionData.map((item:any, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-primary-50/30 transition-colors group">
                                            <td className="px-4 py-4 font-mono text-slate-400">#{item.id || "-"}</td>
                                            <td className="px-4 py-4">
                                                <code className="bg-primary-50 text-primary-600 px-2 py-1 rounded-lg font-black tracking-tighter text-sm">
                                                    {item.dtc || "-"}
                                                </code>
                                            </td>
                                            <td className="px-4 py-4 max-w-lg">
                                                <div className="flex items-start gap-2">
                                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-200 group-hover:bg-emerald-500 transition-colors shrink-0" />
                                                    <p className="font-bold text-slate-700 leading-relaxed italic">{item.solution || "-"}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-slate-500 font-bold">
                                                    <Globe size={14} className="text-slate-300" />
                                                    {item.language || "EN"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-bold text-slate-600">
                                                {item.make || <Badge variant="secondary">Global</Badge>}
                                            </td>
                                            <td className="px-4 py-4 text-slate-400 font-mono">
                                                {item.company_id || "7F"}
                                            </td>
                                            <td className="px-4 py-4">
                                                {item.generic ? (
                                                    <ShieldCheck className="text-emerald-500" size={18} />
                                                ) : (
                                                    <Badge variant="secondary">OEM</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : !error && (
                    <div className="py-24 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <CheckCircle size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold italic">No repair procedures found in current selection.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 px-2">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest order-2 md:order-1">
                            Page {page} of {totalPages} <span className="mx-2 text-slate-200">|</span> Total Items: {total}
                        </p>
                        
                        <div className="flex items-center gap-2 order-1 md:order-2">
                            <Button
                                variant="secondary"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                icon={ChevronLeft}
                                size="sm"
                                className="w-10 h-10 p-0 flex items-center justify-center"
                            />

                            <div className="flex gap-2 mx-2">
                                {getVisiblePages().map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={loading}
                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                            page === pageNum
                                                ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                                                : "bg-white text-slate-500 border border-slate-100 hover:border-primary-200 hover:text-primary-600"
                                        } disabled:opacity-50`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="secondary"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages || loading}
                                icon={ChevronRight}
                                size="sm"
                                className="w-10 h-10 p-0 flex items-center justify-center"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FaultCodeSolutions;