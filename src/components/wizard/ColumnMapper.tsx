import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ColumnMapping, ValidationError } from '@/types';

interface ColumnMapperProps {
  sampleRows: Record<string, string>[];
  detectedFormat: 'debt_collection' | 'marketing' | 'generic';
  onMappingChange: (mappings: Record<string, string>) => void;
  onValidationChange: (errors: ValidationError[]) => void;
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  sampleRows,
  detectedFormat,
  onMappingChange,
  onValidationChange
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  // Required variables based on detected format
  const getRequiredVariables = () => {
    const base = ['name', 'phone'];
    
    switch (detectedFormat) {
      case 'debt_collection':
        return [...base, 'debt_amount', 'due_date'];
      case 'marketing':
        return [...base, 'email'];
      default:
        return base;
    }
  };

  // Available variables for mapping
  const getAvailableVariables = () => {
    const required = getRequiredVariables();
    const optional = [
      'email', 'dni', 'address', 'city', 'age', 'gender',
      'debt_amount', 'due_date', 'product', 'campaign_type',
      'phone_2', 'phone_3', 'notes'
    ];
    
    return {
      required,
      optional: optional.filter(v => !required.includes(v))
    };
  };

  const variables = getAvailableVariables();
  const availableColumns = sampleRows.length > 0 ? Object.keys(sampleRows[0]) : [];

  // Auto-mapping based on column names
  useEffect(() => {
    const autoMappings: Record<string, string> = {};
    
    availableColumns.forEach(column => {
      const normalized = column.toLowerCase().trim();
      
      // Phone mapping
      if (['telefono', 'phone', 'celular', 'movil', 'numero'].some(pattern => normalized.includes(pattern))) {
        if (!autoMappings.phone) autoMappings.phone = column;
      }
      
      // Name mapping
      if (['nombre', 'name', 'cliente', 'client'].some(pattern => normalized.includes(pattern))) {
        if (!autoMappings.name) autoMappings.name = column;
      }
      
      // Email mapping
      if (['email', 'correo', 'mail'].some(pattern => normalized.includes(pattern))) {
        if (!autoMappings.email) autoMappings.email = column;
      }
      
      // Debt amount mapping
      if (['monto', 'debt', 'deuda', 'amount', 'valor'].some(pattern => normalized.includes(pattern))) {
        if (!autoMappings.debt_amount) autoMappings.debt_amount = column;
      }
      
      // Due date mapping
      if (['fecha', 'date', 'vencimiento', 'due'].some(pattern => normalized.includes(pattern))) {
        if (!autoMappings.due_date) autoMappings.due_date = column;
      }
    });
    
    setMappings(autoMappings);
  }, [availableColumns]);

  // Validate current mappings
  useEffect(() => {
    const errors: ValidationError[] = [];
    
    // Check required fields
    variables.required.forEach(variable => {
      if (!mappings[variable]) {
        errors.push({
          row: 0,
          column: variable,
          error: `Campo obligatorio sin mapear: ${variable}`,
          value: null
        });
      }
    });
    
    // Validate sample data
    sampleRows.slice(0, 5).forEach((row, index) => {
      Object.entries(mappings).forEach(([variable, column]) => {
        const value = row[column];
        
        if (variable === 'phone' && value) {
          // Basic phone validation
          const phoneRegex = /^\+?[1-9]\d{1,14}$/;
          if (!phoneRegex.test(value.replace(/\s|-/g, ''))) {
            errors.push({
              row: index + 1,
              column,
              error: 'Formato de teléfono inválido',
              value
            });
          }
        }
        
        if (variable === 'email' && value) {
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              row: index + 1,
              column,
              error: 'Formato de email inválido',
              value
            });
          }
        }
      });
    });
    
    onValidationChange(errors);
  }, [mappings, sampleRows, variables.required, onValidationChange]);

  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  const handleMappingChange = (variable: string, column: string) => {
    setMappings(prev => {
      const updated = { ...prev };
      if (column === '') {
        delete updated[variable];
      } else {
        updated[variable] = column;
      }
      return updated;
    });
  };

  const VariableRow = ({ variable, isRequired }: { variable: string; isRequired: boolean }) => (
    <div className="flex items-center space-x-4 p-3 border rounded-lg">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-900">
          {variable}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {getVariableDescription(variable)}
        </p>
      </div>
      
      <div className="flex-1">
        <select
          value={mappings[variable] || ''}
          onChange={(e) => handleMappingChange(variable, e.target.value)}
          className={`
            block w-full px-3 py-2 border rounded-md text-sm
            ${isRequired && !mappings[variable] ? 'border-red-300' : 'border-gray-300'}
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
        >
          <option value="">Seleccionar columna...</option>
          {availableColumns.map(column => (
            <option key={column} value={column}>{column}</option>
          ))}
        </select>
      </div>
      
      <div className="flex-1">
        {mappings[variable] && (
          <div className="text-sm text-gray-600">
            Ejemplo: {sampleRows[0]?.[mappings[variable]] || 'N/A'}
          </div>
        )}
      </div>
    </div>
  );

  function getVariableDescription(variable: string): string {
    const descriptions: Record<string, string> = {
      name: 'Nombre completo del contacto',
      phone: 'Teléfono principal (formato: +56912345678)',
      email: 'Dirección de correo electrónico',
      debt_amount: 'Monto de la deuda',
      due_date: 'Fecha de vencimiento',
      dni: 'RUT o documento de identidad',
      address: 'Dirección',
      city: 'Ciudad',
      age: 'Edad',
      phone_2: 'Teléfono secundario',
      phone_3: 'Teléfono alternativo'
    };
    return descriptions[variable] || 'Variable personalizada';
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Mapeo de Columnas
        </h3>
        <p className="text-blue-700 text-sm">
          Formato detectado: <strong>{detectedFormat}</strong>. 
          Mapea las columnas de tu archivo Excel a las variables del sistema.
        </p>
      </div>

      {/* Preview data */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Vista previa de datos (primeras 3 filas):</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                {availableColumns.map(column => (
                  <th key={column} className="text-left p-2 font-medium text-gray-700">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleRows.slice(0, 3).map((row, index) => (
                <tr key={index} className="border-b border-gray-200">
                  {availableColumns.map(column => (
                    <td key={column} className="p-2 text-gray-600">
                      {row[column] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Required mappings */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Campos Obligatorios:</h4>
        <div className="space-y-3">
          {variables.required.map(variable => (
            <VariableRow key={variable} variable={variable} isRequired={true} />
          ))}
        </div>
      </div>

      {/* Optional mappings */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Campos Opcionales:</h4>
        <div className="space-y-3">
          {variables.optional.map(variable => (
            <VariableRow key={variable} variable={variable} isRequired={false} />
          ))}
        </div>
      </div>
    </div>
  );
};