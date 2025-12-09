import { useRef, useEffect, useMemo } from "react";
import OrderList from "@/components/orders/orderList/orderList";
import { useData } from "@/contexts/operationProvider";
import ReturnArrow from "@/components/basic/returnArrow";
import { Link } from "react-router";
import OrderFilterDialog from "@/components/dialogs/orderFilterDialog";
import { useSettings } from "@/contexts/settingsProvider";
import DataStateHandler from "@/components/basic/dataStateHandler";
import { getPeriodInMongoFilterFormat } from "@/utils/helper";
import { useAuth } from "@/contexts/authProvider";


const ClientPageClient = ({ client_id }) => {
  const filterDialogRef = useRef(null);
  const { data, fetchData, setOperationData } = useData();
  const { settings, updateSettings } = useSettings();

  const { adminHasRole } = useAuth();

  const clientDataKey = `client-${client_id}`;
  const clientOrdersKey = `orders-client-${client_id}`;

  // Initial data fetch
  useEffect(() => {
    
    fetchData({
      key: clientDataKey,
      collection: "client",
      operationName: "getDetails",
      id: client_id,
    });

    fetchData({
      key: clientOrdersKey,
      collection: "order",
      operationName: "get",
      operationData: { filter: { client_id, ...getPeriodInMongoFilterFormat({period: "today"}) } },
      invalidatingOperations: [
        { collection: "order", operation: "create", condition: ({operationParams}) => operationParams.data.client_id === client_id },
        "edit", 
        "delete"
      ]
    });
  }, [client_id]);

  const ordersReady = useMemo(() => data?.[clientOrdersKey]?.valid, [data]);
  const orders = useMemo(() => data?.[clientOrdersKey]?.data || [], [data]);
  const client = useMemo(() => data?.[clientDataKey]?.data, [data]);

  
  useEffect(() => {
    if (!settings[clientOrdersKey] || !settings[clientOrdersKey].period) {
      updateSettings({[clientOrdersKey] : { period: "today" }});
    } else {

      setOperationData({
        key: clientOrdersKey,
        operationData: { filter: { client_id, ...getPeriodInMongoFilterFormat(settings[clientOrdersKey]) } }
      });
    }
  }, [settings]);




  const handleApplyFilters = (data) => {
    if (data.period != "custom_period") {
      updateSettings({[clientOrdersKey]: { period: data.period }});
    } else {
      updateSettings({
        [clientOrdersKey]: {
          period: "custom_period",
          from: data.startDate,
          to: data.endDate
        }
      });
    }

    return { ok: true };
  };

  return (
    <div className="flex flex-col h-full">
      <ReturnArrow href="/clients" />
      <div className="collection-head">
        <h1 className="collection-title">{client?.name || 'Client'}</h1>
        <div className="collection-head-operations">
          <button className="outline-button-small" onClick={() => filterDialogRef.current?.open()}>
            Filter
          </button>
          {
            adminHasRole("representant") &&
            <Link to={`/clients/${client_id}/create`}>
              <button className="primary-button-small">New</button>
            </Link>
          }
        </div>
      </div>
      

      <div className="flex-1 min-h-0">
        {
          !ordersReady &&
          <DataStateHandler dataKey={clientOrdersKey} />
        }
        {
          ordersReady &&
          <OrderList orders={orders} listType="client" id={clientOrdersKey} />
        }
      </div>

      <OrderFilterDialog
        ref={filterDialogRef}
        onApply={handleApplyFilters}
        initialData={{
          period: settings[clientOrdersKey]?.period,
          startDate: settings[clientOrdersKey]?.from,
          endDate: settings[clientOrdersKey]?.to
        }}
      />
    </div>
  );
};

export default ClientPageClient;
