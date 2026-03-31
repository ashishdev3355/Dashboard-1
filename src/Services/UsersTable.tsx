import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Shield,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface User {
  [key: string]: string | number | boolean | null;
}

interface Filters {
  email: string;
  plan: string;
  status: string;
}

const ITEMS_PER_PAGE = 20; 

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>({ email: '', plan: '', status: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.email) params.append('email', filters.email);
      if (filters.plan) params.append('plan', filters.plan);
      if (filters.status) params.append('status', filters.status);
      
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/users?${params.toString()}`,{
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setUsers(data.users || []);
      setTotal(data.total || 0); 
    } catch (err) {
      setError("Failed to synchronize user registry.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.email) params.append('email', filters.email);
      if (filters.plan) params.append('plan', filters.plan);
      if (filters.status) params.append('status', filters.status);
      
      const response = await fetch(`${API_BASE_URL}api/users?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data.users && data.users.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.users);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        const filename = `UserRegistry_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
      }
    } catch (err) {
      alert('Failed to generate export manifest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="User Master Registry" 
        subtitle="Comprehensive management of system participants, subscription tiers, and access states"
        icon={Users}
        action={
          <Button 
            variant="outline" 
            onClick={downloadExcel} 
            disabled={loading || users.length === 0}
            icon={Download}
          >
            Export Master
          </Button>
        }
      />

      <div className="space-y-8">
        <Card title="Query Parameters" icon={Search} subtitle="Filter participants by identity and status">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchUsers();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input 
                label="Email Identity" 
                placeholder="user@example.com"
                value={filters.email}
                onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                icon={Mail}
              />
              <Input 
                label="Subscription Plan" 
                placeholder="e.g. Premium"
                value={filters.plan}
                onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
                icon={Shield}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="h-11 w-full bg-slate-50 border-none rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All States</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" className="px-10 h-11" isLoading={loading} icon={Search}>
                Execute Filter
              </Button>
            </div>
          </form>
        </Card>

        <Card noPadding title="Active Participants" icon={Activity} headerAction={<Badge variant="secondary">{total} Total Records</Badge>}>
          {loading ? (
            <div className="p-24 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
              <p className="text-slate-400 font-black italic tracking-widest animate-pulse">Synchronizing user registry...</p>
            </div>
          ) : error ? (
            <div className="p-24 text-center animate-fadeIn">
              <AlertCircle className="w-16 h-16 text-rose-300 mx-auto mb-6" />
              <p className="text-slate-700 font-black text-xl mb-2 italic">Registry Access Failure</p>
              <p className="text-slate-400 max-w-sm mx-auto mb-8 font-bold text-sm tracking-tight">{error}</p>
              <Button variant="primary" className="h-11 px-8 shadow-lg shadow-primary-100" onClick={fetchUsers} icon={RefreshCw}>Reconnect Registry</Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-24 text-center italic">
              <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black tracking-widest text-xs uppercase">No system participants identified</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {Object.keys(users[0]).map((key) => (
                      <th key={key} className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user, idx) => (
                    <tr key={idx} className="hover:bg-primary-50/30 transition-colors group">
                      {Object.values(user).map((val, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap font-bold text-slate-600">
                          {val === null || val === undefined ? (
                            <span className="text-slate-300">-</span>
                          ) : typeof val === 'boolean' ? (
                            <Badge variant={val ? 'success' : 'secondary'}>{val ? 'TRUE' : 'FALSE'}</Badge>
                          ) : i === 0 ? (
                              <code className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded font-mono">{String(val)}</code>
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Manifest Fragment <span className="text-primary-600">{page}</span> of <span className="text-slate-900">{totalPages}</span>
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
                  {getVisiblePages().map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${
                        page === pageNum
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-100'
                          : 'bg-white text-slate-500 hover:bg-primary-50 border border-slate-100'
                      }`}
                      onClick={() => setPage(pageNum)}
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
      </div>
    </div>
  );
};

export default UsersTable;