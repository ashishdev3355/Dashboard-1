import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Key,
  ShieldCheck,
  FileUp,
  Trash2,
  Database,
  ChevronRight,
  Info
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';

interface UploadResponse {
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

const VEHICLE_MAKES = [
  'Ashok Leyland', 'Baic', 'Bajaj 3 Wheelers', 'Bajaj-Bikes', 'BMW', 'BMW Bikes', 'BYD',
  'Chery', 'Chevrolet', 'Citroen', 'Daewoo', 'Ducati Bikes', 'Fiat', 'Force Motors', 'Ford',
  'Geely', 'Geo', 'GMC', 'Great Wall', 'Haval', 'Honda', 'Honda Bikes', 'Husqvarna Bikes',
  'Hyundai', 'Infiniti', 'Isuzu', 'JAC Motors', 'Jeep', 'KTM- Bikes', 'Land Rover', 'Lexus',
  'MG', 'Mahindra', 'Mahindra 3 Wheelers', 'Maserati', 'Mercedes Benz', 'Mitsubishi', 'Nissan',
  'Opel', 'Other Bikes', 'Perodua', 'Peugeot', 'Piaggio 3 Wheelers', 'Piaggio Bikes', 'Proton',
  'Renault', 'Rover', 'Royal Enfield Bikes', 'Ssangyong', 'Subaru', 'Suzuki', 'Suzuki Bikes',
  'TVS 3 Wheelers', 'TVS Bikes', 'Tata', 'Tata EV', 'Toyota', 'Triumph Bikes', 'UAZ', 'VAZ',
  'Volkswagen', 'Volvo', 'Yamaha Bikes'
];

const Updatecommand: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && (
      selectedFile.name.endsWith('.xlsx') || 
      selectedFile.name.endsWith('.xls') || 
      selectedFile.name.endsWith('.csv')
    )) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setMessage('');
    } else {
      setMessage('Incompatible protocol. Use Excel (.xlsx, .xls) or CSV format.');
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
      setMessage('No command manifest identified for ingestion');
      setUploadStatus('error');
      return;
    }

    if (!sheetName.trim()) {
      setMessage('Target manufacturer segment is required');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheetName', sheetName.trim());
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}api/UpdatesCommands`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data: UploadResponse = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setMessage(data.message || 'Command synchronization complete');
        setFile(null);
        setSheetName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus('error');
        setMessage(data.message || 'Synchronization failure');
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage('Transmission error during command update cycle');
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
      <PageHeader 
        title="Command Architecture Update" 
        subtitle="Execute high-priority updates to global diagnostic command manifests"
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title="Manifest Transmission" icon={FileUp}>
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
                    {file ? file.name : "Drop command manifest or browse"}
                  </h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    {file ? formatFileSize(file.size) : "Protocol: .xlsx, .xls, .csv (Max 10MB)"}
                  </p>
                </div>
                
                {!file ? (
                  <Button variant="secondary" onClick={handleBrowseClick} icon={Database}>
                    Select Files
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setFile(null)} icon={Trash2}>
                    Purge Selection
                  </Button>
                )}
              </div>
            </div>
          </Card>

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
          <Card title="Target Classification" icon={Key}>
            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Manufacturer Segment</label>
                <select
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="h-12 w-full bg-slate-50 border-none rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none"
                  disabled={isUploading}
                >
                  <option value="">Select Target Make</option>
                  {VEHICLE_MAKES.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                className="w-full h-14 text-lg shadow-xl shadow-primary-200"
                onClick={handleUpload}
                disabled={!file || !sheetName.trim() || isUploading}
                isLoading={isUploading}
                icon={ShieldCheck}
              >
                Execute Update
              </Button>
            </div>
          </Card>

          <Card title="Protocol Definition" icon={Info}>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Manifest Schema:</p>
              <div className="grid grid-cols-2 gap-2">
                {['ActivationCode', 'Plan', 'Duration', 'Vehicle'].map(item => (
                  <div key={item} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <ChevronRight size={12} className="text-primary-500" />
                    <span className="text-[10px] font-black text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};

export default Updatecommand;