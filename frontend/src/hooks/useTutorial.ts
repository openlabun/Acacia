import { useState, useCallback } from 'react';

const TUTORIAL_KEY = 'acacia_intro_seen_time';
const EXPIRATION_TIME_MS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

export function useTutorial() {
  const [runTutorial, setRunTutorial] = useState(() => {
    try {
      const savedTimestamp = localStorage.getItem(TUTORIAL_KEY);
      const now = Date.now();
      
      // Si no existe, o si ya pasaron 24 horas
      if (!savedTimestamp || now > parseInt(savedTimestamp, 10) + EXPIRATION_TIME_MS) {
        // ESTRATEGIA A PRUEBA DE BALAS: 
        // Guardamos en el localStorage INMEDIATAMENTE. 
        // Así, si el usuario navega a la Malla sin cerrar el tutorial, ya quedó registrado.
        localStorage.setItem(TUTORIAL_KEY, now.toString());
        return true; 
      }

      return false; // Si ya lo vio hace menos de 24h, no lo mostramos.
    } catch (error) {
      console.warn("localStorage no está disponible", error);
      return false; // Fallback de seguridad
    }
  });

  // Usamos 'any' para evitar el error del CallBackProps y los cambios de versión de la librería
  const handleJoyrideCallback = useCallback((data: any) => {
    const { status, type } = data;
    
    // Validamos si el tour terminó, fue omitido, o se cerró por evento
    if (
      status === 'finished' || 
      status === 'skipped' || 
      type === 'tour:end'
    ) {
      setRunTutorial(false);
    }
  }, []);

  return { runTutorial, handleJoyrideCallback };
}