import React, { useState } from 'react';
import { FileUploader } from '@/components/wizard/FileUploader';
import { ColumnMapper } from '@/components/wizard/ColumnMapper';
import { Button } from '@/components/ui/Button';
import { useExcelPreview, useCreateBatch } from '@/services/queries';

interface BatchConfig {
  name: string;
  description: string;
  priority: number;
  max_call_duration: number;
  ring_timeout: number;
  max_attempts: number;
  retry_delay_hours: number;
  start_hour: string;
  end_hour: string;
  days_of_week: number[];
  timezone: string;
  allow_duplicates: boolean;
}

export const NewBatchWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadData, setUploadData] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<BatchConfig>({
    name: '',
    description: '',
    priority: 2, // normal
    max_call_duration: 300,
    ring_timeout: 30,
    max_attempts: 3,
    retry_delay_hours: 24,
    start_hour: '09:00',
    end_hour: '18:00',
    days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
    timezone: 'America/Santiago',
    allow_duplicates: false,
  });

  const excelPreviewMutation = useExcelPreview();
  const createBatchMutation = useCreateBatch();

  // Función para resetear todo el wizard
  const resetWizard = () => {
    setCurrentStep(1);
    setUploadData(null);
    setUploadedFile(null);
    setMappings({});
    setConfig({
      name: '',
      description: '',
      priority: 2,
      max_call_duration: 300,
      ring_timeout: 30,
      max_attempts: 3,
      retry_delay_hours: 24,
      start_hour: '09:00',
      end_hour: '18:00',
      days_of_week: [1, 2, 3, 4, 5],
      timezone: 'America/Santiago',
      allow_duplicates: false,
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      // TODO: Get real account ID from user context/auth
      const accountId = 'default-account-id';
      const result = await excelPreviewMutation.mutateAsync({ file, accountId });
      setUploadData(result);
      setUploadedFile(file);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleCreateBatch = async () => {
    if (!uploadedFile) {
      alert('No hay archivo seleccionado');
      return;
    }

    // Confirmación antes de crear
    const confirmMessage = `¿Confirmar creación de campaña?\n\n` +
      `Nombre: ${config.name}\n` +
      `Contactos: ${uploadData?.total_rows || 0}\n` +
      `Horario: ${config.start_hour} - ${config.end_hour}\n` +
      `Intentos máximos: ${config.max_attempts}\n\n` +
      `¿Deseas crear esta campaña?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const accountId = 'default-account-id'; // TODO: Get from auth context
      
      const batchRequest = {
        account_id: accountId,
        name: config.name,
        description: config.description,
        priority: config.priority,
        call_settings: {
          max_call_duration: config.max_call_duration,
          ring_timeout: config.ring_timeout,
          max_attempts: config.max_attempts,
          retry_delay_hours: config.retry_delay_hours,
          allowed_hours: {
            start: config.start_hour,
            end: config.end_hour,
          },
          days_of_week: config.days_of_week,
          timezone: config.timezone,
        },
        excel_file: uploadedFile,
        allow_duplicates: config.allow_duplicates,
      };

      await createBatchMutation.mutateAsync(batchRequest);
      
      alert('¡Campaña creada exitosamente!\n\nLa campaña se ha creado y está lista para comenzar.');
      
      // Resetear todo el wizard después de crear exitosamente
      resetWizard();
      
      // TODO: Navigate to batch detail page or batches list
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Error al crear la campaña.\n\nPor favor, verifica los datos e intenta nuevamente.');
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Configurar Campaña
            </h2>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la campaña *
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Cobranza Octubre 2025"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={config.description}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Descripción opcional de la campaña"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={config.priority}
                      onChange={(e) => setConfig({ ...config, priority: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>Baja</option>
                      <option value={2}>Normal</option>
                      <option value={3}>Alta</option>
                      <option value={4}>Urgente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Call Settings */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Llamadas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración máxima (segundos)
                    </label>
                    <input
                      type="number"
                      value={config.max_call_duration}
                      onChange={(e) => setConfig({ ...config, max_call_duration: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="30"
                      max="600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo tiempo de cada llamada</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo de timbre (segundos)
                    </label>
                    <input
                      type="number"
                      value={config.ring_timeout}
                      onChange={(e) => setConfig({ ...config, ring_timeout: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="10"
                      max="60"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tiempo de espera antes de colgar</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intentos máximos
                    </label>
                    <input
                      type="number"
                      value={config.max_attempts}
                      onChange={(e) => setConfig({ ...config, max_attempts: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">Reintentos por contacto</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay entre reintentos (horas)
                    </label>
                    <input
                      type="number"
                      value={config.retry_delay_hours}
                      onChange={(e) => setConfig({ ...config, retry_delay_hours: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="168"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tiempo de espera entre reintentos</p>
                  </div>
                </div>
              </div>

              {/* Schedule Settings */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Horario de Llamadas</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      value={config.start_hour}
                      onChange={(e) => setConfig({ ...config, start_hour: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      value={config.end_hour}
                      onChange={(e) => setConfig({ ...config, end_hour: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de la semana
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 1, label: 'Lun' },
                      { value: 2, label: 'Mar' },
                      { value: 3, label: 'Mié' },
                      { value: 4, label: 'Jue' },
                      { value: 5, label: 'Vie' },
                      { value: 6, label: 'Sáb' },
                      { value: 0, label: 'Dom' },
                    ].map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const isSelected = config.days_of_week.includes(day.value);
                          setConfig({
                            ...config,
                            days_of_week: isSelected
                              ? config.days_of_week.filter((d) => d !== day.value)
                              : [...config.days_of_week, day.value].sort(),
                          });
                        }}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border ${
                          config.days_of_week.includes(day.value)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona horaria
                  </label>
                  <select
                    value={config.timezone}
                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="America/Santiago">Chile (America/Santiago)</option>
                    <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                    <option value="America/Lima">Perú (Lima)</option>
                    <option value="America/Bogota">Colombia (Bogotá)</option>
                    <option value="America/Mexico_City">México (Ciudad de México)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones Avanzadas</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow_duplicates"
                    checked={config.allow_duplicates}
                    onChange={(e) => setConfig({ ...config, allow_duplicates: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_duplicates" className="ml-2 block text-sm text-gray-700">
                    Permitir contactos duplicados en otros batches
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Si está desactivado, no se llamará a contactos que ya estén en otra campaña activa
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(3)}
              >
                ← Anterior
              </Button>
              <Button
                onClick={handleCreateBatch}
                isLoading={createBatchMutation.isPending}
                disabled={!config.name.trim() || config.days_of_week.length === 0}
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