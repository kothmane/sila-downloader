import { useSettings } from "@/contexts/settingsProvider";
import { IconX } from "@tabler/icons-react";
import React, { useEffect, useMemo } from "react";
import { useData } from "@/contexts/operationProvider";


export default React.memo(({className}) => {
  const { settings, updateSettings } = useSettings();
  const { data } = useData();
  
  const numberOfSelectedFiles = Object.values(settings.selectedFiles).filter(file => file.selected).length;
  const footageKey = `footage-${settings.selectedProject?._id}`;
  const footageReady = useMemo(() => data?.[footageKey]?.valid, [data, settings.selectedProject?._id]);
  const footage = useMemo(() => data?.[footageKey]?.data, [data, settings.selectedProject?._id]);


  return (
    <div className="flex justify-between items-center">
      {
        footageReady && footage.categorized &&
        <>
          <button className={`neutral-colors size ${settings.selectedCategory == null ? "bg-lightest" : "bg-light"}`} onClick={() => updateSettings({selectedCategory: null})}>
            <p>All</p>
          </button>
          {Object.keys(footage.categories).map(category => (
            <button key={category} className={`neutral-colors size ${settings.selectedCategory == category ? "bg-lightest" : "bg-light"}`} onClick={() => updateSettings({selectedCategory: category})}>
              <p>{category}</p>
            </button>
          ))}
        </>
      }
      {
        numberOfSelectedFiles > 0 &&
        <div className="outline-colors size">
          <p>{numberOfSelectedFiles} files selected</p>
          <button onClick={() => updateSettings({selectedFiles: {}})} className="tiny-icon-size primary-colors bg-red-400 rounded-md">
            <IconX />
          </button>
        </div>
      }
    </div>
  );


});