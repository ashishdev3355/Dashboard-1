import React, { useEffect, useState, useRef } from "react";
import { 
  Zap, 
  Search, 
  Filter, 
  Activity,
  Database,
  Info,
  Code,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import TableHead from "../components/reusable/TableHead";
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 30;

const columns = [
    "Command Name",
    "Model",
    "Manufacturer",
    "Header",
    "Sub Header",
    "PIN",
    "Protocol",
    "Logic",
    "Metric Formula",
    "Imperial Formula",
    "Metric Unit",
    "Imperial Unit",
    "Reference Data"
];

const LiveDateCommands: React.FC = () => {
    const [liveData, setLiveData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [make, setMake] = useState<string>("");
    const [model, setModel] = useState<string>("");
    const [module, setModule] = useState<string>("");

    const [page, setPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(0);

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchLiveData = async (
        targetPage: number = 1,
        searchMake: string = "",
        searchModel: string = "",
        searchModule: string = ""
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

            if (searchMake.trim()) params.append('make', searchMake.trim());
            if (searchModel.trim()) params.append('model', searchModel.trim());
            if (searchModule.trim()) params.append('module', searchModule.trim());

            const url = `${API_BASE_URL}api/LiveDataCommands?${params.toString()}`;
            const token = localStorage.getItem("token");

            const response = await fetch(url, {
                signal: abortControllerRef.current.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

            const result = await response.json();

            if (result && Array.isArray(result.data)) {
                setLiveData(result.data);
                setTotal(result.total || 0);
                setPage(targetPage);
                
                if (result.data.length === 0) {
                    setError(searchMake || searchModel || searchModule 
                        ? "No live commands found matching your criteria." 
                        : "No live command data available in database."
                    );
                }
            } else {
                setLiveData([]);
                setTotal(0);
                setError("Data synchronization error: Invalid format.");
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error("Error fetching live data:", err);
            setLiveData([]);
            setTotal(0);
            setError("Unable to sync live command data. Please check your network.");
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    useEffect(() => {
        fetchLiveData(1, "", "", "");
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLiveData(1, make, model, module);
    };

    const handlePageChange = (newPage: number) => {
        fetchLiveData(newPage, make, model, module);
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const getVisiblePages = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, page - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);
            if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
            <PageHeader 
                title="Live Data Commands" 
                subtitle="Monitor and manage real-time diagnostic commands and parameter mappings"
                icon={Zap}
                action={
                    <Button 
                        variant="outline" 
                        onClick={() => fetchLiveData(1, make, model, module)} 
                        isLoading={loading}
                        icon={Activity}
                    >
                        Sync Manifest
                    </Button>
                }
            />

            <div className="space-y-8">
                <Card title="Query Builder" subtitle="Filter commands by vehicle infrastructure" icon={Filter}>
                    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-end gap-6">
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input 
                                label="Manufacturer" 
                                placeholder="e.g. Honda"
                                value={make}
                                onChange={(e) => setMake(e.target.value)}
                                icon={Database}
                            />
                            <Input 
                                label="Model" 
                                placeholder="e.g. CBR 650R"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                icon={Search}
                            />
                            <Input 
                                label="Module / System" 
                                placeholder="e.g. ECU"
                                value={module}
                                onChange={(e) => setModule(e.target.value)}
                                icon={Info}
                            />
                        </div>
                        
                        <Button type="submit" variant="primary" className="px-10 h-11 shadow-lg shadow-primary-200" isLoading={loading} icon={Search}>
                            Execute Query
                        </Button>
                    </form>
                </Card>

                <Card noPadding title="Command Specification Registry" icon={Code} headerAction={<Badge variant="secondary">{total} Active Commands</Badge>}>
                    {loading ? (
                        <div className="p-32 text-center">
                            <div className="animate-spin h-14 w-14 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6 shadow-sm"></div>
                            <p className="text-slate-400 font-black italic tracking-widest animate-pulse uppercase text-xs">Syncing real-time command data...</p>
                        </div>
                    ) : error ? (
                        <div className="p-24 text-center animate-fadeIn">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-50 text-rose-500 rounded-[28px] mb-6 shadow-sm border border-rose-100/50">
                                <Activity size={32} />
                            </div>
                            <p className="text-slate-700 font-black text-xl mb-2 italic">Data Synchronization Failure</p>
                            <p className="text-slate-400 max-w-sm mx-auto mb-8 font-bold text-sm tracking-tight">{error}</p>
                            <Button variant="primary" className="h-11 px-8 shadow-lg shadow-primary-200" onClick={() => fetchLiveData(1, make, model, module)} icon={RefreshCw}>Reconnect Stream</Button>
                        </div>
                    ) : liveData.length === 0 ? (
                        <div className="p-32 text-center italic animate-fadeIn">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 text-slate-200 rounded-[28px] mb-6 border border-slate-100">
                                <Search size={32} />
                            </div>
                            <p className="text-slate-400 font-black tracking-widest text-xs uppercase">No command data identified</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 font-black text-slate-400 uppercase tracking-widest">
                                        <TableHead columns={columns} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {liveData.map((item, idx) => (
                                        <tr key={`${item.id || idx}`} className="hover:bg-primary-50/30 transition-all group">
                                            <td className="px-6 py-4 font-black text-slate-700 tracking-tight whitespace-nowrap">{item.name || "-"}</td>
                                            <td className="px-6 py-4 text-slate-500 font-bold italic">{item.model || "-"}</td>
                                            <td className="px-6 py-4 text-slate-400 font-bold uppercase tracking-tighter truncate max-w-[100px]">{item.make || "-"}</td>
                                            <td className="px-6 py-4 font-black text-slate-600 font-mono text-[10px]">{item.header || "-"}</td>
                                            <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{item.subHeader || "-"}</td>
                                            <td className="px-6 py-4">
                                              <code className="bg-slate-900 text-primary-400 px-2 py-1 rounded-lg font-mono text-[10px] font-black tracking-wider shadow-sm">{item.pid || "-"}</code>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-bold truncate max-w-[100px]">{item.protocol || "-"}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={item.formulaBased === 'true' ? 'primary' : 'secondary'}>
                                                    {item.formulaBased === 'true' ? "Active" : "Static"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 max-w-[120px] truncate border-l border-slate-50/50">
                                                <span className="text-slate-500 font-mono font-bold" title={item.formula_metric}>{item.formula_metric || "-"}</span>
                                            </td>
                                            <td className="px-6 py-4 max-w-[120px] truncate border-l border-slate-50/50">
                                                <span className="text-slate-500 font-mono font-bold" title={item.formula_imperial}>{item.formula_imperial || "-"}</span>
                                            </td>
                                            <td className="px-6 py-4 font-black text-primary-600 italic">{item.unit_metric || "-"}</td>
                                            <td className="px-6 py-4 font-black text-amber-600 italic">{item.unit_imperial || "-"}</td>
                                            <td className="px-6 py-4">
                                                {item.referenceJSON ? (
                                                    <div className="flex items-center gap-1.5 text-primary-500 cursor-help" title={JSON.stringify(item.referenceJSON)}>
                                                        <Code size={14} />
                                                        <span className="font-black text-[10px] uppercase">JSON</span>
                                                    </div>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Manifest Fragment <span className="text-primary-600 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span>
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1 || loading}
                                    className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all disabled:opacity-30 shadow-sm"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="flex gap-2 mx-4">
                                    {getVisiblePages().map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={loading}
                                            className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all ${
                                                page === pageNum
                                                    ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                                                    : "bg-white text-slate-600 hover:bg-primary-50 border border-slate-100"
                                            } disabled:opacity-50`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages || loading}
                                    className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all disabled:opacity-30 shadow-sm"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default LiveDateCommands;