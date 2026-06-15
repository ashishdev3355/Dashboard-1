import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface User {
  [key: string]: string | number | boolean | null;
}

interface Filters {
  email: string;
  plan: string;
  status: string;
}

const ITEMS_PER_PAGE = 20; 

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>({ email: '', plan: '', status: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.email) params.append('email', filters.email);
      if (filters.plan) params.append('plan', filters.plan);
      if (filters.status) params.append('status', filters.status);

     
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

       const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/users?${params.toString()}`,{
         headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotal(data.total || 0); 
    } catch (err) {
      console.error('Fetch error:', err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Excel download function
  const downloadExcel = async () => {
    try {
      setLoading(true);
      
      // Fetch all data without pagination
      const params = new URLSearchParams();
      if (filters.email) params.append('email', filters.email);
      if (filters.plan) params.append('plan', filters.plan);
      if (filters.status) params.append('status', filters.status);
      
      // Don't add page and limit to get all data
      const response = await fetch(`${API_BASE_URL}api/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.users && data.users.length > 0) {
        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(data.users);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        
        // Generate filename
        const filename = `Users_${filters.email || 'All'}_${filters.plan || 'All'}_${filters.status || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
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
    fetchUsers();
  }, [page]); // ✅ page बदलते ही API call होगी

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
    <div className="flex min-h-screen bg-gray">
      <div className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 ml-6">User List</h2>

        {/* Filters and Buttons */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Filters row */}
          {/* <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Email"
              className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Plan"
              className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
            />
            <input
              type="text"
              placeholder="Status"
              className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            />
            <button
              onClick={() => { setPage(1); fetchUsers(); }}
              className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-all"
            >
              Filter
            </button>
          </div> */}

          <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchUsers();
          }}
          >
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Email"
            className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Plan"
            className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.plan}
            onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
          />
          <input
            type="text"
            placeholder="Status"
            className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-all"
          >
            Filter
          </button>
        </div>
      </form>

          
          {/* Excel Download Button */}
          <div className="flex">
            <button
              onClick={downloadExcel}
              disabled={loading || users.length === 0}
              className="bg-blue-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3.293 7.707A1 1 0 014 7h3V3a1 1 0 011-1h4a1 1 0 011 1v4h3a1 1 0 01.707 1.707l-7 7a1 1 0 01-1.414 0l-7-7z"/>
              </svg>
              Download Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <p className="p-4 text-gray-500">Loading...</p>
          ) : error ? (
            <p className="p-4 text-red-500">{error}</p>
          ) : users.length === 0 ? (
            <p className="p-4 text-gray-500">No users found.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(users[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-2 text-left text-gray-700 font-medium border-b border-gray-300 whitespace-nowrap"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(user).map((val, i) => (
                      <td
                        key={i}
                        className="px-4 py-2 border-b border-gray-200 text-gray-800 whitespace-nowrap"
                      >
                        {val === null || val === undefined ? '-' : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
      </div>
    </div>
  );
};

export default UsersTable;