import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const UPLOAD_SERVER_URL = import.meta.env.VITE_UPLOAD_SERVER_URL || 'http://localhost:3000';

export default function VideoUploader({ onUploadComplete }) {
  const [uploadStatus, setUploadStatus] = useState({
    uploading: false,
    progress: 0,
    error: null,
    success: false,
    loaded: '0 B',
    total: '0 B',
    speed: '0 B/s'
  });

  const uploadToR2 = async (file) => {
    try {
      setUploadStatus({ 
        uploading: true, 
        progress: 0, 
        error: null, 
        success: false,
        loaded: '0 B',
        total: formatBytes(file.size),
        speed: '0 B/s'
      });

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);

      // Progress simulation since fetch doesn't have real progress events
      const progressInterval = setInterval(() => {
        setUploadStatus(prev => {
          const newProgress = prev.progress + 5;
          return {
            ...prev,
            progress: newProgress > 90 ? 90 : newProgress,
            loaded: formatBytes((file.size * newProgress) / 100),
            speed: formatBytes((file.size * 5) / 100) + '/s'
          };
        });
      }, 500);

      try {
        // Upload to Express server which handles R2 upload
        const response = await fetch(`${UPLOAD_SERVER_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        clearInterval(progressInterval);
        
        const result = await response.json();
        
        if (!response.ok) {
          console.error('Upload failed with status:', response.status);
          console.error('Error response:', result);
          throw new Error(result.error || `Upload failed with status ${response.status}`);
        }

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Set progress to 100% when complete
        setUploadStatus(prev => ({
          ...prev,
          progress: 100,
          loaded: formatBytes(file.size),
          success: true,
          uploading: false
        }));

        onUploadComplete({
          video_url: result.video_url,
          thumbnail_url: result.thumbnail_url || '',
          duration: result.duration || ''
        });

      } catch (fetchError) {
        clearInterval(progressInterval);
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(prev => ({
        ...prev,
        uploading: false,
        error: error.message || 'Failed to upload video. Please try again.',
        success: false
      }));
    }
  };

  // Helper function to format bytes into human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      uploadToR2(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    multiple: false
  });

  return (
    <div className="mb-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploadStatus.uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? "Drop the video here"
            : "Drag and drop a video file here, or click to select"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: MP4, MOV, AVI, MKV
        </p>
      </div>

      {/* Enhanced Upload Status */}
      {(uploadStatus.uploading || uploadStatus.error || uploadStatus.success) && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          {uploadStatus.uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="font-medium text-gray-700">Uploading video...</span>
                </div>
                <span className="text-sm font-medium text-blue-600">{uploadStatus.progress}%</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>

              {/* Upload details */}
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  {uploadStatus.loaded} of {uploadStatus.total}
                </span>
                <span>Speed: {uploadStatus.speed}</span>
              </div>
            </div>
          )}

          {uploadStatus.error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
              <AlertCircle size={20} />
              <span className="font-medium">{uploadStatus.error}</span>
            </div>
          )}

          {uploadStatus.success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
              <CheckCircle size={20} />
              <span className="font-medium">Upload complete!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 