import React, { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ModelListPage: React.FC = () => {
  const [selectedMake, setSelectedMake] = useState<string>("Mahindra");
  const [modelList, setModelList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchModels = async () => {
    if (!selectedMake) return;

    setLoading(true);
    setError("");
    setModelList([]);

    try {
      const trimmedMake = selectedMake.trim();
      const url = `${API_BASE_URL}api/ModelList?make=${encodeURIComponent(
        trimmedMake
      )}`;
      console.log("Fetching models from:", url);
      const token = localStorage.getItem("token");
      const response = await fetch(url,{
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const json = await response.json();
      console.log("API Response:", json);

      if (Array.isArray(json.data) && json.data.length > 0) {
        const names = json.data.map((item: { name: string }) => item.name);
        setModelList(names);
      } else {
        setError("No models found for the entered make.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch model list. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Excel download function
  const downloadExcel = () => {
    if (modelList.length === 0) return;

    // Prepare data for CSV
    const excelData = modelList.map((model, index) => ({
      'S.No': index + 1,
      'Make': selectedMake,
      'Model Name': model
    }));

    // Create CSV content
    const headers = ['S.No', 'Make', 'Model Name'];
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
    
    // Generate filename with current date and make
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `Model_List_${selectedMake}_${dateStr}.csv`;

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

  useEffect(() => {
    fetchModels();
  }, [selectedMake]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
        Model List Viewer
      </h1>

      {/* Search Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault(); 
              fetchModels(); 
            }}
            className="flex flex-col md:flex-row items-center gap-4"
          >
            <label className="font-medium text-gray-700">Enter Make:</label>
            <input
              type="text"
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="border px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              placeholder="Type a make (e.g., Mahindra)"
            />
            <button
              type="submit" // ✅ pressing Enter will submit the form
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Fetch Models"}
            </button>
          </form>
        </div>


        {/* Download Excel Button */}
        <div className="flex justify-end">
          <button
            className="bg-blue-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition flex items-center gap-2"
             onClick={downloadExcel}
            disabled={modelList.length === 0 || loading}
            title={modelList.length === 0 ? "No data available to download" : "Download CSV file"}
          >
           
            Download Excel 
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-blue-500 text-center flex items-center justify-center gap-2 py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-lg">Loading models...</span>
        </div>
      )}

      {/* Error State */}
      {error && <p className="text-red-500 text-center py-4 text-lg">{error}</p>}

      {/* Model List Display */}
      {!loading && modelList.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Models for {selectedMake}
            </h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {modelList.length} models found
            </span>
          </div>
          
          {/* Grid Layout for Models */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {modelList.map((model, index) => (
              <div
                key={model}
                className="bg-gray-50 border rounded-lg p-3 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium min-w-[24px] text-center">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 font-medium">{model}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && modelList.length === 0 && (
        <div className="text-center py-20">
          <div className="text-gray-400 text-6xl mb-4">🚗</div>
          <p className="text-gray-500 text-xl">No models available</p>
          <p className="text-gray-400 mt-2">Try searching with a different make</p>
        </div>
      )}
    </div>
  );
};

export default ModelListPage;