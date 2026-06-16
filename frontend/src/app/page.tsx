"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Pedido = {
  id: string;
  customer_phone: string;
  order_details: string;
  source: string;
  status: string;
  created_at: any;
};

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pedidosArray: Pedido[] = [];
      querySnapshot.forEach((document) => {
        pedidosArray.push({ id: document.id, ...document.data() } as Pedido);
      });
      setPedidos(pedidosArray);
    }, (error) => {
      console.error("Error fetching pedidos:", error);
    });

    return () => unsubscribe();
  }, []);

  const aceptarPedido = async (id: string) => {
    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, {
        status: "Aceptado"
      });
    } catch (error) {
      console.error("Error aceptando el pedido", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel de Control - IA Call Center</h1>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Detalles del Pedido
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
                    No hay pedidos todavía.
                  </td>
                </tr>
              ) : null}
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{pedido.customer_phone}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${pedido.source === 'WhatsApp' ? 'text-green-900' : 'text-blue-900'}`}>
                      <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${pedido.source === 'WhatsApp' ? 'bg-green-200' : 'bg-blue-200'}`}></span>
                      <span className="relative">{pedido.source}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-pre-wrap">{pedido.order_details}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${pedido.status === 'Pendiente' ? 'text-yellow-900' : 'text-green-900'}`}>
                      <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${pedido.status === 'Pendiente' ? 'bg-yellow-200' : 'bg-green-200'}`}></span>
                      <span className="relative">{pedido.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {pedido.created_at ? new Date(pedido.created_at.seconds * 1000).toLocaleString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                     {pedido.status === 'Pendiente' && (
                       <button 
                        onClick={() => aceptarPedido(pedido.id)}
                        className="bg-indigo-600 text-white font-bold py-1 px-3 rounded hover:bg-indigo-500">
                         Aceptar
                       </button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
