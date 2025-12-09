import React, { useState, forwardRef, useImperativeHandle } from 'react';

const Dialog = forwardRef(({ children, onOuterAreaClick }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const outerAreaClick = () => {
    close();
    onOuterAreaClick?.();
  }

  useImperativeHandle(ref, () => ({
    open,
    close
  }));

  if (!isOpen) return null;

  return (
    <div className="dialog-screen" onClick={outerAreaClick}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
});

const Header = ({ children }) => {
  return (
    <div className="dialog-header">
      {children}
    </div>
  );
};

const Body = ({ children }) => {
  return (
    <div className="dialog-body">
      {children}
    </div>
  );
};

const Footer = ({ children }) => {

  return (
    <div className="dialog-footer">
      {children}
    </div>
  );
};

Dialog.Header = Header;
Dialog.Body = Body;
Dialog.Footer = Footer;

Dialog.displayName = 'Dialog';

export default Dialog;