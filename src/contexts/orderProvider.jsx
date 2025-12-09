import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useOperation } from "./operationProvider";

const OrderContext = createContext();

const OrderProvider = ({ children }) => {

  const { operation } = useOperation();

  const [order, setOrder] = useState(
    {
      products: [
      /*{
          product document
          product full path which is a path from the outmost category to the parent category
          quantity
        },*/
      ]
    }
  );

  const total = useMemo(() => {
    return order.products.reduce((acc, product) => acc + product.quantity * product.product.price, 0);
  }, [order]);

  const addProduct = useCallback((product, fullPath) => {

    setOrder(currentOrder => {
      const productIndex = currentOrder.products.findIndex(p => p.product._id === product._id);
      if (productIndex !== -1) {
        const newProducts = [...currentOrder.products];
        newProducts[productIndex].quantity++;
        return { ...currentOrder, products: newProducts };
      } else {
        return {
          ...currentOrder,
          products: [...currentOrder.products, { product, product_full_path: fullPath, quantity: 1 }]
        };
      }
    });
  }, []);

  const removeProduct = useCallback((product) => {
    setOrder(currentOrder => {
      const productIndex = currentOrder.products.findIndex(p => p.product._id === product._id);
      if (productIndex === -1) return currentOrder;

      const newProducts = [...currentOrder.products];
      if (newProducts[productIndex].quantity > 1) {
        newProducts[productIndex].quantity--;
        return { ...currentOrder, products: newProducts };
      } else {
        newProducts.splice(productIndex, 1);
        return { ...currentOrder, products: newProducts };
      }
    });
  }, []);

  const deleteProduct = useCallback((product) => {
    setOrder(currentOrder => ({
      ...currentOrder,
      products: currentOrder.products.filter(p => p.product._id !== product._id)
    }));
  }, []);

  const setProductQuantity = useCallback((product, quantity) => {
    setOrder(currentOrder => {
      const productIndex = currentOrder.products.findIndex(p => p.product._id === product._id);
      if (productIndex === -1) return currentOrder;

      const newProducts = [...currentOrder.products];
      if (quantity > 0) {
        newProducts[productIndex].quantity = quantity;
        return { ...currentOrder, products: newProducts };
      } else {
        newProducts.splice(productIndex, 1);
        return { ...currentOrder, products: newProducts };
      }
    });
  }, []);

  const resetOrder = useCallback(() => {
    setOrder({
      products: []
    });
  }, []);

  const submitOrder = useCallback(async (client_id) => {
    const response = await operation({
      collection: "order",
      name: "create",
      static_operation: true,
      data: {
        client_id: client_id,
        products: order.products.map((product) => ({
          product_id: product.product._id,
          full_name: product.product_full_path,
          quantity: product.quantity,
        }))
      }
    });

    return response;
  }, [order, operation]);


  return (
    <OrderContext.Provider value={{ order, total, addProduct, removeProduct, deleteProduct, setProductQuantity, resetOrder, submitOrder }}>
      {children}
    </OrderContext.Provider>
  );

};

const useOrder = () => {
  return useContext(OrderContext);
};

export { OrderContext, OrderProvider, useOrder };
