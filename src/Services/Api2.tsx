import { useState, useEffect, } from 'react';
import { Search, ChevronLeft, ChevronRight, Car, Settings, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Type definitions
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
  
  // Search and filter states
  const [make, setMake] = useState<string>('Honda');
  const [selectedModules, setSelectedModules] = useState<string>('Engine, ABS');
  const [functionType, setFunctionType] = useState<string>('scan');
  const [fullScan, setFullScan] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 100
  });

  // Available modules (extracted from your data)
 

  const fetchCommands = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        make,
        function_type: functionType,
        full_scan: fullScan.toString()
      });
      
      // Convert selectedModules string to array for API
      const modulesArray = selectedModules.split(',').map(m => m.trim()).filter(m => m);
      params.append('module', JSON.stringify(modulesArray));
      
      const possibleEndpoints = [
        `${BASE_URL}api/CommandAPI?${params}`,
       
      ];

      let response: Response | undefined;
      const token = localStorage.getItem("token");
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint,{
             headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
          });
          
          if (response.status !== 404) {
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!response || response.status === 404) {
        throw new Error('API endpoint not found. Please check your server configuration.');
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setCommands(result.data);
        setFilteredCommands(result.data);
        
        // Update pagination
        const totalItems = result.data.length;
        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
        setPagination(prev => ({
          ...prev,
          totalItems,
          totalPages,
          currentPage: 1
        }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check if the server is running.';
        }
      }
      
      setError(errorMessage);
      setCommands([]);
      setFilteredCommands([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter commands based on search term
  useEffect(() => {
    let filtered = commands;
    
    if (searchTerm.trim()) {
      filtered = commands.filter(cmd => 
        cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.module.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCommands(filtered);
    
    // Update pagination for filtered results
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: 1
    }));
  }, [commands, searchTerm, pagination.itemsPerPage]);

  // Get paginated data
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

  

  // Auto-fetch on component mount
  useEffect(() => {
    fetchCommands();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 ml-10 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Automotive Diagnostic Commands</h1>
              <p className="text-blue-100 mt-1">Search and manage OBD-II diagnostic commands by vehicle make and module</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          
        <div>
          
             <form
            onSubmit={(e) => {
              e.preventDefault(); // prevent page reload
              fetchCommands();    // trigger your function
            }}
            className="bg-gray-50 rounded-lg p-6 mb-6"
            >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Vehicle Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Make</label>
                <input
                  type="text"
                  placeholder="Enter vehicle make..."
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Function Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Function Type</label>
                <select
                  value={functionType}
                  onChange={(e) => setFunctionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="scan">Scan</option>
                  <option value="live_data">Live Data</option>
                  <option value="vin">vin</option>
                  
                  <option value="clear">Clear Codes</option>
                </select>
              </div>

              {/* Full Scan Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scan Type</label>
                <div className="flex items-center space-x-3 py-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={fullScan}
                      onChange={(e) => setFullScan(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Full Scan</span>
                  </label>
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Commands</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search commands or modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Module Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Modules</label>
              <input
                type="text"
                placeholder="Enter modules (comma separated)..."
                value={selectedModules}
                onChange={(e) => setSelectedModules(e.target.value)}
                className="w-70 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: Engine, ABS, HVAC
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"   
                disabled={loading || !selectedModules.trim()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fetch Commands
                  </>
                )}
              </button>
            </div>
          </form>
        </div>  

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900">Error</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {filteredCommands.length > 0 && (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {pagination.totalItems} commands found for {make}
                  </span>
                  {searchTerm && (
                    <span className="text-sm text-blue-700">
                      (filtered by "{searchTerm}")
                    </span>
                  )}
                </div>
                <div className="text-sm text-blue-700">
                  Modules: {selectedModules}
                </div>
              </div>

              

              {/* Commands Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Command
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Module
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {getPaginatedData().map((command, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 whitespace-nowrap">
                            <code className="text-sm font-mono  px-2 py-1 rounded">
                              {command.command}
                            </code>
                          </td>
                          <td className="px-6  whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center rounded-full text-xs font-medium ">
                              {command.module}
                            </span>
                          </td>
                          <td className="px-6  whitespace-nowrap text-sm ">
                            {command.command.startsWith('AT') ? 'Setup' : 'Diagnostic'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Items per page:</label>
                  <select
                    value={pagination.itemsPerPage}
                    onChange={(e) => setPagination(prev => ({
                      ...prev,
                      itemsPerPage: parseInt(e.target.value),
                      currentPage: 1
                    }))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const startPage = Math.max(1, pagination.currentPage - 2);
                    const pageNum = startPage + i;
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded text-sm font-medium transition-colors ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredCommands.length === 0 && !error && (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Commands Found</h3>
              <p className="text-gray-500 mb-4">
                {commands.length === 0 
                  ? 'Click "Fetch Commands" to load diagnostic commands'
                  : 'No commands match your search criteria'
                }
              </p>
              {commands.length === 0 && (
                <button
                  onClick={fetchCommands}
                  disabled={!selectedModules.trim()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Fetch Commands
                </button>
              )}
            </div>
          )}

        
        </div>
      </div>
    </div>
  );
};

export default CommandAPIFrontend;