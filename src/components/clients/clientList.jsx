import { useData } from "@/contexts/operationProvider";
import { useMemo, useEffect, useRef } from "react";
import { wilayas } from "@/assets/dictionaries"
import ClientCard from "./clientCard";
import OperationFormDialog from "@/components/dialogs/operationFormDialog";
import { Input } from "@/components/basic/Form";
import DataStateHandler from "../basic/dataStateHandler";
import { useAuth } from "@/contexts/authProvider";

const ClientList = ({wilaya}) => {
  const { data, fetchData } = useData();
  const { adminHasRole } = useAuth();
  const createDialogRef = useRef(null);

  const clientListData = useMemo(() => {
    return data?.[`wilayaClients-${wilaya}`]?.data || [];
  }, [data, wilaya]);

  const clientListReady = useMemo(() => data?.[`wilayaClients-${wilaya}`]?.valid, [data]);
  
  useEffect(() => {
    fetchData({
      key: `wilayaClients-${wilaya}`,
      collection: "client",
      operationName: "get",
      operationData: { filter: {wilaya}},
      invalidatingOperations: ["create", "edit", "delete"]
    });
  }, [wilaya]);


  return (
    <>
      <div className="collection-head">
        <h1>{wilaya} - {wilayas[wilaya]}</h1>
        <div className="collection-head-actions">
          {
            adminHasRole("super_admin") &&
            <button className="primary-button" onClick={() => createDialogRef.current.open()}>
              Ajouter
            </button>
          }
        </div>
      </div>
      {
        !clientListReady &&
        <DataStateHandler dataKey={`wilayaClients-${wilaya}`} />
      }
      {
        clientListReady && 
        <>
          {
            clientListData.length === 0 &&
            <div className="card w-full h-30 flex flex-col items-center justify-center px-16">
              <p className="">Aucun client trouvé</p>
            </div>
          }
          {
            clientListData.length > 0 &&
            <div className="flex flex-col gap-2">
              {
                clientListData.map((client) => (
                  <ClientCard key={client._id} client={client} wilaya={wilaya} />
                ))
              }
            </div>
          }
        </>
      }
      <OperationFormDialog
        ref={createDialogRef}
        operationInfo={{ collection: "client", name: "create" }}
        dialogInfo={{
          title: "Créer un client",
          actionLabel: "Créer"
        }}
        formInfo={{
          validationFunction: (data) => {
            if (data.name === "") return { success: false, error: "Le nom est requis" };
            return { success: true, error: null };
          },
          initialData: { name: "", wilaya }
        }}
      >
        <Input inputInfo={{dataId: "name", label: "Nom", type: "text"}} />
      </OperationFormDialog>
    </>
  )
}
export default ClientList;
