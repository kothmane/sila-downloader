import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import Dialog from "@/components/basic/dialog";
import AsyncButton from "@/components/basic/asyncButton";

const ActionDialog = forwardRef(({asyncFunction, onSuccess = (_) => {}, onCancel = (_) => {}, dialogInfo : {title, actionLabel}, children}, ref) => {
  const innerRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    open: () => innerRef.current.open(),
    close: () => innerRef.current.close(),
  }));
  
  const [error, setError] = useState(null);


  const onAction = async () => {
    setError(null);
    const result = await asyncFunction();

    if (result.ok) {
      innerRef.current.close();
      onSuccess(result.data);
    } else {
      setError(result.error);
    }
  }

  const handleCancel = () => {
    innerRef.current.close();
    onCancel();
  }

  return (
    <Dialog ref={innerRef}>
      <Dialog.Header>
        <h1>{title}</h1>
      </Dialog.Header>
      <Dialog.Body>
        {children}
        {error && <p className="error-card mt-2">{error}</p>}
      </Dialog.Body>
      <Dialog.Footer>
        <button className="outline-button" onClick={handleCancel}>Annuler</button>
        <AsyncButton className="primary-button" onClick={onAction}>{actionLabel}</AsyncButton>
      </Dialog.Footer>
    </Dialog>
  );
});

ActionDialog.displayName = "ActionDialog";

export default ActionDialog;