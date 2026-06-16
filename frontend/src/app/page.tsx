"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Producto = {
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
};

type Pedido = {
  id: string;
  customer_phone: string;
  customer_name?: string;
  customer_address?: string;
  payment_method?: string;
  order_details: string;
  source: string;
  status: string;
  created_at: any;
  productos?: Producto[];
  subtotal?: number;
  descuentoTotal?: number;
  impuestos?: number;
  total?: number;
};

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [vistaEditor, setVistaEditor] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [telefonoNuevo, setTelefonoNuevo] = useState("");
  const [productosLocal, setProductosLocal] = useState<Producto[]>([]);
  const [productoActual, setProductoActual] = useState({
    codigo: "",
    nombre: "",
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0,
  });
  const [impuestoPorcentaje, setImpuestoPorcentaje] = useState(13);
  const [expandidos, setExpandidos] = useState<string[]>([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");

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

  const crearPedidoNuevo = () => {
    setVistaEditor(true);
    setPedidoSeleccionado(null);
    setTelefonoNuevo("");
    setClienteNombre("");
    setClienteDireccion("");
    setMetodoPago("Efectivo");
    setProductosLocal([]);
    setProductoActual({ codigo: "", nombre: "", cantidad: 1, precioUnitario: 0, descuento: 0 });
  };

  const agregarProducto = () => {
    if (!productoActual.nombre || productoActual.precioUnitario === 0) {
      alert("Por favor completa el nombre y precio del producto");
      return;
    }
    setProductosLocal([...productosLocal, { ...productoActual }]);
    setProductoActual({ codigo: "", nombre: "", cantidad: 1, precioUnitario: 0, descuento: 0 });
  };

  const eliminarProducto = (index: number) => {
    setProductosLocal(productosLocal.filter((_, i) => i !== index));
  };

  const calcularTotales = () => {
    const subtotal = productosLocal.reduce(
      (acc, p) => acc + (p.cantidad * p.precioUnitario - (p.cantidad * p.precioUnitario * (p.descuento / 100))),
      0
    );
    const descuentoTotal = productosLocal.reduce(
      (acc, p) => acc + (p.cantidad * p.precioUnitario * (p.descuento / 100)),
      0
    );
    const impuestos = subtotal * (impuestoPorcentaje / 100);
    const total = subtotal + impuestos;
    return { subtotal, descuentoTotal, impuestos, total };
  };

  const guardarPedido = async () => {
    if (!telefonoNuevo || productosLocal.length === 0) {
      alert("Ingresa teléfono y al menos un producto");
      return;
    }

    const { subtotal, descuentoTotal, impuestos, total } = calcularTotales();

    try {
      await addDoc(collection(db, "pedidos"), {
        customer_phone: telefonoNuevo,
        customer_name: clienteNombre || "No especificado",
        customer_address: clienteDireccion || "No especificado",
        payment_method: metodoPago,
        productos: productosLocal,
        subtotal,
        descuentoTotal,
        impuestos,
        total,
        order_details: `Pedido con ${productosLocal.length} productos - Total: ${total.toFixed(2)}`,
        source: "Manual",
        status: "Pendiente",
        created_at: serverTimestamp(),
      });

      alert("✅ Pedido creado exitosamente");
      setVistaEditor(false);
      setProductosLocal([]);
      setTelefonoNuevo("");
      setClienteNombre("");
      setClienteDireccion("");
    } catch (error) {
      console.error("Error creando pedido:", error);
      alert("Error creando el pedido");
    }
  };

  const aceptarPedido = async (id: string) => {
    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, { status: "Aceptado" });
      // Mostrar confirmación con sonido virtual
      if (typeof window !== "undefined") {
        const audio = new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==");
        audio.play().catch(() => {});
      }
    } catch (error) {
      console.error("Error aceptando el pedido", error);
    }
  };

  const rechazarPedido = async (id: string) => {
    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, { status: "Rechazado" });
    } catch (error) {
      console.error("Error rechazando el pedido", error);
    }
  };

  const toggleExpandir = (id: string) => {
    setExpandidos(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const cumpleFiltro = filtro === "todos" || pedido.status === filtro;
    const cumpleBusqueda = busqueda === "" || pedido.customer_phone.includes(busqueda);
    return cumpleFiltro && cumpleBusqueda;
  });

  const estadisticas = {
    total: pedidos.length,
    pendientes: pedidos.filter(p => p.status === "Pendiente").length,
    aceptados: pedidos.filter(p => p.status === "Aceptado").length,
    rechazados: pedidos.filter(p => p.status === "Rechazado").length,
  };

  const { subtotal: subtotalActual, descuentoTotal: descActual, impuestos: impActual, total: totalActual } = calcularTotales();

  if (vistaEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Crear Nuevo Pedido</h1>
            <button
              onClick={() => setVistaEditor(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ← Volver
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono del Cliente</label>
              <input
                type="text"
                value={telefonoNuevo}
                onChange={(e) => setTelefonoNuevo(e.target.value)}
                placeholder="+34 123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Cliente</label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              <input
                type="text"
                value={clienteDireccion}
                onChange={(e) => setClienteDireccion(e.target.value)}
                placeholder="Calle Principal 123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Agregar Productos */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar Productos</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <input
                type="text"
                placeholder="Código"
                value={productoActual.codigo}
                onChange={(e) => setProductoActual({ ...productoActual, codigo: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Nombre producto"
                value={productoActual.nombre}
                onChange={(e) => setProductoActual({ ...productoActual, nombre: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm col-span-2"
              />
              <input
                type="number"
                placeholder="Cantidad"
                value={productoActual.cantidad}
                onChange={(e) => setProductoActual({ ...productoActual, cantidad: Number(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Precio"
                value={productoActual.precioUnitario}
                onChange={(e) => setProductoActual({ ...productoActual, precioUnitario: Number(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="% Desc."
                value={productoActual.descuento}
                onChange={(e) => setProductoActual({ ...productoActual, descuento: Number(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={agregarProducto}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
            >
              ➕ Agregar Línea
            </button>
          </div>

          {/* Tabla de Productos */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Código</th>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-center">Cantidad</th>
                  <th className="px-4 py-2 text-right">Precio Unit.</th>
                  <th className="px-4 py-2 text-right">% Desc.</th>
                  <th className="px-4 py-2 text-right">Subtotal</th>
                  <th className="px-4 py-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {productosLocal.map((prod, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{prod.codigo || "-"}</td>
                    <td className="px-4 py-3 font-medium">{prod.nombre}</td>
                    <td className="px-4 py-3 text-center">{prod.cantidad}</td>
                    <td className="px-4 py-3 text-right">{prod.precioUnitario.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{prod.descuento}%</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {(prod.cantidad * prod.precioUnitario * (1 - prod.descuento / 100)).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => eliminarProducto(idx)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          {productosLocal.length > 0 && (
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-gray-600 text-sm">Sub-total</p>
                  <p className="text-2xl font-bold text-blue-600">${subtotalActual.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Descuentos</p>
                  <p className="text-2xl font-bold text-orange-600">-${descActual.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Impuestos ({impuestoPorcentaje}%)</p>
                  <p className="text-2xl font-bold text-purple-600">${impActual.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">TOTAL</p>
                  <p className="text-3xl font-bold text-green-600">${totalActual.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={guardarPedido}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
            >
              💾 Guardar Pedido
            </button>
            <button
              onClick={() => setVistaEditor(false)}
              className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold text-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">IA Call Center</h1>
              <p className="text-blue-100">Panel de Control de Pedidos - En Tiempo Real</p>
            </div>
            <button
              onClick={crearPedidoNuevo}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
            >
              ➕ Nuevo Pedido
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-medium">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Aceptados</p>
            <p className="text-3xl font-bold text-green-600">{estadisticas.aceptados}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium">Rechazados</p>
            <p className="text-3xl font-bold text-red-600">{estadisticas.rechazados}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Total</p>
            <p className="text-3xl font-bold text-blue-600">${pedidosFiltrados.reduce((a, p) => a + (p.total || 0), 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Buscar por teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Aceptado">Aceptados</option>
              <option value="Rechazado">Rechazados</option>
            </select>
          </div>
        </div>

        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-2xl text-gray-400 mb-2">📭</p>
            <p className="text-gray-600 text-lg">No hay pedidos para mostrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pedidosFiltrados.map((pedido) => (
              <div
                key={pedido.id}
                className={`rounded-lg shadow-lg border-l-4 transition-all duration-300 overflow-hidden ${
                  pedido.status === "Pendiente" ? "border-yellow-500 bg-white" :
                  pedido.status === "Aceptado" ? "border-green-500 bg-green-50 shadow-green-200" :
                  "border-red-500 bg-red-50"
                }`}
              >
                <div className="p-6">
                  {/* Header con Estado */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-3xl font-bold text-gray-900">{pedido.customer_phone}</span>
                      </div>
                      <p className="text-sm text-gray-600">{pedido.source}</p>
                    </div>
                    <span className={`inline-block px-4 py-2 rounded-full font-bold text-sm transition-all ${
                      pedido.status === "Pendiente" ? "bg-yellow-100 text-yellow-800 animate-pulse" :
                      pedido.status === "Aceptado" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {pedido.status === "Aceptado" ? "✅ " : pedido.status === "Rechazado" ? "❌ " : "⏳ "}
                      {pedido.status}
                    </span>
                  </div>

                  {/* Información del Cliente */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Nombre</p>
                        <p className="text-sm text-gray-900 font-medium">{pedido.customer_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Dirección</p>
                        <p className="text-sm text-gray-900">{pedido.customer_address || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Método de Pago</p>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {pedido.payment_method || "N/A"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Fecha</p>
                        <p className="text-sm text-gray-900">
                          {pedido.created_at ? new Date(pedido.created_at.seconds * 1000).toLocaleDateString("es-ES") : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Productos o Detalles */}
                  {pedido.productos && pedido.productos.length > 0 ? (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left">Producto</th>
                            <th className="px-3 py-2 text-center">Cantidad</th>
                            <th className="px-3 py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pedido.productos.map((prod, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-3 py-2 font-medium">{prod.nombre}</td>
                              <td className="px-3 py-2 text-center">{prod.cantidad}</td>
                              <td className="px-3 py-2 text-right font-bold">
                                ${(prod.cantidad * prod.precioUnitario * (1 - prod.descuento / 100)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mb-4 bg-gray-100 p-3 rounded text-sm text-gray-700">
                      {pedido.order_details || "Sin detalles"}
                    </div>
                  )}

                  {/* Totales */}
                  {pedido.subtotal !== undefined && pedido.subtotal > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg mb-4 border border-blue-200">
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Sub</p>
                          <p className="text-sm font-bold text-gray-900">${pedido.subtotal.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Desc</p>
                          <p className="text-sm font-bold text-orange-600">-${(pedido.descuentoTotal || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Imptos</p>
                          <p className="text-sm font-bold text-purple-600">${(pedido.impuestos || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded p-2 text-white">
                          <p className="text-xs font-semibold">TOTAL</p>
                          <p className="text-lg font-bold">${pedido.total?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-3">
                    {pedido.status === "Pendiente" && (
                      <>
                        <button
                          onClick={() => aceptarPedido(pedido.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                          ✅ Aceptar
                        </button>
                        <button
                          onClick={() => rechazarPedido(pedido.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                          ❌ Rechazar
                        </button>
                      </>
                    )}
                    {pedido.status === "Aceptado" && (
                      <div className="w-full bg-gradient-to-r from-green-100 to-green-200 text-green-700 font-bold py-2 rounded-lg text-center border border-green-500 animate-pulse">
                        ✅ Aceptado - En preparación
                      </div>
                    )}
                    {pedido.status === "Rechazado" && (
                      <div className="w-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 font-bold py-2 rounded-lg text-center border border-red-500">
                        ❌ Rechazado
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
