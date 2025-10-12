import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateBatchRequest, AccountModel } from '@/types';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBatchRequest) => void;
  isLoading: boolean;
  accounts: AccountModel[];
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  accounts
}) => {
  const [formData, setFormData] = useState<CreateBatchRequest>({
    account_id: '',
    name: '',
    description: '',
    script_content: '',
    voice_settings: {
      voice_id: 'default',
      speed: 1.0,
      pitch: 0,
      volume: 1.0,
      language: 'es-CL'
    },
    call_settings: {
      max_call_duration: 300, // 5 minutos
      ring_timeout: 30,
      max_attempts: 3,
      retry_delay_hours: 24,
      allowed_hours: {
        start: '09:00',
        end: '18:00'
      },
      days_of_week: [1, 2, 3, 4, 5], // Lunes a Viernes
      timezone: 'America/Santiago'
    },
    contacts_data: [],
    excel_file: null,
    schedule_type: 'immediate', // immediate, scheduled, recurring
    scheduled_start: null,
    recurring_config: null,
    priority: 'normal'
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [excelPreview, setExcelPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreateBatchRequest],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    if (!file.name.match(/\.(csv)$/)) {
      setErrors(prev => ({ ...prev, excel_file: 'Debe ser un archivo CSV (.csv)' }));
      return;
    }

    setFormData(prev => ({ ...prev, excel_file: file }));
    
    // Aquí puedes agregar lógica para leer el archivo Excel y generar preview
    // Por ahora simularemos datos de preview
    setExcelPreview([
      { nombre: 'Juan Pérez', telefono: '+56912345678', rut: '12345678-9', monto_deuda: 150000 },
      { nombre: 'María González', telefono: '+56987654321', rut: '98765432-1', monto_deuda: 250000 },
      { nombre: 'Carlos Rodríguez', telefono: '+56955555555', rut: '11111111-1', monto_deuda: 180000 }
    ]);
  };

  const handleDayToggle = (day: number) => {
    const currentDays = formData.call_settings.days_of_week;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    handleInputChange('call_settings.days_of_week', newDays);
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.account_id) newErrors.account_id = 'Debe seleccionar una cuenta';
      if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
      if (!formData.script_content.trim()) newErrors.script_content = 'El script es requerido';
    }

    if (step === 2) {
      if (!formData.excel_file && formData.contacts_data.length === 0) {
        newErrors.excel_file = 'Debe cargar un archivo Excel o agregar contactos manualmente';
      }
    }

    if (step === 3) {
      if (formData.call_settings.max_call_duration <= 0) {
        newErrors.max_call_duration = 'La duración máxima debe ser mayor a 0';
      }
      if (formData.call_settings.max_attempts <= 0) {
        newErrors.max_attempts = 'Los intentos máximos deben ser mayor a 0';
      }
      if (formData.call_settings.days_of_week.length === 0) {
        newErrors.days_of_week = 'Debe seleccionar al menos un día de la semana';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return days[day];
  };

  const steps = [
    { title: 'Información Básica', description: 'Cuenta, nombre y script' },
    { title: 'Contactos', description: 'Cargar datos desde Excel' },
    { title: 'Configuración de Llamadas', description: 'Parámetros de ejecución' },
    { title: 'Programación', description: 'Cuándo ejecutar la campaña' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Campaña" size="xl">
      <div className="space-y-6">
        {/* Steps Header */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index + 1 === currentStep 
                  ? 'bg-blue-600 text-white' 
                  : index + 1 < currentStep 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1 < currentStep ? '✓' : index + 1}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  index + 1 < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Información Básica */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuenta de Cliente
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => handleInputChange('account_id', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar cuenta...</option>
                  {accounts.map((account) => (
                    <option key={account.account_id} value={account.account_id}>
                      {account.account_name} ({account.balance?.credits || 0} créditos)
                    </option>
                  ))}
                </select>
                {errors.account_id && <p className="text-red-500 text-sm mt-1">{errors.account_id}</p>}
              </div>

              <Input
                label="Nombre de la Campaña"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder="Ej: Cobranza Cartera Vencida Enero 2025"
                required
              />

              <Input
                label="Descripción (opcional)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción de la campaña..."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Script de la Llamada
                </label>
                <textarea
                  value={formData.script_content}
                  onChange={(e) => handleInputChange('script_content', e.target.value)}
                  rows={8}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Hola {nombre}, le llamamos de {empresa} para informarle sobre su deuda de {monto_deuda}..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Puedes usar variables como {`{nombre}`}, {`{monto_deuda}`}, {`{empresa}`}, etc.
                </p>
                {errors.script_content && <p className="text-red-500 text-sm mt-1">{errors.script_content}</p>}
              </div>

              {/* Voice Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Configuración de Voz</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Velocidad de Habla
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={formData.voice_settings.speed}
                      onChange={(e) => handleInputChange('voice_settings.speed', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-500 text-center">{formData.voice_settings.speed}x</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Idioma
                    </label>
                    <select
                      value={formData.voice_settings.language}
                      onChange={(e) => handleInputChange('voice_settings.language', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="es-CL">Español (Chile)</option>
                      <option value="es-AR">Español (Argentina)</option>
                      <option value="es-MX">Español (México)</option>
                      <option value="es-ES">Español (España)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contactos */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Cargar Contactos</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo Excel
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Cargar archivo Excel con columnas: nombre, telefono, rut, monto_deuda
                    </p>
                  </div>
                </div>
                {errors.excel_file && <p className="text-red-500 text-sm mt-1">{errors.excel_file}</p>}
              </div>

              {/* Excel Preview */}
              {excelPreview.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Vista Previa ({excelPreview.length} contactos)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">RUT</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monto Deuda</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {excelPreview.slice(0, 5).map((contact, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.nombre}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.telefono}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.rut}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              ${contact.monto_deuda?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {excelPreview.length > 5 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        ... y {excelPreview.length - 5} contactos más
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Configuración de Llamadas */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Llamadas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Duración Máxima (segundos)"
                  type="number"
                  value={formData.call_settings.max_call_duration}
                  onChange={(e) => handleInputChange('call_settings.max_call_duration', parseInt(e.target.value) || 0)}
                  error={errors.max_call_duration}
                  min="30"
                  max="600"
                />

                <Input
                  label="Tiempo de Timbrado (segundos)"
                  type="number"
                  value={formData.call_settings.ring_timeout}
                  onChange={(e) => handleInputChange('call_settings.ring_timeout', parseInt(e.target.value) || 0)}
                  min="10"
                  max="60"
                />

                <Input
                  label="Intentos Máximos"
                  type="number"
                  value={formData.call_settings.max_attempts}
                  onChange={(e) => handleInputChange('call_settings.max_attempts', parseInt(e.target.value) || 0)}
                  error={errors.max_attempts}
                  min="1"
                  max="10"
                />

                <Input
                  label="Horas entre Intentos"
                  type="number"
                  value={formData.call_settings.retry_delay_hours}
                  onChange={(e) => handleInputChange('call_settings.retry_delay_hours', parseInt(e.target.value) || 0)}
                  min="1"
                  max="168"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Hora de Inicio"
                  type="time"
                  value={formData.call_settings.allowed_hours.start}
                  onChange={(e) => handleInputChange('call_settings.allowed_hours.start', e.target.value)}
                />

                <Input
                  label="Hora de Fin"
                  type="time"
                  value={formData.call_settings.allowed_hours.end}
                  onChange={(e) => handleInputChange('call_settings.allowed_hours.end', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de la Semana Permitidos
                </label>
                <div className="flex space-x-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        formData.call_settings.days_of_week.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {getDayName(day)}
                    </button>
                  ))}
                </div>
                {errors.days_of_week && <p className="text-red-500 text-sm mt-1">{errors.days_of_week}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona Horaria
                </label>
                <select
                  value={formData.call_settings.timezone}
                  onChange={(e) => handleInputChange('call_settings.timezone', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="America/Santiago">Santiago (GMT-3)</option>
                  <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/Lima">Lima (GMT-5)</option>
                  <option value="America/Bogota">Bogotá (GMT-5)</option>
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad de la Campaña
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Programación */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Programación de Ejecución</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Programación
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="schedule_type"
                      value="immediate"
                      checked={formData.schedule_type === 'immediate'}
                      onChange={(e) => handleInputChange('schedule_type', e.target.value)}
                      className="mr-2"
                    />
                    <span>Iniciar Inmediatamente</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="schedule_type"
                      value="scheduled"
                      checked={formData.schedule_type === 'scheduled'}
                      onChange={(e) => handleInputChange('schedule_type', e.target.value)}
                      className="mr-2"
                    />
                    <span>Programar para una fecha específica</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="schedule_type"
                      value="recurring"
                      checked={formData.schedule_type === 'recurring'}
                      onChange={(e) => handleInputChange('schedule_type', e.target.value)}
                      className="mr-2"
                    />
                    <span>Programación Recurrente</span>
                  </label>
                </div>
              </div>

              {formData.schedule_type === 'scheduled' && (
                <Input
                  label="Fecha y Hora de Inicio"
                  type="datetime-local"
                  value={formData.scheduled_start || ''}
                  onChange={(e) => handleInputChange('scheduled_start', e.target.value)}
                />
              )}

              {formData.schedule_type === 'recurring' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    La programación recurrente permite ejecutar la campaña automáticamente en intervalos regulares.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">
                      Configuración de recurrencia se implementará en una versión posterior.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-blue-900 mb-2">Resumen de la Campaña</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Cuenta:</dt>
                    <dd className="text-blue-900">
                      {accounts.find(acc => acc.account_id === formData.account_id)?.account_name || 'No seleccionada'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Nombre:</dt>
                    <dd className="text-blue-900">{formData.name || 'Sin nombre'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Contactos:</dt>
                    <dd className="text-blue-900">{excelPreview.length} contactos</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Horario:</dt>
                    <dd className="text-blue-900">
                      {formData.call_settings.allowed_hours.start} - {formData.call_settings.allowed_hours.end}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Intentos máximos:</dt>
                    <dd className="text-blue-900">{formData.call_settings.max_attempts}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Programación:</dt>
                    <dd className="text-blue-900">
                      {formData.schedule_type === 'immediate' ? 'Inmediata' :
                       formData.schedule_type === 'scheduled' ? 'Programada' : 'Recurrente'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={currentStep === 1 ? onClose : handlePrevious}
            >
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </Button>
            
            <div className="flex space-x-3">
              {currentStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    'Crear Campaña'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};