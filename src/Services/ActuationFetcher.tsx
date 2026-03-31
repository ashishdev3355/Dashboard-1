import { useEffect, useState, useCallback, useRef } from "react";
import { 
  Activity, 
  Download, 
  Search, 
  Database, 
  Info, 
  Layers, 
  Car, 
  Calendar,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

type ActuationDetail = {
  actuation_type: string;
  pid: string | null;
  actuation_subtype: string | null;
  last_subtype: string | null;
  seed_key_variant: string | null;
  message: string | null;
  message_item: boolean;
  success_check: string | null;
};

type ActuationGroup = {
  actuation_type: string;
  actuation_subtype: string[];
  message: string;
  details: ActuationDetail[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 200;

const ActuationFetcher = () => {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState<ActuationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (targetPage?: number, currentMake?: string, currentModel?: string, currentYear?: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError("");

    const currentPage = targetPage ?? page;
    const searchMake = currentMake !== undefined ? currentMake : make;
    const searchModel = currentModel !== undefined ? currentModel : model;
    const searchYear = currentYear !== undefined ? currentYear : year;

    const params = new URLSearchParams();
    if (searchMake.trim()) params.set('make', searchMake);
    if (searchModel.trim()) params.set('model', searchModel);
    if (searchYear.trim()) params.set('year', searchYear);
    params.set('page', currentPage.toString());
    params.set('limit', ITEMS_PER_PAGE.toString());

    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}api/ActuationCommands?${params.toString()}`;

    try {
      const res = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) throw new Error(`Connectivity failure: ${res.status}`);
      
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        setData(json.data);
        setTotal(json.total || 0);
      } else {
        setData([]);
        setError(searchMake || searchModel || searchYear ? "Search criteria returned zero command sequences." : "No actuation telemetry available in the repository.");
        setTotal(0);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError("Synchronisation with the telemetry server failed.");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [make, model, year, page]);

  useEffect(() => {
    fetchData(1);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchData(1, make, model, year);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage, make, model, year);
  };

  const downloadExcel = () => {
    if (data.length === 0) return;
    const excelData: any[] = [];
    
    data.forEach((group) => {
      if (group.details && group.details.length > 0) {
        group.details.forEach((detail) => {
          excelData.push({
            'Type': group.actuation_type,
            'Group Message': group.message,
            'PID': detail.pid || '',
            'Subtype': detail.actuation_subtype || '',
            'Seed Variant': detail.seed_key_variant || '',
            'Execution Message': detail.message || '',
            'Success Check': detail.success_check || ''
          });
        });
      }
    });

    if (excelData.length === 0) return;
    const headers = Object.keys(excelData[0]);
    let csvContent = headers.join(',') + '\n';
    excelData.forEach(row => {
      const values = headers.map(h => {
        const v = String(row[h]);
        return (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v;
      });
      csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `Actuation_Telemetry_${new Date().toISOString().split('T')[0]}.csv`;
    const nav: any = navigator;

    if (typeof nav.msSaveBlob === "function") {
      nav.msSaveBlob(blob, filename);
    } else {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 px-2">
      <PageHeader 
        title="Actuation Sequences" 
        subtitle="Manage and inspect high-level component test protocols and command chains."
        icon={Activity}
        action={
          <Button 
            variant="outline" 
            onClick={downloadExcel} 
            disabled={data.length === 0 || loading}
            icon={Download}
          >
            Export CSV
          </Button>
        }
      />

      <Card title="Telemetry Filter" subtitle="Identify sequences by vehicle identity" icon={Layers}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input 
              label="Manufacturer" 
              placeholder="e.g. Yamaha, Honda"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              icon={Database}
            />
            <Input 
              label="Model Identifier" 
              placeholder="e.g. FZ-S, Activa"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              icon={Car}
            />
            <Input 
              label="Release Year" 
              placeholder="e.g. 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              icon={Calendar}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" className="px-10 h-12 shadow-xl shadow-primary-200" isLoading={loading}>
              Fetch Protocol
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-6 flex-1 overflow-auto">
        {loading ? (
          <div className="p-32 text-center">
            <div className="animate-spin h-14 w-14 border-[5px] border-primary-600 border-t-transparent rounded-full mx-auto mb-8 shadow-inner shadow-primary-100"></div>
            <p className="text-slate-400 font-black tracking-[0.2em] animate-pulse">SYNCHRONIZING TELEMETRY STREAM...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-red-50/50">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Sync Interrupted</h3>
            <p className="text-slate-500 font-bold mb-8 max-w-xs mx-auto italic">{error}</p>
            <Button variant="outline" onClick={() => fetchData(1)}>Resume Sync</Button>
          </div>
        ) : data.length > 0 ? (
          data.map((group, idx) => (
            <Card 
              key={idx} 
              title={group.actuation_type} 
              subtitle={group.message}
              icon={ChevronRight}
              noPadding
            >
              {group.details?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest">PID Registry</th>
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest">Structural Subtype</th>
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest">Variant Seed</th>
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest">Status / Check</th>
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest">Telemetry Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {group.details.map((item, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-primary-50/20 transition-colors">
                          <td className="px-5 py-4">
                            <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-black">{item.pid || "0x00"}</code>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-600 italic">{item.actuation_subtype || "-"}</td>
                          <td className="px-5 py-4 font-mono text-primary-500">{item.seed_key_variant || "-"}</td>
                          <td className="px-5 py-4">
                            {item.message_item ? (
                              <Badge variant="primary">Stream Hook</Badge>
                            ) : (
                              <Badge variant="secondary">Static Command</Badge>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-medium italic">{item.message || "Protocol initialized."}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Info className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold italic text-sm tracking-wide">Detailed telemetry sequence unavailable for this protocol.</p>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="p-32 text-center">
            <Search className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] italic">No Protocol Synchronized</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/50 gap-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
            Sequence Page <span className="text-primary-600">{page}</span> of <span className="text-slate-800">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1 || loading}>Previous</Button>
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    disabled={loading}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      page === p
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <Button variant="secondary" size="sm" onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || loading}>Next</Button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default ActuationFetcher;