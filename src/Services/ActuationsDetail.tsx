import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

// Mock HeaderAndValue component since we can't import it
const HeaderAndValue = ({ header = false, Title }: { header?: boolean; Title: string }) => {
  if (header) {
    return <th className="border px-4 py-3 text-left bg-gray-100 text-gray-700">{Title}</th>;
  }
  return <td className="border px-4 py-2">{Title}</td>;
};

interface ActuationItem {
  created_at: string;
  updated_at: string;
  actuation_option: string;
  actuation_type: string;
  device: string | null;
  end_date: string | null;
  input: string | null;
  product_id: string | null;
  user_car_model_id: string | null;
  make: string;
  model: string;
  user_email: string | null;
  scanResArray: any[];
}

interface Filters {
  email: string;
  make: string;
  model: string;
  input: string;
  actuation_type: string;
  actuation_option: string;
  user_car_model_id: string;
}

const ITEMS_PER_PAGE = 30;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 

const ActuationsDetail = () => {
  const [actuationsData, setActuationsData] = useState<ActuationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    email: "",
    make: "",
    model: "",
    input: "",
    actuation_type: "",
    actuation_option: "",
    user_car_model_id: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate()

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...filters,
      });
        const token =  localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}api/ActuationsDetail?${params.toString()}`,{
           headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch actuations data");

      const json = await response.json();
      if (json && Array.isArray(json.actuations)) {
        setActuationsData(json.actuations);
        setTotal(json.total || 0);
      } else {
        setError("Invalid response format");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Something went wrong");
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
      const response = await fetch(`${API_BASE_URL}api/ActuationsDetail?${params.toString()}`);
      
      if (!response.ok) throw new Error("Failed to fetch actuations data");
      
      const json = await response.json();
      
      if (json && Array.isArray(json.actuations) && json.actuations.length > 0) {
        // Prepare data for Excel
        const excelData = json.actuations.map((item: ActuationItem) => ({
          'Email': item.user_email || '-',
          'Make': item.make,
          'Model': item.model,
          'Actuation Type': item.actuation_type,
          'Actuation Option': item.actuation_option,
          'Input': item.input || '-',
          'Device': item.device || '-',
          'Product ID': item.product_id || '-',
          'User Car Model ID': item.user_car_model_id || '-',
          'End Date': item.end_date || '-',
          'Created At': new Date(item.created_at).toLocaleString(),
          'Updated At': new Date(item.updated_at).toLocaleString()
        }));
        
        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Actuations Detail');
        
        // Generate filename
        const filename = `Actuations_Detail_${filters.make || 'All'}_${filters.email || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
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
      <h2 className="text-xl font-bold mb-4">Actuations</h2>
      {error && <p className="text-red-500">{error}</p>}

      {/* Filters Section and Excel Download Button */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Filters row */}
        {/* <div className="flex flex-wrap gap-4">
          {Object.keys(filters).map((key) => (
            <div key={key} className="flex flex-col w-52">
              <label className="mb-1 font-semibold capitalize">
                {key.replace(/_/g, " ")}
              </label>
              <input
                type="text"
                placeholder={key.replace(/_/g, " ")}
                className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters[key as keyof Filters]}
                onChange={(e) =>
                  handleFilterChange(key as keyof Filters, e.target.value)
                }
              />
            </div>
          ))}
          <button
            onClick={() => {
              setPage(1);
              fetchData();
            }}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-all self-end"
          >
            Filter
          </button>
        </div> */}

        <form
          onSubmit={(e) => {
            e.preventDefault(); // prevents page reload
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
                  type="text"
                  placeholder={key.replace(/_/g, " ")}
                  className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters[key as keyof Filters]}
                  onChange={(e) =>
                    handleFilterChange(key as keyof Filters, e.target.value)
                  }
                />
              </div>
            ))}

            <button
              type="submit" // ✅ Enter key submits the form
              className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-all self-end"
            >
              Filter
            </button>
          </div>
        </form>

        
       
        <div className="flex justify-end">
          <button
            onClick={downloadExcel}
            disabled={loading || actuationsData.length === 0}
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
            <HeaderAndValue header={true} Title="Model" />
            <HeaderAndValue header={true} Title="Actuation Type" />
            <HeaderAndValue header={true} Title="Actuation Option" />
            <HeaderAndValue header={true} Title="Input" />
            <HeaderAndValue header={true} Title="Device" />
            <HeaderAndValue header={true} Title="Product ID" />
            <HeaderAndValue header={true} Title="User Car Model ID" />
            <HeaderAndValue header={true} Title="end Date" />
            <HeaderAndValue header={true} Title="Created At" />
            <HeaderAndValue header={true} Title="Updated At" />
            <HeaderAndValue header={true} Title="Show" />
          </tr>
        </thead>
        <tbody>
          {actuationsData.map((item, index) => (
            <tr key={index}>
              <HeaderAndValue Title={item.user_email || "-"} />
              <HeaderAndValue Title={item.make} />
              <HeaderAndValue Title={item.model} />
              <HeaderAndValue Title={item.actuation_type} />
              <HeaderAndValue Title={item.actuation_option} />
              <HeaderAndValue Title={item.input || "-"} />
              <HeaderAndValue Title={item.device || "-"} />
              <HeaderAndValue Title={item.product_id || "-"} />
              <HeaderAndValue Title={item.user_car_model_id || "-"} />
              <HeaderAndValue Title={item.end_date || "-"} />
              <HeaderAndValue
                Title={new Date(item.created_at).toLocaleString()}
              />
              <HeaderAndValue
                Title={new Date(item.updated_at).toLocaleString()}
              />
              <td className="border px-4 py-2">
                {/* <button
                  onClick={() => {
                    // Mock navigation - in real app use navigate
                    console.log('Navigate to details with actuation data:', item);
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  View Details
                </button> */}

                <button
                  onClick={() =>
                    navigate("/ActuationsDetail/details", {
                      state: {
                        ScanArray: item.scanResArray,   // adjust if your field name is different
                        created_at: item.created_at,
                        updated_at: item.updated_at,
                        email: item.user_email,
                        make: item.make,
                        model: item.model,
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

export default ActuationsDetail;