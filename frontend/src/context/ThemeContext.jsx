import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    // Cargar tema guardado o usar 'claro' por defecto
    const guardado = localStorage.getItem('tema');
    return guardado || 'claro';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (tema === 'oscuro') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => {
    setTema((prev) => (prev === 'claro' ? 'oscuro' : 'claro'));
  };

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTema = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTema debe usarse dentro de ThemeProvider');
  return context;
};