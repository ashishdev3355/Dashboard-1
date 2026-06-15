import React, { useEffect, useState } from "react";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CommandData {
  function_name: string;
  make: string;
  model: string;
  variant: string[];
  commands: Record<string, string[]>;
}

const ITEMS_PER_PAGE = 100;

const CustomCommands: React.FC = () => {
  const [data, setData] = useState<CommandData[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCustomCommands = async (pageNumber = 1) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (make) params.append("make", make);
      if (model) params.append("model", model);
      if (year) params.append("year", year);
      params.append("page", pageNumber.toString());
      params.append("limit", ITEMS_PER_PAGE.toString());

      const url = params.toString()
        ? `${API_BASE_URL}api/CustomCommands?${params.toString()}`
        : `${API_BASE_URL}api/CustomCommands`;
      const token = localStorage.getItem("token");
      const response = await fetch(url,{
         headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const json = await response.json();

      if (json.data && Array.isArray(json.data)) {
        const normalizedData: CommandData[] = json.data.map((item: any) => ({
          function_name: item.function_name,
          make: item.make,
          model: item.model,
          variant: item.variant || [],
          commands: item.commands?.[0] || {},
        }));

        setData(normalizedData);
        setTotal(json.total || 0);
        setPage(pageNumber);
      } else {
        setData([]);
        setTotal(0);
        setError("No custom commands found for the given car details.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch commands");
    } finally {
      setLoading(false);
    }
  };

 
  useEffect(() => {
    fetchCustomCommands(1);
  }, []);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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
    <div className="flex flex-col ml-5 w-full min-h-screen bg-gray-50 p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Custom Commands Viewer
      </h2>

      {/* Filters and Buttons */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Filters row */}
        

        <form
          onSubmit={(e) => {
            e.preventDefault(); // prevent page reload
            setPage(1);
            fetchCustomCommands(1);
          }}
        >
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Make"
              className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={make}
              onChange={(e) => setMake(e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <input
              type="text"
              placeholder="Year"
              className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <button
              type="submit" // ✅ makes Enter work
              className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-all"
            >
              Search
            </button>
          </div>
        </form>

        
      
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-x-auto">
        {loading ? (
          <p className="p-4 text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-4 text-red-500">{error}</p>
        ) : data.length === 0 ? (
          <p className="p-4 text-gray-500">No commands found.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold border-b">
                  Function Name
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold border-b">
                  Make
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold border-b">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold border-b">
                  Variants
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold border-b">
                  Commands
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b text-gray-800 font-medium">
                    {item.function_name}
                  </td>
                  <td className="px-6 py-4 border-b text-gray-800 font-medium">
                    {item.make}
                  </td>
                  <td className="px-6 py-4 border-b text-gray-800 font-medium">
                    {item.model}
                  </td>
                  <td className="px-6 py-4 border-b text-gray-600">
                    {item.variant.join(", ")}
                  </td>
                  <td className="px-6 py-4 border-b text-gray-700">
                    <div className="flex flex-col gap-1">
                      {Object.entries(item.commands).map(([variant, cmds]) => (
                        <div key={variant}>
                          <strong>{variant}:</strong>
                          <ul className="list-disc list-inside ml-4 text-gray-600">
                            {cmds.map((cmd, i) => (
                              <li key={i}>{cmd}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Pagination Design */}
      <div className="mt-6 flex flex-col items-center space-y-4">
        {/* Pagination buttons */}
        <div className="flex items-center space-x-1">
          <button
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => fetchCustomCommands(page - 1)}
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
              onClick={() => fetchCustomCommands(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => fetchCustomCommands(page + 1)}
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

export default CustomCommands;
