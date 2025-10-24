import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';

interface FileUploaderProps {
  onUpload: (file: File) => void;
  onProgress?: (progress: number) => void;
  accept?: string[];
  maxSize?: number; // in bytes
  isLoading?: boolean;
  error?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  onProgress,
  accept = ['.csv', '.xls', '.xlsx'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  isLoading = false,
  error
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize,
    multiple: false,
    disabled: isLoading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasErrors = fileRejections.length > 0 || error;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${hasErrors ? 'border-red-300 bg-red-50' : ''}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {isLoading ? (
            <div>
              <p className="text-lg font-medium text-gray-900">Subiendo archivo...</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo Excel'}
              </p>
              <p className="text-gray-500">
                o <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Formatos soportados: {accept.join(', ')} (máx. {formatFileSize(maxSize)})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800">Error en el archivo:</h4>
          <ul className="mt-2 text-sm text-red-700">
            {fileRejections.map(({ file, errors }, index) => (
              <li key={index}>
                <strong>{file.name}</strong>:
                <ul className="ml-4 list-disc">
                  {errors.map((error) => (
                    <li key={error.code}>
                      {error.code === 'file-too-large' ? 
                        `El archivo es muy grande (máx. ${formatFileSize(maxSize)})` :
                        error.code === 'file-invalid-type' ?
                        `Formato no válido. Usa: ${accept.join(', ')}` :
                        error.message
                      }
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* File Requirements */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-800">Requisitos del archivo:</h4>
        <ul className="mt-2 text-sm text-blue-700 list-disc ml-4">
          <li>El archivo debe contener al menos las columnas: <strong>Teléfono</strong> y <strong>Nombre/Email</strong></li>
          <li>Los teléfonos deben estar en formato internacional (+56912345678)</li>
          <li>La primera fila debe contener los nombres de las columnas</li>
          <li>Máximo 50,000 contactos por archivo</li>
        </ul>
      </div>
    </div>
  );
};