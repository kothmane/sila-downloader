import { useData } from "@/contexts/operationProvider";
import { useMemo, useEffect } from "react";
import { wilayas } from "@/assets/dictionaries"
import WilayaCard from "./wilayaCard";

const WilayaList = () => {
  const { data, fetchData } = useData();
  

  const wilayaData = useMemo(() => {
    return data?.wilayaData?.data || {};
  }, [data]);
  
  useEffect(() => {
    fetchData({key: "wilayaData", collection: "client", operationName: "getWilayaData"});
  }, []);


  return (
    <div className="flex flex-col gap-2">
      {
        Object.entries(wilayas).map(([key, value]) => (
          <WilayaCard key={key} number={key} value={value} numberOfClients={wilayaData[key] || 0} />
        ))
      }
    </div>
  )
}

export default WilayaList;