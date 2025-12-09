import { forwardRef, useImperativeHandle, useRef } from "react";

import ActionDialog from "@/components/dialogs/actionDialog";
import { useOperation } from "@/contexts/operationProvider";

const OperationDialog = forwardRef((
  {
    onSuccess = (_) => {},
    onCancel = (_) => {},
    operationInfo : {collection, name, id = null, data = {}},
    dialogInfo,
    children
  }, ref) => {
  
  const innerRef = useRef(null);
  const { operation } = useOperation();

  useImperativeHandle(ref, () => ({
    open: () => innerRef.current.open(),
    close: () => innerRef.current.close(),
  }));
  
  const onAction = async () => {
    const result = await operation({collection, name, id, data, static_operation: id === null});

    return result;
  }


  return (
    <ActionDialog ref={innerRef} asyncFunction={onAction} onSuccess={onSuccess} onCancel={onCancel} dialogInfo={dialogInfo}>
      {children}
    </ActionDialog>
  );
});

OperationDialog.displayName = "OperationDialog";

export default OperationDialog;