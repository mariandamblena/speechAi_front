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
  // Configuración inicial
  const initialFormData: CreateBatchRequest = {
    account_id: '',
    name: '',
    description: '',
    priority: 1,
    call_settings: {
      max_call_duration: 300,
      ring_timeout: 30,
      max_attempts: 3,
      retry_delay_hours: 24,
      allowed_hours: {
        start: '09:00',
        end: '18:00'
      },
      days_of_week: [1, 2, 3, 4, 5],
      timezone: 'America/Santiago'
    },
    allow_duplicates: false,
    excel_file: undefined
  };

  const [formData, setFormData] = useState<CreateBatchRequest>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [excelPreview, setExcelPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Log cuentas disponibles cuando el modal se abre
  React.useEffect(() => {
    if (isOpen && accounts) {
      console.group('🏢 Cuentas disponibles:');
      console.log('Total de cuentas:', accounts.length);
      accounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.account_name} (ID: ${account.account_id}, Créditos: ${account.balance?.credits || 0})`);
      });
      console.groupEnd();
    }
  }, [isOpen, accounts]);

  // Resetear formulario cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔄 Reseteando modal con initialFormData:', initialFormData);
      console.log('  - call_settings:', initialFormData.call_settings);
      setFormData(initialFormData);
      setCurrentStep(1);
      setExcelPreview([]);
      setErrors({});
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Log cuando cambia el paso para debugging
  React.useEffect(() => {
    console.log(`📍 Paso actual: ${currentStep}`);
    if (currentStep === 3) {
      console.group('🔧 PASO 3 - Estado de call_settings:');
      console.log('formData.call_settings:', formData.call_settings);
      if (formData.call_settings) {
        console.log('  ✅ Tiene call_settings');
        console.log('  - max_call_duration:', formData.call_settings.max_call_duration);
        console.log('  - allowed_hours:', formData.call_settings.allowed_hours);
        console.log('  - days_of_week:', formData.call_settings.days_of_week);
      } else {
        console.error('  ❌ NO tiene call_settings!');
      }
      console.groupEnd();
    }
  }, [currentStep, formData.call_settings]);

  const handleInputChange = (field: string, value: any) => {
    const parts = field.split('.');
    
    setFormData(prev => {
      if (parts.length === 1) {
        // Campo simple: account_id, name, etc.
        return {
          ...prev,
          [field]: value
        };
      } else if (parts.length === 2) {
        // Campo de segundo nivel: call_settings.max_call_duration
        const [parent, child] = parts;
        const parentObj = prev[parent as keyof CreateBatchRequest];
        return {
          ...prev,
          [parent]: {
            ...(typeof parentObj === 'object' && parentObj !== null ? parentObj : {}),
            [child]: value
          }
        };
      } else if (parts.length === 3) {
        // Campo de tercer nivel: call_settings.allowed_hours.start
        const [parent, middle, child] = parts;
        const parentObj = prev[parent as keyof CreateBatchRequest] as any;
        return {
          ...prev,
          [parent]: {
            ...(typeof parentObj === 'object' && parentObj !== null ? parentObj : {}),
            [middle]: {
              ...(parentObj && typeof parentObj[middle] === 'object' ? parentObj[middle] : {}),
              [child]: value
            }
          }
        };
      }
      return prev;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo Excel o CSV
    if (!file.name.match(/\.(csv|xls|xlsx)$/i)) {
      setErrors(prev => ({ ...prev, excel_file: 'Debe ser un archivo Excel (.xls, .xlsx) o CSV (.csv)' }));
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
    if (!formData.call_settings) return;
    
    const currentDays = formData.call_settings.days_of_week;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    handleInputChange('call_settings.days_of_week', newDays);
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.account_id || formData.account_id === '' || formData.account_id === 'string') {
        newErrors.account_id = '⚠️ Debe seleccionar una cuenta válida del dropdown';
      }
      if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
      // Script es opcional - no validar
    }

    if (step === 2) {
      if (!formData.excel_file) {
        newErrors.excel_file = 'Debe cargar un archivo Excel';
      }
    }

    if (step === 3) {
      if (formData.call_settings && formData.call_settings.max_call_duration <= 0) {
        newErrors.max_call_duration = 'La duración máxima debe ser mayor a 0';
      }
      if (formData.call_settings && formData.call_settings.max_attempts <= 0) {
        newErrors.max_attempts = 'Los intentos máximos deben ser mayor a 0';
      }
      if (formData.call_settings && formData.call_settings.days_of_week.length === 0) {
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
    
    console.log('🔍 handleSubmit llamado - currentStep:', currentStep, 'isLoading:', isLoading);
    
    // Solo permitir submit en el último paso (paso 3)
    if (currentStep < 3) {
      console.log('📌 currentStep < 3, llamando handleNext()');
      handleNext();
      return;
    }

    // Si ya está cargando, no hacer nada
    if (isLoading) {
      console.log('⚠️ Ya está cargando, ignorando submit');
      return;
    }

    // Validar que TODOS los pasos anteriores estén completos
    const paso1Valid = validateStep(1);
    const paso2Valid = validateStep(2);
    const paso3Valid = validateStep(3);

    if (!paso1Valid) {
      alert('❌ Error: Debes completar correctamente el Paso 1 (Información Básica).\n\nPor favor, vuelve atrás y verifica que hayas seleccionado una cuenta y un nombre válido.');
      return;
    }

    if (!paso2Valid) {
      alert('❌ Error: Debes completar correctamente el Paso 2 (Contactos).\n\nPor favor, vuelve atrás y verifica que hayas cargado un archivo Excel válido.');
      return;
    }

    if (!paso3Valid) {
      alert('❌ Error: Debes completar correctamente el Paso 3 (Configuración).\n\nPor favor, verifica todos los campos de configuración.');
      return;
    }
    
    console.group('📤 Validando datos antes de confirmar:');
    console.log('Form Data completo:', formData);
    console.log('account_id:', formData.account_id);
    console.log('account_id tipo:', typeof formData.account_id);
    console.log('name:', formData.name);
    console.log('excel_file:', formData.excel_file?.name);
    console.log('Call Settings (will be JSON stringified):', formData.call_settings);
    
    // Validación crítica adicional
    if (!formData.account_id || formData.account_id === 'string' || formData.account_id === '') {
      console.error('❌ ERROR: account_id inválido:', formData.account_id);
      console.error('💡 SOLUCIÓN: Debes seleccionar una cuenta del dropdown en el Step 1');
      console.error('📋 Cuentas disponibles:', accounts?.length || 0);
      alert('❌ Error: Debes volver al Paso 1 y seleccionar una cuenta válida del dropdown.\n\n' + 
            'El campo "Cuenta de Cliente" no puede estar vacío.\n\n' +
            `Cuentas disponibles: ${accounts?.length || 0}`);
      console.groupEnd();
      return;
    }

    if (!formData.excel_file) {
      alert('❌ Error: Debes volver al Paso 2 y cargar un archivo Excel con los contactos.');
      console.groupEnd();
      return;
    }
    
    console.groupEnd();

    // TODO VALIDADO - Mostrar modal de confirmación
    setShowConfirmation(true);
  };

  const handleConfirmCreate = () => {
    console.group('✅ CONFIRMACIÓN - Enviando datos al backend:');
    console.log('📋 FormData completo:', formData);
    console.log('🔧 call_settings:', formData.call_settings);
    console.log('📞 max_call_duration:', formData.call_settings?.max_call_duration);
    console.log('⏰ allowed_hours:', formData.call_settings?.allowed_hours);
    console.log('📅 days_of_week:', formData.call_settings?.days_of_week);
    console.log('🌍 timezone:', formData.call_settings?.timezone);
    console.log('📁 excel_file:', formData.excel_file?.name);
    console.log('🏢 account_id:', formData.account_id);
    console.groupEnd();
    
    setShowConfirmation(false);
    onSubmit(formData);
  };

  const handleCancelCreate = () => {
    setShowConfirmation(false);
  };

  // Prevenir submit con Enter en los inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
      e.preventDefault();
      // Si estamos en un paso anterior al 3, avanzar
      if (currentStep < 3) {
        handleNext();
      }
      // Si estamos en el paso 3, no hacer nada (el usuario debe hacer clic en el botón)
    }
  };

  const getDayName = (day: number) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return days[day];
  };

  const steps = [
    { title: 'Información Básica', description: 'Cuenta y nombre' },
    { title: 'Contactos', description: 'Cargar datos desde Excel' },
    { title: 'Configuración de Llamadas', description: 'Parámetros de ejecución' }
  ];

  return (
    <>
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

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6 relative">
          {/* Overlay de carga cuando isLoading es true */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Creando campaña...</p>
              </div>
            </div>
          )}

          {/* Step 1: Información Básica */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuenta de Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    console.log('🔄 Cuenta seleccionada:', selectedId);
                    handleInputChange('account_id', selectedId);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">⚠️ Seleccionar cuenta...</option>
                  {accounts && accounts.length > 0 ? (
                    accounts.map((account) => {
                      // 🔧 Mostrar el saldo correcto según el tipo de plan
                      const balanceDisplay = account.plan_type === 'credit_based'
                        ? `${account.balance?.credits || 0} créditos`
                        : `${account.balance?.minutes || 0} minutos`;
                      
                      return (
                        <option key={account.account_id} value={account.account_id}>
                          {account.account_name} ({balanceDisplay})
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>No hay cuentas disponibles</option>
                  )}
                </select>
                {errors.account_id && <p className="text-red-500 text-sm mt-1">{errors.account_id}</p>}
                {formData.account_id && (
                  <p className="text-green-600 text-sm mt-1">
                    ✅ Cuenta seleccionada: {accounts.find(a => a.account_id === formData.account_id)?.account_name}
                  </p>
                )}
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
                      accept=".csv,.xls,.xlsx"
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

              {/* Checkbox: Permitir Duplicados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_duplicates}
                    onChange={(e) => handleInputChange('allow_duplicates', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      Permitir contactos duplicados
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Si los contactos ya existen en otras campañas de esta cuenta, permite crear un nuevo batch con ellos.
                      Útil para crear nuevas campañas con los mismos contactos o reintentar con diferentes horarios.
                    </p>
                  </div>
                </label>
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
          {currentStep === 3 && formData.call_settings && (
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
                        formData.call_settings?.days_of_week.includes(day)
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
                  value={formData.priority || 1}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="1">Baja</option>
                  <option value="2">Normal</option>
                  <option value="3">Alta</option>
                  <option value="4">Urgente</option>
                </select>
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
              {currentStep < 3 ? (
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

    {/* Modal de confirmación */}
    <ConfirmationModal
      isOpen={showConfirmation}
      onConfirm={handleConfirmCreate}
      onCancel={handleCancelCreate}
      formData={formData}
      excelPreview={excelPreview}
      accounts={accounts}
    />
    </>
  );
};

// Modal de confirmación interno
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  formData: CreateBatchRequest;
  excelPreview: any[];
  accounts: AccountModel[];
}> = ({ isOpen, onConfirm, onCancel, formData, excelPreview, accounts }) => {
  if (!isOpen) return null;

  const selectedAccount = accounts.find(acc => acc.account_id === formData.account_id);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-3xl">⚠️</span>
          Confirmar Creación de Campaña
        </h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-start">
            <span className="font-medium text-gray-700 w-32">Cuenta:</span>
            <span className="text-gray-900">{selectedAccount?.account_name || 'No especificada'}</span>
          </div>
          
          <div className="flex items-start">
            <span className="font-medium text-gray-700 w-32">Nombre:</span>
            <span className="text-gray-900">{formData.name}</span>
          </div>
          
          <div className="flex items-start">
            <span className="font-medium text-gray-700 w-32">Contactos:</span>
            <span className="text-gray-900">
              {excelPreview.length > 0 ? `${excelPreview.length} contactos` : 'No cargados'}
            </span>
          </div>
          
          <div className="flex items-start">
            <span className="font-medium text-gray-700 w-32">Horario:</span>
            <span className="text-gray-900">
              {formData.call_settings?.allowed_hours?.start || '09:00'} - {formData.call_settings?.allowed_hours?.end || '18:00'}
            </span>
          </div>
          
          <div className="flex items-start">
            <span className="font-medium text-gray-700 w-32">Intentos máx:</span>
            <span className="text-gray-900">{formData.call_settings?.max_attempts || 3}</span>
          </div>
          
          <div className="flex items-start">
            <span className="font-medium text-gray-700 w-32">Duplicados:</span>
            <span className="text-gray-900">{formData.allow_duplicates ? 'Permitidos' : 'No permitidos'}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800 font-medium">
            ¿Estás seguro de que deseas crear esta campaña con la configuración mostrada?
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="flex-1 py-3 text-base font-medium"
          >
            ❌ Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            variant="primary"
            className="flex-1 py-3 text-base font-medium bg-green-600 hover:bg-green-700"
          >
            ✓ Sí, Crear Campaña
          </Button>
        </div>
      </div>
    </div>
  );
};