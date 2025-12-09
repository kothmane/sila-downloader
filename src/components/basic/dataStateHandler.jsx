import { useData } from "@/contexts/operationProvider";
import { useMemo } from "react";
import Spinner from "./spinner";

const DataStateHandler = ({dataKey}) => {
  const { data } = useData();
  const loading = useMemo(() => data[dataKey]?.loading, [data]);
  const error = useMemo(() => data[dataKey]?.error, [data]);
  
  
  if (loading) {
    return (
      <div className="card w-full h-30 flex flex-col items-center justify-center">
        <Spinner />
      </div>
    )
  } else if (error) {
    return (
      <div className="card w-full h-30 flex flex-col items-center justify-center">
        <p className="card-title">Error: {error}</p>
      </div>
    )
  } else {
  return (
    <div className="card w-full h-30 flex flex-col items-center justify-center">
        <p className="card-title">No data</p>
      </div>
    )
  }
}

export default DataStateHandler;