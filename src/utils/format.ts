// Utilidades para formateo de números y valores

/**
 * Formatea un número con máximo 2 decimales
 * @param num - Número a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado con separadores de miles
 */
export const formatNumber = (num: number | undefined | null, decimals: number = 2): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  return Number(num.toFixed(decimals)).toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

/**
 * Formatea un valor monetario (CLP por defecto)
 * @param amount - Monto a formatear
 * @param currency - Código de moneda (por defecto CLP)
 * @returns String formateado como moneda
 */
export const formatCurrency = (amount: number | undefined | null, currency: string = 'CLP'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency 
    }).format(0);
  }
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency 
  }).format(amount);
};

/**
 * Formatea minutos a un formato legible
 * @param minutes - Minutos a formatear
 * @returns String formateado (ej: "123.45 min")
 */
export const formatMinutes = (minutes: number | undefined | null): string => {
  return `${formatNumber(minutes)} min`;
};

/**
 * Formatea créditos
 * @param credits - Créditos a formatear
 * @returns String formateado (ej: "1,234.56 créditos")
 */
export const formatCredits = (credits: number | undefined | null): string => {
  return `${formatNumber(credits)} créditos`;
};

/**
 * Formatea un porcentaje
 * @param value - Valor del porcentaje (0-100)
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado (ej: "87.50%")
 */
export const formatPercentage = (value: number | undefined | null, decimals: number = 2): string => {
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Formatea duración en segundos a formato legible
 * @param seconds - Segundos a formatear
 * @returns String formateado (ej: "2:05" o "1:30:45")
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formatea bytes a formato legible (KB, MB, GB)
 * @param bytes - Bytes a formatear
 * @returns String formateado (ej: "1.5 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const decimals = 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${formatNumber(bytes / Math.pow(k, i), decimals)} ${sizes[i]}`;
};
