import { IconPhoto, IconVideo, IconFile, IconLoader2, IconPlayerPause, IconCheck, IconX } from "@tabler/icons-react";
import React, { useCallback, useMemo, useState } from "react";
import { useSettings } from "@/contexts/settingsProvider";
import { useDownloads } from "@/contexts/downloadsProvider";



/* 
  possible status:
  - downloading
  - paused
  - completed
  - error
  - queued


*/


export default React.memo(({file}) => {

  const { settings, updateSettings } = useSettings();



  const isImage = file.type.split("/")[0] == "image";
  const isVideo = file.type.split("/")[0] == "video";

  const Icon = isImage ? IconPhoto : isVideo ? IconVideo : IconFile;

  const getReadableSize = useCallback((size) => {
    if (size > 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else if (size > 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${size} B`;
    }
  }, []);

  const getReadableDate = useCallback((date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);



  const isSelected = useMemo(() => settings.selectedFiles[file._id]?.selected || false, [settings.selectedFiles, file]);

  const handleSelect = useCallback(() => {

    const oldFileInfo = settings.selectedFiles?.[file._id] || {selected: false, file};

    const updatedFileInfo = {...oldFileInfo, selected: !isSelected};
    updateSettings({
      selectedFiles: {...settings.selectedFiles, [file._id]: updatedFileInfo}
    });
  }, [isSelected, file, settings.selectedFiles]);


  return (
    <div onClick={handleSelect} className="bg-light hover:bg-lightest p-2 rounded-md h-fit flex gap-2 group min-w-0 overflow-hidden">
      {
        file.thumbnail_url &&
        <img src={file.thumbnail_url} alt={file.name} className="w-20 h-20 object-cover" />
      }
      {
        !file.thumbnail_url &&
        <div className="w-20 h-20 bg-lightest flex items-center justify-center">
          <Icon size={30} className="text-neutral-500" />
        </div>
      }
      <div className="flex-1 min-w-0 flex flex-col gap-1 h-20">
        <div className="flex justify-between gap-2 h-full w-full min-w-0">
          <div className="flex flex-col justify-between h-full min-w-0">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted text-ellipsis overflow-hidden whitespace-nowrap">{getReadableSize(file.size)} - {getReadableDate(file.date)}</p>
            </div>
            {
              <FileDownloadInfo file={file} />
            }
          </div>
          <div className="">
            {
              isSelected &&
              <input readOnly type="checkbox" className="w-8 h-8 rounded-md" checked={true}  />
            }
            {
              !isSelected &&
              <input readOnly type="checkbox" className="w-8 h-8 rounded-md group-hover:block hidden" checked={false}  />
            }
          </div>
        </div>
      </div>
    </div>
  );
});



const FileDownloadInfo = React.memo(({file}) => {

  const { downloads } = useDownloads();
  const { settings } = useSettings();

  const fileDownloadInfo = useMemo(() => {
    return downloads[settings.selectedProject?._id]?.files[file._id];
  }, [downloads, settings.selectedProject?._id, file._id]);



  if (!fileDownloadInfo) {
    return null;
  }


  // if its not completed we display the status along with a status bar (progress determined by sizeOnDisk / size)
  if (["downloading", "paused"].includes(fileDownloadInfo.status) ) {
    return (
      <div className="flex flex-col gap-1">
        <div className="w-full bg-gray-200 rounded h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded"
            style={{
              width: `${Math.min(100, Math.max(0, (fileDownloadInfo.sizeOnDisk / fileDownloadInfo.size) * 100))}%`
            }}
          ></div>
        </div>
        <FileDownloadStatus status={fileDownloadInfo.status} />
      </div>
    );
  }

  // if its completed we display the status only
  return (
    <FileDownloadStatus status={fileDownloadInfo.status} />
  );
});

const statusColor = {
  paused: "text-yellow-500",
  queued: "text-gray-500",
  downloading: "text-blue-500",
  completed: "text-green-500",
  error: "text-red-500",
}


const FileDownloadStatus = ({status = ""}) => {
  return (
    // icon + status 
    <div className="flex items-center gap-1">
      { status == "paused" && <IconPlayerPause size={20} className={statusColor[status]} /> }
      { status == "queued" && <IconLoader2 size={20} className={`animate-spin ${statusColor[status]}`} /> }
      { status == "downloading" && <IconLoader2 size={20} className={`animate-spin ${statusColor[status]}`} /> }
      { status == "completed" && <IconCheck size={20} className={statusColor[status]} /> }
      { status == "error" && <IconX size={20} className={statusColor[status]} /> }
      <p className={`text-sm font-medium ${statusColor[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</p>
    </div>
  );
}
