import React, { useEffect, useState } from "react";
import { 
  Bike, 
  Search, 
  Download, 
  ChevronRight, 
  Database,
  Filter,
  Activity,
  Layout
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";

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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        setError("No manufacturers identified in this segment.");
      }
    } catch (err) {
      setBikeMakes([]);
      setError("Failed to synchronize manufacturer registry.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (bikeMakes.length === 0) return;

    const headers = ['S.No', 'Segment', 'Make Name'];
    let csvContent = headers.join(',') + '\n';
    
    bikeMakes.forEach((make, index) => {
      const row = [index + 1, segment, make];
      const escapedRow = row.map(value => {
        const str = String(value);
        if (str.includes(',') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvContent += escapedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `ManufacturerRegistry_${segment}_${dateStr}.csv`;

    const nav: any = navigator;
    if (typeof nav.msSaveBlob === "function") {
      nav.msSaveBlob(blob, filename);
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
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="Manufacturer Registry" 
        subtitle="Global directory of supported manufacturers and diagnostic segments"
        icon={Layout}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search & Filter Side */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Segment Filter" icon={Filter}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchBikeMakes();
              }}
              className="space-y-6"
            >
              <Input
                label="System Segment"
                placeholder="e.g. bike, car, truck"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                icon={Search}
              />
              <Button 
                variant="primary" 
                className="w-full h-11" 
                type="submit" 
                isLoading={loading}
                icon={Activity}
              >
                Refresh Registry
              </Button>
            </form>
          </Card>

          <Card title="Registry Actions" icon={Database}>
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-400 italic">Export the current segment registry to local storage:</p>
              <Button
                variant="secondary"
                className="w-full h-11"
                onClick={downloadExcel}
                disabled={bikeMakes.length === 0 || loading}
                icon={Download}
              >
                Export CSV
              </Button>
            </div>
          </Card>
        </div>

        {/* Results Side */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-[32px] border border-slate-100 p-24 text-center">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-400 font-black italic tracking-widest animate-pulse uppercase">Synchronizing Repository...</p>
            </div>
          ) : bikeMakes.length > 0 ? (
            <Card title="Synchronized Manufacturers" icon={Bike} noPadding subtitle={`Total Identifiers: ${bikeMakes.length}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-50">
                {bikeMakes.map((make, idx) => (
                  <div key={idx} className="bg-white p-5 flex items-center justify-between group hover:bg-primary-50/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-300 text-xs group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <span className="font-black text-slate-700 tracking-tight">{make}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-primary-400 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 p-24 text-center">
              <Database size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold italic">No manufacturer profiles found for segment "{segment}"</p>
            </div>
          )}
          
          {error && (
            <div className="mt-6 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-600 font-bold text-sm animate-shake">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const XCircle = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
  </svg>
);

export default BikeMakeList;