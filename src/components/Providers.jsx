import { OperationProvider } from "@/contexts/operationProvider";
import { AuthProvider } from "@/contexts/authProvider";
import Redirect from "@/components/Redirect";
import useFullHeight from "@/hooks/useFullHeight";
import { SettingsProvider } from "@/contexts/settingsProvider";
import { Outlet } from "react-router";
import { DownloadsProvider } from "@/contexts/downloadsProvider";

export default function Providers() {

  useFullHeight();

  
  return (
    <AuthProvider>
      <OperationProvider>
        <SettingsProvider>
          <DownloadsProvider>
            <Redirect>
              <div className="outer-container">
                <Outlet />
              </div>
            </Redirect>
          </DownloadsProvider>
        </SettingsProvider>
      </OperationProvider>
    </AuthProvider>
  );
}