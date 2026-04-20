import { useState, useEffect } from 'react';

/**
 * Hook para retrasar la actualización de un valor.
 * @param value El valor a debouncing.
 * @param delay El tiempo de retraso en milisegundos.
 * @returns El valor debounced.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Establecer el temporizador para actualizar el valor después del retraso
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el temporizador si el valor cambia (antes de que expire el anterior)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
