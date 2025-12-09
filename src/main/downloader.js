// i want to use electron store to save data
import Store from "electron-store";
import fs from "fs";
import { promises as fsp } from "fs";
import https from "https";
import { ipcMain, app } from "electron";
import path from "path";


/* 
downloadData structure
{
  "project_id": {
    folder_path: "path/to/downloadfolder",
    footage_id: "footage_id",
    "files": {
      "file_id": { // the id of the File document associated with the file
        name: // the name of the file
        category: // the category of the file
        size: // the size of the file as it is in the cloud
        url: // the url of the file on aws s3
        status: // completed,  this is only included in the store if the file is completed, otherwise not
      }
    }
  }
  
}

the path of the file itself is folder_path/category/name


after expansion it will look like this:

{
  "project_id": {
    folder_path: "path/to/downloadfolder",
    "files": [
      {
        id: { // the id of the File document associated with the file
          name: // the name of the file
          category: // the category of the file
          size: // the size of the file as it is in the cloud
          url: // the url of the file on aws s3
          sizeOnDisk: // the size of the file on disk
          status: // the status of the file, can be "paused", "downloading", "completed", "queued"
        },
      }
    ]
  }
}

*/

// i want all the modifications that happen to the downloadData to go through a function rather than directly modifying the downloadData
// we will use a function that will take a path and value;





// a function to check weather the url is valid by sending a head request and checking the status code
const checkUrl = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status == 200;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// a function to periodically check a condition and not resolve until the condition is met
const waitForCondition = async ({condition, interval = 100, timeout = 10000}) => {
  const startTime = Date.now();
  while (!condition()) {
    await new Promise(resolve => setTimeout(resolve, interval));
    if (Date.now() - startTime > timeout) {
      throw new Error("Timeout waiting for condition");
    }
  }

  return true;
}


const processUpdates = (updates) => {
  let processedUpdates = [];

  // we will get rid of rudundant updates, we will reverse the list then only keep the first one and then reverse it again
  updates.reverse();
  for (const {path, value} of updates) {
    // if the path is already in the processedUpdates, we will not add it again
    if (processedUpdates.some(update => update.path === path)) {
      continue;
    } else {
      processedUpdates.push({path, value});
    }
  }

  processedUpdates.reverse();

  return processedUpdates;
}


class Downloader {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.store = new Store();
  
    const downloadFolder = this.store.get("downloadFolder");
    if (!downloadFolder) {
      console.log("no download folder set, setting to default");
      const defaultDownloadFolder = path.join(app.getPath("downloads"), "sila-downloader");
      console.log("default download folder", defaultDownloadFolder);
      this.store.set("downloadFolder", defaultDownloadFolder);
    }

    this.queue = [];
    this.accumulate = false;
    this.accumulatedUpdates = [];
    this.updateInterval = null;


    this.expand();

  }

  updateStoreValue ({projectId, fileId, key, value}) {
    // first write to the store
    this.store.set(`downloadData.${projectId}.files.${fileId}.${key}`, value);

    // then also update the downloadData
    this.setDownloadDataValue(`${projectId}.files.${fileId}.${key}`, value);

  }
  
  setDownloadDataValue(path, value) {
    if (typeof path !== "string" || !path.length) {
      console.error("Invalid path:", path);
      return;
    }
  
    const parts = path.split(".");
    let current = this.downloadData;
  
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        console.error("Invalid path:", path);
        return;
      }
      current = current[parts[i]];
    }

    if (value === undefined) {
      delete current[parts[parts.length - 1]];
    } else {
      current[parts[parts.length - 1]] = value;
    }

    if (this.accumulate) {
      this.accumulatedUpdates.push({path, value});
    }
  }

  startSendingUpdates () {

    this.accumulate = true;
    this.accumulatedUpdates = [];
    
    this.mainWindow.webContents.send('set-download-data', this.downloadData);

    this.updateInterval = setInterval(() => {
      if (this.accumulatedUpdates.length > 0) {
        

        this.mainWindow.webContents.send('send-download-updates', processUpdates(this.accumulatedUpdates));
        this.accumulatedUpdates = [];
      }
    }, 500);
  }

  stopSendingUpdates () {
    this.accumulate = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }



  // this function will be called on startup to prepare the data for the downloader
  // this function expands the data stored in the store to include the size of the file on disk and its download status
  expand () {

    this.downloadData = this.store.get("downloadData") || {};

    // for each project in downloadData, for each file in the project we will check if the size of the file is similar to size
    for (const [projectId, project] of Object.entries(this.downloadData)) {
      for (const [fileId, file] of Object.entries(project.files)) {
        
        const filePath = this.getFilePath(projectId, file);

        // use file system to check the size of the file
        if (file.status != "completed") {
          
          let fileSize = 0;
          try {
            if (fs.existsSync(filePath)) {
              fileSize = fs.statSync(filePath).size;
            }
          } catch (error) {
            // If there's an error reading the file, treat it as non-existent
            fileSize = 0;
          }
          
          // this file is not completed so we mark it as paused
          if (fileSize < file.size) {
            this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "paused");
            this.setDownloadDataValue(`${projectId}.files.${fileId}.sizeOnDisk`, fileSize);
          } else {
            this.updateStoreValue({projectId, fileId, key: "status", value: "completed"});
            this.updateStoreValue({projectId, fileId, key: "sizeOnDisk", value: fileSize});
          }
        }
      }
    }
  }

  pushToQueue (projectId, fileId) {
    this.queue.push({ projectId, fileId, locked: false });
  }

  removeFromQueue (fileId) {
    this.queue = this.queue.filter(file => file.fileId !== fileId);
  }

  isInQueue (fileId) {
    return this.queue.some(file => file.fileId === fileId);
  }


  // this function needs to be atomic, it finds the unlocked files in the queue and starts dowloading them and locks them until there is four locked files
  checkQueue () {
    // count already locked (in-progress) downloads
    let lockedFiles = this.queue.reduce((count, f) => count + (f.locked ? 1 : 0), 0);

    for (const file of this.queue) {
      if (lockedFiles >= 4) break;
      if (!file.locked) {
        file.locked = true;
        lockedFiles++;
        this.startDownload(file.projectId, file.fileId);
      }
    }

    return lockedFiles;
  }

  // this is the actual download function that will handle the downloading of the file
  async startDownload (projectId, fileId) {
    try {
      const project = this.downloadData[projectId];
      const file = this.downloadData[projectId].files[fileId];

      // check if it has a url
      let hasValidUrl = false;
      if (file.url)
        hasValidUrl = await checkUrl(file.url);

      if (!hasValidUrl) {
        const newUrl = await this.getUrl(project.footage_id, fileId);
        this.updateStoreValue({projectId, fileId, key: "url", value: newUrl});
      }

      // at this point we know the url is valid
      const filePath = this.getFilePath(projectId, file);

      // ensure parent directory exists
      const parentDir = path.dirname(filePath);
      await fsp.mkdir(parentDir, { recursive: true });

      // here we check how much the size of the file
      let fileSize = 0;
      try {
        const stat = await fsp.stat(filePath);
        fileSize = stat.size;
      } catch (e) {
        fileSize = 0;
      }


      // as long as the file size is not full we download a chunck of it and write it to the file stream
      if (fileSize < file.size) {
        const fileStream = fs.createWriteStream(filePath, { flags: fileSize > 0 ? "a" : "w" });

        const requestOptions = fileSize > 0 ? { headers: { Range: `bytes=${fileSize}-` } } : {};

        let lastPersistAt = Date.now();

        const urlObject = new URL(file.url);
        const options = { ...requestOptions };
        const req = https.get(file.url, options, (response) => {
          this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "downloading");

          response.pipe(fileStream);

          if (response.statusCode !== 200 && response.statusCode !== 206) {
            console.log("received an error")
            console.log(response.statusCode)
            file.status = "error";
            fileStream.close();
            this.removeFromQueue(fileId);
            this.checkQueue();
            return;
          }

          response.on("data", (chunk) => {
            fileSize += chunk.length;
            this.setDownloadDataValue(`${projectId}.files.${fileId}.sizeOnDisk`, fileSize);

            if (file.halt) {
              console.log("file.halt", file.halt);
              fileStream.close();
              req.destroy();
              this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "paused");
              this.removeFromQueue(fileId);
              this.checkQueue();
              return;
            }

          });

          response.on("end", () => {
            console.log("end event")
            fileStream.close();
            this.setDownloadDataValue(`${projectId}.files.${fileId}.sizeOnDisk`, fileSize);
            this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "completed");
            this.removeFromQueue(fileId);
            this.checkQueue();
          });

          response.on("error", (err) => {
            console.log("an error has occured", err)
            if (file.status != "paused") {
              this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "error");
            }
            try { fileStream.close(); } catch {}
            this.removeFromQueue(fileId);
            this.checkQueue();
          });
        });

        req.on("error", (err) => {
          console.log("an error has occured 2", err)

          this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "error");
          try { fileStream.close(); } catch {}
          this.removeFromQueue(fileId);
          this.checkQueue();
        });

        


      } else if (fileSize >= file.size) {
        this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "completed");
        this.removeFromQueue(fileId);
        this.checkQueue();
      }
    } catch (error) {
      console.log(error);
      console.error("startDownload error:", error?.message || error);
    }
  
  }

  getFilePath (projectId, file) {
    try {
      const project = this.downloadData[projectId];
      let filePath;

      if (file.category) {
        filePath = path.join(project.folder_path, file.category, file.name);
      } else {
        filePath = path.join(project.folder_path, file.name);
      }
      
      return filePath;
    } catch (error) {
      console.error("getFilePath error:", error?.message || error);
      return null;
    }
  }

  start (projectId, fileId) {
    try {
      // check if its in the downloadData
      const file = this.downloadData[projectId].files[fileId];
      if (!file)
        return;

      // check if its already in queue
      if (this.isInQueue(fileId))
        return;

      this.pushToQueue(projectId, fileId);
      this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "queued");
      this.setDownloadDataValue(`${projectId}.files.${fileId}.halt`, false);
      // trigger queue processing
      this.checkQueue();
    } catch (error) {
      console.error("start error:", error?.message || error);
    }
  }

  startMany (projectId, fileIds) {
    try {
      const project = this.downloadData[projectId];
      if (!project) return;
      for (const fileId of fileIds || []) {
        const file = project.files?.[fileId];
        if (!file) continue;
        if (this.isInQueue(fileId)) continue;
        this.pushToQueue(projectId, fileId);
        this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "queued");
        this.setDownloadDataValue(`${projectId}.files.${fileId}.halt`, false);
      }
      this.checkQueue();
    } catch (error) {
      console.error("startMany error:", error?.message || error);
    }
  }

  pause (projectId, fileId) {
    try {
      // check if its in the downloadData
      const file = this.downloadData[projectId].files[fileId];
      if (!file) {
        console.log("file not found in download data")
        return;
      }
      console.log("pausing file", fileId);
      this.setDownloadDataValue(`${projectId}.files.${fileId}.halt`, true);
    } catch (error) {
      console.error("pause error:", error?.message || error);
    }
  }

  pauseMany (projectId, fileIds) {
    try {
      const project = this.downloadData[projectId];
      if (!project) return;
      for (const fileId of fileIds || []) {
        const file = project.files?.[fileId];
        if (!file) continue;

        // if the file is in the queue, we halt it only
        if (this.isInQueue(fileId)) {
          this.setDownloadDataValue(`${projectId}.files.${fileId}.halt`, true);
          this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "paused");
          this.removeFromQueue(fileId);
        } else {
          this.setDownloadDataValue(`${projectId}.files.${fileId}.halt`, true);
          this.setDownloadDataValue(`${projectId}.files.${fileId}.status`, "paused");
        }

      }
    } catch (error) {
      console.error("pauseMany error:", error?.message || error);
    }
  }

  download (project, file, category) {
    try {
      // check if its in the downloadData
      console.log(this.downloadData);
      const fileInData = this.downloadData?.[project._id]?.files?.[file._id];
      if (!fileInData)
        this.createNewDownload({project, file, category});

      this.start(project._id, file._id);
    } catch (error) {
      console.error("download error:", error?.message || error);
    }
  }

  downloadMany (project, filesWithCategories) {
    try {
      if (!Array.isArray(filesWithCategories) || filesWithCategories.length === 0) return;

      // Ensure project exists
      if (!this.downloadData[project._id]) {
        const projectData = {
          folder_path: path.join(this.store.get("downloadFolder"), project.name + "-" + project._id),
          footage_id: project.footage._id,
          files: {}
        };
        this.setDownloadDataValue(`${project._id}`, projectData);
        this.store.set(`downloadData.${project._id}`, projectData);
      }

      for (const { file, category } of filesWithCategories) {
        const fileInData = this.downloadData?.[project._id]?.files?.[file._id];
        if (!fileInData) {
          this.createNewDownload({ project, file, category });
        }
      }

      const fileIds = filesWithCategories.map(({ file }) => file._id);
      this.startMany(project._id, fileIds);
    } catch (error) {
      console.error("downloadMany error:", error?.message || error);
    }
  }

  async delete (projectId, fileId) {
    try {
      // check if its in the downloadData
      const file = this.downloadData[projectId].files[fileId];
      if (!file)
        return;

      // check if its downloading
      if (this.isInQueue(fileId)) {
        this.pause(projectId, fileId);
        // we wait for it to be paused
        await waitForCondition({condition: () => !this.isInQueue(fileId), interval: 100, timeout: 10000});
      }

      // delete the file from disk
      const filePath = this.getFilePath(projectId, file);
      try {
        await fsp.unlink(filePath);
      } catch (e) {
        // ignore if file doesn't exist
      }

      // delete the file from the downloadData
      this.setDownloadDataValue(`${projectId}.files.${fileId}`, undefined);
      this.store.delete(`downloadData.${projectId}.files.${fileId}`);
    } catch (error) {
      console.error("delete error:", error?.message || error);
    }
  }

  async deleteMany (projectId, fileIds) {
    try {
      const project = this.downloadData[projectId];
      if (!project) return;

      this.pauseMany(projectId, fileIds);

      // Wait for all to fileeIds files to be out of queue
      await waitForCondition({ condition: () => this.queue.every(file => !fileIds.includes(file.fileId)), interval: 100, timeout: 10000 });

      for (const fileId of fileIds || []) {
        const file = project.files?.[fileId];
        if (!file) continue;
        const filePath = this.getFilePath(projectId, file);
        try {
          await fsp.unlink(filePath);
        } catch (e) {
          // ignore if file doesn't exist
        }
        this.setDownloadDataValue(`${projectId}.files.${fileId}`, undefined);
        this.store.delete(`downloadData.${projectId}.files.${fileId}`);
      }

      this.checkQueue();
    } catch (error) {
      console.error("deleteMany error:", error?.message || error);
    }
  }

  createNewDownload ({project, file, category}) {
    try {
      // check if the project exists in the downloadData
      const projectIsInData = this.downloadData[project._id];


      if (!projectIsInData) {
        // create the project
        const projectData = {
          folder_path: path.join(this.store.get("downloadFolder"), project.name + "-" + project._id),
          footage_id: project.footage._id,
          files: {}
        };

        this.setDownloadDataValue(`${project._id}`, projectData);
        this.store.set(`downloadData.${project._id}`, projectData);
      }
      
      const fileName = file.name;
      const fileSize = file.size;
      const fileId = file._id;
      const fileCategory = category;
      const creationDate = Date.now();
      

      // create the file
      const fileData = {
        date: creationDate,
        name: fileName,
        category: fileCategory,
        size: fileSize,
        status: "paused"
      };

      this.setDownloadDataValue(`${project._id}.files.${fileId}`, fileData);
      this.store.set(`downloadData.${project._id}.files.${fileId}`, {
        date: creationDate,
        name: fileName,
        category: fileCategory,
        size: fileSize,
      });
    } catch (error) {
      console.error("createNewDownload error:", error?.message || error);
    }
  }

  async getUrl (footageId, fileId) {
    try {
      this.mainWindow.webContents.send('get-url', footageId, fileId);

      const url = await new Promise((resolve, reject) => {
        ipcMain.once(`url-${fileId}`, (event, receivedUrl) => {
          resolve(receivedUrl);
        });
      });

      return url;
    } catch (error) {
      console.error("getUrl error:", error?.message || error);
      return null;
    }
  }

}


export default Downloader;