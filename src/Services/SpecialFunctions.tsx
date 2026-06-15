import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import HeaderAndValue from "../ReusedCompontets/HeaderAndValue"
import { useNavigate } from 'react-router-dom';



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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

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
      const response = await fetch(`${API_BASE_URL}api/SpecialFunctions?${params.toString()}`,{
         headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
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

  // Excel download function
  const downloadExcel = async () => {
    try {
      setLoading(true);
      
      // Fetch all data without pagination
      const params = new URLSearchParams({
        ...filters,
      });
      
      // Don't add page and limit to get all data
      const response = await fetch(`${API_BASE_URL}api/SpecialFunctions?${params.toString()}`);
      
      if (!response.ok) throw new Error('Failed to fetch special functions data');
      
      const json = await response.json();
      
      if (json && Array.isArray(json.scans) && json.scans.length > 0) {
        // Prepare data for Excel
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
        
        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Special Functions');
        
        // Generate filename
        const filename = `Special_Functions_${filters.make || 'All'}_${filters.email || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Download file
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

  // Generate page numbers to show
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="p-4 ml-8">
      <h2 className="text-xl font-bold mb-4">Special Functions</h2>
      {error && <p className="text-red-500">{error}</p>}

      {/* Filters Section and Excel Download Button */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Filters row */}
      
        <form
            onSubmit={(e) => {
              e.preventDefault(); // stop page reload
              setPage(1);
              fetchData();
            }}
          >
            <div className="flex flex-wrap gap-4">
              {Object.keys(filters).map((key) => (
                <div key={key} className="flex flex-col w-52">
                  <label className="mb-1 font-semibold capitalize">
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    type={
                      key.includes("time")
                        ? "date"
                        : key === "hard_coded"
                        ? "checkbox"
                        : "text"
                    }
                    placeholder={key.replace(/_/g, " ")}
                    className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={
                      key === "hard_coded"
                        ? undefined
                        : filters[key as keyof Filters]
                    }
                    checked={
                      key === "hard_coded"
                        ? filters[key as keyof Filters] === "true"
                        : undefined
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        key as keyof Filters,
                        key === "hard_coded"
                          ? (e.target as HTMLInputElement).checked.toString()
                          : e.target.value
                      )
                    }
                  />
                </div>
              ))}

              <button
                type="submit" // ✅ Enter key now triggers filter
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-all self-end"
              >
                Filter
              </button>
            </div>
          </form>

        
        {/* Excel Download Button */}
        <div className="flex justify-end">
          <button
            onClick={downloadExcel}
            disabled={loading || functionsData.length === 0}
            className="bg-blue-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3.293 7.707A1 1 0 014 7h3V3a1 1 0 011-1h4a1 1 0 011 1v4h3a1 1 0 01.707 1.707l-7 7a1 1 0 01-1.414 0l-7-7z"/>
            </svg>
            Download Excel
          </button>
        </div>
      </div>

      {loading && <p className="text-blue-500">Loading...</p>}

      {/* Table */}
      <table className="min-w-full bg-white border border-gray-200 text-sm">
        <thead>
          <tr>
            <HeaderAndValue header={true} Title="Email" />
            <HeaderAndValue header={true} Title="Make" />
            <HeaderAndValue header={true} Title="Module" />
            <HeaderAndValue header={true} Title="Model" />
            <HeaderAndValue header={true} Title="Function Type" />
            <HeaderAndValue header={true} Title="Command Type" />
            <HeaderAndValue header={true} Title="Item Number" />
            <HeaderAndValue header={true} Title="Variant" />
            <HeaderAndValue header={true} Title="License Plate" />
            <HeaderAndValue header={true} Title="Scan Ended" />
            <HeaderAndValue header={true} Title="Hard Coded" />
            <HeaderAndValue header={true} Title="Start Time" />
            <HeaderAndValue header={true} Title="End Time" />
            <HeaderAndValue header={true} Title="Show" />
          </tr>
        </thead>
        <tbody>
          {functionsData.map((item, index) => (
            <tr key={index}>
              <HeaderAndValue Title={item.user_email} />
              <HeaderAndValue Title={item.make} />
              <HeaderAndValue Title={item.module} />
              <HeaderAndValue Title={item.model} />
              <HeaderAndValue Title={item.function_type} />
              <HeaderAndValue Title={item.command_type} />
              <HeaderAndValue Title={item.item_number} />
              <HeaderAndValue Title={item.variant} />
              <HeaderAndValue Title={item.license_plate} />
              <HeaderAndValue Title={item.scan_ended} />
              <HeaderAndValue Title={item.hard_coded ? 'Yes' : 'No'} />
              <HeaderAndValue Title={new Date(item.scan_start_time).toLocaleString()} />
              <HeaderAndValue Title={new Date(item.scan_end_time).toLocaleString()} />
              <td className="border px-4 py-2">
                {/* <button
                  onClick={() => {
                    // Mock navigation - in real app use navigate
                    console.log('Navigate to details with function data:', item);
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  View Details
                </button> */}



                <button
                  onClick={() =>
                    navigate("/SpecialFunctions/details", {
                      state: {
                        ScanArray: item.scanResArray,   // or whatever field holds your scan array
                        start_time: item.scan_start_time,
                        end_time: item.scan_end_time,
                        email: item.user_email,
                        make: item.make,
                      },
                    })
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  View Details
                </button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ New Pagination Design */}
      <div className="mt-6 flex flex-col items-center space-y-4">
        {/* Pagination buttons */}
        <div className="flex items-center space-x-1">
          <button
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>

          {totalPages > 0 && generatePageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              className={`w-10 h-10 rounded-md font-medium transition-colors ${
                page === pageNum
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages || 1))}
            disabled={page === (totalPages || 1)}
          >
            Next
          </button>
        </div>

        {/* Showing results text */}
        <p className="text-gray-600 text-sm">
          Showing page {page} of {totalPages || 1} ({total} total items)
        </p>
      </div>
    </div>
  );
};

export default SpecialFunctionsDetail;