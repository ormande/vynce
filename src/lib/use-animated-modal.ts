"use client";

import { useEffect, useState } from "react";

/**
 * Controla o ciclo de vida de animação de um modal.
 * Mantém o modal renderizado durante a animação de saída antes de desmontar.
 */
export function useAnimatedModal(isOpen: boolean, exitDuration = 180) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, exitDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, exitDuration]);

  return { shouldRender, isClosing };
}
