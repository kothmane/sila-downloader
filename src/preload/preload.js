const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('api', {

  submitUrl: (fileId, url) => {
    ipcRenderer.send(`url-${fileId}`, url);
  },

  onGetUrl: (handler) => {
    const listener = (event, footageId, fileId) => handler(footageId, fileId);
    ipcRenderer.on('get-url', listener);
    return () => ipcRenderer.removeListener('get-url', listener);
  },

  openFolder: (projectId) => {
    ipcRenderer.send('open-folder', projectId);
  },

  setDownloadFolder: (folderPath) => {
    ipcRenderer.send('set-download-folder', folderPath);
  },

  onDownloadFolderUpdated: (handler) => {
    const listener = (event, folderPath) => handler(folderPath);
    ipcRenderer.on('download-folder-updated', listener);
    return () => ipcRenderer.removeListener('download-folder-updated', listener);
  },

  pickFolder: () => {
    return ipcRenderer.invoke('pick-folder');
  },

  startDownload: (projectId, fileId) => {
    ipcRenderer.send('start-download', projectId, fileId);
  },
  
  pauseDownload: (projectId, fileId) => {
    ipcRenderer.send('pause-download', projectId, fileId);
  },
  
  deleteDownload: (projectId, fileId) => {
    ipcRenderer.send('delete-download', projectId, fileId);
  },
  
  // Batch operations
  startDownloads: (projectId, fileIds) => {
    ipcRenderer.send('start-downloads', projectId, fileIds);
  },

  pauseDownloads: (projectId, fileIds) => {
    ipcRenderer.send('pause-downloads', projectId, fileIds);
  },

  deleteDownloads: (projectId, fileIds) => {
    ipcRenderer.send('delete-downloads', projectId, fileIds);
  },
  
  downloadFile: (project, file, category) => {
    ipcRenderer.send('download-file', project, file, category);
  },

  downloadFiles: (project, filesWithCategories) => {
    ipcRenderer.send('download-files', project, filesWithCategories);
  },


  setDownloadDataHandler: (handler) => {
    const listener = (event, downloadData) => {
      handler(downloadData);
    };
    ipcRenderer.on('set-download-data', listener);
    return () => ipcRenderer.removeListener('set-download-data', listener);
  },

  setDownloadUpdatesHandler: (handler) => {
    const listener = (event, downloadUpdates) => {
      handler(downloadUpdates);
    };
    ipcRenderer.on('send-download-updates', listener);
    return () => ipcRenderer.removeListener('send-download-updates', listener);
  },

  requestDownloadData: () => {
    ipcRenderer.send('request-download-data');
  },
});


try {
  // Expose the React DevTools hook to the renderer
  const devToolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (devToolsHook) {
    contextBridge.exposeInMainWorld('__REACT_DEVTOOLS_GLOBAL_HOOK__', devToolsHook);
  }
} catch (e) {
  console.warn('React DevTools hook injection failed', e);
}