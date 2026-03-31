import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  Gauge, 
  Search, 
  Download, 
  Filter,
  Layers,
  Info,
  Activity
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
  "Header",
  "Sub Header",
  "PID",
  "Protocol",
  "System",
  "Init",
  "Logic",
  "Generic",
  "Metric Formula",
  "Imperial Formula",
  "Metric Unit",
  "Imperial Unit"
];

const OdometerDetails: React.FC = () => {
  const [odometerData, setOdometerData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOdometerData = useCallback(async (targetPage?: number, currentMake?: string, currentModel?: string, currentYear?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError("");

    const currentPage = targetPage ?? page;
    const searchMake = currentMake !== undefined ? currentMake : make;
    const searchModel = currentModel !== undefined ? currentModel : model;
    const searchYear = currentYear !== undefined ? currentYear : year;

    try {
      const url = `${API_BASE_URL}api/OdometerAPI?make=${encodeURIComponent(
        searchMake
      )}&model=${encodeURIComponent(searchModel)}&year=${encodeURIComponent(
        searchYear
      )}&page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error(`Cloud sync failed: ${response.status}`);
      }
      
      const result = await response.json();

      if (Array.isArray(result.data)) {
        setOdometerData(result.data);
        setTotal(typeof result.total === "number" ? result.total : result.data.length);
        if (result.data.length === 0) {
          setError(searchMake || searchModel || searchYear ? "No matching odometer records found." : "Odometer database is currently empty.");
        }
      } else {
        setOdometerData([]);
        setError("Unexpected data format received from server.");
        setTotal(0);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error("Error fetching odometer data:", err);
      setOdometerData([]);
      setError("Unable to sync with odometer database. Check your connection.");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [make, model, year, page]);

  useEffect(() => {
    fetchOdometerData(1);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchOdometerData(1, make, model, year);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOdometerData(newPage, make, model, year);
  };

  const downloadExcel = () => {
    if (odometerData.length === 0) return;

    const headers = ['Header', 'Sub Header', 'PID', 'Protocol', 'System', 'Init', 'Formula Based', 'Generic', 'Formula (Metric)', 'Formula (Imperial)', 'Unit (Metric)', 'Unit (Imperial)'];
    let csvContent = headers.join(',') + '\n';
    
    odometerData.forEach(item => {
      const row = [
        item.header || '',
        item.subHeader || '',
        item.pid || '',
        item.protocol || '',
        item.system || '',
        item.init || '',
        item.formulaBased ? 'Yes' : 'No',
        item.generic ? 'Yes' : 'No',
        item.formula_metric || '',
        item.formula_imperial || '',
        item.unit_metric || '',
        item.unit_imperial || ''
      ];

      const formattedRow = row.map(value => {
        const str = String(value);
        if (str.includes(',') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvContent += formattedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `Odometer_Export_${new Date().toISOString().split('T')[0]}.csv`;
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

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <PageHeader 
        title="Odometer Configuration" 
        subtitle="Manage and inspect odometer PID specifications and formulas."
        icon={Gauge}
        action={
          <Button 
            variant="outline" 
            onClick={downloadExcel} 
            disabled={odometerData.length === 0 || loading}
            icon={Download}
          >
            Export CSV
          </Button>
        }
      />

      <Card title="Database Search" subtitle="Filter by manufacturer, model, or year" icon={Filter}>
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
              placeholder="e.g. Yamaha"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              icon={Layers}
            />
            <Input 
              label="Model Name" 
              placeholder="e.g. R15 V3"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              icon={Search}
            />
            <Input 
              label="Production Year" 
              placeholder="e.g. 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              icon={Info}
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" className="px-10 h-12" isLoading={loading}>
              Fetch Records
            </Button>
          </div>
        </form>
      </Card>

      <Card noPadding title="Specification Matrix" headerAction={<Badge variant="secondary">{total} Parameters</Badge>}>
        {loading ? (
          <div className="p-24 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-slate-400 font-medium tracking-wide">Syncing specifications...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-slate-700 font-bold text-lg mb-2">Sync Interrupted</p>
            <p className="text-slate-500 max-w-xs mx-auto mb-6">{error}</p>
            <Button variant="outline" onClick={() => fetchOdometerData(1)}>Retry Sync</Button>
          </div>
        ) : odometerData.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium tracking-wide">No specifications found for the current filter set.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <TableHead columns={columns} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {odometerData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-primary-50/30 transition-colors duration-150">
                    <td className="px-3 py-3 font-bold text-slate-700">{item.header || "-"}</td>
                    <td className="px-3 py-3 text-slate-500 italic">{item.subHeader || "-"}</td>
                    <td className="px-3 py-3"><code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-black">{item.pid || "-"}</code></td>
                    <td className="px-3 py-3 text-slate-400 truncate max-w-[80px]">{item.protocol || "-"}</td>
                    <td className="px-3 py-3 text-slate-400 truncate max-w-[80px]">{item.system || "-"}</td>
                    <td className="px-3 py-3 font-mono text-[10px] text-slate-400">{item.init || "-"}</td>
                    <td className="px-3 py-3">
                      <Badge variant={item.formulaBased ? 'primary' : 'secondary'}>{item.formulaBased ? "Yes" : "No"}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={item.generic ? 'warning' : 'secondary'}>{item.generic ? "Yes" : "No"}</Badge>
                    </td>
                    <td className="px-3 py-3 max-w-[120px] truncate group border-l border-slate-50 relative">
                      <span className="text-slate-500 font-mono" title={item.formula_metric}>{item.formula_metric || "-"}</span>
                    </td>
                    <td className="px-3 py-3 max-w-[120px] truncate group border-l border-slate-50">
                      <span className="text-slate-500 font-mono" title={item.formula_imperial}>{item.formula_imperial || "-"}</span>
                    </td>
                    <td className="px-3 py-3 font-bold text-primary-600 italic">{item.unit_metric || "-"}</td>
                    <td className="px-3 py-3 font-bold text-amber-600 italic">{item.unit_imperial || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">
              Page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-30"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                        page === pageNum
                          ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                          : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      } disabled:opacity-50`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default OdometerDetails;