import React, { useEffect, useState } from "react";
import { 
  Car, 
  Search, 
  Download, 
  ChevronRight, 
  Box,
  Filter,
  Activity,
  Layers,
  Database,
  XCircle
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";

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
      const url = `${API_BASE_URL}api/ModelList?make=${encodeURIComponent(trimmedMake)}`;
      const token = localStorage.getItem("token");
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const json = await response.json();

      if (Array.isArray(json.data) && json.data.length > 0) {
        const names = json.data.map((item: { name: string }) => item.name);
        setModelList(names);
      } else {
        setError("No model configurations identified for the specified manufacturer.");
      }
    } catch (err) {
      setError("Failed to synchronize model registry.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (modelList.length === 0) return;

    const headers = ['S.No', 'Manufacturer', 'Model Variant'];
    let csvContent = headers.join(',') + '\n';
    
    modelList.forEach((model, index) => {
      const row = [index + 1, selectedMake, model];
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
    const filename = `ModelRegistry_${selectedMake}_${dateStr}.csv`;

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
    fetchModels();
  }, [selectedMake]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="Model Configuration Index" 
        subtitle="Comprehensive database of specialized vehicle models and factory variants"
        icon={Layers}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search & Statistics Side */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Manufacturer Query" icon={Search}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchModels();
              }}
              className="space-y-6"
            >
              <Input
                label="Selected Manufacturer"
                placeholder="e.g. Mahindra, Ford, Tata"
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                icon={Box}
              />
              <Button 
                variant="primary" 
                className="w-full h-11 shadow-lg shadow-primary-200" 
                type="submit" 
                isLoading={loading}
                icon={Activity}
              >
                Scan Registry
              </Button>
            </form>
          </Card>

          <Card title="Variant Controls" icon={Filter}>
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-400 italic">Export current manufacturer variant dataset:</p>
              <Button
                variant="secondary"
                className="w-full h-11"
                onClick={downloadExcel}
                disabled={modelList.length === 0 || loading}
                icon={Download}
              >
                Export CSV Manifest
              </Button>
            </div>
          </Card>
        </div>

        {/* Results Side */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-[32px] border border-slate-100 p-24 text-center">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-400 font-black italic tracking-widest animate-pulse uppercase">Correlating Model Architecture...</p>
            </div>
          ) : modelList.length > 0 ? (
            <Card 
                title={`${selectedMake} Variant Matrix`} 
                icon={Car} 
                noPadding 
                subtitle={`Identified Configurations: ${modelList.length}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-50">
                {modelList.map((model, index) => (
                  <div key={model} className="bg-white p-5 flex items-center justify-between group hover:bg-primary-50/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-300 text-xs group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <span className="font-black text-slate-700 tracking-tight">{model}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-primary-400 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 p-24 text-center">
              <Database size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold italic">No model profiles found for "{selectedMake}"</p>
            </div>
          )}
          
          {error && (
            <div className="mt-6 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-600 font-bold text-sm animate-shake">
              <XCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelListPage;