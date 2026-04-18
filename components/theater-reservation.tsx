"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Mail, MapPin, Moon, Phone, Sparkles, Sun, Ticket, Users } from "lucide-react";
import { useTheme } from "next-themes";

import {
  THEATER_CONFIG,
  generarAsientosIniciales,
  getSeatButtonClassName,
  getSeatRowNumber,
  getSeatVisualState,
  suggestSeats,
  type Seat,
} from "@/lib/theater";

export default function TheaterReservation() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [asientos, setAsientos] = useState<Seat[][]>(generarAsientosIniciales);
  const [cantidad, setCantidad] = useState<string>("");
  const [asientosSugeridos, setAsientosSugeridos] = useState<Set<number>>(new Set());
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<Set<number>>(new Set());
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error" | "info"; texto: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const estadisticas = useMemo(() => {
    const total = asientos.flat().length;
    const ocupados = asientos.flat().filter((a) => a.estado).length;
    const disponibles = total - ocupados;
    const sugeridos = asientosSugeridos.size;
    const seleccionados = asientosSeleccionados.size;
    const pendientes = sugeridos > 0 ? sugeridos : seleccionados;

    return { total, ocupados, disponibles, sugeridos, seleccionados, pendientes };
  }, [asientos, asientosSeleccionados, asientosSugeridos]);

  // Función requerida por el ejercicio: recibe solo la cantidad a reservar.
  const suggest = useCallback((cantidadSolicitada: number): Set<number> => {
    return suggestSeats(cantidadSolicitada, asientos);
  }, [asientos]);

  const handleSugerir = useCallback(() => {
    const cantidadNum = parseInt(cantidad, 10);

    if (Number.isNaN(cantidadNum) || cantidadNum <= 0) {
      setMensaje({ tipo: "error", texto: "Por favor, ingresa un número válido mayor a 0" });
      setAsientosSugeridos(new Set());
      return;
    }

    if (cantidadNum > THEATER_CONFIG.ASIENTOS_POR_FILA) {
      setMensaje({
        tipo: "error",
        texto: `No es posible reservar más de ${THEATER_CONFIG.ASIENTOS_POR_FILA} asientos consecutivos (tamaño máximo de una fila)`,
      });
      setAsientosSugeridos(new Set());
      return;
    }

    const sugeridos = suggest(cantidadNum);

    if (sugeridos.size === 0) {
      setMensaje({
        tipo: "error",
        texto: `No hay ${cantidadNum} asientos consecutivos disponibles en ninguna fila. Intenta con menos asientos.`,
      });
      setAsientosSugeridos(new Set());
      return;
    }

    const idsArray = Array.from(sugeridos);
    const primeraFila = getSeatRowNumber(idsArray[0], THEATER_CONFIG.ASIENTOS_POR_FILA);
    setMensaje({
      tipo: "info",
      texto: `Se sugieren ${cantidadNum} asientos en la Fila ${primeraFila} (IDs: ${idsArray.join(", ")})`,
    });
    setAsientosSugeridos(sugeridos);
    setAsientosSeleccionados(new Set());
  }, [cantidad, suggest]);

  const handleClickAsiento = useCallback((id: number, estado: boolean) => {
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

    setAsientosSugeridos(new Set());
    setMensaje(null);
  }, []);

  const handleConfirmarReserva = useCallback(() => {
    const asientosAReservar = asientosSugeridos.size > 0 ? asientosSugeridos : asientosSeleccionados;

    if (asientosAReservar.size === 0) {
      setMensaje({ tipo: "error", texto: "No hay asientos seleccionados para reservar" });
      return;
    }

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
  }, [asientosSeleccionados, asientosSugeridos]);

  const handleReiniciar = useCallback(() => {
    setAsientos(generarAsientosIniciales());
    setAsientosSugeridos(new Set());
    setAsientosSeleccionados(new Set());
    setCantidad("");
    setMensaje({ tipo: "info", texto: "Teatro reiniciado al estado inicial" });
  }, []);

  const getEstadoAsiento = useCallback((id: number, ocupado: boolean) => {
    return getSeatVisualState(id, ocupado, asientosSugeridos, asientosSeleccionados);
  }, [asientosSeleccionados, asientosSugeridos]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-card/60 backdrop-blur-xl sticky top-0 z-50 shadow-[0_10px_30px_-18px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <Ticket className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary">TEATRO-UNA</h1>
                <p className="text-xs text-muted-foreground">Reserva interactiva con sugerencia priorizando cercanía al escenario</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-6 text-sm text-muted-foreground">
              <span className="hidden md:flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2">
                <Users className="w-4 h-4" />
                {estadisticas.disponibles} disponibles
              </span>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-foreground transition-colors hover:bg-secondary"
                aria-label="Cambiar tema"
              >
                {isMounted && resolvedTheme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-300" />
                    <span className="hidden sm:inline">Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-primary" />
                    <span className="hidden sm:inline">Oscuro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="relative mx-auto max-w-3xl">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-28 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute top-2 left-8 h-16 w-16 rounded-full bg-accent/20 blur-2xl" />
            <div className="absolute top-0 right-10 h-20 w-20 rounded-full bg-primary/15 blur-2xl" />

            <div className="relative rounded-t-[110px] bg-gradient-to-b from-primary/30 via-accent/20 to-transparent px-8 pt-8 pb-14">
              <div className="rounded-2xl border border-primary/30 bg-card/80 py-4 px-8 text-center shadow-[0_22px_45px_-28px_color-mix(in_oklab,var(--primary)_65%,transparent)]">
                <span className="text-lg font-semibold tracking-widest text-primary uppercase">
                  Escenario
                </span>
              </div>
            </div>

            <div className="h-1 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          </div>
        </section>

        <section className="mb-8">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-border/70 bg-card/70 p-6 shadow-[0_24px_60px_-32px_color-mix(in_oklab,var(--primary)_38%,transparent)] backdrop-blur-xl">
            <div className="overflow-x-auto pb-4">
              <div className="flex min-w-full justify-center">
                <div className="inline-flex flex-col gap-2 min-w-max items-center">
                {asientos.map((fila, indexFila) => (
                  <div key={indexFila} className="flex items-center gap-2">
                    <span className="w-8 text-right text-sm font-medium text-muted-foreground">
                      F{indexFila + 1}
                    </span>

                    <div className="flex gap-1.5 rounded-full bg-background/35 px-3 py-2">
                      {fila.map((asiento) => {
                        const estado = getEstadoAsiento(asiento.id, asiento.estado);

                        return (
                          <button
                            key={asiento.id}
                            onClick={() => handleClickAsiento(asiento.id, asiento.estado)}
                            disabled={asiento.estado}
                            className={getSeatButtonClassName(estado)}
                            title={`Asiento ${asiento.id} - ${estado === "ocupado" ? "Ocupado" : "Disponible"}`}
                            aria-label={`Asiento ${asiento.id}, fila ${indexFila + 1}, ${estado}`}
                            data-seat-state={estado}
                          >
                            {asiento.id}
                          </button>
                        );
                      })}
                    </div>

                    <span className="w-8 text-left text-sm font-medium text-muted-foreground">
                      F{indexFila + 1}
                    </span>
                  </div>
                ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border/70 pt-6">
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

        <section className="mb-12">
          <div className="mx-auto max-w-xl rounded-[28px] border border-border/70 bg-card/72 p-6 shadow-[0_22px_58px_-36px_color-mix(in_oklab,var(--accent)_65%,transparent)] backdrop-blur-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Reservar Asientos
            </h2>

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
                    max={THEATER_CONFIG.ASIENTOS_POR_FILA}
                    placeholder="Ej: 4"
                    className="flex-1 rounded-2xl border border-border/80 bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground shadow-inner shadow-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={handleSugerir}
                    className="rounded-2xl bg-gradient-to-r from-accent to-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                  >
                    Sugerir
                  </button>
                </div>
              </div>

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

              {(asientosSugeridos.size > 0 || asientosSeleccionados.size > 0) && (
                <div className="rounded-2xl border border-border/70 bg-secondary/70 p-4">
                  <p className="text-sm text-muted-foreground mb-1">Asientos a reservar:</p>
                  <p className="font-medium text-foreground">
                    {Array.from(asientosSugeridos.size > 0 ? asientosSugeridos : asientosSeleccionados)
                      .sort((a, b) => a - b)
                      .join(", ")}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmarReserva}
                  disabled={asientosSugeridos.size === 0 && asientosSeleccionados.size === 0}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                >
                  Confirmar Reserva
                </button>
                <button
                  onClick={handleReiniciar}
                  className="rounded-2xl border border-border/70 bg-secondary/75 px-6 py-3 font-medium text-secondary-foreground transition-all hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 focus:ring-offset-card"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="mx-auto max-w-5xl grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-border/70 bg-card/72 p-4 text-center backdrop-blur-xl">
              <p className="text-3xl font-bold text-primary">{estadisticas.total}</p>
              <p className="text-sm text-muted-foreground">Total de asientos</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-card/72 p-4 text-center backdrop-blur-xl">
              <p className="text-3xl font-bold text-seat-available">{estadisticas.disponibles}</p>
              <p className="text-sm text-muted-foreground">Disponibles</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-card/72 p-4 text-center backdrop-blur-xl">
              <p className="text-3xl font-bold text-seat-occupied">{estadisticas.ocupados}</p>
              <p className="text-sm text-muted-foreground">Ocupados</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-card/72 p-4 text-center backdrop-blur-xl">
              <p className="text-3xl font-bold text-seat-suggested">{estadisticas.pendientes}</p>
              <p className="text-sm text-muted-foreground">
                {estadisticas.sugeridos > 0
                  ? "Sugeridos"
                  : estadisticas.seleccionados > 0
                  ? "Seleccionados"
                  : "Pendientes"}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-border/70 bg-card/55 py-12 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-border/70 bg-background/45 p-6 shadow-[0_20px_50px_-34px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary shadow-lg shadow-primary/25">
                  <Ticket className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
                    Teatro Universitario
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight text-primary">TEATRO-UNA</h3>
                </div>
              </div>

              <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                Plataforma de reserva de asientos con sugerencia inteligente por cercanía al escenario,
                selección visual de espacios y confirmación inmediata de disponibilidad.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-border/70 bg-secondary/70 px-4 py-2 text-xs font-medium text-secondary-foreground">
                  Tema claro y oscuro
                </span>
                <span className="rounded-full border border-border/70 bg-secondary/70 px-4 py-2 text-xs font-medium text-secondary-foreground">
                  Sugerencias automáticas
                </span>
                <span className="rounded-full border border-border/70 bg-secondary/70 px-4 py-2 text-xs font-medium text-secondary-foreground">
                  Estado en tiempo real
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-background/45 p-6 shadow-[0_20px_50px_-34px_color-mix(in_oklab,var(--accent)_45%,transparent)]">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Contacto
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">Av. Universidad 123, Ciudad Universitaria, CP 12345</span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 text-sm">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">+52 (55) 1234-5678</span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 text-sm">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">reservas@teatro-una.edu</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-center">
            <p>© {new Date().getFullYear()} TEATRO-UNA. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
