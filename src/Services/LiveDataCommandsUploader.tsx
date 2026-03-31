import { useState, useCallback } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Database, 
  Trash2,
  Activity,
  Zap,
  ShieldCheck,
  Info
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface DuplicateDetails {
    inFile: number;
    inDatabase: number;
    fileDuplicateDetails: string[];
    dbDuplicateCodes: string[];
}

interface UploadResult {
    success?: boolean;
    message: string;
    totalRows: number;
    importedRows: number;
    duplicates: DuplicateDetails;
}

const LiveDataCommandsUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState<boolean>(false);

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
            'application/vnd.ms-excel',
            'text/csv'
        ];

        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

        if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
            setError('Standardized protocol requires (.xlsx, .xls, or .csv)');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('Data payload exceeds 10MB limit');
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
            setError('No source telemetry identified for ingestion');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = `${BASE_URL}api/LiveDateCommandsUplode`;
            const token = localStorage.getItem("token");

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (response.status === 404) {
                throw new Error('System telemetry endpoint not identified');
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Incompatible server response protocol');
            }

            const result: UploadResult = await response.json();

            if (response.ok) {
                setUploadResult({ ...result, success: true });
                setFile(null);
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                throw new Error(result.message || `Protocol failure: ${response.status}`);
            }
        } catch (err: any) {
            setError(err.message || 'Transmission failure during telemetry ingestion');
        } finally {
            setUploading(false);
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
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB'][i];
    };

    const MetricBox = ({ title, value, icon: Icon, variant }: { title: string, value: number, icon: any, variant: 'primary' | 'success' | 'warning' | 'danger' }) => {
        const colorMap = {
            primary: 'text-primary-600 bg-primary-50 border-primary-100',
            success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            warning: 'text-amber-600 bg-amber-50 border-amber-100',
            danger: 'text-rose-600 bg-rose-50 border-rose-100'
        };
        return (
            <div className={`rounded-2xl border p-5 ${colorMap[variant]} group hover:shadow-lg transition-all`}>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</h4>
                    <Icon size={16} className="opacity-40 group-hover:opacity-100" />
                </div>
                <div className="text-2xl font-black">{value}</div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
            <PageHeader 
                title="Live Telemetry Ingestion" 
                subtitle="Import high-frequency diagnostic command sets for real-time data streaming"
                icon={Activity}
            />

            {!uploadResult ? (
                <div className="space-y-8">
                    <Card title="Telemetry Stream Ingest" icon={Database}>
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
                                accept=".xlsx,.xls,.csv"
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
                                        <p className="text-xl font-black text-slate-800">Drop telemetry dataset or browse</p>
                                        <p className="text-sm font-bold text-slate-400 mt-2 tracking-wide uppercase">Protocol: .xlsx, .xls, .csv (Max 10MB)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card title="Ingestion Schema" icon={Info}>
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-slate-500 italic leading-relaxed">The system requires specific diagnostic headers for command correlation:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['model_group_id', 'command', 'short_name', 'decimals', 'min', 'max', 'units', 'type'].map((head) => (
                                        <Badge key={head} variant="secondary" className="px-2 py-1 text-[10px]">{head}</Badge>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <div className="flex flex-col justify-center items-center p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="w-full max-w-xs h-14 text-lg shadow-xl shadow-primary-200" 
                                onClick={uploadFile} 
                                disabled={!file || uploading}
                                isLoading={uploading}
                                icon={ShieldCheck}
                            >
                                Execute Telemetry Ingest
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
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 text-center shadow-xl">
                        <div className="w-20 h-20 bg-emerald-100 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Telemetry Synchronized</h3>
                        <p className="text-slate-500 font-bold italic">{uploadResult.message}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricBox title="Command Registry" value={uploadResult.totalRows} icon={Activity} variant="primary" />
                        <MetricBox title="Imported Hooks" value={uploadResult.importedRows} icon={Zap} variant="success" />
                        <MetricBox title="File Collisions" value={uploadResult.duplicates?.inFile || 0} icon={AlertCircle} variant="warning" />
                        <MetricBox title="DB Collisions" value={uploadResult.duplicates?.inDatabase || 0} icon={XCircle} variant="danger" />
                    </div>

                    {(uploadResult.duplicates?.fileDuplicateDetails?.length > 0 || uploadResult.duplicates?.dbDuplicateCodes?.length > 0) && (
                        <Card title="Stream Interruption Analysis" icon={AlertCircle}>
                            <div className="space-y-6">
                                {uploadResult.duplicates.fileDuplicateDetails?.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Duplicate Stream Identifiers</h5>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto">
                                            <div className="flex flex-wrap gap-2">
                                                {uploadResult.duplicates.fileDuplicateDetails.map((dup, index) => (
                                                    <code key={index} className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] text-amber-700 font-black">
                                                        {typeof dup === 'string' ? dup : JSON.stringify(dup)}
                                                    </code>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {uploadResult.duplicates.dbDuplicateCodes?.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Master Registry Synchronization Conflict</h5>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 mb-3 italic">The following command sequences already exist in the master repository:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {uploadResult.duplicates.dbDuplicateCodes.map((code, i) => (
                                                    <span key={i} className="bg-white border border-slate-200 px-2 py-1 rounded-lg font-mono text-[10px] text-slate-600">
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    <div className="flex justify-center pt-8">
                        <Button variant="secondary" onClick={resetUpload} size="lg" icon={Upload}>
                            Ingest Alternate Stream
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveDataCommandsUploader;
