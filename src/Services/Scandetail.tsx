import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import HeaderAndValue from "../ReusedCompontets/HeaderAndValue"
import { useNavigate } from "react-router-dom";

interface DecodedArrayItem {
  pid: string;
  data: string;
  decodedFaultArray: Record<string, string>;
  header: string;
  protocol: string;
  system: string;
}

interface ScanResItem {
  data: string;
  header: string;
  make: string;
  pid: string;
  protocol: string;
  system: string;
}

interface ScanItem {
  id: number;
  scan_id : number;
  email: string;
  model: string;
  vin: string;
  license_plate: string;
  scan_ended: string;
  make: string;
  function: string;
  type: string;
  country_id: number;
  scan_end_time: string;
  scan_start_time: string;
  app_version: string;
  pdf_report: string;
  scanResArray: ScanResItem[] | null;
  decodedArray: DecodedArrayItem[] | null;
}

interface Filters {
  email: string;
  make: string;
  model: string;
  license_plate: string;
  country_id: string;
  scan_start_time: string;
  scan_end_time: string;
  type: string;
  app_version: string;
}

const ITEMS_PER_PAGE = 30;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

const Scandetail = () => {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    email: '',
    make: '',
    model: '',
    license_plate: '',
    country_id: '',
    scan_start_time: '',
    scan_end_time: '',
    type: '',
    app_version: '',
  });
  
  // Initialize page from sessionStorage
  const [page, setPage] = useState(() => {
    const savedPage = sessionStorage.getItem('scanDetailPage');
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  
  const [total, setTotal] = useState(0);

  const navigate = useNavigate(); 

  // Save page to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('scanDetailPage', page.toString());
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...filters,
      });
      const token =  localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/ScanDetail?${params.toString()}`,{
         headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch scan report');

      const json = await response.json();
      if (json && Array.isArray(json.scans)) {
        setScans(json.scans);
        setTotal(json.total || 0);
        
        // Cache the data in sessionStorage
        sessionStorage.setItem('scanDetailCache', JSON.stringify({
          scans: json.scans,
          total: json.total || 0,
          page: page,
          filters: filters,
          timestamp: Date.now()
        }));
        console.log('💾 Cached scan data');
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
      
      const params = new URLSearchParams({
        ...filters,
      });
      
      const response = await fetch(`${API_BASE_URL}api/ScanDetail?${params.toString()}`);
      
      if (!response.ok) throw new Error('Failed to fetch scan report');
      
      const json = await response.json();
      
      if (json && Array.isArray(json.scans) && json.scans.length > 0) {
        const excelData = json.scans.map((scan: ScanItem) => ({
          'Email': scan.email,
          'Start Time': new Date(scan.scan_start_time).toLocaleString(),
          'End Time': new Date(scan.scan_end_time).toLocaleString(),
          'Model': scan.model,
          'License Plate': scan.license_plate,
          'VIN': scan.vin,
          'Scan Ended': scan.scan_ended,
          'Make': scan.make,
          'Country': scan.country_id,
          'Function': scan.function,
          'Type': scan.type,
          'App Version': scan.app_version,
          'PDF Report': scan.pdf_report || 'No Report'
        }));
        
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scan Details');
        
        const filename = `Scan_Details_${filters.make || 'All'}_${filters.email || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
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

  // ✅ Restore scroll position after data loads
  useEffect(() => {
    if (!loading && scans.length > 0) {
      // Check if we're returning from details page
      const returningFromDetails = sessionStorage.getItem('returningToScanPage');
      
      // Use a unique key for this page
      const savedScrollPosition = sessionStorage.getItem('scanDetailPage_ScrollPosition');
      console.log('Raw saved position from storage:', savedScrollPosition);
      console.log('Returning from details?', returningFromDetails);
      
      if (returningFromDetails === 'true') {
        
        if (savedScrollPosition && savedScrollPosition !== '0') {
          const scrollPos = parseInt(savedScrollPosition, 10);
          console.log('🎯 Restoring scroll position:', scrollPos);
          
          if (scrollPos > 0) {
            // Multiple attempts to ensure scroll happens
            const scrollAttempts = [0, 50, 100, 200, 300, 400, 500];
            scrollAttempts.forEach(delay => {
              setTimeout(() => {
                window.scrollTo(0, scrollPos);
                console.log('Scrolled at', delay, 'ms, current position:', window.scrollY);
              }, delay);
            });
            
            // Clear the flag after restoration is complete
            setTimeout(() => {
              sessionStorage.removeItem('returningToScanPage');
              console.log('✅ Cleared returningToScanPage flag after restoration');
            }, 600);
          }
        } else {
          sessionStorage.removeItem('returningToScanPage');
        }
      } else {
        console.log('Not returning from details - starting at top');
      }
    }
  }, [loading, scans]);


  
  // ✅ Save scroll position on scroll
  useEffect(() => {
    let timeoutId: number;
    let hasRestoredScroll = false;
    
    // Mark that this component is active
    sessionStorage.setItem('activePage', 'scanDetailPage');
    
    // Check if we're returning from details page
    const returningFromDetails = sessionStorage.getItem('returningToScanPage');
    if (returningFromDetails === 'true') {
      hasRestoredScroll = false; // Will be set to true after restoration
      console.log('🔄 Component mounted - returning from details, will restore scroll');
    }
    
    const handleScroll = () => {
      // Debounce scroll saves
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollPos = window.scrollY;
        const activePage = sessionStorage.getItem('activePage');
        const stillReturning = sessionStorage.getItem('returningToScanPage');
        
        // Don't save if:
        // 1. This page is not active
        // 2. We're still in the process of returning from details (within first 500ms)
        // 3. We're loading data
        if (activePage === 'scanDetailPage' && stillReturning !== 'true' && !loading) {
          sessionStorage.setItem('scanDetailPage_ScrollPosition', scrollPos.toString());
          console.log('ScanDetail Auto-saved scroll position:', scrollPos);
        } else {
          console.log('Skipping auto-save - returning from details or loading:', { stillReturning, loading });
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      
      // Check BOTH flags - navigating to details OR returning from details
      const navigatingToDetails = sessionStorage.getItem('navigatingToDetails');
      const returningFromDetails = sessionStorage.getItem('returningToScanPage');
      
      console.log('Unmount - navigatingToDetails flag:', navigatingToDetails);
      console.log('Unmount - returningToScanPage flag:', returningFromDetails);
      
      if (navigatingToDetails === 'true' || returningFromDetails === 'true') {
        console.log('✅ Skipping unmount save - preserving position');
      } else {
        // Only save if genuinely leaving the scan detail page
        const finalScrollPos = window.scrollY;
        console.log('💾 Saving on unmount (leaving page):', finalScrollPos);
        if (finalScrollPos > 0) {
          sessionStorage.setItem('scanDetailPage_ScrollPosition', finalScrollPos.toString());
        }
      }
    };
  }, [loading]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // ✅ Handle navigation and save scroll
  const handleViewDetails = (scan: ScanItem) => {
    // Mark that we're navigating to details page
    sessionStorage.setItem('navigatingToDetails', 'true');
    sessionStorage.setItem('activePage', 'detailsPage');
    
    // Save current scroll position with unique key for this page
    const currentScroll = window.scrollY;
    sessionStorage.setItem('scanDetailPage_ScrollPosition', currentScroll.toString());
    console.log('Saving scroll position on button click:', currentScroll);
    
    // Verify it was saved
    setTimeout(() => {
      const verification = sessionStorage.getItem('scanDetailPage_ScrollPosition');
      console.log('Verification - position in storage:', verification);
    }, 10);
    
    navigate(`/ObdScanReport/details/${scan.id}`, {
    // navigate(`/ObdScanReport/details`, {
      state: {
        ScanArray: scan.scanResArray,
        DecodeArray: scan.decodedArray,
        start_time: scan.scan_start_time,
        end_time: scan.scan_end_time,
        license_plate: scan.license_plate,
        email: scan.email,
        App_version: scan.app_version,
        scan_ended: scan.scan_ended,
        functiones: scan.function,
        type: scan.type,
      },
    });
  };

  return (
    <div className="p-4 ml-8">
      <h2 className="text-xl font-bold mb-4">Scan Details</h2>
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex flex-col gap-4 mb-6">
        <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              sessionStorage.removeItem('scanDetailPage_ScrollPosition');
              fetchData();
            }}
          >
            <div className="flex flex-wrap gap-4">
              {Object.keys(filters).map((key) => (
                <input
                  key={`filter-${key}`}
                  type={
                    key.includes("time")
                      ? "date"
                      : key === "country_id"
                      ? "number"
                      : "text"
                  }
                  placeholder={key}
                  className="border border-gray-300 px-4 py-2 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters[key as keyof Filters]}
                  onChange={(e) =>
                    handleFilterChange(key as keyof Filters, e.target.value)
                  }
                />
              ))}

              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-all"
              >
                Filter
              </button>
            </div>
          </form>

        <div className="flex justify-center">
          <button
            onClick={downloadExcel}
            disabled={loading || scans.length === 0}
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

      <table className="min-w-full bg-white border border-gray-200 text-sm">
        <thead>
          <tr>
            <HeaderAndValue header={true} Title="Email" />
            <HeaderAndValue header={true} Title="Start Time" />
            <HeaderAndValue header={true} Title="End Time" />
            <HeaderAndValue header={true} Title="Model" />
            <HeaderAndValue header={true} Title="License Plate" />
            <HeaderAndValue header={true} Title="VIN" />
            <HeaderAndValue header={true} Title="Scan Ended" />
            <HeaderAndValue header={true} Title="Make" />
            <HeaderAndValue header={true} Title="Country" />
            <HeaderAndValue header={true} Title="Funtion" />
            <HeaderAndValue header={true} Title="Type" />
            <HeaderAndValue header={true} Title="App Version" />
            <HeaderAndValue header={true} Title="PDF Report" />
            <HeaderAndValue header={true} Title="Show" />
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr key={`scan-${scan.id}`}>
              <HeaderAndValue Title={scan.email} />
              <HeaderAndValue Title={new Date(scan.scan_start_time).toLocaleString()} />
              <HeaderAndValue Title={new Date(scan.scan_end_time).toLocaleString()} />
              <HeaderAndValue Title={scan.model} />
              <HeaderAndValue Title={scan.license_plate} />
              <HeaderAndValue Title={scan.vin} />
              <HeaderAndValue Title={scan.scan_ended} />
              <HeaderAndValue Title={scan.make} />
              <HeaderAndValue Title={scan.country_id} />
              <HeaderAndValue Title={scan.function} />
              <HeaderAndValue Title={scan.type} />
              <HeaderAndValue Title={scan.app_version} />
              <td className="border px-4 py-2">
                {scan.pdf_report ? (
                  <a
                    href={scan.pdf_report}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    View Report
                  </a>
                ) : (
                  'No Report'
                )}
              </td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => handleViewDetails(scan)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center space-y-4">
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
                key={`page-${pageNum}`}
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

          <p className="text-gray-600 text-sm">
            Showing page {page} of {totalPages || 1} ({total} total items)
          </p>
        </div>
      )}
    </div>
  );
};

export default Scandetail;



