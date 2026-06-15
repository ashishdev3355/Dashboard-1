import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(make ? { make } : {}),
      });
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/getCoverage?${params.toString()}`,{
         headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
      });

      if (!response.ok) throw new Error('Failed to fetch coverage data');

      const json = await response.json();
      if (json && Array.isArray(json.coverages)) {
        setCoverages(json.coverages);
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
        ...(make ? { make } : {}),
      });
      
      // Don't add page and limit to get all data
      const response = await fetch(`${API_BASE_URL}api/getCoverage?${params.toString()}`);
      
      if (!response.ok) throw new Error('Failed to fetch coverage data');
      
      const json = await response.json();
      
      if (json && Array.isArray(json.coverages) && json.coverages.length > 0) {
        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(json.coverages);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Coverage Data');
        
        // Generate filename
        const filename = `Coverage_Data_${make || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
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

  const handleSearch = () => {
    setPage(1);
    fetchData();
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
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-2xl font-bold mb-4">Coverage Data</h2>

      {/* Filter and Buttons */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Filter row */}
        {/* <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter car make (e.g. Hyundai)"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div> */}


        <form
          onSubmit={(e) => {
            e.preventDefault(); // stop page reload
            handleSearch();     // call your search
          }}
          className="flex gap-4"
        >
          <input
            type="text"
            placeholder="Enter car make (e.g. Hyundai)"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Search
          </button>
        </form>

        
        {/* Excel Download Button */}
        <div className="flex justify-end">
          <button
            onClick={downloadExcel}
            disabled={loading || coverages.length === 0}
            className="bg-blue-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3.293 7.707A1 1 0 014 7h3V3a1 1 0 011-1h4a1 1 0 011 1v4h3a1 1 0 01.707 1.707l-7 7a1 1 0 01-1.414 0l-7-7z"/>
            </svg>
            Download Excel
          </button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {loading && <p className="text-blue-500">Loading...</p>}

      {/* Table */}
      {coverages.length > 0 && (
        <>
          <p className="mb-4 text-gray-600">
            Showing <strong>{coverages.length}</strong> out of <strong>{total}</strong> results
          </p>
          <table className="min-w-full bg-white border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border px-4 py-3 text-left">Function Name</th>
                <th className="border px-4 py-3 text-left">Function Type</th>
              </tr>
            </thead>
            <tbody>
              {coverages.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{item.function_name}</td>
                  <td className="border px-4 py-2">{item.function_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ✅ New Pagination Design */}
      {totalPages > 1 && (
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

            {generatePageNumbers().map((pageNum) => (
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
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>

          {/* Showing results text */}
          <p className="text-gray-600 text-sm">
            Showing page {page} of {totalPages || 1} ({total} total items)
          </p>
        </div>
      )}
    </div>
  );
};

export default GetCoverage;