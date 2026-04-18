"use client";

import { useState, useCallback, useMemo } from "react";
import { Mail, MapPin, Phone, Ticket, Users, Sparkles } from "lucide-react";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Representa un asiento individual en el teatro
 * @property id - Identificador único del asiento (número entero)
 * @property estado - true = ocupado, false = libre
 */
interface Asiento {
  id: number;
  estado: boolean;
}

/**
 * Configuración del teatro
 */
const CONFIGURACION = {
  FILAS: 8, // Número total de filas
  ASIENTOS_POR_FILA: 12, // Asientos por fila
} as const;

// ============================================================================
// GENERACIÓN DE DATOS INICIALES
// ============================================================================

/**
 * Genera la matriz de asientos con algunos ocupados por defecto
 * para demostrar la funcionalidad del sistema
 */
function generarAsientosIniciales(): Asiento[][] {
  const asientos: Asiento[][] = [];
  let idContador = 1;

  // Asientos pre-ocupados para demostración (distribuidos aleatoriamente)
  const asientosOcupados = new Set([
    3, 4, 5, // Fila 1
    14, 15, 18, // Fila 2
    27, 28, 29, 30, // Fila 3 (centro ocupado)
    38, 39, 40, 41, 42, // Fila 4 (varios consecutivos ocupados)
    50, 51, 55, 56, // Fila 5
    63, 64, 70, 71, 72, // Fila 6
    80, 85, 86, // Fila 7
    93, 94, 95, // Fila 8
  ]);

  for (let fila = 0; fila < CONFIGURACION.FILAS; fila++) {
    const filaAsientos: Asiento[] = [];
    for (let asiento = 0; asiento < CONFIGURACION.ASIENTOS_POR_FILA; asiento++) {
      filaAsientos.push({
        id: idContador,
        estado: asientosOcupados.has(idContador), // true = ocupado
      });
      idContador++;
    }
    asientos.push(filaAsientos);
  }

  return asientos;
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE SUGERENCIA DE ASIENTOS
// ============================================================================

/**
 * Función suggest: Busca asientos consecutivos disponibles
 *
 * ALGORITMO:
 * 1. Valida que la cantidad solicitada no exceda el tamaño de una fila
 * 2. Calcula el índice de la fila central del teatro
 * 3. Busca desde el centro hacia afuera (alternando arriba/abajo)
 * 4. En cada fila, busca grupos de asientos consecutivos disponibles
 * 5. Retorna el primer grupo válido encontrado como un Set de IDs
 *
 * @param cantidad - Número de asientos consecutivos a reservar
 * @param asientos - Matriz de asientos del teatro
 * @returns Set<number> con los IDs de asientos sugeridos, o Set vacío si no hay solución
 */
function suggest(cantidad: number, asientos: Asiento[][]): Set<number> {
  // Validación: cantidad debe ser positiva y no mayor que asientos por fila
  if (cantidad <= 0 || cantidad > CONFIGURACION.ASIENTOS_POR_FILA) {
    return new Set();
  }

  const numFilas = asientos.length;
  // Calcular el índice de la fila central (ej: 8 filas -> índice 3 o 4)
  const filaCentral = Math.floor((numFilas - 1) / 2);

  /**
   * Busca asientos consecutivos disponibles en una fila específica
   * Prioriza posiciones más cercanas al centro de la fila
   */
  function buscarEnFila(fila: Asiento[]): number[] | null {
    const centroFila = Math.floor(fila.length / 2);
    let mejorInicio = -1;
    let mejorDistanciaAlCentro = Infinity;

    // Buscar todos los grupos posibles de asientos consecutivos
    for (let inicio = 0; inicio <= fila.length - cantidad; inicio++) {
      let consecutivosLibres = true;

      // Verificar si hay 'cantidad' asientos libres consecutivos desde 'inicio'
      for (let j = 0; j < cantidad; j++) {
        if (fila[inicio + j].estado) {
          // estado = true significa ocupado
          consecutivosLibres = false;
          break;
        }
      }

      if (consecutivosLibres) {
        // Calcular la distancia del centro del grupo al centro de la fila
        const centroGrupo = inicio + (cantidad - 1) / 2;
        const distanciaAlCentro = Math.abs(centroGrupo - centroFila);

        // Guardar este grupo si está más cerca del centro
        if (distanciaAlCentro < mejorDistanciaAlCentro) {
          mejorDistanciaAlCentro = distanciaAlCentro;
          mejorInicio = inicio;
        }
      }
    }

    // Si encontramos un grupo válido, retornar los IDs
    if (mejorInicio !== -1) {
      return fila.slice(mejorInicio, mejorInicio + cantidad).map((a) => a.id);
    }

    return null;
  }

  /**
   * Genera el orden de búsqueda de filas desde el centro hacia afuera
   * Ejemplo para 8 filas (índices 0-7, centro en 3):
   * Orden: [3, 4, 2, 5, 1, 6, 0, 7]
   */
  function generarOrdenFilas(): number[] {
    const orden: number[] = [filaCentral];
    let offset = 1;

    while (orden.length < numFilas) {
      // Alternar: primero hacia adelante, luego hacia atrás
      if (filaCentral + offset < numFilas) {
        orden.push(filaCentral + offset);
      }
      if (filaCentral - offset >= 0) {
        orden.push(filaCentral - offset);
      }
      offset++;
    }

    return orden;
  }

  // Buscar en cada fila según el orden de proximidad al centro
  const ordenFilas = generarOrdenFilas();

  for (const indiceFila of ordenFilas) {
    const resultado = buscarEnFila(asientos[indiceFila]);
    if (resultado) {
      return new Set(resultado);
    }
  }

  // No se encontraron asientos disponibles
  return new Set();
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function TheaterReservation() {
  // Estado de los asientos
  const [asientos, setAsientos] = useState<Asiento[][]>(generarAsientosIniciales);
  // Cantidad de asientos a reservar (input del usuario)
  const [cantidad, setCantidad] = useState<string>("");
  // Asientos sugeridos por el algoritmo
  const [asientosSugeridos, setAsientosSugeridos] = useState<Set<number>>(new Set());
  // Asientos seleccionados manualmente por el usuario
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<Set<number>>(new Set());
  // Mensaje de feedback para el usuario
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error" | "info"; texto: string } | null>(null);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const total = CONFIGURACION.FILAS * CONFIGURACION.ASIENTOS_POR_FILA;
    const ocupados = asientos.flat().filter((a) => a.estado).length;
    const disponibles = total - ocupados;
    return { total, ocupados, disponibles };
  }, [asientos]);

  /**
   * Maneja el clic en el botón de sugerir asientos
   */
  const handleSugerir = useCallback(() => {
    const cantidadNum = parseInt(cantidad);

    // Validaciones
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      setMensaje({ tipo: "error", texto: "Por favor, ingresa un número válido mayor a 0" });
      setAsientosSugeridos(new Set());
      return;
    }

    if (cantidadNum > CONFIGURACION.ASIENTOS_POR_FILA) {
      setMensaje({
        tipo: "error",
        texto: `No es posible reservar más de ${CONFIGURACION.ASIENTOS_POR_FILA} asientos consecutivos (tamaño máximo de una fila)`,
      });
      setAsientosSugeridos(new Set());
      return;
    }

    // Ejecutar algoritmo de sugerencia
    const sugeridos = suggest(cantidadNum, asientos);

    if (sugeridos.size === 0) {
      setMensaje({
        tipo: "error",
        texto: `No hay ${cantidadNum} asientos consecutivos disponibles en ninguna fila. Intenta con menos asientos.`,
      });
      setAsientosSugeridos(new Set());
    } else {
      const idsArray = Array.from(sugeridos);
      const primeraFila = Math.ceil(idsArray[0] / CONFIGURACION.ASIENTOS_POR_FILA);
      setMensaje({
        tipo: "info",
        texto: `Se sugieren ${cantidadNum} asientos en la Fila ${primeraFila} (IDs: ${idsArray.join(", ")})`,
      });
      setAsientosSugeridos(sugeridos);
      setAsientosSeleccionados(new Set()); // Limpiar selección manual
    }
  }, [cantidad, asientos]);

  /**
   * Maneja el clic en un asiento individual
   */
  const handleClickAsiento = useCallback((id: number, estado: boolean) => {
    // No permitir seleccionar asientos ocupados
    if (estado) return;

    setAsientosSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
    // Limpiar sugerencias al seleccionar manualmente
    setAsientosSugeridos(new Set());
    setMensaje(null);
  }, []);

  /**
   * Confirma la reserva de los asientos seleccionados o sugeridos
   */
  const handleConfirmarReserva = useCallback(() => {
    const asientosAReservar = asientosSugeridos.size > 0 ? asientosSugeridos : asientosSeleccionados;

    if (asientosAReservar.size === 0) {
      setMensaje({ tipo: "error", texto: "No hay asientos seleccionados para reservar" });
      return;
    }

    // Actualizar el estado de los asientos a ocupados
    setAsientos((prev) =>
      prev.map((fila) =>
        fila.map((asiento) =>
          asientosAReservar.has(asiento.id) ? { ...asiento, estado: true } : asiento
        )
      )
    );

    const idsReservados = Array.from(asientosAReservar).sort((a, b) => a - b);
    setMensaje({
      tipo: "exito",
      texto: `¡Reserva confirmada! Asientos: ${idsReservados.join(", ")}`,
    });
    setAsientosSugeridos(new Set());
    setAsientosSeleccionados(new Set());
    setCantidad("");
  }, [asientosSugeridos, asientosSeleccionados]);

  /**
   * Reinicia el teatro al estado inicial
   */
  const handleReiniciar = useCallback(() => {
    setAsientos(generarAsientosIniciales());
    setAsientosSugeridos(new Set());
    setAsientosSeleccionados(new Set());
    setCantidad("");
    setMensaje({ tipo: "info", texto: "Teatro reiniciado al estado inicial" });
  }, []);

  /**
   * Determina el estado visual de un asiento
   */
  const getEstadoAsiento = (id: number, ocupado: boolean): "ocupado" | "disponible" | "seleccionado" | "sugerido" => {
    if (ocupado) return "ocupado";
    if (asientosSugeridos.has(id)) return "sugerido";
    if (asientosSeleccionados.has(id)) return "seleccionado";
    return "disponible";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Ticket className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary">TEATRO-UNA</h1>
                <p className="text-xs text-muted-foreground">Sistema de Reserva de Asientos</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {estadisticas.disponibles} disponibles
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* ================================================================ */}
        {/* ESCENARIO */}
        {/* ================================================================ */}
        <section className="mb-8">
          <div className="relative mx-auto max-w-3xl">
            {/* Efecto de luces del escenario */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/20 blur-3xl rounded-full" />
            <div className="absolute -top-2 left-1/4 w-16 h-16 bg-primary/10 blur-2xl rounded-full" />
            <div className="absolute -top-2 right-1/4 w-16 h-16 bg-primary/10 blur-2xl rounded-full" />

            {/* Escenario */}
            <div className="relative bg-gradient-to-b from-primary/30 via-primary/20 to-transparent rounded-t-[100px] pt-6 pb-12 px-8">
              <div className="bg-card border-2 border-primary/50 rounded-lg py-4 px-8 text-center shadow-lg shadow-primary/20">
                <span className="text-lg font-semibold tracking-widest text-primary uppercase">
                  Escenario
                </span>
              </div>
            </div>

            {/* Línea decorativa */}
            <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>
        </section>

        {/* ================================================================ */}
        {/* ÁREA DE ASIENTOS */}
        {/* ================================================================ */}
        <section className="mb-8">
          <div className="mx-auto max-w-4xl bg-card rounded-2xl border border-border p-6 shadow-xl">
            {/* Grid de asientos */}
            <div className="overflow-x-auto pb-4">
              <div className="inline-flex flex-col gap-2 min-w-max mx-auto">
                {asientos.map((fila, indexFila) => (
                  <div key={indexFila} className="flex items-center gap-2">
                    {/* Número de fila */}
                    <span className="w-8 text-right text-sm font-medium text-muted-foreground">
                      F{indexFila + 1}
                    </span>

                    {/* Asientos de la fila */}
                    <div className="flex gap-1.5">
                      {fila.map((asiento) => {
                        const estado = getEstadoAsiento(asiento.id, asiento.estado);
                        return (
                          <button
                            key={asiento.id}
                            onClick={() => handleClickAsiento(asiento.id, asiento.estado)}
                            disabled={asiento.estado}
                            className={`
                              w-9 h-9 md:w-10 md:h-10 rounded-lg text-xs font-medium
                              transition-all duration-200 transform
                              flex items-center justify-center
                              ${estado === "ocupado"
                                ? "bg-seat-occupied text-white cursor-not-allowed opacity-70"
                                : estado === "sugerido"
                                ? "bg-seat-suggested text-white ring-2 ring-seat-suggested ring-offset-2 ring-offset-card scale-105 animate-pulse"
                                : estado === "seleccionado"
                                ? "bg-seat-selected text-primary-foreground ring-2 ring-seat-selected ring-offset-2 ring-offset-card scale-105"
                                : "bg-seat-available text-white hover:scale-110 hover:brightness-110 cursor-pointer"
                              }
                              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card
                            `}
                            title={`Asiento ${asiento.id} - ${estado === "ocupado" ? "Ocupado" : "Disponible"}`}
                            aria-label={`Asiento ${asiento.id}, fila ${indexFila + 1}, ${estado}`}
                          >
                            {asiento.id}
                          </button>
                        );
                      })}
                    </div>

                    {/* Número de fila (derecha) */}
                    <span className="w-8 text-left text-sm font-medium text-muted-foreground">
                      F{indexFila + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================ */}
            {/* LEYENDA */}
            {/* ============================================================ */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-seat-available" />
                  <span className="text-sm text-muted-foreground">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-seat-occupied opacity-70" />
                  <span className="text-sm text-muted-foreground">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-seat-selected ring-2 ring-seat-selected ring-offset-1 ring-offset-card" />
                  <span className="text-sm text-muted-foreground">Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-seat-suggested ring-2 ring-seat-suggested ring-offset-1 ring-offset-card" />
                  <span className="text-sm text-muted-foreground">Sugerido</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* PANEL DE RESERVA */}
        {/* ================================================================ */}
        <section className="mb-12">
          <div className="mx-auto max-w-xl bg-card rounded-2xl border border-border p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Reservar Asientos
            </h2>

            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label htmlFor="cantidad" className="block text-sm font-medium text-muted-foreground mb-2">
                  ¿Cuántos asientos deseas reservar?
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    id="cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    min="1"
                    max={CONFIGURACION.ASIENTOS_POR_FILA}
                    placeholder="Ej: 4"
                    className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    onClick={handleSugerir}
                    className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                  >
                    Sugerir
                  </button>
                </div>
              </div>

              {/* Mensaje de feedback */}
              {mensaje && (
                <div
                  className={`p-4 rounded-lg text-sm ${
                    mensaje.tipo === "exito"
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : mensaje.tipo === "error"
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-primary/20 text-primary border border-primary/30"
                  }`}
                >
                  {mensaje.texto}
                </div>
              )}

              {/* Resumen de selección */}
              {(asientosSugeridos.size > 0 || asientosSeleccionados.size > 0) && (
                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Asientos a reservar:</p>
                  <p className="font-medium text-foreground">
                    {Array.from(asientosSugeridos.size > 0 ? asientosSugeridos : asientosSeleccionados)
                      .sort((a, b) => a - b)
                      .join(", ")}
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmarReserva}
                  disabled={asientosSugeridos.size === 0 && asientosSeleccionados.size === 0}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                >
                  Confirmar Reserva
                </button>
                <button
                  onClick={handleReiniciar}
                  className="px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-all focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 focus:ring-offset-card"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* ESTADÍSTICAS */}
        {/* ================================================================ */}
        <section className="mb-12">
          <div className="mx-auto max-w-3xl grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-3xl font-bold text-primary">{estadisticas.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-3xl font-bold text-seat-available">{estadisticas.disponibles}</p>
              <p className="text-sm text-muted-foreground">Disponibles</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-3xl font-bold text-seat-occupied">{estadisticas.ocupados}</p>
              <p className="text-sm text-muted-foreground">Ocupados</p>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      <footer className="border-t border-border bg-card/50 py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Logo e información */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">TEATRO-UNA</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                El mejor teatro de la ciudad, ofreciendo experiencias culturales únicas desde 1985.
              </p>
            </div>

            {/* Información de contacto */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Av. Universidad 123, Ciudad Universitaria, CP 12345</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">+52 (55) 1234-5678</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">reservas@teatro-una.edu</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TEATRO-UNA. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
