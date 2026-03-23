import React, { useEffect, useState, useRef } from "react";
import TableHead from "../ReusedCompontets/TableHead"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 30;

const columns = [
    "Name",
    "model",
    "make",
    "Header",
    "Sub Header",
    "PIN",
    "Protocol",
    "Formula Based",
    "Formula (Metric)",
    "Formula (Imperial)",
    "Unit (Metric)",
    "Unit (Imperial)",
    "Reference JSON"
];

const LiveDateCommands: React.FC = () => {
    const [liveData, setLiveData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [make, setMake] = useState<string>("");
    const [model, setModel] = useState<string>("");
    const [module, setModule] = useState<string>("");


    const [page, setPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(0);

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchLiveData = async (
        targetPage: number = 1,
        searchMake: string = "",
        searchModel: string = "",
        searchModule: string = ""
    ) => {
        
        
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError("");

        try {
            // Build URL parameters
            const params = new URLSearchParams({
                limit: ITEMS_PER_PAGE.toString(),
                page: targetPage.toString()
            });

            if (searchMake.trim()) params.append('make', searchMake.trim());
            if (searchModel.trim()) params.append('model', searchModel.trim());
            if (searchModule.trim()) params.append('module', searchModule.trim());

            const url = `${API_BASE_URL}api/LiveDataCommands?${params.toString()}`;
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
                
                setLiveData(result.data);
                setTotal(result.total || 0);
                setPage(targetPage);
                
                if (result.data.length === 0) {
                    setError(searchMake || searchModel || searchModule 
                        ? "No live data found for the specified criteria." 
                        : "No live data available."
                    );
                }
            } else {
                console.error('❌ Invalid response structure:', result);
                setLiveData([]);
                setTotal(0);
                setError("Invalid response format from server");
            }

        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('🚫 Request aborted');
                return;
            }
            
            console.error("❌ Error fetching live data:", err);
            setLiveData([]);
            setTotal(0);
            setError("Failed to fetch live data. Please try again.");
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
            console.log('✨ fetchLiveData completed');
        }
    };

    // Initial load
    useEffect(() => {
        fetchLiveData(1, "", "", "");
    }, []);

    // Search handler
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLiveData(1, make, model, module);
    };

    // Page change handler
    const handlePageChange = (newPage: number) => {
        console.log('🔄 Page change requested:', { 
            newPage, 
            currentPage: page, 
            make, 
            model, 
            module,
            totalPages: Math.ceil(total / ITEMS_PER_PAGE)
        });
        fetchLiveData(newPage, make, model, module);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    // Simple pagination - show up to 5 pages
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
            <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
                Live Details
            </h1>

            {/* Search Form */}
            <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                        value={module}
                        onChange={(e) => setModule(e.target.value)}
                        placeholder="Module"
                        className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Fetch"}
                    </button>
                </form>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-center py-4 text-lg">{error}</p>}

            {/* Content */}
            <div className="flex-1 overflow-auto space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-blue-500 text-xl">Loading live data...</p>
                            <p className="text-gray-500 mt-2">Please wait while we fetch the data</p>
                        </div>
                    </div>
                ) : liveData.length > 0 ? (
                    <div className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-blue-700">
                                Live Data Results
                            </h2>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {liveData.length} items
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border">
                                <TableHead columns={columns} />
                                <tbody>
                                    {liveData.map((item, idx) => (
                                        <tr key={`${item.id || idx}`} className="hover:bg-gray-50">
                                            <td className="border px-3 py-2">
                                                {item.name || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.model || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.make || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.header || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.subHeader || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.pid || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.protocol || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.formulaBased || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.formula_metric || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.formula_imperial || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.unit_metric || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.unit_imperial || "-"}
                                            </td>
                                            <td className="border px-3 py-2">
                                                {item.referenceJSON ? JSON.stringify(item.referenceJSON): "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : !error && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-xl">No live data to display</p>
                        <p className="text-gray-400 mt-2">Try searching with different criteria</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
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
                                        ? "bg-blue-600 text-white"
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

            {/* Stats */}
            {total > 0 && (
                <div className="text-center text-sm text-gray-500 mt-2 bg-white rounded-lg p-4 border">
                    <div className="flex flex-wrap justify-center items-center gap-6">
                        <span>📄 Page {page} of {totalPages}</span>
                        <span>📊 Total Items: {total}</span>
                        <span>🔧 Current Page Items: {liveData.length}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveDateCommands;