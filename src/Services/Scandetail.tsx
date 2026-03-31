import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSearch, 
  Download, 
  Mail, 
  Hash, 
  Activity,
  ArrowRight,
  Database,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

interface DecodedArrayItem {
  pid: string;
  data: string;
  decodedFaultArray: Record<string, string>;
  header: string;
  protocol: string;
  system: string;
}

interface ScanResItem {
  data: string;
  header: string;
  make: string;
  pid: string;
  protocol: string;
  system: string;
}

interface ScanData {
  _id: string;
  user_email: string;
  license_plate: string;
  scan_start_time: string;
  scan_end_time: string;
  App_version: string;
  scan_ended: string;
  functiones: string;
  type: string;
  ScanArray: ScanResItem[];
  DecodeArray: DecodedArrayItem[];
}

const ITEMS_PER_PAGE = 30;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ObdScanReport = () => {
  const [scanData, setScanData] = useState<ScanData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    email: '',
    license_plate: '',
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
        email: filters.email,
        license_plate: filters.license_plate,
      });
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/ObdScanReport?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch scan report data');

      const json = await response.json();
      if (json && Array.isArray(json.scans)) {
        setScanData(json.scans);
        setTotal(json.total || 0);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Connection to diagnostic database failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        email: filters.email,
        license_plate: filters.license_plate,
      });
      const response = await fetch(`${API_BASE_URL}api/ObdScanReport?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch scan report data');
      const json = await response.json();
      if (json && Array.isArray(json.scans) && json.scans.length > 0) {
        const excelData = json.scans.map((item: ScanData) => ({
          'Email': item.user_email,
          'License Plate': item.license_plate,
          'Start Time': new Date(item.scan_start_time).toLocaleString(),
          'End Time': new Date(item.scan_end_time).toLocaleString(),
          'App Version': item.App_version,
          'Status': item.scan_ended === 'true' ? 'Completed' : 'Pending',
          'Function': item.functiones,
          'Type': item.type,
          'Scan Results Count': item.ScanArray?.length || 0,
          'Faults Found': item.DecodeArray?.length || 0
        }));
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scan Reports');
        const filename = `Scan_Reports_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const handleFilterChange = (field: string, value: string) => {
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="OBD Diagnostic Reports" 
        subtitle="Vew and analyze historical vehicle scan data across your network"
        icon={Database}
        action={
          <Button 
            variant="outline" 
            onClick={downloadExcel} 
            disabled={loading || scanData.length === 0}
            icon={Download}
          >
            Export Manifest
          </Button>
        }
      />

      <div className="space-y-8">
        <Card title="Database Query" subtitle="Filter diagnostic records by identity or vehicle plate" icon={Search}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchData();
            }}
            className="flex flex-col md:flex-row items-end gap-6"
          >
            <div className="flex-1 w-full">
              <Input 
                label="Account Email" 
                placeholder="user@example.com"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                icon={Mail}
              />
            </div>
            <div className="flex-1 w-full">
              <Input 
                label="License Plate" 
                placeholder="e.g. MH12AB1234"
                value={filters.license_plate}
                onChange={(e) => handleFilterChange('license_plate', e.target.value)}
                icon={Hash}
              />
            </div>
            
            <Button type="submit" variant="primary" className="px-10 h-11" isLoading={loading} icon={Search}>
              Execute Filter
            </Button>
          </form>
        </Card>

        <Card noPadding title="Diagnostic History" icon={Activity} headerAction={<Badge variant="secondary">{total} Total Records</Badge>}>
          {loading ? (
            <div className="p-32 text-center">
              <div className="animate-spin h-14 w-14 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6 shadow-sm"></div>
              <p className="text-slate-400 font-black italic tracking-widest animate-pulse uppercase text-xs">Synchronizing diagnostic server...</p>
            </div>
          ) : error ? (
            <div className="p-24 text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-50 text-rose-500 rounded-[28px] mb-6 shadow-sm border border-rose-100/50">
                <Activity size={32} />
              </div>
              <p className="text-slate-700 font-black text-xl mb-2 italic">Connection Infrastructure Failure</p>
              <p className="text-slate-400 max-w-sm mx-auto mb-8 font-bold text-sm tracking-tight">{error}</p>
              <Button variant="primary" className="h-11 px-8 shadow-lg shadow-primary-200" onClick={fetchData} icon={RefreshCw}>Reconnect Database</Button>
            </div>
          ) : scanData.length === 0 ? (
            <div className="p-32 text-center italic animate-fadeIn">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 text-slate-200 rounded-[28px] mb-6 border border-slate-100">
                <FileSearch size={32} />
              </div>
              <p className="text-slate-400 font-black tracking-widest text-xs uppercase">No diagnostic findings identified</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">User Identity</th>
                    <th className="px-8 py-5">Plate No.</th>
                    <th className="px-8 py-5">Start Time</th>
                    <th className="px-8 py-5">End Time</th>
                    <th className="px-8 py-5">App Rel.</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scanData.map((item, index) => (
                    <tr key={item._id || index} className="hover:bg-primary-50/30 transition-all group">
                      <td className="px-8 py-5 font-black text-slate-700 tracking-tight">{item.user_email}</td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="font-mono bg-slate-900 text-primary-400 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-black tracking-widest shadow-lg shadow-slate-900/10">{item.license_plate}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-slate-500 font-bold">
                        {new Date(item.scan_start_time).toLocaleString()}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-slate-500 font-bold">
                        {new Date(item.scan_end_time).toLocaleString()}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <Badge variant="secondary">{item.App_version}</Badge>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <Badge variant={item.scan_ended === 'true' ? 'success' : 'warning'}>
                          {item.scan_ended === 'true' ? 'Complete' : 'Interrupt'}
                        </Badge>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-slate-400 font-bold uppercase tracking-tighter">{item.type || 'Generic'}</td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <Button 
                          variant="primary" 
                          size="sm" 
                          icon={ArrowRight} 
                          iconPosition="right"
                          className="h-9 px-4 font-black"
                          onClick={() =>
                            navigate(`/ObdScanReport/details/${item._id}`, {
                              state: {
                                ScanArray: item.ScanArray,
                                DecodeArray: item.DecodeArray,
                                start_time: item.scan_start_time,
                                end_time: item.scan_end_time,
                                license_plate: item.license_plate,
                                email: item.user_email,
                                App_version: item.App_version,
                                scan_ended: item.scan_ended,
                                functiones: item.functiones,
                                type: item.type,
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
            <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Manifest Fragment <span className="text-primary-600 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span>
              </p>
              
              <div className="flex items-center gap-1.5">
                <button
                  className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all disabled:opacity-30 shadow-sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex gap-2 mx-4">
                  {generatePageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all ${
                        page === pageNum
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                          : 'bg-white text-slate-500 border border-slate-100 hover:bg-primary-50'
                      }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all disabled:opacity-30 shadow-sm"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
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

export default ObdScanReport;
