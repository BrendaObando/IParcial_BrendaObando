import test from "node:test";
import assert from "node:assert/strict";

import {
  crearMatrizAsientos,
  generateRowSearchOrder,
  getSeatButtonClassName,
  getSeatVisualState,
  suggestSeats,
} from "../lib/theater.ts";

function ids(resultado: Set<number>): number[] {
  return Array.from(resultado);
}

test("Solicitar 1 asiento devuelve un Set con el mejor asiento de la fila más cercana al escenario", () => {
  const matriz = crearMatrizAsientos(5, 5);
  const resultado = suggestSeats(1, matriz);

  assert.ok(resultado instanceof Set);
  assert.deepEqual(ids(resultado), [3]);
});

test("Solicitar varios asientos contiguos devuelve el mejor bloque centrado en la fila más cercana al escenario", () => {
  const matriz = crearMatrizAsientos(5, 6);
  const resultado = suggestSeats(3, matriz);

  assert.deepEqual(ids(resultado), [2, 3, 4]);
});

test("Solicitar más asientos que el tamaño de una fila devuelve un Set vacío", () => {
  const matriz = crearMatrizAsientos(4, 4);
  const resultado = suggestSeats(5, matriz);

  assert.ok(resultado instanceof Set);
  assert.equal(resultado.size, 0);
});

test("Solicitar una cantidad que no existe junta en ninguna fila devuelve un Set vacío", () => {
  const matriz = crearMatrizAsientos(3, 4, [1, 3, 6, 8, 9, 11]);
  const resultado = suggestSeats(2, matriz);

  assert.equal(resultado.size, 0);
});

test("Si varias filas cumplen, se elige la más cercana al escenario", () => {
  const matriz = crearMatrizAsientos(5, 4, [1, 2, 3, 4, 17, 18, 19, 20]);
  const resultado = suggestSeats(2, matriz);

  assert.deepEqual(generateRowSearchOrder(5), [0, 1, 2, 3, 4]);
  assert.deepEqual(ids(resultado), [6, 7]);
});

test("El estado visual sugerido aplica la clase de color correcta", () => {
  const sugeridos = new Set([10, 11]);
  const seleccionados = new Set<number>();
  const estado = getSeatVisualState(10, false, sugeridos, seleccionados);

  assert.equal(estado, "sugerido");
  assert.match(getSeatButtonClassName(estado), /bg-seat-suggested/);
});
