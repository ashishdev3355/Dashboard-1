import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Activity,
  Layers,
  Filter
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

interface CoverageItem {
  function_name: string;
  function_type: string;
}

const ITEMS_PER_PAGE = 30;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const GetCoverage = () => {
  const [coverages, setCoverages] = useState<CoverageItem[]>([]);
  const [make, setMake] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(make ? { make } : {}),
      });
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/getCoverage?${params.toString()}`,{
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch coverage data');

      const json = await response.json();
      if (json && Array.isArray(json.coverages)) {
        setCoverages(json.coverages);
        setTotal(json.total || 0);
      } else {
        setError('Invalid response format encountered.');
      }
    } catch (err) {
      setError('Connection to coverage registry failed.');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(make ? { make } : {}),
      });
      const response = await fetch(`${API_BASE_URL}api/getCoverage?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch coverage data');
      const json = await response.json();
      
      if (json && Array.isArray(json.coverages) && json.coverages.length > 0) {
        const ws = XLSX.utils.json_to_sheet(json.coverages);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Coverage Data');
        const filename = `Coverage_Manifest_${make || 'Global'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
      }
    } catch (err) {
      alert('Failed to generate export manifest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchData();
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="Protocol Coverage Index" 
        subtitle="Global audit of supported diagnostic functions and system coverage matrices"
        icon={ShieldCheck}
        action={
          <Button
            variant="outline"
            onClick={downloadExcel}
            disabled={loading || coverages.length === 0}
            icon={Download}
          >
            Export Excel
          </Button>
        }
      />

      <div className="space-y-8">
        <Card title="Manufacturer Query" icon={Search} subtitle="Search supported diagnostic hooks by brand">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 w-full">
              <Input
                label="Vehicle Manufacturer"
                placeholder="e.g. Hyundai, Toyota"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                icon={Layers}
              />
            </div>
            <Button variant="primary" className="h-11 px-8" type="submit" isLoading={loading} icon={Activity}>
              Scan Registry
            </Button>
          </form>
        </Card>

        {loading ? (
          <div className="bg-white rounded-[32px] border border-slate-100 p-32 text-center shadow-sm">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-slate-400 font-black italic tracking-widest animate-pulse uppercase">Synchronizing Coverage Stacks...</p>
          </div>
        ) : coverages.length > 0 ? (
          <Card 
            title="Verified Protocol Support" 
            icon={ClipboardList} 
            noPadding 
            headerAction={<Badge variant="secondary">{total} Active Identifiers</Badge>}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest">Function Name</th>
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-center">Diagnostic Payload Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {coverages.map((item, index) => (
                    <tr key={index} className="hover:bg-primary-50/30 transition-colors group">
                      <td className="px-8 py-5 font-black text-slate-700 tracking-tight">{item.function_name}</td>
                      <td className="px-8 py-5 text-center">
                        <Badge variant={item.function_type.toLowerCase().includes('critical') ? 'danger' : 'primary'}>
                          {item.function_type.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Manifest Page <span className="text-primary-600 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span>
                </p>
                
                <div className="flex items-center gap-1.5">
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all disabled:opacity-30 shadow-sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex gap-2 mx-4">
                    {generatePageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${
                          page === pageNum
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                            : "bg-white text-slate-500 border border-slate-100 hover:bg-primary-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all disabled:opacity-30 shadow-sm"
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 p-24 text-center">
            <Filter size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold italic">No coverage data identified for "{make || 'selected parameters'}"</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-[20px] p-5 flex items-center gap-4 text-rose-600 font-bold text-sm animate-shake">
            <Activity size={20} className="animate-pulse" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetCoverage;