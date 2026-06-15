import React, { useEffect, useState } from "react";


type Detail = {
  pid: string;
  command_type: string;
  function_name: string;
  message: string | null;
  hard_coded: boolean;
};

type SPFCommand = {
  function_name: string;
  hard_coded: boolean;
  details: Detail[];
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL; // API base URL
const ITEMS_PER_PAGE = 200; // Number of items per page

const SPFCommands: React.FC = () => {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState<SPFCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setData([]);

    try {
      const params = new URLSearchParams();
      if (make) params.append("make", make);
      if (model) params.append("model", model);
      if (year) params.append("year", year);

      params.append("page", page.toString());
      params.append("limit", ITEMS_PER_PAGE.toString());
      const token =  localStorage.getItem("token");
      const url = `${BASE_URL}api/SPFCommands?${params.toString()}`;
      const response = await fetch(url,{
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
      });
      const json = await response.json();

      if (json.data && json.data.length > 0) {
        setData(json.data);
        setTotal(json.total || 0);
      } else {
        setError("No data found for the given car details.");
        setTotal(0);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch SPF commands. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on page load and page changes
  useEffect(() => {
    fetchData();
  }, [page]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const currentPageItems = data.length;

  // Excel download function
  // const downloadExcel = async () => {
  //   try {
  //     setLoading(true);
      
  //     // Fetch all data without pagination
  //     const params = new URLSearchParams();
  //     if (make) params.append("make", make);
  //     if (model) params.append("model", model);
  //     if (year) params.append("year", year);
      
  //     // Don't add page and limit to get all data
  //     const url = `${BASE_URL}api/SPFCommands?${params.toString()}`;
  //     const response = await fetch(url);
  //     const json = await response.json();
      
  //     if (json.data && json.data.length > 0) {
  //       // Prepare data for Excel
  //       const excelData : any = [];
        
  //       json.data.forEach((command : any) => {
  //         if (command.details && command.details.length > 0) {
  //           command.details.forEach((detail : any) => {
  //             excelData.push({
  //               'Function Name': command.function_name,
  //               'Hard Coded': command.hard_coded ? 'True' : 'False',
  //               'PID': detail.pid || 'N/A',
  //               'Message': detail.message || 'N/A',
  //               'Command Type': detail.command_type || 'N/A'
  //             });
  //           });
  //         } else {
  //           excelData.push({
  //             'Function Name': command.function_name,
  //             'Hard Coded': command.hard_coded ? 'True' : 'False',
  //             'PID': 'N/A',
  //             'Message': 'N/A',
  //             'Command Type': 'N/A'
  //           });
  //         }
  //       });
        
  //       // Create workbook and worksheet
  //       const ws = XLSX.utils.json_to_sheet(excelData);
  //       const wb = XLSX.utils.book_new();
  //       XLSX.utils.book_append_sheet(wb, ws, 'SPF Commands');
        
  //       // Generate filename
  //       const filename = `SPF_Commands_${make || 'All'}_${model || 'All'}_${year || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
  //       // Download file
  //       XLSX.writeFile(wb, filename);
  //     } else {
  //       alert('No data available to download');
  //     }
  //   } catch (err) {
  //     console.error('Error downloading Excel:', err);
  //     alert('Failed to download Excel file');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    
    if (end - start < maxPagesToShow - 1) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-semibold mb-4 text-center text-blue-700">
        SPF Commands Viewer
      </h1>

      {/* Search Inputs and Buttons */}
      <div className="flex flex-col gap-4 mb-6 justify-center">
        {/* Search inputs row */}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <form
            onSubmit={(e) => {
              e.preventDefault(); // prevent full page reload
              setPage(1); // Reset page
              fetchData(); // Trigger search
            }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center"
          >
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Hyundai"
              className="border px-4 py-2 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. i20"
              className="border px-4 py-2 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2020"
              className="border px-4 py-2 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit" // ✅ Enter key works now
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
            >
              Fetch SPF
            </button>
          </form>
        </div>

        
      </div>

      {/* Status Messages */}
      {loading && <p className="text-blue-500 text-center">Loading...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Data Table (scrollable) */}
      <div className="flex-1 overflow-auto space-y-6">
        {data.length > 0 ? (
          data.map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-300 rounded-lg shadow-sm p-4"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {item.function_name}
              </h2>
              <p className="mb-2 text-sm text-gray-600">
                <strong>Hard Coded:</strong> {item.hard_coded ? "True" : "False"}
              </p>

              {item.details && item.details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="border px-3 py-2 text-left">PID</th>
                        <th className="border px-3 py-2 text-left">Message</th>
                        <th className="border px-3 py-2 text-left">Command Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.details.map((d, detailIdx) => (
                        <tr key={detailIdx} className="hover:bg-gray-50">
                          <td className="border px-3 py-1">{d.pid ?? "N/A"}</td>
                          <td className="border px-3 py-1">{d.message ?? "N/A"}</td>
                          <td className="border px-3 py-1">{d.command_type ?? "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No command details available</p>
              )}
            </div>
          ))
        ) : (
          !loading && <p className="text-center text-gray-500">No data to display</p>
        )}
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <div className="mt-6">
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mb-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Previous
            </button>
            
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 rounded text-sm ${
                  pageNum === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          </div>

          {/* Page Info */}
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-purple-200 rounded"></span>
              <span>Page {page} of {totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-blue-200 rounded"></span>
              <span>Total Items: {total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-gray-200 rounded"></span>
              <span>Current Page Items: {currentPageItems}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SPFCommands;