import Dropdown from "../basic/dropdown";
import MoreButton from "../basic/moreButton";
import OperationDialog from "@/components/dialogs/operationDialog";
import OperationFormDialog from "@/components/dialogs/operationFormDialog";
import { useRef } from "react";
import { Input, MultiSelect } from "@/components/basic/Form";
import { useData } from "@/contexts/operationProvider";
import { Link } from "react-router";

export default function AdminCard({ admin }) {
  const deleteDialogRef = useRef(null);
  const editDialogRef = useRef(null);
  const { data } = useData();

  const representatives = data?.admins?.data?.filter(admin => admin.roles.includes("representant"));


  return (
    <div className="card flex min-h-24">
      <Link to={`/admins/${admin._id}`} className="flex-1 flex flex-col gap-2">
        <div>
          <div className="flex gap-2 items-center">
            <p className="card-title">{admin.name}</p>
            {
              admin.roles.map(role => (
                <div className="tag" key={role}>{role}</div>
              ))
            }
          </div>
          <p className="card-subtitle">{admin.email}</p>
        </div>
        
        {
          admin.roles.includes("logistique")  && (
            <>
              <p className="card-content">{admin.limited_access_to_orders ? "Accès limité" : "Accès complet"}</p>
              {
                admin.limited_access_to_orders && (
                  <p className="card-content">Accès aux commandes crées par: {admin.order_access_by_admin_list.map(admin => admin.name).join(", ")}</p>
                )
              }
            </>
          )
        }
      </Link>
      <div className="flex-none">
        <Dropdown>
          <Dropdown.Toggle>
            <MoreButton />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => editDialogRef.current.open()}>Modifier</Dropdown.Item>
            <Dropdown.Item onClick={() => deleteDialogRef.current.open()}>Supprimer</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <OperationDialog
        ref={deleteDialogRef}
        operationInfo={{ collection: "admin", name: "delete", id: admin._id }}
        dialogInfo={{
          title: "Supprimer l'admin",
          actionLabel: "Supprimer"
        }}
      >
        <p>Êtes-vous sûr de vouloir supprimer cet admin ?</p>
      </OperationDialog>
      <OperationFormDialog
        ref={editDialogRef}
        operationInfo={{ collection: "admin", name: "edit", id: admin._id }}
        dialogInfo={
          {
            title: "Modifier l'admin",
            actionLabel: "Modifier"
          }
        }
        formInfo={{
          validationFunction: (data) => {
            return { success: true, error: null };
          },
          initialData: {
            name: admin.name,
            roles: admin.roles,
            limited_access_to_orders: admin.limited_access_to_orders,
            order_access_by_admin_list: admin.order_access_by_admin_list.map(admin => admin._id),
          },
        }}
      >
        <Input inputInfo={{ type: "text", dataId: "name", label: "Nom" }} />
        <MultiSelect 
          inputInfo={
            { 
              type: "multi-select", 
              dataId: "roles", 
              label: "Rôles",
              options: [
                { value: "logistique", label: "Logistique" },
                { value: "representant", label: "Représentant" },
              ]
            }
          } 
        />
        <Input inputInfo={
            { 
              type: "checkbox", 
              dataId: "limited_access_to_orders", 
              label: "Accès limité aux commandes", 
              visible: (data) => data.roles.includes("logistique"),
            }
          } 
        />
        <MultiSelect 
          inputInfo={
            { 
              type: "multi-select", 
              dataId: "order_access_by_admin_list", 
              label: "Accès aux commandes crées par",
              visible: (data) => data.limited_access_to_orders,
              options: representatives.map(admin => ({ value: admin._id, label: admin.name }))
            }
          } 
        />
      </OperationFormDialog>
    </div>
  );
}