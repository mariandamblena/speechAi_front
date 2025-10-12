import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateAccountRequest } from '@/types';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountRequest) => void;
  isLoading: boolean;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<CreateAccountRequest>({
    account_name: '',
    contact_email: '',
    contact_name: '',
    contact_phone: '',
    plan_type: 'credit_based',
    initial_credits: 1000,
    initial_minutes: 0,
    features: {
      max_concurrent_calls: 5,
      voice_cloning: false,
      advanced_analytics: false,
      custom_integration: false,
      priority_support: false
    },
    settings: {
      allowed_call_hours: {
        start: '09:00',
        end: '18:00'
      },
      timezone: 'America/Santiago',
      retry_settings: {
        max_attempts: 3,
        retry_delay_hours: 24
      }
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'El nombre de la empresa es requerido';
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'El email de contacto es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'El email no es válido';
    }

    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'El nombre de contacto es requerido';
    }

    if (formData.plan_type === 'credit_based' && (formData.initial_credits || 0) <= 0) {
      newErrors.initial_credits = 'Los créditos iniciales deben ser mayor a 0';
    }

    if (formData.plan_type === 'minutes_based' && formData.initial_minutes <= 0) {
      newErrors.initial_minutes = 'Los minutos iniciales deben ser mayor a 0';
    }

    if (formData.features.max_concurrent_calls <= 0) {
      newErrors.max_concurrent_calls = 'El número de llamadas concurrentes debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFeatureChange = (feature: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }));
  };

  const handleSettingChange = (setting: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleTimeChange = (timeType: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        allowed_call_hours: {
          ...prev.settings.allowed_call_hours,
          [timeType]: value
        }
      }
    }));
  };

  const handleRetrySettingChange = (setting: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        retry_settings: {
          ...prev.settings.retry_settings,
          [setting]: value
        }
      }
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Cuenta" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Información de la Empresa</h3>
          
          <Input
            label="Nombre de la Empresa"
            value={formData.account_name}
            onChange={(e) => handleInputChange('account_name', e.target.value)}
            error={errors.account_name}
            placeholder="Ej: Empresa ABC"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de Contacto"
              value={formData.contact_name}
              onChange={(e) => handleInputChange('contact_name', e.target.value)}
              error={errors.contact_name}
              placeholder="Juan Pérez"
              required
            />

            <Input
              label="Email de Contacto"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              error={errors.contact_email}
              placeholder="contacto@empresa.com"
              required
            />
          </div>

          <Input
            label="Teléfono de Contacto"
            value={formData.contact_phone}
            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
            placeholder="+56 9 1234 5678"
          />
        </div>

        {/* Plan y Créditos */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Plan y Facturación</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Plan
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="plan_type"
                  value="credit_based"
                  checked={formData.plan_type === 'credit_based'}
                  onChange={(e) => handleInputChange('plan_type', e.target.value)}
                  className="mr-2"
                />
                <span>Por Créditos</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="plan_type"
                  value="minutes_based"
                  checked={formData.plan_type === 'minutes_based'}
                  onChange={(e) => handleInputChange('plan_type', e.target.value)}
                  className="mr-2"
                />
                <span>Por Minutos</span>
              </label>
            </div>
          </div>

          {formData.plan_type === 'credit_based' ? (
            <Input
              label="Créditos Iniciales"
              type="number"
              value={formData.initial_credits}
              onChange={(e) => handleInputChange('initial_credits', parseInt(e.target.value) || 0)}
              error={errors.initial_credits}
              min="1"
              placeholder="1000"
            />
          ) : (
            <Input
              label="Minutos Iniciales"
              type="number"
              value={formData.initial_minutes}
              onChange={(e) => handleInputChange('initial_minutes', parseInt(e.target.value) || 0)}
              error={errors.initial_minutes}
              min="1"
              placeholder="500"
            />
          )}
        </div>

        {/* Características del Plan */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Características Incluidas</h3>
          
          <Input
            label="Llamadas Concurrentes Máximas"
            type="number"
            value={formData.features.max_concurrent_calls}
            onChange={(e) => handleInputChange('max_concurrent_calls', parseInt(e.target.value) || 1)}
            error={errors.max_concurrent_calls}
            min="1"
            max="50"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.features.voice_cloning}
                onChange={(e) => handleFeatureChange('voice_cloning', e.target.checked)}
                className="mr-2"
              />
              <span>Clonación de Voz</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.features.advanced_analytics}
                onChange={(e) => handleFeatureChange('advanced_analytics', e.target.checked)}
                className="mr-2"
              />
              <span>Analytics Avanzados</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.features.custom_integration}
                onChange={(e) => handleFeatureChange('custom_integration', e.target.checked)}
                className="mr-2"
              />
              <span>Integración Personalizada</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.features.priority_support}
                onChange={(e) => handleFeatureChange('priority_support', e.target.checked)}
                className="mr-2"
              />
              <span>Soporte Prioritario</span>
            </label>
          </div>
        </div>

        {/* Configuraciones */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Configuraciones de Llamadas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hora de Inicio"
              type="time"
              value={formData.settings.allowed_call_hours.start}
              onChange={(e) => handleTimeChange('start', e.target.value)}
            />

            <Input
              label="Hora de Fin"
              type="time"
              value={formData.settings.allowed_call_hours.end}
              onChange={(e) => handleTimeChange('end', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona Horaria
            </label>
            <select
              value={formData.settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Intentos Máximos"
              type="number"
              value={formData.settings.retry_settings.max_attempts}
              onChange={(e) => handleRetrySettingChange('max_attempts', parseInt(e.target.value) || 1)}
              min="1"
              max="10"
            />

            <Input
              label="Horas entre Intentos"
              type="number"
              value={formData.settings.retry_settings.retry_delay_hours}
              onChange={(e) => handleRetrySettingChange('retry_delay_hours', parseInt(e.target.value) || 1)}
              min="1"
              max="168"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
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
              'Crear Cuenta'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};