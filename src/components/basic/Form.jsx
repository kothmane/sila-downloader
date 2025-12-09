import { createContext, useContext, forwardRef, useImperativeHandle, useState  } from "react";

// Form context
const FormContext = createContext();

const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a Form');
  }
  return context;
};



// Form component
const Form = forwardRef(({ children, validationFunction = null, initialData = {} }, ref) => {

  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialData);

  const setFormDataValue = (dataId, value) => {
    setFormData((prev) => ({ ...prev, [dataId]: value }));
  }


  useImperativeHandle(ref, () => ({
    getFormData: () => formData,
    setError: (error) => setError(error),
    validate: () => {
      if (!validationFunction) {
        return true;
      }
      const validationResult = validationFunction(formData);
      if (validationResult.success) {
        return true;
      } else {
        setError(validationResult.error);
        return false;
      }
    },
  }));

  return (
    <FormContext.Provider value={{ formData, setFormDataValue }}>
      <form className="flex flex-col gap-4">
        {children}
        {error && <div className="error-card">{error}</div>}
      </form>
    </FormContext.Provider>
  );
});



// Input component
const Input = ({ inputInfo, ...props }) => {  

  const { setFormDataValue, formData } = useForm();

  if (inputInfo.visible && !inputInfo.visible(formData)) {
    return null;
  }


  if (["text", "email", "password", "number", "tel", "url", "search", "date", "time", "datetime-local", "month", "week"].includes(inputInfo.type)) {
    return (
      <div className="flex flex-col gap-2">
        <label key={inputInfo.dataId} htmlFor={inputInfo.dataId}>
          {inputInfo.label}
        </label>
        <input id={inputInfo.dataId} type={inputInfo.type} value={formData[inputInfo.dataId] || ""} onChange={e => setFormDataValue(inputInfo.dataId, e.target.value)} />
      </div>
    );
  }

  if (["file"].includes(inputInfo.type)) {
    return (
      <div className="flex flex-col gap-2">
        <label>
          {inputInfo.label}
        </label>
        <label htmlFor={inputInfo.dataId} className="file-input-container">
          <div className="file-input-button">Choose File</div>
          <div className="file-input-filename">{formData[inputInfo.dataId]?.name || "No file chosen"}</div>
        </label>
        <input id={inputInfo.dataId} className="sr-only" type={inputInfo.type} onChange={e => setFormDataValue(inputInfo.dataId, e.target.files[0])} />
      </div>
    );
  }


  if (["textarea"].includes(inputInfo.type)) {
    return (
      <div className="flex flex-col gap-2">
        <label key={inputInfo.dataId} htmlFor={inputInfo.dataId}>
          {inputInfo.label}
        </label>
        <textarea id={inputInfo.dataId} value={formData[inputInfo.dataId] || ""} onChange={e => setFormDataValue(inputInfo.dataId, e.target.value)} />
      </div>
    );
  }

  if (["select"].includes(inputInfo.type)) {
    return (
      <div className="flex flex-col gap-2">
        <label key={inputInfo.dataId} htmlFor={inputInfo.dataId}>
          {inputInfo.label}
        </label>
        <select id={inputInfo.dataId} value={formData[inputInfo.dataId] || ""} onChange={e => setFormDataValue(inputInfo.dataId, e.target.value)}>
          {inputInfo.options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (["checkbox"].includes(inputInfo.type)) {
    return (
      <div className="flex gap-2 items-center">
        <input id={inputInfo.dataId} type={inputInfo.type} checked={formData[inputInfo.dataId] || false} onChange={e => setFormDataValue(inputInfo.dataId, e.target.checked)} />
        <label key={inputInfo.dataId} htmlFor={inputInfo.dataId}>
          {inputInfo.label}
        </label>
      </div>
    );
  }

  if (["radio"].includes(inputInfo.type)) {
    return (
      <div>
        <p>{inputInfo.label}</p>
        <div className={inputInfo.radioOptionsClass || "flex gap-2 items-center"} >
          {
            inputInfo.options.map(option => (
              <div key={option.value} className="flex gap-2 items-center">
                <input
                  id={option.value}
                  name={inputInfo.dataId}
                  value={option.value}
                  type={inputInfo.type}
                  checked={formData[inputInfo.dataId] === option.value}
                  onChange={e => setFormDataValue(inputInfo.dataId, e.target.value)}
                />
                <label key={option.value} htmlFor={option.value}>
                  {option.label}
                </label>
              </div>
            ))
          }
        </div>
      </div>
    );
  }

};


const MultiSelect = ({ inputInfo, ...props }) => {
  const { setFormDataValue, formData } = useForm();

  if (inputInfo.visible && !inputInfo.visible(formData)) {
    return null;
  }


  const modifyList = (value, checked) => {
    const newList = [...(formData[inputInfo.dataId] || [])];
    if (checked) {
      newList.push(value);
    } else {
      newList.splice(newList.indexOf(value), 1);
    }
    setFormDataValue(inputInfo.dataId, newList);
  }

  return (
    <div className="flex flex-col gap-2">
      <label key={inputInfo.dataId} htmlFor={inputInfo.dataId}>
        {inputInfo.label}
      </label>
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {
          inputInfo.options.length === 0 && (
            <p className="text-sm muted-text-color">Aucune option disponible</p>
          )
        }
        {
          inputInfo.options.length > 0 && inputInfo.options.map((option, index) => (
            <div key={option.value || index} className="flex gap-2 items-center">
              <input className="multi-select-checkbox" id={option.value} type="checkbox" value={option.value} checked={formData[inputInfo.dataId]?.includes(option.value) || false} onChange={e => modifyList(option.value, e.target.checked)} />
              <label key={option.value} htmlFor={option.value}>{option.label}</label>
            </div>
          ))
        }
      </div>
    </div>
  );
}


const FolderInput = ({ inputInfo, ...props }) => {
  const { setFormDataValue, formData } = useForm();

  const handleClick = async () => {
    const result = await window.api?.pickFolder?.();
    if (result.canceled) {
      return;
    }
    const folder = result.filePaths[0];
    setFormDataValue(inputInfo.dataId, folder);
  }

  return (
    <div className="flex flex-col gap-2" onClick={handleClick}>
      <label>
        {inputInfo.label}
      </label>
      <label htmlFor={inputInfo.dataId} className="file-input-container">
        <div className="file-input-button">Choose Folder</div>
        <div className="file-input-filename">{formData[inputInfo.dataId] || "No folder chosen"}</div>
      </label>
    </div>
  );
}

export { Form, Input, MultiSelect, FolderInput };


