
import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Bug, TrendingUp } from 'lucide-react';

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
      setMessage('Please select a valid Excel file (.xlsx or .xls)');
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
      setMessage('Please select a file first');
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
        setMessage(data.message || 'Excel file uploaded successfully!');
        setStats(data.stats || null);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus('error');
        setMessage(data.message || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage('Network error. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Bug className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Fault Codes Excel Importer</h1>
        </div>
        <p className="text-red-100">Import Excel files containing DTC codes, titles, severity levels, and repair difficulty data</p>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver 
            ? 'border-red-400 bg-red-50' 
            : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-16 h-16 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Drop your Excel file here or click to browse
            </h3>
            <p className="text-sm text-gray-500">
              Supports .xlsx and .xls files up to 50MB
            </p>
          </div>
          <button
            onClick={handleBrowseClick}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Browse Files
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Selected File Display */}
      {file && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expected File Format */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-3">Expected Excel Format:</h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">DTC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">Title</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium">Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Repair Difficulty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-medium">Make</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-sm font-medium">Generic</span>
          </div>
        </div>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• Column A: DTC code (required)</p>
          <p>• Column B: Error title/description</p>
          <p>• Column C: Severity level (1-5)</p>
          <p>• Column D: Repair difficulty (1-5)</p>
          <p>• Column E: Vehicle make</p>
          <p>• Column F: Company ID (extracted from Excel data)</p>
          <p>• Column G: Generic flag (true/false)</p>
        </div>
      </div>

      {/* Upload Statistics */}
      {stats && uploadStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Import Statistics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-2xl font-bold text-green-600">{stats.insertedCount}</div>
              <div className="text-sm text-gray-600">New Records Added</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-2xl font-bold text-yellow-600">{stats.skippedCount}</div>
              <div className="text-sm text-gray-600">Duplicates Skipped</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRowsProcessed}</div>
              <div className="text-sm text-gray-600">Total Rows Processed</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600 space-y-1">
            <p><strong>Processing Time:</strong> {formatTime(stats.processingTimeMs)}</p>
            <p><strong>Speed:</strong> {stats.rowsPerSecond} rows/second</p>
            <p><strong>Worksheet:</strong> {stats.worksheetName}</p>
            <p><strong>Company ID:</strong> {stats.companyId}</p>
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
          uploadStatus === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {uploadStatus === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
            !file || isUploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:scale-105'
          }`}
        >
          <Upload className="w-5 h-5" />
          {isUploading ? 'Processing Excel...' : 'Import Fault Codes'}
        </button>
      </div>
    </div>
  );
};

export default FaultCodesUploader2;