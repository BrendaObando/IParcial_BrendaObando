export interface Seat {
  id: number;
  estado: boolean;
}

export type SeatMatrix = Seat[][];

export const THEATER_CONFIG = {
  FILAS: 8,
  ASIENTOS_POR_FILA: 12,
} as const;

export type SeatVisualState = "ocupado" | "disponible" | "seleccionado" | "sugerido";

export function generarAsientosIniciales(): SeatMatrix {
  const asientos: SeatMatrix = [];
  let idContador = 1;

  const asientosOcupados = new Set([
    3, 4, 5,
    14, 15, 18,
    27, 28, 29, 30,
    38, 39, 40, 41, 42,
    50, 51, 55, 56,
    63, 64, 70, 71, 72,
    80, 85, 86,
    93, 94, 95,
  ]);

  for (let fila = 0; fila < THEATER_CONFIG.FILAS; fila++) {
    const filaAsientos: Seat[] = [];

    for (let asiento = 0; asiento < THEATER_CONFIG.ASIENTOS_POR_FILA; asiento++) {
      filaAsientos.push({
        id: idContador,
        estado: asientosOcupados.has(idContador),
      });
      idContador++;
    }

    asientos.push(filaAsientos);
  }

  return asientos;
}

export function crearMatrizAsientos(
  filas: number,
  asientosPorFila: number,
  ocupados: number[] = []
): SeatMatrix {
  const ocupadosSet = new Set(ocupados);
  const matriz: SeatMatrix = [];
  let id = 1;

  for (let fila = 0; fila < filas; fila++) {
    const filaActual: Seat[] = [];

    for (let asiento = 0; asiento < asientosPorFila; asiento++) {
      filaActual.push({
        id,
        estado: ocupadosSet.has(id),
      });
      id++;
    }

    matriz.push(filaActual);
  }

  return matriz;
}

export function generateRowSearchOrder(numFilas: number): number[] {
  if (numFilas <= 0) {
    return [];
  }

  return Array.from({ length: numFilas }, (_, index) => index);
}

function buscarMejorGrupoEnFila(fila: Seat[], cantidad: number): number[] | null {
  const centroFila = (fila.length - 1) / 2;
  let mejorInicio = -1;
  let mejorDistancia = Infinity;

  for (let inicio = 0; inicio <= fila.length - cantidad; inicio++) {
    const grupo = fila.slice(inicio, inicio + cantidad);

    if (!grupo.every((asiento) => !asiento.estado)) {
      continue;
    }

    const centroGrupo = inicio + (cantidad - 1) / 2;
    const distancia = Math.abs(centroGrupo - centroFila);

    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejorInicio = inicio;
    }
  }

  if (mejorInicio === -1) {
    return null;
  }

  return fila.slice(mejorInicio, mejorInicio + cantidad).map((seat) => seat.id);
}

export function suggestSeats(cantidad: number, asientos: SeatMatrix): Set<number> {
  if (cantidad <= 0 || asientos.length === 0) {
    return new Set<number>();
  }

  const asientosPorFila = asientos[0]?.length ?? 0;
  if (cantidad > asientosPorFila) {
    return new Set<number>();
  }

  const ordenFilas = generateRowSearchOrder(asientos.length);

  for (const indiceFila of ordenFilas) {
    const resultado = buscarMejorGrupoEnFila(asientos[indiceFila], cantidad);

    if (resultado) {
      return new Set(resultado);
    }
  }

  return new Set<number>();
}

export function getSeatVisualState(
  id: number,
  ocupado: boolean,
  asientosSugeridos: Set<number>,
  asientosSeleccionados: Set<number>
): SeatVisualState {
  if (ocupado) return "ocupado";
  if (asientosSugeridos.has(id)) return "sugerido";
  if (asientosSeleccionados.has(id)) return "seleccionado";
  return "disponible";
}

export function getSeatButtonClassName(estado: SeatVisualState): string {
  const baseClassName = [
    "w-9 h-9 md:w-10 md:h-10 rounded-lg text-xs font-medium",
    "transition-all duration-200 transform",
    "flex items-center justify-center",
  ].join(" ");

  const colorClassName =
    estado === "ocupado"
      ? "bg-seat-occupied text-white cursor-not-allowed opacity-70"
      : estado === "sugerido"
      ? "bg-seat-suggested text-white ring-2 ring-seat-suggested ring-offset-2 ring-offset-card scale-105 animate-pulse"
      : estado === "seleccionado"
      ? "bg-seat-selected text-primary-foreground ring-2 ring-seat-selected ring-offset-2 ring-offset-card scale-105"
      : "bg-seat-available text-white hover:scale-110 hover:brightness-110 cursor-pointer";

  const focusClassName =
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card";

  return `${baseClassName} ${colorClassName} ${focusClassName}`;
}

export function getSeatRowNumber(seatId: number, asientosPorFila: number): number {
  return Math.ceil(seatId / asientosPorFila);
}
