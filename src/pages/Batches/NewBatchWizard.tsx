import React, { useState } from 'react';
import { FileUploader } from '@/components/wizard/FileUploader';
import { ColumnMapper } from '@/components/wizard/ColumnMapper';
import { Button } from '@/components/ui/Button';
import { useExcelPreview, useCreateBatch } from '@/services/queries';

export const NewBatchWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadData, setUploadData] = useState<any>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const excelPreviewMutation = useExcelPreview();
  const createBatchMutation = useCreateBatch();

  const handleFileUpload = async (file: File) => {
    try {
      // TODO: Get real account ID from user context/auth
      const accountId = 'default-account-id';
      const result = await excelPreviewMutation.mutateAsync({ file, accountId });
      setUploadData(result);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Subir Archivo', description: 'Selecciona tu archivo Excel' },
    { number: 2, title: 'Mapear Columnas', description: 'Configura las variables' },
    { number: 3, title: 'Revisar', description: 'Validar y confirmar' },
    { number: 4, title: 'Configurar', description: 'Opciones de campaña' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center ${
                step.number < steps.length ? 'flex-1' : ''
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {step.number}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {step.number < steps.length && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Subir Archivo Excel
            </h2>
            <FileUploader
              onUpload={handleFileUpload}
              isLoading={excelPreviewMutation.isPending}
              error={excelPreviewMutation.error?.toString()}
            />
          </div>
        )}

        {currentStep === 2 && uploadData && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mapear Columnas
            </h2>
            <ColumnMapper
              sampleRows={uploadData.sampleRows}
              detectedFormat={uploadData.detectedFormat}
              onMappingChange={setMappings}
              onValidationChange={() => {}}
            />
            <div className="mt-6 flex justify-between">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(1)}
              >
                ← Anterior
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={Object.keys(mappings).length === 0}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Revisar Datos
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">
                Archivo: {uploadData?.sampleRows.length || 0} filas detectadas
              </p>
              <p className="text-gray-600">
                Formato: {uploadData?.detectedFormat}
              </p>
              <p className="text-gray-600">
                Mapeos configurados: {Object.keys(mappings).length}
              </p>
            </div>
            <div className="mt-6 flex justify-between">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(2)}
              >
                ← Anterior
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configurar Campaña
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la campaña
                </label>
                <input
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ej: Cobranza Octubre 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Descripción opcional de la campaña"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(3)}
              >
                ← Anterior
              </Button>
              <Button
                onClick={() => {
                  // Create batch logic here
                  alert('¡Campaña creada exitosamente!');
                }}
                isLoading={createBatchMutation.isPending}
              >
                Crear Campaña
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};