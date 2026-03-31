import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  Layers, 
  Search, 
  Database, 
  Info, 
  Car, 
  Calendar,
  ChevronRight,
  ShieldAlert,
  Code,
  Zap,
  Terminal
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

type Detail = {
  pid: string;
  command_type: string;
  function_name: string;
  message: string | null;
  hard_coded: boolean;
};

type SPFCommand = {
  function_name: string;
  hard_coded: boolean;
  details: Detail[];
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 200;

const SPFCommands: React.FC = () => {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState<SPFCommand[]>([]);
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

    try {
      const params = new URLSearchParams();
      if (searchMake.trim()) params.append("make", searchMake);
      if (searchModel.trim()) params.append("model", searchModel);
      if (searchYear.trim()) params.append("year", searchYear);
      params.append("page", currentPage.toString());
      params.append("limit", ITEMS_PER_PAGE.toString());

      const token = localStorage.getItem("token");
      const url = `${BASE_URL}api/SPFCommands?${params.toString()}`;
      
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error(`Fetch aborted or failed: ${response.status}`);
      
      const json = await response.json();

      if (json.data && json.data.length > 0) {
        setData(json.data);
        setTotal(json.total || 0);
      } else {
        setData([]);
        setError(searchMake || searchModel || searchYear ? "No SPF sequences found matching vehicle description." : "SPF command repository is currently empty.");
        setTotal(0);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError("Failed to synchronize with SPF telemetry server.");
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

  const getPageNumbers = () => {
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const pages = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    if (end - start < maxPagesToShow - 1) start = Math.max(1, end - maxPagesToShow + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 px-2">
      <PageHeader 
        title="SPF Command Engine" 
        subtitle="Manage and analyze Special Function (SPF) protocols and PID mappings."
        icon={Terminal}
      />

      <Card title="Registry Query" subtitle="Filter sequences by vehicle manufacturer and series" icon={Layers}>
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
              placeholder="e.g. Hyundai, Toyota"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              icon={Database}
            />
            <Input 
              label="Model Specification" 
              placeholder="e.g. i20, Corolla"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              icon={Car}
            />
            <Input 
              label="Production Year" 
              placeholder="e.g. 2020"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              icon={Calendar}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" className="px-10 h-12 shadow-xl shadow-primary-200" isLoading={loading}>
              Execute Sync
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-6">
        {loading ? (
          <div className="p-32 text-center">
            <div className="animate-spin h-14 w-14 border-[5px] border-primary-600 border-t-transparent rounded-full mx-auto mb-8 shadow-inner shadow-primary-50"></div>
            <p className="text-slate-400 font-black tracking-[0.2em] animate-pulse uppercase">Syncing SPF Telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center bg-white rounded-[32px] border border-slate-100 shadow-xl">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Sync Error</h3>
            <p className="text-slate-500 font-bold italic mb-8 mx-auto max-w-xs">{error}</p>
            <Button variant="outline" onClick={() => fetchData(1)}>Resume Sync</Button>
          </div>
        ) : data.length > 0 ? (
          data.map((item, idx) => (
            <Card 
              key={idx} 
              title={item.function_name} 
              headerAction={
                <Badge variant={item.hard_coded ? "warning" : "secondary"}>
                  {item.hard_coded ? "Hard Coded" : "Dynamic"}
                </Badge>
              }
              icon={Code}
              noPadding
            >
              {item.details && item.details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest">PID Hook</th>
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest">Command Type</th>
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest">Protocol Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {item.details.map((d, detailIdx) => (
                        <tr key={detailIdx} className="hover:bg-primary-50/20 transition-colors">
                          <td className="px-5 py-4">
                            <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-black">{d.pid ?? "0x00"}</code>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-600 italic">{d.command_type ?? "N/A"}</td>
                          <td className="px-5 py-4 text-slate-500 font-medium italic">{d.message ?? "Protocol initialized."}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Info className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold italic text-sm tracking-wide">No low-level PID details mapped for this function.</p>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="p-32 text-center">
            <Zap className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] italic">No SPF Data Sync</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white rounded-[32px] border border-slate-100 shadow-xl gap-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Registry Page <span className="text-primary-600 font-black">{page}</span> of <span className="text-slate-800 font-black">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1 || loading}>Previous</Button>
            <div className="hidden sm:flex gap-1">
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    pageNum === page
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                   {pageNum}
                </button>
              ))}
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

export default SPFCommands;