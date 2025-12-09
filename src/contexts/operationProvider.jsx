import { useMemo, useCallback, useContext, createContext, useState } from "react";
import { operation as operation_ } from "@/utils/helper";
import { useAuth } from "./authProvider";


const OperationContext = createContext();
const DataContext = createContext();

const useOperation = () => {
  const context = useContext(OperationContext);
  if (!context) {
    throw new Error('useOperation must be used within an OperationProvider');
  }
  return context;
};

const useData = () => {

  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within an dataProvider');
  }
  return context;
};

const OperationProvider = ({ children }) => {

  const { firebaseUser } = useAuth();

  // structure: { [key]: { loading: boolean, valid: boolean, data: any, error?: any } }
  const [data, setData] = useState({});

  // structure: { [key]: { collection, operationName, id, operationData, invalidatingOperations } }
  const [dataConfig, setDataConfig] = useState({});

  // go through dataConfig and inalidate all the data that is invalidated by the operation
  const invalidationCheckForOperation = useCallback((operationParams) => {
    const { collection, name: operationName } = operationParams;
    for (const key in dataConfig) {
      for (const invalidatingOperation of dataConfig[key].invalidatingOperations) {
        
        let shouldInvalidate = false;
        if (typeof invalidatingOperation === 'string') {
          if (dataConfig[key].collection === collection && invalidatingOperation === operationName) {
            shouldInvalidate = true;
          }
        } else {
          const { collection: invalidatingCollection, operation: invalidatingOperationName, condition } = invalidatingOperation;
          if ((invalidatingCollection === undefined || invalidatingCollection === collection) && invalidatingOperationName === operationName) {
            if (condition) {
              if (condition({operationParams, data: data[key].data})) {
                shouldInvalidate = true;
              }
            } else {
              shouldInvalidate = true;
            }
          }
        }

        if (shouldInvalidate) {
          setData((prev) => ({...prev, [key]: { ...prev[key], valid: false }}));
          getData({
            key,
            collection: dataConfig[key].collection,
            operationName: dataConfig[key].operationName,
            id: dataConfig[key].id,
            operationData: dataConfig[key].operationData,
            dataProcessor: dataConfig[key].dataProcessor,
          });
          break;
        }
      }
    }
  }, [dataConfig, data]);


  const operation = useCallback(async (operationParams) => {

    const {collection, name, id = null, ids = [], data = {}, file = null, static_operation = false} = operationParams;
    const token = await firebaseUser.getIdToken();
    const result = await operation_({collection, name, id, ids, data, file, static_operation, token});
    if (result.ok)
      invalidationCheckForOperation(operationParams);
    
    return result;
  }, [firebaseUser, invalidationCheckForOperation]);
  
  // use operation to fetch data
  const getData = useCallback(async ({key, collection, operationName, id = null, operationData = {}, dataProcessor = null}) => {
    setData((prev) => ({...prev, [key]: { loading: true, valid: false, data: null, error: null }}));
    const result = await operation({collection, name: operationName, id, data: operationData, static_operation: id == null});
    console.log("we received the following result", result);
    let resultData = result.data;
    if (dataProcessor) {
      resultData = dataProcessor(resultData);
    }
    if (result.ok) {
      setData((prev) => ({...prev, [key]: { loading: false, valid: true, data: resultData }}));
    } else {
      setData((prev) => ({...prev, [key]: { loading: false, valid: false, data: null, error: result.error }}));
    }
  }, [data, operation]);
  
  
  const setOperationData = useCallback(({key, operationData}) => {
    if (!dataConfig[key] || JSON.stringify(dataConfig[key].operationData) === JSON.stringify(operationData)) {
      return;
    } else {
      setDataConfig((prev) => ({...prev, [key]: { ...prev[key], operationData }}));
      setData((prev) => ({...prev, [key]: { ...prev[key], valid: false }})); 
      if (data[key] && !data[key].loading) {
        getData({key, collection: dataConfig[key].collection, operationName: dataConfig[key].operationName, id: dataConfig[key].id, operationData, dataProcessor: dataConfig[key].dataProcessor});
      }
    }
  
  }, [dataConfig, data , getData]);


  const fetchData = useCallback(async ({key, collection, operationName, id= null, operationData = {}, invalidatingOperations = [], dataProcessor = null}) => {
    if (!firebaseUser) return;
    
    const cacheEntry = data[key];
    if (!cacheEntry) {
      setDataConfig((prev) => ({...prev, [key]: { collection, operationName, id, operationData, invalidatingOperations, dataProcessor }}));
      getData({key, collection, operationName, id, operationData, dataProcessor});
    } else if (!cacheEntry.valid) {
      getData({key, collection, operationName, id, operationData, dataProcessor});
    }
  }, [data, getData, firebaseUser]);

  
  const operationValue = useMemo(() => ({ operation }), [operation]);
  const dataValue = useMemo(() => ({ data, fetchData, setOperationData }), [data, fetchData, setOperationData]);
  
  return (
    <OperationContext.Provider value={operationValue}>
      <DataContext.Provider value={dataValue}>
        {children}
      </DataContext.Provider>
    </OperationContext.Provider>
  );
}

export { OperationProvider, useOperation, useData };

