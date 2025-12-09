import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const DownloadsContext = createContext();


const useDownloads = () => {
    return useContext(DownloadsContext);
}

const DownloadsProvider = ({children}) => {
    const downloadsRef = useRef(null);
    const [downloads, setDownloads] = useState({});


    const handleSetDownloads = useCallback((downloadData) => {
        setDownloads((_) => downloadData);
        downloadsRef.current = downloadData;
    }, [setDownloads]);

    const handleDownloadDataUpdates = useCallback((downloadUpdates) => {
        let updatedDownloads = {...downloadsRef.current};
        
        for (const {path, value} of downloadUpdates) {
            if (typeof path !== "string" || !path.length) {
                console.error("Invalid path:", path);
                return;
            }
        
            const parts = path.split(".");
            let current = updatedDownloads;
        
            for (let i = 0; i < parts.length - 1; i++) {
                if (current[parts[i]] === undefined) {
                    console.error("Invalid path:", path, "part", parts[i], "not found in", current);
                    // in this case to preserve the data we are going to ask for a full copy
                   /*  window.api.requestDownloadData(); */
                    return;
                }
                current = current[parts[i]];
            }

            if (value === undefined) {
                delete current[parts[parts.length - 1]];
            } else {
                current[parts[parts.length - 1]] = value;
            }
        }

        console.log("final updated downloads", updatedDownloads);
        handleSetDownloads(updatedDownloads);
    }, [downloads]);

    useEffect(() => {
        let unsubscribe, unsubscribe2;
        if (window.api) {
            unsubscribe = window.api.setDownloadDataHandler((downloadData) => {
                console.log("download data received", downloadData);
                handleSetDownloads(downloadData);
            });

            unsubscribe2 = window.api.setDownloadUpdatesHandler((downloadUpdates) => {
                console.log("download updates received", downloadUpdates);
                handleDownloadDataUpdates(downloadUpdates);
            });

            window.api.requestDownloadData();
        }
        
        return () => {
            if (unsubscribe) unsubscribe();
            if (unsubscribe2) unsubscribe2();
        }
    }, []);

    return (    
        <DownloadsContext.Provider value={{downloads, setDownloads}}>
            {children}
        </DownloadsContext.Provider>
    )
}

export { DownloadsProvider, useDownloads };