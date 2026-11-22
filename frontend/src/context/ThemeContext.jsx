import { createContext, useContext, useEffect } from 'react';
import { useAjustes, setAjustes, aplicarTemaDocumento, temaOscuroActual } from '../design/ajustes';

const ThemeContext = createContext(null);

/**
 * Fuente única de verdad del tema: el store de ajustes.
 * Este provider solo observa y delega; nunca escribe la clase por su cuenta,
 * de modo que ningún effect compitiendo pueda revertir el toggle.
 */
export function ThemeProvider({ children }) {
  const a = useAjustes();

  useEffect(() => {
    aplicarTemaDocumento(a.tema);
  }, [a.tema]);

  const value = {
    oscuro: temaOscuroActual(a.tema),
    tema: a.tema,
    toggle: () => setAjustes({ tema: temaOscuroActual(a.tema) ? 'claro' : 'oscuro' }),
    setTema: (t) => setAjustes({ tema: t }),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);