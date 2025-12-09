import { useSettings } from "@/contexts/settingsProvider";
import { IconPlayerPlayFilled, IconPlayerPauseFilled, IconTrash, IconDownload, IconFolder } from "@tabler/icons-react";
import SelectionInfo from "./selectionInfo";
import React, { useMemo, useRef } from "react";
import { useData } from "@/contexts/operationProvider";
import { useDownloads } from "@/contexts/downloadsProvider";
import ActionDialog from "@/components/dialogs/actionDialog";

const ProjectHeader = React.memo(({className}) => {
  const { settings } = useSettings();
  const { data } = useData();
  const deleteDialogRef = useRef(null);

  const affectedFiles = useMemo(() => {
    if (!settings.selectedProject?._id) {
      return [];
    }

    const selectedFiles = Object.values(settings.selectedFiles)
      .filter(file => file.selected)
      .map(file => file.file);

    if (selectedFiles.length > 0) {
      return selectedFiles;
    }
    
    const footageKey = `footage-${settings.selectedProject?._id}`;
    const footage = data?.[footageKey]?.data;

    if (footage?.categorized) {
      if (settings.selectedCategory) {
        const files = footage?.categories?.[settings.selectedCategory] || [];
        return files;
      } else {
        const allFiles = Object.values(footage?.categories).flat();
        return allFiles;
      }
    } else {
      return footage?.files;
    }
  }, [settings, data]);

  const handleDownload = () => {
    const footageKey = `footage-${settings.selectedProject?._id}`;
    const footage = data?.[footageKey]?.data;
    const footageIsCategorized = footage?.categorized;

    const filesWithCategories = affectedFiles.map(file => {
      let category = "1";
      if (footageIsCategorized) {
        category = Object.entries(footage.categories).find(([key, val]) => val.some(f => f._id == file._id))?.[0];
      }
      return { file, category };
    });

    window.api.downloadFiles(settings.selectedProject, filesWithCategories);
  }



  const handleDelete = () => {
    const fileIds = affectedFiles.map(file => file._id);
    window.api.deleteDownloads(settings.selectedProject._id, fileIds);
    return {ok: true};
  }

  const handleStart = () => {
    const fileIds = affectedFiles.map(file => file._id);
    window.api.startDownloads(settings.selectedProject._id, fileIds);
  }

  const handlePause = () => {
    const fileIds = affectedFiles.map(file => file._id);
    window.api.pauseDownloads(settings.selectedProject._id, fileIds);
  }


  return (
    <div className={className}>
      <div className="flex gap-6 items-center">
        <div className=" flex gap-2 items-center">
          <button onClick={handleStart} className="icon-button-square-big">
            <IconPlayerPlayFilled size={24} />
          </button>
          <button onClick={handlePause} className="icon-button-square-big">
            <IconPlayerPauseFilled size={24} />
          </button>
          <button onClick={() => deleteDialogRef.current.open()} className="icon-button-square-big">
            <IconTrash size={24} />
          </button>
        </div>
        <SelectionInfo />
      </div>
      
      <div className="flex gap-2">
        <OpenFolderButton />
        <button onClick={handleDownload} className="primary-colors size">
          <IconDownload size={20} />
          <p className="">Download</p>
        </button>
      </div>
      <ActionDialog
        ref={deleteDialogRef}
        asyncFunction={handleDelete}
        dialogInfo={{
          title: "Delete",
          actionLabel: "Delete",
        }}
        onSuccess={() => {
          console.log("deleted");
        }}
      >
        <p>Are you sure you want to delete the selected files?</p>
      </ActionDialog>
    </div>
  );

});



const OpenFolderButton = () => {

  const { settings } = useSettings();
  const { downloads } = useDownloads();

  const selectedProjectHasFolder = useMemo(() => {
    const projectId = settings.selectedProject?._id;
    if (!projectId) {
      return false;
    }
    const projectFolder = downloads[projectId]?.folder_path;
    return projectFolder != null;
  }, [settings.selectedProject?._id, downloads]);

  const handleOpenFolder = () => {
    const projectId = settings.selectedProject?._id;
    if (!projectId) {
      return;
    }
    window.api.openFolder(projectId);
  }

  if (!selectedProjectHasFolder) {
    return null;
  }

  return (
    <button onClick={handleOpenFolder} className="outline-colors size">
      <IconFolder size={20} />
      <p className="">Open Folder</p>
    </button>
  )
}


export default ProjectHeader;
