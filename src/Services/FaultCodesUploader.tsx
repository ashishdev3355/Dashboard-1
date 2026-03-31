import { useState, useCallback } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Database, 
  Trash2, 
  Eye, 
  Clock, 
  BarChart3,
  FileUp,
  ShieldCheck,
  Zap,
  Info,
  Activity
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/';

interface TableStats {
  inserted: number;
  duplicates: number;
  skipped: number;
  processingTime: number;
  duplicateDetails?: Array<{
    rowNumber: number;
    data: any;
    reason: string;
  }>;
  duplicateBreakdown?: {
    excelDuplicates: number;
    databaseDuplicates: number;
  };
}

interface UploadResult {
  success: boolean;
  message: string;
  stats?: {
    totalProcessingTime: number;
    totalRowsInserted: number;
    fileName: string;
    fileSize: number;
    performance?: {
      rowsPerSecond: number;
      improvement: string;
    };
  };
  summary?: {
    my_fault_codes: TableStats;
    my_fault_code_causes: TableStats;
    my_fault_code_symptoms: TableStats;
    my_fault_code_solutions: TableStats;
  };
  error?: string;
}

const FaultCodesUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Standard protocol requires Excel format (.xlsx or .xls)');
      return;
    }
    
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('Payload exceeds maximum allowable size (100MB)');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError('No source file identified for ingestion');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const token = localStorage.getItem("token");
      const endpoint = `${BASE_URL}api/FaultUplodes`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const contentType = response.headers.get('content-type');
      let result: UploadResult;

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        throw new Error(`System error: Protocol mismatch during transmission`);
      }

      if (response.ok && result.success) {
        setUploadResult(result);
        setFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.message || result.error || `Access point error: ${response.status}`);
      }
    } catch (err: any) {
      setError(err.message || 'Transmission failure during ingestion');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const resetUpload = () => {
    setUploadResult(null);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const StatBox = ({ title, data, icon: Icon, colorClass }: { title: string, data?: TableStats, icon: any, colorClass: string }) => (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
        <Icon className={`w-5 h-5 ${colorClass} opacity-40 group-hover:opacity-100 transition-opacity`} />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">Inserted</span>
          <code className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-black text-sm">{data?.inserted || 0}</code>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">Duplicates</span>
          <code className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg font-black text-sm">{data?.duplicates || 0}</code>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">Skipped</span>
          <code className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg font-black text-sm">{data?.skipped || 0}</code>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="Fault Intelligence Ingestion" 
        subtitle="Mass-import diagnostic datasets across structural diagnostic categories"
        icon={Database}
      />

      {!uploadResult ? (
        <div className="space-y-8">
          <Card title="Source Selection" icon={FileUp}>
            <div
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-primary-400 bg-primary-50/50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 bg-slate-50/50 hover:border-primary-300 hover:bg-white'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              
              {file ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto animate-bounce-slow">
                    <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">{file.name}</p>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{formatFileSize(file.size)}</p>
                  </div>
                  <Button variant="secondary" onClick={removeFile} disabled={uploading} icon={Trash2}>
                    Purge Selection
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto">
                    <Upload className="w-10 h-10 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">Drop system export or click to browse</p>
                    <p className="text-sm font-bold text-slate-400 mt-2 tracking-wide">Supports .xlsx and .xls protocol (Max 100MB)</p>
                  </div>
                </div>
              )}
            </div>

            {uploading && (
              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                  <span>Processing Diagnostic Stream...</span>
                  <span className="text-primary-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
                  <div
                    className="bg-primary-600 h-full rounded-full transition-all duration-300 shadow-sm shadow-primary-200"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Structural Guidance" icon={Info}>
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-500 leading-relaxed italic">System expects an Excel workbook with the following defined sheets:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <span className="text-xs font-black text-slate-600">fault_descriptions</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black text-slate-600">causes</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-black text-slate-600">symptoms</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-black text-slate-600">solutions</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex flex-col justify-center items-center p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
               <Button 
                variant="primary" 
                size="lg" 
                className="w-full max-w-xs h-14 text-lg" 
                onClick={uploadFile} 
                disabled={!file || uploading}
                isLoading={uploading}
                icon={ShieldCheck}
              >
                Execute Ingestion
              </Button>
              {error && (
                <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-sm animate-shake">
                  <XCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 text-center shadow-2xl shadow-emerald-100/50">
            <div className="w-20 h-20 bg-emerald-100 rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Ingestion Cycle Complete</h3>
            <p className="text-slate-500 font-bold italic">{uploadResult.message}</p>
            
            {uploadResult.stats && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <BarChart3 size={12} /> Total Records
                  </div>
                  <p className="text-2xl font-black text-emerald-600">{uploadResult.stats.totalRowsInserted}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <Clock size={12} /> Execution Time
                  </div>
                  <p className="text-2xl font-black text-primary-600">{formatDuration(uploadResult.stats.totalProcessingTime)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <FileSpreadsheet size={12} /> Payload Size
                  </div>
                  <p className="text-2xl font-black text-amber-600">{formatFileSize(uploadResult.stats.fileSize)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatBox title="Fault Codes" data={uploadResult.summary?.my_fault_codes} icon={Zap} colorClass="text-blue-500" />
            <StatBox title="Causal Hub" data={uploadResult.summary?.my_fault_code_causes} icon={AlertCircle} colorClass="text-emerald-500" />
            <StatBox title="Symptom Index" data={uploadResult.summary?.my_fault_code_symptoms} icon={Eye} colorClass="text-amber-500" />
            <StatBox title="Resolution Repository" data={uploadResult.summary?.my_fault_code_solutions} icon={ShieldCheck} colorClass="text-purple-500" />
          </div>

          <div className="flex justify-center pt-8">
            <Button variant="secondary" onClick={resetUpload} size="lg" icon={Upload}>
              Initiate New Cycle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaultCodesUploader;