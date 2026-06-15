


import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Key } from 'lucide-react';

interface UploadResponse {
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

// Vehicle makes data array
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
      setMessage('Please select a valid Excel (.xlsx, .xls) or CSV file');
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

    if (!sheetName.trim()) {
      setMessage('Sheet name is required');
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
        // "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token
        },
      });

      const data: UploadResponse = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setMessage(data.message || 'File uploaded successfully!');
        setFile(null);
        setSheetName('');
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Update Commands</h1>
        </div>
        <p className="text-purple-100">Import CSV or Excel files with activation codes, plans, duration, and vehicle information</p>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver 
            ? 'border-purple-400 bg-purple-50' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-16 h-16 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Drop your file here or click to browse
            </h3>
            <p className="text-sm text-gray-500">
              Supports .xlsx, .xls, and .csv files up to 10MB
            </p>
          </div>
          <button
            onClick={handleBrowseClick}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Files
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
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

      {/* Sheet Name Select */}
      <div className="mt-6">
        <label htmlFor="sheetName" className="block text-sm font-medium text-gray-700 mb-2">
          Sheet Name (Make) *
        </label>
        <select
          id="sheetName"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          disabled={isUploading}
        >
          <option value="">Select a make/sheet name</option>
          {VEHICLE_MAKES.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </div>

      {/* Expected File Format */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-3">Expected File Format:</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-medium">ActivationCode</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Plan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium">Duration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-medium">Vehicle</span>
          </div>
        </div>
        <p className="text-sm text-blue-700">
          For CSV: Use headers like "ActivationCode", "Activation Code", or "activation_code" (similar flexibility for other fields)
        </p>
      </div>

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
          disabled={!file || !sheetName.trim() || isUploading}
          className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
            !file || !sheetName.trim() || isUploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:scale-105'
          }`}
        >
          <Upload className="w-5 h-5" />
          {isUploading ? 'Uploading...' : 'Upload & Import'}
        </button>
      </div>
    </div>
  );
};

export default Updatecommand;