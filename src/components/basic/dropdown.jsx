import React, { Children, cloneElement, useState, useRef, useEffect, createContext, useContext } from 'react';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react-dom';

const DropdownContext = createContext({
  close: () => {},
});

const Dropdown = ({ children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize floating-ui
  const { x, y, strategy, update, refs } = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip(),
      shift(),
    ],
  });

  // Set up auto-update
  useEffect(() => {
    if (!isOpen || !refs.floating.current || !refs.reference.current) return;

    // Set up auto-update
    const cleanup = autoUpdate(
      refs.reference.current,
      refs.floating.current,
      update
    );

    return cleanup;
  }, [isOpen, refs.floating, refs.reference, update]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        refs.floating.current &&
        !refs.floating.current.contains(event.target) &&
        refs.reference.current &&
        !refs.reference.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, refs.floating, refs.reference]);

  let toggleElement = null;
  let menuElement = null;

  Children.forEach(children, (child) => {
    if (!child) return;

    if (child.type === Dropdown.Toggle) {
      toggleElement = cloneElement(child, {
        ref: refs.setReference,
        onClick: (e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
          child.props.onClick?.(e);
        },
        'aria-expanded': isOpen,
        'aria-haspopup': true,
      });
    }
    if (child.type === Dropdown.Menu) {
      menuElement = cloneElement(child, {
        show: isOpen,
        ref: refs.setFloating,
        x,
        y,
        strategy,
      });
    }
  });

  const contextValue = {
    close: () => setIsOpen(false),
  };

  return (
    <DropdownContext.Provider value={contextValue}>
      <div className={`dropdown ${className}`}>
        {toggleElement}
        {menuElement}
      </div>
    </DropdownContext.Provider>
  );
};

Dropdown.displayName = 'Dropdown';

// Simplified Toggle component that's just a wrapper div
const Toggle = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div 
    ref={ref}
    className={`dropdown-toggle ${className}`}
    role="button"
    tabIndex={0}
    {...props}
  >
    {children}
  </div>
));

Toggle.displayName = 'Dropdown.Toggle';
Dropdown.Toggle = Toggle;

// Menu component with floating-ui positioning
const Menu = React.forwardRef(({ children, show, x, y, strategy, className = '', ...props }, ref) => {
  if (!show) return null;

  return (
    <div 
      ref={ref}
      role="menu"
      className={`dropdown-menu absolute z-10 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${className}`}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
        transform: 'translateY(0)', // Prevent transform inheritance issues
      }}
      {...props}
    >
      {children}
    </div>
  );
});

Menu.displayName = 'Dropdown.Menu';
Dropdown.Menu = Menu;

const Item = ({ children, onClick, className = '' }) => {
  const { close } = useContext(DropdownContext);
  return (
    <button 
      className={`dropdown-item ${className}`}
      role="menuitem"
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling
        onClick?.(e);
        close();
      }}
    >
      {children}
    </button>
  );
};

Item.displayName = 'Dropdown.Item';
Dropdown.Item = Item;

export default Dropdown; 