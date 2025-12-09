import { useRef, useEffect, useMemo } from "react";
import OrderList from "@/components/orders/orderList/orderList";
import { useData } from "@/contexts/operationProvider";
import ReturnArrow from "@/components/basic/returnArrow";
import { Link } from "react-router";
import OrderFilterDialog from "@/components/dialogs/orderFilterDialog";
import { useSettings } from "@/contexts/settingsProvider";
import DataStateHandler from "@/components/basic/dataStateHandler";
import { getPeriodInMongoFilterFormat } from "@/utils/helper";


const AdminPageClient = ({ admin_id }) => {
  const filterDialogRef = useRef(null);
  const { data, fetchData, setOperationData } = useData();
  const { settings, updateSettings } = useSettings();

  const adminDataKey = `admin-${admin_id}`;
  const adminOrdersKey = `orders-admin-${admin_id}`;

  // Initial data fetch
  useEffect(() => {
    
    fetchData({
      key: adminDataKey,
      collection: "admin",
      operationName: "get",
      operationData: { filter: { _id: admin_id } },
    });

    fetchData({
      key: adminOrdersKey,
      collection: "order",
      operationName: "get",
      operationData: { filter: { admin_id, ...getPeriodInMongoFilterFormat({period: "today"}) } },
      invalidatingOperations: [
        { collection: "order", operation: "create", condition: ({operationParams}) => operationParams.data.admin_id === admin_id },
        "edit", 
        "delete"
      ]
    });
  }, [admin_id]);

  const ordersReady = useMemo(() => data?.[adminOrdersKey]?.valid, [data]);
  const orders = useMemo(() => data?.[adminOrdersKey]?.data || [], [data]);
  const admin = useMemo(() => data?.[adminDataKey]?.data?.[0], [data]);

  
  useEffect(() => {
    if (!settings[adminOrdersKey] || !settings[adminOrdersKey].period) {
      updateSettings({[adminOrdersKey] : { period: "today" }});
    } else {

      setOperationData({
        key: adminOrdersKey,
        operationData: { filter: { admin_id, ...getPeriodInMongoFilterFormat(settings[adminOrdersKey]) } }
      });
    }
  }, [settings]);




  const handleApplyFilters = (data) => {
    if (data.period != "custom_period") {
      updateSettings({[adminOrdersKey]: { period: data.period }});
    } else {
      updateSettings({
        [adminOrdersKey]: {
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
      <ReturnArrow href="/admins" />
      <div className="collection-head">
        <h1 className="collection-title">{admin?.name || 'Admin'}</h1>
        <div className="collection-head-operations">
          <button className="outline-button-small" onClick={() => filterDialogRef.current?.open()}>
            Filtrer
          </button>
        </div>
      </div>
      

      <div className="flex-1 min-h-0">
        {
          !ordersReady &&
          <DataStateHandler dataKey={adminOrdersKey} />
        }
        {
          ordersReady &&
          <OrderList orders={orders} listType="admin" id={adminOrdersKey} />
        }
      </div>

      <OrderFilterDialog
        ref={filterDialogRef}
        onApply={handleApplyFilters}
        initialData={{
          period: settings[adminOrdersKey]?.period,
          startDate: settings[adminOrdersKey]?.from,
          endDate: settings[adminOrdersKey]?.to
        }}
      />
    </div>
  );
};

export default AdminPageClient;
