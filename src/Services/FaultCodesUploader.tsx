

















import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Database, Trash2, Eye, Clock, BarChart3 } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/';

// Type definitions matching backend response
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

interface StatCardProps {
  title: string;
  data?: TableStats;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
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
      setError('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    
    // Match backend limit of 100MB
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
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
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const token = localStorage.getItem("token");
      const endpoint = `${BASE_URL}api/FaultUplodes`;
      
      console.log(`Uploading to: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let result: UploadResult;

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}`);
      }

      if (response.ok && result.success) {
        setUploadResult(result);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.message || result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);
      let errorMessage = 'An unknown error occurred during upload';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Cannot connect to server. Please check if the server is running and the URL is correct.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Upload timeout. The file may be too large or the server is busy.';
        }
      }
      
      setError(errorMessage);
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
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const StatCard: React.FC<StatCardProps> = ({ title, data, icon: Icon, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Inserted:</span>
          <span className="font-medium text-green-600">{data?.inserted || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Duplicates:</span>
          <span className="font-medium text-yellow-600">{data?.duplicates || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Skipped:</span>
          <span className="font-medium text-red-600">{data?.skipped || 0}</span>
        </div>
        {data?.processingTime && (
          <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-blue-600">{formatDuration(data.processingTime)}</span>
          </div>
        )}
      </div>
      
      {/* Duplicate breakdown */}
      {data?.duplicateBreakdown && (data.duplicateBreakdown.excelDuplicates > 0 || data.duplicateBreakdown.databaseDuplicates > 0) && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Duplicate Sources:</p>
          <div className="space-y-1">
            {data.duplicateBreakdown.excelDuplicates > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Excel:</span>
                <span className="text-yellow-600">{data.duplicateBreakdown.excelDuplicates}</span>
              </div>
            )}
            {data.duplicateBreakdown.databaseDuplicates > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Database:</span>
                <span className="text-yellow-600">{data.duplicateBreakdown.databaseDuplicates}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Fault Codes Bulk Uploader</h1>
              <p className="text-blue-100 mt-1">Import Excel files with fault descriptions, causes, symptoms, and solutions</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Upload Section */}
          {!uploadResult && (
            <div className="space-y-6">
              {/* File Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : file
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
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
                  <div className="space-y-4">
                    <FileSpreadsheet className="w-16 h-16 text-green-500 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-green-700">{file.name}</p>
                      <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={removeFile}
                      disabled={uploading}
                      className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Drop your Excel file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports .xlsx and .xls files up to 100MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Uploading and processing...</span>
                    <span className="text-gray-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Expected Sheets Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Expected Excel Sheets:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-700">fault_descriptions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-blue-700">causes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-blue-700">symptoms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-blue-700">solutions</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  * Each sheet should have headers in the first row. Empty rows will be skipped.
                </p>
              </div>

              {/* Connection Test */}
              {/* <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>API Endpoint:</strong> {BASE_URL}api/FaultUplodes
                </p>
              </div> */}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">Upload Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                    {error.includes('Cannot connect to server') && (
                      <div className="mt-2 text-xs text-red-600">
                        <p>Troubleshooting tips:</p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          <li>Check if the backend server is running</li>
                          <li>Verify the API endpoint URL</li>
                          <li>Check for CORS issues in browser console</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-center">
                <button
                  onClick={uploadFile}
                  disabled={!file || uploading}
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload & Import
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success Results */}
          {uploadResult && uploadResult.success && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">Import Successful!</h3>
                <p className="text-green-700">{uploadResult.message}</p>
                
                {/* Overall Stats */}
                {uploadResult.stats && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Total Inserted</span>
                      </div>
                      <p className="text-lg font-bold text-green-600 mt-1">{uploadResult.stats.totalRowsInserted}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-center space-x-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">Processing Time</span>
                      </div>
                      <p className="text-lg font-bold text-green-600 mt-1">{formatDuration(uploadResult.stats.totalProcessingTime)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-center space-x-2">
                        <FileSpreadsheet className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">File Size</span>
                      </div>
                      <p className="text-lg font-bold text-green-600 mt-1">{formatFileSize(uploadResult.stats.fileSize)}</p>
                    </div>
                  </div>
                )}

                {/* Performance Info */}
                {uploadResult.stats?.performance && (
                  <div className="mt-3 text-xs text-green-600">
                    <p>Performance: {uploadResult.stats.performance.rowsPerSecond} rows/sec</p>
                    <p>{uploadResult.stats.performance.improvement}</p>
                  </div>
                )}
              </div>

              {/* Detailed Import Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Import Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Fault Codes"
                    data={uploadResult.summary?.my_fault_codes}
                    icon={Database}
                    color="text-blue-500"
                  />
                  <StatCard
                    title="Causes"
                    data={uploadResult.summary?.my_fault_code_causes}
                    icon={AlertCircle}
                    color="text-green-500"
                  />
                  <StatCard
                    title="Symptoms"
                    data={uploadResult.summary?.my_fault_code_symptoms}
                    icon={Eye}
                    color="text-yellow-500"
                  />
                  <StatCard
                    title="Solutions"
                    data={uploadResult.summary?.my_fault_code_solutions}
                    icon={CheckCircle}
                    color="text-purple-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetUpload}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Another File
                </button>
              </div>
            </div>
          )}

          {/* Failed Results */}
          {uploadResult && !uploadResult.success && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-900 mb-2">Import Failed</h3>
                <p className="text-red-700">{uploadResult.message || uploadResult.error}</p>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={resetUpload}
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaultCodesUploader;