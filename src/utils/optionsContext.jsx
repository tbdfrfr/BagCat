import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const OptionsContext = createContext();

const getStoredOptions = () => {
  try {
    return JSON.parse(localStorage.getItem('options') || '{}');
  } catch {
    return {};
  }
};

export const OptionsProvider = ({ children }) => {
  const [options, setOptions] = useState(getStoredOptions);

  const updateOption = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return;
    setOptions((prev) => ({ ...prev, ...obj }));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('options', JSON.stringify(options));
    } catch {}
  }, [options]);

  const contextValue = useMemo(() => ({ options, updateOption }), [options, updateOption]);

  return <OptionsContext.Provider value={contextValue}>{children}</OptionsContext.Provider>;
};

export const useOptions = () => {
  const context = useContext(OptionsContext);
  if (!context) {
    throw new Error('useOptions must be used within an OptionsProvider');
  }
  return context;
};
