import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Bug, 
  TrendingUp,
  ShieldCheck,
  FileUp,
  Activity,
  History,
  Info,
  Trash2,
  ChevronRight
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';

interface UploadResponse {
  message: string;
  stats?: {
    totalRowsProcessed: number;
    insertedCount: number;
    skippedCount: number;
    deletedCount: number;
    processingTimeMs: number;
    rowsPerSecond: number;
    fileName: string;
    fileSize: number;
    companyId: number;
    worksheetName: string;
  };
}

const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL || '';

const FaultCodesUploader2: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [stats, setStats] = useState<UploadResponse['stats'] | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && (
      selectedFile.name.endsWith('.xlsx') || 
      selectedFile.name.endsWith('.xls')
    )) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setMessage('');
      setStats(null);
    } else {
      setMessage('Invalid protocol. Please select an Excel manifest (.xlsx or .xls)');
      setUploadStatus('error');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('No diagnostic manifest identified for ingestion');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${API_BASE_URL}api/faultCodes`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data: UploadResponse = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setMessage(data.message || 'Diagnostic database synchronized successfully');
        setStats(data.stats || null);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus('error');
        setMessage(data.message || 'Synchronization failure');
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage('Transmission error during database update cycle');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB'][i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="DTC Registry Ingestion" 
        subtitle="Upload and correlate global diagnostic fault codes with repair intelligence"
        icon={Bug}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title="Database Manifest Upload" icon={FileUp}>
            <div
              className={`relative border-2 border-dashed rounded-[32px] p-12 text-center transition-all duration-300 ${
                isDragOver 
                  ? 'border-primary-400 bg-primary-50/50' 
                  : file 
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 bg-slate-50/50 hover:border-primary-300 hover:bg-white'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-6">
                {file ? (
                  <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center animate-bounce-slow">
                    <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center">
                    <Upload className="w-10 h-10 text-primary-500" />
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">
                    {file ? file.name : "Drop DTC manifest or browse"}
                  </h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    {file ? formatFileSize(file.size) : "Protocol: .xlsx, .xls (Max 50MB)"}
                  </p>
                </div>
                
                {!file ? (
                  <Button variant="secondary" onClick={handleBrowseClick} icon={Activity}>
                    Browse Registry
                  </Button>
                ) : (
                  <div className="flex gap-4">
                    <Button variant="primary" onClick={handleUpload} isLoading={isUploading} icon={ShieldCheck}>
                      Initiate Import
                    </Button>
                    <Button variant="secondary" onClick={() => setFile(null)} icon={Trash2}>
                      Purge
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {stats && uploadStatus === 'success' && (
            <Card title="Synchronization Intelligence" icon={TrendingUp} subtitle="DTC Ingestion Metrics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">New Entrants</p>
                  <div className="text-3xl font-black text-emerald-700">{stats.insertedCount}</div>
                  <p className="text-xs text-emerald-500 mt-1 font-bold italic">Records defined</p>
                </div>
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Redundancy Filter</p>
                  <div className="text-3xl font-black text-amber-700">{stats.skippedCount}</div>
                  <p className="text-xs text-amber-500 mt-1 font-bold italic">Duplicates bypassed</p>
                </div>
                <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Total Throughput</p>
                  <div className="text-3xl font-black text-primary-700">{stats.totalRowsProcessed}</div>
                  <p className="text-xs text-primary-500 mt-1 font-bold italic">Rows synchronized</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">Process Velocity</span>
                  <span className="text-sm font-black text-slate-700">{stats.rowsPerSecond} records/sec</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">Latency</span>
                  <span className="text-sm font-black text-slate-700">{formatTime(stats.processingTimeMs)}</span>
                </div>
              </div>
            </Card>
          )}

          {message && (
            <div className={`p-6 rounded-[24px] border flex items-center gap-4 animate-fadeIn ${
              uploadStatus === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                : 'bg-rose-50 text-rose-800 border-rose-100'
            }`}>
              {uploadStatus === 'success' ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <span className="font-bold italic">{message}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card title="Protocol Definition" icon={Info}>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Manifest Schema:</p>
              <div className="space-y-2">
                {[
                  { label: 'DTC', desc: 'Diagnostic Code Identifier' },
                  { label: 'Title', desc: 'Fault Description' },
                  { label: 'Severity', desc: 'Priority Index (1-5)' },
                  { label: 'Difficulty', desc: 'Repair Complexity' },
                  { label: 'Make', desc: 'Target Manufacturer' },
                  { label: 'Generic', desc: 'Global Protocol Flag' }
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} className="text-primary-500" />
                      <span className="text-[10px] font-black text-slate-600 uppercase">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 italic">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Transmission History" icon={History}>
             <div className="text-center py-8">
                <History className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-[11px] font-bold text-slate-400 italic px-4">Session logs are synchronized automatically with the global telemetry cluster.</p>
             </div>
          </Card>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};

export default FaultCodesUploader2;