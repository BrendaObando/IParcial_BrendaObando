# Teatro-UNA

Aplicación web desarrollada con `Next.js` para la reserva de asientos en un teatro.

El proyecto implementa una matriz de asientos, una función de sugerencia de espacios contiguos y una interfaz visual para seleccionar, sugerir y confirmar reservas.

## Requisitos

- `Node.js` instalado
- `npm` disponible en la terminal
- Windows PowerShell recomendado para usar el script `npm run dev` tal como está configurado

## Instalación

Si el proyecto aún no tiene dependencias instaladas, ejecutá:

```powershell
npm install
```

## Cómo correr el proyecto

Usá este comando:

```powershell
npm run dev
```

Luego abrí en el navegador:

```text
http://localhost:3000
```

## Importante sobre el puerto 3000

El script `npm run dev` fue ajustado para intentar liberar automáticamente el puerto `3000` antes de iniciar el servidor.

Eso significa que normalmente no deberías tener que matar procesos manualmente.

Si aun así algo falla, podés intentar:

```powershell
taskkill /F /IM node.exe
npm run dev
```

## Scripts disponibles

- `npm run dev`
  Inicia el proyecto en modo desarrollo.

- `npm run build`
  Genera la versión de producción.

- `npm run start`
  Ejecuta la versión de producción luego de compilar.

- `npm run lint`
  Script definido en `package.json`, aunque en el estado actual del proyecto puede requerir instalar `eslint` si se quiere usar.

## Pruebas del algoritmo

El proyecto incluye pruebas para validar la lógica de selección de asientos.

Ejecutá:

```powershell
node --test tests\theater.test.ts
```

Casos cubiertos:

- Solicitar 1 asiento
- Solicitar varios asientos contiguos
- Solicitar más asientos que el tamaño de una fila
- Solicitar una cantidad que no existe junta en ninguna fila
- Verificar prioridad por filas cercanas al centro
- Verificar que el resultado sea un `Set`
- Verificar el estado visual de asientos sugeridos

## Validación de TypeScript

Para revisar que no haya errores de tipos:

```powershell
npx tsc --noEmit
```

## Estructura importante del proyecto

- `app/`
  Rutas y layout principal de la aplicación.

- `components/theater-reservation.tsx`
  Componente principal de la interfaz del teatro.

- `lib/theater.ts`
  Lógica de la matriz de asientos y algoritmo de sugerencia.

- `tests/theater.test.ts`
  Pruebas del comportamiento requerido por el ejercicio.

- `app/globals.css`
  Estilos globales, colores y temas claro/oscuro.

## Funcionalidad principal

La app permite:

- ver la matriz de asientos del teatro
- seleccionar asientos manualmente
- sugerir asientos contiguos automáticamente
- confirmar la reserva
- reiniciar el estado del teatro
- cambiar entre tema claro y oscuro

## Lógica implementada

La sugerencia de asientos cumple estas reglas:

- los asientos se representan con una matriz
- cada asiento tiene `id` y `estado`
- la búsqueda inicia por las filas más cercanas al centro
- si varias filas cumplen, se elige la más cercana al centro
- los asientos sugeridos son contiguos y están en una misma fila
- si no existe solución, se devuelve un `Set` vacío

## Problemas comunes

### El proyecto no abre en el navegador

Verificá que esté corriendo `npm run dev` y abrí:

```text
http://localhost:3000
```

Si el navegador muestra una versión vieja, recargá con:

```text
Ctrl + F5
```

### El puerto sigue ocupado

Ejecutá:

```powershell
taskkill /F /IM node.exe
npm run dev
```

## Autor

Proyecto adaptado para el ejercicio de reserva de asientos del teatro en JavaScript.
