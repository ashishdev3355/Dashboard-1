import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSearch, 
  Download, 
  Filter as FilterIcon, 
  Mail, 
  Car, 
  Layout, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeaderAndValue from "../components/reusable/HeaderAndValue";
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

interface SpecialFunctionItem {
  make: string;
  module: string;
  model: string;
  function_type: string;
  command_type: string;
  item_number: string;
  variant: string;
  license_plate: string;
  scan_ended: string;
  hard_coded: boolean;
  scan_start_time: string;
  scan_end_time: string;
  user_email: string;
  scanResArray: any;
}

interface Filters {
  email: string;
  make: string;
  module: string;
  model: string;
  function_type: string;
  command_type: string;
  item_number: string;
  variant: string;
  license_plate: string;
  scan_ended: string;
  hard_coded: string;
  scan_start_time: string;
  scan_end_time: string;
}

const ITEMS_PER_PAGE = 30;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SpecialFunctionsDetail = () => {
  const [functionsData, setFunctionsData] = useState<SpecialFunctionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    email: '',
    make: '',
    module: '',
    model: '',
    function_type: '',
    command_type: '',
    item_number: '',
    variant: '',
    license_plate: '',
    scan_ended: '',
    hard_coded: '',
    scan_start_time: '',
    scan_end_time: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...filters,
      });
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/SpecialFunctions?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch special functions data');

      const json = await response.json();
      if (json && Array.isArray(json.scans)) {
        setFunctionsData(json.scans);
        setTotal(json.total || 0);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ ...filters });
      const response = await fetch(`${API_BASE_URL}api/SpecialFunctions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch special functions data');
      const json = await response.json();
      if (json && Array.isArray(json.scans) && json.scans.length > 0) {
        const excelData = json.scans.map((item: SpecialFunctionItem) => ({
          'Email': item.user_email,
          'Make': item.make,
          'Module': item.module,
          'Model': item.model,
          'Function Type': item.function_type,
          'Command Type': item.command_type,
          'Item Number': item.item_number,
          'Variant': item.variant,
          'License Plate': item.license_plate,
          'Scan Ended': item.scan_ended,
          'Hard Coded': item.hard_coded ? 'Yes' : 'No',
          'Start Time': new Date(item.scan_start_time).toLocaleString(),
          'End Time': new Date(item.scan_end_time).toLocaleString()
        }));
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Special Functions');
        const filename = `Special_Functions_${filters.make || 'All'}_${filters.email || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <PageHeader 
        title="Special Functions Registry" 
        subtitle="Manage and analyze special diagnostic function executions."
        icon={Activity}
        action={
          <Button 
            variant="outline" 
            onClick={downloadExcel} 
            disabled={loading || functionsData.length === 0}
            icon={Download}
          >
            Export Sheet
          </Button>
        }
      />

      {/* Filters Section */}
      <Card title="Query Parameters" subtitle="Filter functional scan records" icon={FilterIcon}>
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
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Start Date</label>
              <input 
                type="date"
                className="premium-input w-full"
                value={filters.scan_start_time}
                onChange={(e) => handleFilterChange('scan_start_time', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" className="px-10 h-12" isLoading={loading}>
              Execute Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Table Section */}
      <Card noPadding title="Special Function Executions" headerAction={<Badge variant="secondary">Total: {total}</Badge>}>
        {loading ? (
          <div className="p-24 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-slate-400 font-medium tracking-wide">Retrieving functional records...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center">
            <Badge variant="danger" className="mb-4">System Error</Badge>
            <p className="text-slate-500 font-semibold">{error}</p>
          </div>
        ) : functionsData.length === 0 ? (
          <div className="p-24 text-center">
            <FileSearch className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium tracking-wide">No functional records found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <HeaderAndValue header={true} Title="User Identity" />
                  <HeaderAndValue header={true} Title="Make" />
                  <HeaderAndValue header={true} Title="Module" />
                  <HeaderAndValue header={true} Title="Model" />
                  <HeaderAndValue header={true} Title="Function" />
                  <HeaderAndValue header={true} Title="Command" />
                  <HeaderAndValue header={true} Title="Item No" />
                  <HeaderAndValue header={true} Title="Variant" />
                  <HeaderAndValue header={true} Title="Plate" />
                  <HeaderAndValue header={true} Title="Status" />
                  <HeaderAndValue header={true} Title="Start Time" />
                  <HeaderAndValue header={true} Title="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {functionsData.map((item, index) => (
                  <tr key={index} className="hover:bg-primary-50/30 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">{item.user_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">{item.make}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">{item.module}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">{item.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">{item.function_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">{item.command_type}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">#{item.item_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">{item.variant}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100 text-xs font-black uppercase">{item.license_plate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={item.scan_ended === 'true' ? 'success' : 'warning'}>
                        {item.scan_ended === 'true' ? 'Completed' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {new Date(item.scan_start_time).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        icon={ArrowRight} 
                        iconPosition="right"
                        onClick={() =>
                          navigate("/SpecialFunctions/details", {
                            state: {
                              ScanArray: item.scanResArray,
                              start_time: item.scan_start_time,
                              end_time: item.scan_end_time,
                              email: item.user_email,
                              make: item.make,
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

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Showing page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages || 1}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-30 disabled:pointer-events-none"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </button>

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

              <button
                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-30 disabled:pointer-events-none"
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

export default SpecialFunctionsDetail;