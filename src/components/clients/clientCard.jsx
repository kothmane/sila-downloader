import { Link } from "react-router";
import Dropdown from "../basic/dropdown";
import MoreButton from "../basic/moreButton";
import OperationDialog from "@/components/dialogs/operationDialog";
import OperationFormDialog from "@/components/dialogs/operationFormDialog";
import { useRef } from "react";
import { Input } from "@/components/basic/Form";

const ClientCard = ({client, wilaya}) => {
  const deleteDialogRef = useRef(null);
  const editDialogRef = useRef(null);


  return (
    <div className="card flex min-h-24">
      <Link to={`/clients/${client._id}`} className="flex-1">
        <div className="flex flex-col gap-2">
          <p className="card-title">{client.name}</p>
          <p className="card-subtitle">{client.orders.length} commandes</p>
        </div>
      </Link>
      <div className="flex-none">
        <Dropdown>
          <Dropdown.Toggle>
            <MoreButton />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => editDialogRef.current.open()}>Modifier</Dropdown.Item>
            <Dropdown.Item className="danger" onClick={() => deleteDialogRef.current.open()}>Supprimer</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <OperationDialog
        ref={deleteDialogRef}
        operationInfo={{ collection: "client", name: "delete", id: client._id }}
        dialogInfo={{
          title: "Supprimer le client",
          actionLabel: "Supprimer"
        }}
      >
        <p>Êtes-vous sûr de vouloir supprimer ce client ?</p>
      </OperationDialog>
      <OperationFormDialog
        ref={editDialogRef}
        operationInfo={{ collection: "client", name: "edit", id: client._id }}
        dialogInfo={{
          title: "Modifier le client",
          actionLabel: "Modifier"
        }}
        formInfo={{
          validationFunction: (data) => {
            if (data.name === "") return { success: false, error: "Le nom est requis" };
            return { success: true, error: null };
          },
          initialData: { name: client.name, wilaya }
        }}
      >
        <Input inputInfo={{dataId: "name", label: "Nom", type: "text"}} />
      </OperationFormDialog>
    </div>
  )
}
export default ClientCard;
