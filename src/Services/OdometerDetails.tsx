import React, { useEffect, useState, useCallback, useRef } from "react";
import TableHead  from "../ReusedCompontets/TableHead"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 30;

const columns = [
  "Header",
  "Sub Header",
  "PID",
  "Protocol",
  "System",
  "Init",
  "Formula Based",
  "Generic",
  "Formula (Metric)",
  "Formula (Imperial)",
  "Unit (Metric)",
  "Unit (Imperial)"
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
  
  // Add ref to track the current request
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOdometerData = useCallback(async (targetPage?: number, currentMake?: string, currentModel?: string, currentYear?: string) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
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
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (Array.isArray(result.data)) {
        setOdometerData(result.data);
        setTotal(typeof result.total === "number" ? result.total : result.data.length);
        setError("");
        if (result.data.length === 0) {
          if (searchMake || searchModel || searchYear) {
            setError("No odometer data found for the specified criteria.");
          } else {
            setError("No odometer data available.");
          }
        }
      } else {
        setOdometerData([]);
        setError("No odometer data found.");
        setTotal(0);
      }
    } catch (err) {
      // Don't show error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      console.error("Error fetching odometer data:", err);
      setOdometerData([]);
      setError("Failed to fetch odometer data. Please try again.");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Fetch on first render - load all data by default
  useEffect(() => {
    fetchOdometerData(1);
  }, []);

  // Handle search button click
  const handleSearch = () => {
    setPage(1);
    fetchOdometerData(1, make, model, year);
  };

  // Handle page navigation
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOdometerData(newPage, make, model, year);
  };

  // Excel download function
  const downloadExcel = () => {
    if (odometerData.length === 0) return;

    // Prepare data for CSV
    const excelData = odometerData.map((item, index) => ({
      'S.No': index + 1,
      'Header': item.header || '',
      'Sub Header': item.subHeader || '',
      'PID': item.pid || '',
      'Protocol': item.protocol || '',
      'System': item.system || '',
      'Init': item.init || '',
      'Formula Based': item.formulaBased ? 'Yes' : 'No',
      'Generic': item.generic ? 'Yes' : 'No',
      'Formula (Metric)': item.formula_metric || '',
      'Formula (Imperial)': item.formula_imperial || '',
      'Unit (Metric)': item.unit_metric || '',
      'Unit (Imperial)': item.unit_imperial || ''
    }));

    // Create CSV content
    const headers = ['S.No', 'Header', 'Sub Header', 'PID', 'Protocol', 'System', 'Init', 'Formula Based', 'Generic', 'Formula (Metric)', 'Formula (Imperial)', 'Unit (Metric)', 'Unit (Imperial)'];
    let csvContent = headers.join(',') + '\n';
    
    excelData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header as keyof typeof row];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    // const link = document.createElement('a');
    
    // Generate filename with current date and search params
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    let filename = `Odometer_Details_${dateStr}`;
    
    if (make || model || year) {
      const filters = [make, model, year].filter(Boolean).join('_');
      filename += `_${filters}`;
    }
    
    filename += '.csv';

   

      // Fix typing issue by safely checking (msSaveBlob exists only in IE)
      const nav: any = navigator;

      if (typeof nav.msSaveBlob === "function") {
        nav.msSaveBlob(blob, filename); // IE 10+
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-full mx-auto">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
        Odometer Details
      </h1>

      {/* Search box */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault(); // prevent page refresh
              handleSearch();     // trigger your search
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"
          >
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Make"
              className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model"
              className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit" // ✅ Enter key will trigger this
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Loading..." : "Fetch"}
            </button>
          </form>

        {/* Download Excel Button */}
        <div className="flex justify-end mt-3">
          <button
            className="bg-blue-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition flex items-center gap-2"
            onClick={downloadExcel}
            disabled={odometerData.length === 0 || loading}
            title={odometerData.length === 0 ? "No data available to download" : "Download CSV file"}
          >
            
            Download Excel 
          </button>
        </div>
      </div>

      
      {error && <p className="text-red-500 text-center py-4 text-lg">{error}</p>}

      {/* Data display */}
      <div className="flex-1 overflow-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-blue-500 text-xl">Loading odometer data...</p>
              <p className="text-gray-500 mt-2">Please wait while we fetch the data</p>
            </div>
          </div>
        ) : odometerData.length > 0 ? (
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-700">
                Odometer Data Results
              </h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {odometerData.length} items
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                

                  <TableHead columns={columns} />
                <tbody>
                  {odometerData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3">
                        {item.header ? (
                          <span className=" px-2  rounded text-xs font-mono">
                            {item.header}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3">
                        {item.subHeader ? (
                          <span className=" px-2  rounded text-xs font-mono">
                            {item.subHeader}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3 ">
                        {item.pid ? (
                          <span className=" px-2  rounded text-xs font-mono">
                            {item.pid}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3 ">
                        {item.protocol ? (
                          <span className=" px-2  rounded text-xs">
                            {item.protocol}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3 ">
                        {item.system ? (
                          <span className=" px-2  rounded text-xs ">
                            {item.system}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3">
                        {item.init ? (
                          <span className=" px-2  rounded text-xs">
                            {item.init}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3">
                        <span className={`px-2  rounded text-xs `}>
                          {item.formulaBased ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="border px-3 py-2">
                        <span className={`px-2  rounded text-xs`}>
                          {item.generic ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="border px-3  max-w-xs">
                        {item.formula_metric ? (
                          <span className="   rounded text-xs block break-all">
                            {item.formula_metric}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3 max-w-xs">
                        {item.formula_imperial ? (
                          <span className=" px-2  rounded text-xs block break-all">
                            {item.formula_imperial}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3 ">
                        {item.unit_metric ? (
                          <span className=" px-2 py-1 rounded ">
                            {item.unit_metric}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-3 ">
                        {item.unit_imperial ? (
                          <span className=" px-2 py-1 rounded ">
                            {item.unit_imperial}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !error && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-xl">No odometer data to display</p>
              <p className="text-gray-400 mt-2">Try searching with different criteria</p>
            </div>
          )
        )}
      </div>




      {/* Pagination */}
      {odometerData.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            Previous
          </button>
          
          {/* Page numbers */}
          <div className="flex gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className={`px-3 py-2 rounded transition ${
                    page === pageNum
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
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
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            Next
          </button>
        </div>
      )}
      
      {totalPages > 0 && (
        <div className="text-center text-sm text-gray-500 mt-2 bg-white rounded-lg p-4 border">
          <div className="flex flex-wrap justify-center items-center gap-6">
            <span>📄 Page {page} of {totalPages}</span>
            <span>📊 Total Items: {total}</span>
            <span>🔧 Current Page Items: {odometerData.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OdometerDetails;