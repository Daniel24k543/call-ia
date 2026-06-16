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
  const [filtro, setFiltro] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

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

  const rechazarPedido = async (id: string) => {
    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, {
        status: "Rechazado"
      });
    } catch (error) {
      console.error("Error rechazando el pedido", error);
    }
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const cumpleFiltro = filtro === "todos" || pedido.status === filtro;
    const cumpleBusqueda = busqueda === "" || pedido.customer_phone.includes(busqueda) || pedido.order_details.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleFiltro && cumpleBusqueda;
  });

  const estadisticas = {
    total: pedidos.length,
    pendientes: pedidos.filter(p => p.status === "Pendiente").length,
    aceptados: pedidos.filter(p => p.status === "Aceptado").length,
    rechazados: pedidos.filter(p => p.status === "Rechazado").length,
  };

  const getSourceIcon = (source: string) => {
    return source === "Llamada" ? "📞" : "💬";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendiente":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "Aceptado":
        return "bg-green-50 border-green-200 text-green-900";
      case "Rechazado":
        return "bg-red-50 border-red-200 text-red-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "Aceptado":
        return "bg-green-100 text-green-800";
      case "Rechazado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">IA Call Center</h1>
              <p className="text-blue-100">Panel de Control de Pedidos</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{estadisticas.total}</div>
              <p className="text-blue-100">Pedidos Totales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
              </div>
              <div className="text-4xl text-yellow-500">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Aceptados</p>
                <p className="text-3xl font-bold text-green-600">{estadisticas.aceptados}</p>
              </div>
              <div className="text-4xl text-green-500">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Rechazados</p>
                <p className="text-3xl font-bold text-red-600">{estadisticas.rechazados}</p>
              </div>
              <div className="text-4xl text-red-500">❌</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Tasa Aceptación</p>
                <p className="text-3xl font-bold text-blue-600">
                  {estadisticas.total === 0 ? "0%" : Math.round((estadisticas.aceptados / estadisticas.total) * 100) + "%"}
                </p>
              </div>
              <div className="text-4xl text-blue-500">📊</div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por teléfono o detalles</label>
              <input
                type="text"
                placeholder="Ej: +34 123456789"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado</label>
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los pedidos</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Aceptado">Aceptados</option>
                <option value="Rechazado">Rechazados</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltro("todos");
                  setBusqueda("");
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Pedidos Cards */}
        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-2xl text-gray-400 mb-2">📭</p>
            <p className="text-gray-600 text-lg">No hay pedidos para mostrar</p>
            <p className="text-gray-400 text-sm mt-2">Los pedidos aparecerán aquí en tiempo real</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pedidosFiltrados.map((pedido) => (
              <div
                key={pedido.id}
                className={`rounded-lg shadow-md border-2 transition-all hover:shadow-lg ${getStatusColor(pedido.status)}`}
              >
                <div className="p-6">
                  {/* Header del Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getSourceIcon(pedido.source)}</span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(pedido.status)}`}>
                          {pedido.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{pedido.customer_phone}</p>
                      <p className="text-sm text-gray-600 mt-1">{pedido.source}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {pedido.created_at ? new Date(pedido.created_at.seconds * 1000).toLocaleDateString("es-ES") : "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pedido.created_at ? new Date(pedido.created_at.seconds * 1000).toLocaleTimeString("es-ES") : ""}
                      </p>
                    </div>
                  </div>

                  {/* Detalles del Pedido */}
                  <div className="bg-white bg-opacity-50 rounded p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">📋 Detalles del Pedido</p>
                    <div className="text-gray-800 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {pedido.order_details}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3">
                    {pedido.status === "Pendiente" && (
                      <>
                        <button
                          onClick={() => aceptarPedido(pedido.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                          ✅ Aceptar Pedido
                        </button>
                        <button
                          onClick={() => rechazarPedido(pedido.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                          ❌ Rechazar
                        </button>
                      </>
                    )}
                    {pedido.status === "Aceptado" && (
                      <div className="w-full bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-lg text-center">
                        ✅ Pedido Aceptado
                      </div>
                    )}
                    {pedido.status === "Rechazado" && (
                      <div className="w-full bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg text-center">
                        ❌ Pedido Rechazado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
