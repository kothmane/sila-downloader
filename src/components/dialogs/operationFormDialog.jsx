import { forwardRef, useImperativeHandle, useRef } from "react";

import { useOperation } from "@/contexts/operationProvider";
import FormDialog from "./formDialog";


const OperationFormDialog = forwardRef((
  {
    onSuccess = (_) => {},
    onCancel = (_) => {},
    operationInfo : {collection, name, id = null},
    formInfo,
    dialogInfo,
    children
  }, ref) => {
  
  const innerRef = useRef(null);
  const { operation } = useOperation();

  useImperativeHandle(ref, () => ({
    open: () => innerRef.current.open(),
    close: () => innerRef.current.close(),
  }));
  
  const onAction = async (data) => {

    const {file, ...actualData} = data;
    const result = await operation({collection, name, id, data: actualData, file, static_operation: id === null});

    return result;
  }

  return (
    <FormDialog
      ref={innerRef} 
      asyncFunction={onAction}
      formInfo={formInfo}
      onSuccess={onSuccess}
      onCancel={onCancel}
      dialogInfo={dialogInfo}
    >
      {children}
    </FormDialog>
  );
});

OperationFormDialog.displayName = "OperationFormDialog";

export default OperationFormDialog;