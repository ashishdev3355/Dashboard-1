import  { useEffect, useState, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 30;

const columns = [
    "ID",
    "DTC",
    "Causes",
    "Language",
    "Make",
    "Company ID",
    "Generic"
];

const FaultCodeCauses = () => {
    const [causesData, setCausesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [dtc, setDtc] = useState("");
    const [make, setMake] = useState("");
    const [generic, setGeneric] = useState("");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchCausesData = async (
        targetPage = 1,
        searchDtc = "",
        searchMake = "",
        searchGeneric = ""
    ) => {
        console.log('🔍 fetchCausesData called with:', { targetPage, searchDtc, searchMake, searchGeneric });
        
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                limit: ITEMS_PER_PAGE.toString(),
                page: targetPage.toString()
            });

            if (searchDtc.trim()) params.append('dtc', searchDtc.trim());
            if (searchMake.trim()) params.append('make', searchMake.trim());
            if (searchGeneric !== "") params.append('generic', searchGeneric);

            const url = `${API_BASE_URL}api/FaultCodeCauses?${params.toString()}`;
            console.log('📡 Making API call to:', url);
            
            const token = localStorage.getItem("token");

            const response = await fetch(url, {
                signal: abortControllerRef.current.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            console.log('📥 Response status:', response.status, response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ API Response:', result);

            if (result && Array.isArray(result.data)) {
                console.log('📊 Setting data:', {
                    dataLength: result.data.length,
                    total: result.total,
                    targetPage
                });
                
                setCausesData(result.data);
                setTotal(result.total || 0);
                setPage(targetPage);
                
                if (result.data.length === 0) {
                    setError(searchDtc || searchMake || searchGeneric !== "" 
                        ? "No causes found for the specified criteria." 
                        : "No causes available."
                    );
                }
            } else {
                console.error('❌ Invalid response structure:', result);
                setCausesData([]);
                setTotal(0);
                setError("Invalid response format from server");
            }

        } catch (err:any) {
            if (err.name === 'AbortError') {
                console.log('🚫 Request aborted');
                return;
            }
            
            console.error("❌ Error fetching causes data:", err);
            setCausesData([]);
            setTotal(0);
            setError("Failed to fetch fault code causes. Please try again.");
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
            console.log('✨ fetchCausesData completed');
        }
    };

    useEffect(() => {
        fetchCausesData(1, "", "", "");
    }, []);

    const handleSearch = (e:any) => {
        e.preventDefault();
        fetchCausesData(1, dtc, make, generic);
    };

    const handlePageChange = (newPage:any) => {
        console.log('🔄 Page change requested:', { 
            newPage, 
            currentPage: page, 
            dtc, 
            make, 
            generic,
            totalPages: Math.ceil(total / ITEMS_PER_PAGE)
        });
        fetchCausesData(newPage, dtc, make, generic);
    };

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const getVisiblePages = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, page - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);
            
            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    return (
        <div className="min-h-screen flex flex-col p-6 max-w-full mx-auto">
            <h1 className="text-3xl font-bold text-center text-orange-700 mb-6">
                Fault Code Causes
            </h1>

            <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                        type="text"
                        value={dtc}
                        onChange={(e) => setDtc(e.target.value)}
                        placeholder="DTC Code (e.g., P2453)"
                        className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                        type="text"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Make (e.g., Audi)"
                        className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <select
                        value={generic}
                        onChange={(e) => setGeneric(e.target.value)}
                        className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">All (Generic/Non-Generic)</option>
                        <option value="true">Generic Only</option>
                        <option value="false">Non-Generic Only</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Search"}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 text-center py-4 text-lg">{error}</p>}

            <div className="flex-1 overflow-auto space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                            <p className="text-orange-500 text-xl">Loading causes...</p>
                            <p className="text-gray-500 mt-2">Please wait while we fetch the data</p>
                        </div>
                    </div>
                ) : causesData.length > 0 ? (
                    <div className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-orange-700">
                                Causes Results
                            </h2>
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                {causesData.length} items
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border">
                                <thead className="bg-gray-100">
                                    <tr>
                                        {columns.map((col) => (
                                            <th key={col} className="border px-3 py-2 text-left font-semibold">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {causesData.map((item:any, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-gray-50">
                                            <td className="border px-3 py-2">
                                                {item.id || "-"}
                                            </td>
                                            <td className="border px-3 py-2 font-mono font-semibold text-orange-600">
                                                {item.dtc || "-"}
                                            </td>
                                            <td className="border px-3 py-2 max-w-md">
                                                <div className="text-gray-700 leading-relaxed">
                                                    {item.causes || "-"}
                                                </div>
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.language || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.make || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.company_id || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.generic 
                                                        ? "bg-orange-100 text-orange-800" 
                                                        : "bg-gray-100 text-gray-800"
                                                }`}>
                                                    {item.generic ? "Yes" : "No"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : !error && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-xl">No causes data to display</p>
                        <p className="text-gray-400 mt-2">Try searching with different criteria</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1 || loading}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                    >
                        Previous
                    </button>

                    <div className="flex gap-2">
                        {getVisiblePages().map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                disabled={loading}
                                className={`px-3 py-2 rounded transition ${
                                    page === pageNum
                                        ? "bg-orange-600 text-white"
                                        : "bg-gray-200 hover:bg-gray-300"
                                } disabled:opacity-50`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages || loading}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                    >
                        Next
                    </button>
                </div>
            )}

            {total > 0 && (
                <div className="text-center text-sm text-gray-500 mt-2 bg-white rounded-lg p-4 border">
                    <div className="flex flex-wrap justify-center items-center gap-6">
                        <span>📄 Page {page} of {totalPages}</span>
                        <span>📊 Total Items: {total}</span>
                        <span>🔧 Current Page Items: {causesData.length}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaultCodeCauses;