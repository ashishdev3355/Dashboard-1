import { useState, useEffect, } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Car, 
  Settings, 
  FileSpreadsheet, 
  RefreshCw, 
  AlertCircle,
  Database,
  ShieldCheck,
  Terminal,
  Activity,
  Layers,
  Info
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface CommandData {
  command: string;
  module: string;
}

interface ApiResponse {
  data: CommandData[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const CommandAPIFrontend = () => {
  const [commands, setCommands] = useState<CommandData[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<CommandData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [make, setMake] = useState<string>('Honda');
  const [selectedModules, setSelectedModules] = useState<string>('Engine, ABS');
  const [functionType, setFunctionType] = useState<string>('scan');
  const [fullScan, setFullScan] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 100
  });

  const fetchCommands = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        make,
        function_type: functionType,
        full_scan: fullScan.toString()
      });
      
      const modulesArray = selectedModules.split(',').map(m => m.trim()).filter(m => m);
      params.append('module', JSON.stringify(modulesArray));
      
      const url = `${BASE_URL}api/CommandAPI?${params}`;
      const token = localStorage.getItem("token");
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error(`Transmission failure: ${response.status}`);

      const result: ApiResponse = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setCommands(result.data);
        setFilteredCommands(result.data);
        
        const totalItems = result.data.length;
        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
        setPagination(prev => ({
          ...prev,
          totalItems,
          totalPages,
          currentPage: 1
        }));
      } else {
        throw new Error('Invalid telemetry format encountered');
      }
    } catch (err: any) {
      setError(err.message || 'Fatal synchronisation error');
      setCommands([]);
      setFilteredCommands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = commands;
    
    if (searchTerm.trim()) {
      filtered = commands.filter(cmd => 
        cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.module.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCommands(filtered);
    
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: 1
    }));
  }, [commands, searchTerm, pagination.itemsPerPage]);

  const getPaginatedData = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredCommands.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  useEffect(() => {
    fetchCommands();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="Diagnostic Command Hub" 
        subtitle="Low-level protocol interface for vehicle infrastructure management and command mapping"
        icon={Terminal}
        action={
          <div className="flex gap-3">
             <Button 
                variant="outline" 
                onClick={fetchCommands} 
                isLoading={loading}
                icon={RefreshCw}
              >
                Sync Manifest
              </Button>
          </div>
        }
      />

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card title="Query Engineering" icon={Settings} subtitle="Configure protocol parameters and target systems">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchCommands();
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Target Manufacturer"
                    placeholder="e.g. Honda, BMW"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    icon={Database}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Function</label>
                    <select
                      value={functionType}
                      onChange={(e) => setFunctionType(e.target.value)}
                      className="h-11 w-full bg-slate-50 border-none rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="scan">System Scan</option>
                      <option value="live_data">Real-time Telemetry</option>
                      <option value="vin">VIN Identification</option>
                      <option value="clear">DTC Purge</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Module Manifest"
                    placeholder="Engine, ABS, Airbag"
                    value={selectedModules}
                    onChange={(e) => setSelectedModules(e.target.value)}
                    icon={Layers}
                  />
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100/50">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">Recursive Scan</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={fullScan}
                        onChange={(e) => setFullScan(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" className="px-12 h-11 shadow-lg shadow-primary-100" isLoading={loading} icon={RefreshCw}>
                    Execute Sync
                  </Button>
                </div>
              </form>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card title="Session Statistics" icon={Activity} subtitle="Active telemetry metrics">
              <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Synchronized Commands</p>
                    <p className="text-3xl font-black text-primary-600 tracking-tighter">{pagination.totalItems}</p>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]" style={{ width: '100%' }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Items / Frame</p>
                      <p className="font-black text-slate-700">{pagination.itemsPerPage}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Frames</p>
                      <p className="font-black text-slate-700">{pagination.totalPages}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 italic">Protocol vectors aligned for diagnostic streaming.</p>
              </div>
            </Card>
          </div>
        </div>

        <Card title="Live Command Manifest" icon={ShieldCheck} subtitle={searchTerm ? `Filtered by: ${searchTerm}` : "Global Registry"}>
          <div className="mb-6">
            <Input 
              placeholder="Filter local manifest (Command identifier or Module name)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="bg-slate-50 border-none h-12"
            />
          </div>

          {loading ? (
            <div className="py-32 text-center overflow-hidden">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-400 font-black italic tracking-widest uppercase text-xs animate-pulse">Correlating Command Vectors...</p>
            </div>
          ) : filteredCommands.length > 0 ? (
            <div className="overflow-x-auto rounded-[24px] border border-slate-100 shadow-sm bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest w-1/2">Command String</th>
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text">Target Module</th>
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-center">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getPaginatedData().map((command, index) => (
                    <tr key={index} className="hover:bg-primary-50/20 transition-all group">
                      <td className="px-8 py-5">
                        <code className="bg-slate-900 text-primary-400 px-4 py-2 rounded-xl font-mono text-[11px] font-black tracking-wider block w-fit shadow-lg shadow-slate-900/10">
                          {command.command}
                        </code>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-black text-slate-700 tracking-tight text-sm uppercase">{command.module}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                          <Badge variant={command.command.startsWith('AT') ? 'warning' : 'primary'}>
                            {command.command.startsWith('AT') ? 'SETUP' : 'DIAGNOSTIC'}
                          </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-32 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200 animate-fadeIn">
              <Info size={56} className="mx-auto text-slate-200 mb-6" />
              <p className="text-slate-500 font-black italic tracking-tight text-lg">No command definitions identified.</p>
              <p className="text-slate-400 font-bold mt-2">Adjust your query parameters to find target hooks.</p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-10 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Burst Frame Size</p>
                <select
                  value={pagination.itemsPerPage}
                  onChange={(e) => setPagination(prev => ({
                    ...prev,
                    itemsPerPage: parseInt(e.target.value),
                    currentPage: 1
                  }))}
                  className="bg-transparent border-none rounded-lg p-0 text-[11px] font-black text-primary-600 focus:ring-0 cursor-pointer"
                >
                  {[30, 50, 100, 200].map(size => (
                    <option key={size} value={size}>{size} / Frame</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all disabled:opacity-30 shadow-sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2 mx-3">
                  <span className="bg-primary-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary-200">
                    {pagination.currentPage}
                  </span>
                  <span className="text-slate-300 font-black px-1">/</span>
                  <span className="bg-white border border-slate-100 text-slate-500 px-5 py-2 rounded-xl text-xs font-black shadow-sm">
                    {pagination.totalPages}
                  </span>
                </div>

                <button
                  className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all disabled:opacity-30 shadow-sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </Card>
        
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-6 flex items-center gap-4 text-rose-600 font-black text-sm animate-shake shadow-sm">
            <div className="bg-rose-100 p-2 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div className="flex flex-col">
              <span className="uppercase text-[10px] opacity-60 tracking-widest mb-0.5">System Fault Identified</span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandAPIFrontend;