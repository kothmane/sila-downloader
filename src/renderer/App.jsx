import { IconDotsVertical, IconLogout, IconSettings } from '@tabler/icons-react';
import React, { useEffect, useRef } from 'react';
import ProjectsClient from '@/components/projects/projectsClient';
import ProjectClient from '@/components/projects/projectClient';
import ProjectHeader from '@/components/projects/projectHeader';
import Dropdown from '@/components/basic/dropdown';
import { useOperation } from '@/contexts/operationProvider';
import FormDialog from '@/components/dialogs/formDialog';
import { useSettings } from '@/contexts/settingsProvider';
import { FolderInput } from '@/components/basic/Form';
import { useAuth } from '@/contexts/authProvider';

const App = () => {
  const { operation } = useOperation();
  const { settings, updateSettings } = useSettings();
  const settingsDialogRef = useRef(null);
  const { signOut, admin } = useAuth();

  useEffect(() => {
    let unsubscribe, unsubscribeDownloadFolder;

    if (window.api) {
      unsubscribe = window.api?.onGetUrl?.(async (footageId, fileId) => {
        console.log("calling onGetUrl");
        const response = await operation({
          collection: "Footage",
          name: "getDownloadUrl",
          id: footageId,
          data: { fileId }
        });

        const url = response.data[0][0];
        window.api.submitUrl(fileId, url);

      });

      unsubscribeDownloadFolder = window.api?.onDownloadFolderUpdated?.(async (folderPath) => {
        console.log("download folder updated", folderPath);
        updateSettings({ downloadFolder: folderPath });
      });
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (typeof unsubscribeDownloadFolder === 'function') unsubscribeDownloadFolder();
    };
  }, [operation, updateSettings]);

  return (
    <>
      <div className="flex justify-between items-stretch h-full w-full">
        <div className="w-[300px] h-full flex flex-col gap-4">
          <div className="menu-header">
            <p className="logo">Sila Downloader</p>
              <Dropdown>
                <Dropdown.Toggle>
                  <button className="transparent-icon-button">
                    <IconDotsVertical size={24} />
                  </button>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item className="flex gap-4" onClick={() => settingsDialogRef.current?.open()}>
                    <IconSettings size={20} /> 
                    <p>Settings</p>
                  </Dropdown.Item>
                  <Dropdown.Item className="flex gap-4" onClick={() => {signOut()}}>
                    <IconLogout size={20} /> 
                    <p>Sign out</p>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
          </div>
          <div className="menu-content">
            <ProjectsClient />
          </div>
        </div>
        <div className="flex-1 bg-medium flex flex-col">
          <ProjectHeader className="p-4 flex justify-between items-center bg-light" />
          <ProjectClient className="flex-1 overflow-y-auto" />
        </div>
      </div>
      <FormDialog
        ref={settingsDialogRef} 
        asyncFunction={(data) => {
          window.api?.setDownloadFolder(data.download_folder);
          console.log("download folder set to", data.download_folder);
          return { ok: true };
        }}
        formInfo={{
          validationFunction: (data) => {
            return { success: true, error: null };
          },
          initialData: {
            download_folder: settings.downloadFolder,
          },
        }}
        onSuccess={() => {}}
        onCancel={() => {}}
        dialogInfo={{
          title: "Settings",
          actionLabel: "Save",
        }}
      >
        <FolderInput inputInfo={{ type: "folder", dataId: "download_folder", label: "Download Folder" }} />
        
      </FormDialog>
    </>
  );
};

export default App;
