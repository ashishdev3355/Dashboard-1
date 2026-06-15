import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Database, Trash2, Key } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Type definitions
interface DuplicateDetails {
  inFile: number;
  inDatabase: number;
  fileDuplicateDetails: Array<{
    code: string;
    rows: number[];
  }>;
  dbDuplicateCodes: string[];
}

interface UploadResult {
  success?: boolean;
  message: string;
  totalRows: number;
  importedRows: number;
  duplicates: DuplicateDetails;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const ActivationCodesUploader = () => {
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
      setError('Please select a valid file (.xlsx, .xls, or .csv)');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
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
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Try multiple possible API endpoints
      const possibleEndpoints = [
        `${BASE_URL}api/uplodeactivationcode`
       
      ];
      const token = localStorage.getItem("token");
      let response: Response | undefined;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
            // "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
            },
          });
          
          if (response.status !== 404) {
            break; // Found a working endpoint
          }
        } catch (e) {
          continue;
        }
      }

      if (!response || response.status === 404) {
        throw new Error('API endpoint not found. Please check your server configuration.');
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error('Server returned an invalid response. Please check server logs.');
      }

      const result: UploadResult = await response.json();

      if (response.ok) {
        setUploadResult({
          ...result,
          success: true
        });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.message || `Server error: ${response.status}`);
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check if the server is running.';
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Server configuration error. Please check server setup.';
        }
      }
      
      setError(errorMessage);
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-8">
          <div className="flex items-center space-x-3">
            <Key className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Activation Codes Uploader</h1>
              <p className="text-indigo-100 mt-1">Import CSV or Excel files with activation codes, plans, duration, and vehicle information</p>
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
                    ? 'border-indigo-400 bg-indigo-50'
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
                  accept=".xlsx,.xls,.csv"
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
                      className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
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
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports .xlsx, .xls, and .csv files up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Expected Fields Info */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-medium text-indigo-900 mb-2">Expected File Format:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-indigo-700">ActivationCode</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-indigo-700">Plan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-indigo-700">Duration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-indigo-700">Vehicle</span>
                  </div>
                </div>
                <p className="text-xs text-indigo-600 mt-2">
                  For CSV: Use headers like "ActivationCode", "Activation Code", or "activation_code" (similar flexibility for other fields)
                </p>
              </div>

              {/* Debug Info */}
            

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900">Upload Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-center">
                <button
                  onClick={uploadFile}
                  disabled={!file || uploading}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          {uploadResult && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">Import Successful!</h3>
                <p className="text-green-700">{uploadResult.message}</p>
              </div>

              {/* Import Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Rows"
                    value={uploadResult.totalRows}
                    icon={Database}
                    color="text-blue-500"
                  />
                  <StatCard
                    title="Imported"
                    value={uploadResult.importedRows}
                    icon={CheckCircle}
                    color="text-green-500"
                  />
                  <StatCard
                    title="File Duplicates"
                    value={uploadResult.duplicates?.inFile || 0}
                    icon={AlertCircle}
                    color="text-yellow-500"
                  />
                  <StatCard
                    title="DB Duplicates"
                    value={uploadResult.duplicates?.inDatabase || 0}
                    icon={XCircle}
                    color="text-red-500"
                  />
                </div>
              </div>

              {/* Duplicate Details */}
              {(uploadResult.duplicates?.fileDuplicateDetails?.length > 0 || uploadResult.duplicates?.dbDuplicateCodes?.length > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-3">Duplicate Information</h4>
                  
                  {uploadResult.duplicates.fileDuplicateDetails?.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-yellow-800 mb-2">File Duplicates:</h5>
                      <div className="text-sm text-yellow-700 space-y-1">
                        {uploadResult.duplicates.fileDuplicateDetails.map((dup, index) => (
                          <p key={index}>
                            Code: <span className="font-mono">{dup.code}</span> appears on rows: {dup.rows.join(', ')}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {uploadResult.duplicates.dbDuplicateCodes?.length > 0 && (
                    <div>
                      <h5 className="font-medium text-yellow-800 mb-2">Database Duplicates:</h5>
                      <div className="text-sm text-yellow-700">
                        <p className="mb-1">The following codes already exist in the database:</p>
                        <div className="font-mono text-xs bg-yellow-100 p-2 rounded max-h-32 overflow-y-auto">
                          {uploadResult.duplicates.dbDuplicateCodes.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetUpload}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Another File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivationCodesUploader;