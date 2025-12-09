import { forwardRef, useImperativeHandle, useRef } from "react";

import { Form } from "@/components/basic/Form";
import ActionDialog from "@/components/dialogs/actionDialog";


const FormDialog = forwardRef((
  {
    onSuccess = (_) => {},
    onCancel = (_) => {},
    asyncFunction,
    formInfo:{
      validationFunction,
      dataProcessingFunction = (data) => data,
      initialData = {}
    },
    dialogInfo,
    children
  }, ref) => {
  
    const innerRef = useRef(null);
  const formRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    open: () => innerRef.current.open(),
    close: () => innerRef.current.close(),
  }));
  
  const onAction = async () => {
    const isValid = formRef.current.validate();
    if (!isValid) return { ok: false, error: "Validation failed" };

    const data = formRef.current.getFormData();
    const processedData = dataProcessingFunction(data);

    const result = await asyncFunction(processedData);

    return result;
  }

  return (
    <ActionDialog
      ref={innerRef} 
      asyncFunction={onAction} 
      onSuccess={onSuccess}
      onCancel={onCancel}
      dialogInfo={dialogInfo}
    >
      <Form ref={formRef} validationFunction={validationFunction} initialData={initialData}>
        {children}
      </Form>
    </ActionDialog>
  );
});

FormDialog.displayName = "FormDialog";

export default FormDialog;