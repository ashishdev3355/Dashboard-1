import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { 
  Activity, 
  Download, 
  Filter as FilterIcon, 
  Mail, 
  Car, 
  Layout, 
  ArrowRight,
  Database,
  Info,
  Layers,
  Search
} from 'lucide-react';
import HeaderAndValue from "../components/reusable/HeaderAndValue";
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

interface ActuationItem {
  created_at: string;
  updated_at: string;
  actuation_option: string;
  actuation_type: string;
  device: string | null;
  end_date: string | null;
  input: string | null;
  product_id: string | null;
  user_car_model_id: string | null;
  make: string;
  model: string;
  user_email: string | null;
  scanResArray: any[];
}

interface Filters {
  email: string;
  make: string;
  model: string;
  input: string;
  actuation_type: string;
  actuation_option: string;
  user_car_model_id: string;
}

const ITEMS_PER_PAGE = 30;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ActuationsDetail = () => {
  const [actuationsData, setActuationsData] = useState<ActuationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    email: "",
    make: "",
    model: "",
    input: "",
    actuation_type: "",
    actuation_option: "",
    user_car_model_id: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...filters,
      });
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}api/ActuationsDetail?${params.toString()}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch actuations data");

      const json = await response.json();
      if (json && Array.isArray(json.actuations)) {
        setActuationsData(json.actuations);
        setTotal(json.total || 0);
      } else {
        setError("Invalid response format");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Something went wrong while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ ...filters });
      const response = await fetch(`${API_BASE_URL}api/ActuationsDetail?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch data for export");
      const json = await response.json();
      
      if (json && Array.isArray(json.actuations) && json.actuations.length > 0) {
        const excelData = json.actuations.map((item: ActuationItem) => ({
          'Email': item.user_email || '-',
          'Make': item.make,
          'Model': item.model,
          'Type': item.actuation_type,
          'Option': item.actuation_option,
          'Input': item.input || '-',
          'Device': item.device || '-',
          'Product ID': item.product_id || '-',
          'Created At': new Date(item.created_at).toLocaleString(),
        }));
        
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Actuations');
        const filename = `Actuations_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
      } else {
        alert('No data available to download');
      }
    } catch (err) {
      console.error('Error downloading Excel:', err);
      alert('Failed to download Excel file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      <PageHeader 
        title="Actuations Registry" 
        subtitle="Analyze and track specialized component test sequences and results."
        icon={Activity}
        action={
          <Button 
            variant="outline" 
            onClick={downloadExcel} 
            disabled={loading || actuationsData.length === 0}
            icon={Download}
          >
            Export Sheet
          </Button>
        }
      />

      <Card title="Query Parameters" subtitle="Filter actuation test records" icon={FilterIcon}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchData();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Input 
              label="User Email" 
              placeholder="user@example.com"
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              icon={Mail}
            />
            <Input 
              label="Vehicle Make" 
              placeholder="e.g. BMW, Audi"
              value={filters.make}
              onChange={(e) => handleFilterChange('make', e.target.value)}
              icon={Car}
            />
            <Input 
              label="Model" 
              placeholder="e.g. A4, X5"
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
              icon={Layout}
            />
            <Input 
              label="Actuation Type" 
              placeholder="e.g. Engine, ABS"
              value={filters.actuation_type}
              onChange={(e) => handleFilterChange('actuation_type', e.target.value)}
              icon={Search}
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" className="px-10 h-12" isLoading={loading}>
              Execute Filter
            </Button>
          </div>
        </form>
      </Card>

      <Card noPadding title="Test Executions" headerAction={<Badge variant="secondary">Total: {total}</Badge>}>
        {loading ? (
          <div className="p-24 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-slate-400 font-medium tracking-wide italic">SYNCHRONIZING REPOSITORY...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Info className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-slate-500 font-semibold">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchData}>Try Again</Button>
          </div>
        ) : actuationsData.length === 0 ? (
          <div className="p-24 text-center">
            <Database className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium tracking-wide">No actuation records found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <HeaderAndValue header={true} Title="User Identity" />
                  <HeaderAndValue header={true} Title="Make" />
                  <HeaderAndValue header={true} Title="Model" />
                  <HeaderAndValue header={true} Title="Type" />
                  <HeaderAndValue header={true} Title="Option" />
                  <HeaderAndValue header={true} Title="Input" />
                  <HeaderAndValue header={true} Title="Device" />
                  <HeaderAndValue header={true} Title="Product ID" />
                  <HeaderAndValue header={true} Title="Timeline" />
                  <HeaderAndValue header={true} Title="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {actuationsData.map((item, index) => (
                  <tr key={index} className="hover:bg-primary-50/30 transition-all duration-200 group">
                    <td className="px-4 py-4 whitespace-nowrap font-bold text-slate-700">{item.user_email || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600 font-medium">{item.make}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{item.model}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="primary">{item.actuation_type}</Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-500">{item.actuation_option}</td>
                    <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-400">{item.input || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400">{item.device || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 font-mono text-[10px]">{item.product_id || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 text-[10px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        icon={ArrowRight} 
                        iconPosition="right"
                        onClick={() =>
                          navigate("/ActuationsDetail/details", {
                            state: {
                              ScanArray: item.scanResArray,
                              created_at: item.created_at,
                              updated_at: item.updated_at,
                              email: item.user_email,
                              make: item.make,
                              model: item.model,
                            },
                          })
                        }
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Showing page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages || 1}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </button>

              <div className="hidden sm:flex gap-1">
                {generatePageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`w-10 h-10 rounded-xl font-black transition-all ${
                      page === pageNum
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages || 1))}
                disabled={page === (totalPages || 1)}
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

export default ActuationsDetail;