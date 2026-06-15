import React, { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const BikeMakeList: React.FC = () => {
  const [bikeMakes, setBikeMakes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [segment, setSegment] = useState<string>("bike");

  const fetchBikeMakes = async () => {
    setLoading(true);
    setError("");

    try {
      const url = `${BASE_URL}api/FetchMakeList?segement=${segment}`;
      const token = localStorage.getItem("token");
      const response = await fetch(url,{
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      if (json.data && Array.isArray(json.data)) {
        const makes = json.data.map((item: { name: string }) => item.name);
        setBikeMakes(makes);
      } else {
        setBikeMakes([]);
        setError("No bike makes found.");
      }
    } catch (err) {
      console.error("Error fetching bike makes:", err);
      setBikeMakes([]);
      setError("Failed to fetch bike makes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSegment(e.target.value);
  };

  // Excel download function
  const downloadExcel = () => {
    if (bikeMakes.length === 0) return;

    // Prepare data for CSV
    const excelData = bikeMakes.map((make, index) => ({
      'S.No': index + 1,
      'Segment': segment,
      'Make Name': make
    }));

    // Create CSV content
    const headers = ['S.No', 'Segment', 'Make Name'];
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
    
    // Generate filename with current date and segment
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `Bike_Makes_${segment}_${dateStr}.csv`;

   

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
    fetchBikeMakes();
  }, [segment]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
        Bike Make List
      </h1>

      {/* <div className="mb-4">
        <label className="block text-gray-700">Enter Segment:</label>
        <input
          type="text"
          value={segment}
          onChange={handleSegmentChange}
          className="w-full p-2 mt-2 border border-gray-300 rounded"
        />
      </div>

      <button
        onClick={fetchBikeMakes}
        className="w-full bg-blue-500 text-white p-2 rounded mb-4"
      >
        Fetch Bike Makes
      </button> */}

      <form
        onSubmit={(e) => {
          e.preventDefault(); // prevent page refresh
          fetchBikeMakes();   // call your function
        }}
        className="mb-4"
      >
        <label className="block text-gray-700">Enter Segment:</label>
        <input
          type="text"
          value={segment}
          onChange={handleSegmentChange}
          className="w-full p-2 mt-2 border border-gray-300 rounded"
          placeholder="e.g. Sports"
        />

        <button
          type="submit" // ✅ Enter will trigger this
          className="w-full bg-blue-500 text-white p-2 rounded mt-4"
        >
          Fetch Bike Makes
        </button>
      </form>


      {/* Download Excel Button */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition flex items-center gap-2"
          onClick={downloadExcel}
          disabled={bikeMakes.length === 0 || loading}
          title={bikeMakes.length === 0 ? "No data available to download" : "Download CSV file"}
        >
         
           Download Excel
        </button>
      </div>

      {loading && <p className="text-blue-500 text-center">Loading bike makes...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && bikeMakes.length > 0 && (
        <div className="border border-gray-300 rounded p-4 shadow-sm">
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {bikeMakes.map((make, idx) => (
              <li key={idx}>{make}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BikeMakeList;