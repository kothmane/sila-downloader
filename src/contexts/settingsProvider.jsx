import { createContext, useContext, useState } from "react";


const SettingsContext = createContext();

const useSettings = () => {
  return useContext(SettingsContext);
}


const SettingsProvider = ({ children }) => {

  const [settings, setSettings] = useState({
    selectedFiles: {},
    selectedProject: null,
    selectedCategory: null,
  });

  const updateSettings = (data) => {
    setSettings((prev) => ({ ...prev, ...data }));
  }


  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );

}

export { SettingsProvider, useSettings };