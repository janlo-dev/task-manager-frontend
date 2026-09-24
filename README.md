# Task Manager — Frontend

Frontend en **React** de un gestor de tareas estilo **Trello**: tableros con columnas, tareas que se arrastran entre columnas, edición inline y tableros compartidos con otros usuarios.

Consume la API REST del backend **[task-manager-api](https://github.com/janlo-dev/task-manager-api)** (repositorio hermano), que se encarga de la autenticación con JWT, la persistencia y las reglas de negocio (permisos de OWNER/MEMBER, borrados en cascada, etc.).

---

## Stack

| | |
|---|---|
| **UI** | React 19 (JavaScript + JSX) |
| **Build / dev server** | Vite 8 |
| **Estilos** | Tailwind CSS v4 (plugin `@tailwindcss/vite`, sin CSS propio) |
| **Drag-and-drop** | `@hello-pangea/dnd` (fork mantenido de `react-beautiful-dnd`) |
| **Tests** | Vitest + React Testing Library + jsdom |
| **Calidad** | ESLint (reglas de `react-hooks` y `react-refresh`) |

No usa router ni librería de estado global: la navegación y el estado se gestionan con `useState` y props (ver [Arquitectura](#arquitectura)).

---

## Funcionalidades

- **Autenticación**: registro e inicio de sesión. El token JWT se guarda en `sessionStorage` (la sesión dura lo que la pestaña).
- **Tableros**: crear, renombrar inline y borrar (con confirmación). Si el usuario solo tiene un tablero, al entrar se abre directamente.
- **Columnas**: crear, renombrar inline y borrar (con confirmación; el backend borra en cascada sus tareas).
- **Tareas**: crear con título y descripción, editar la descripción inline y borrar (con confirmación).
- **Drag-and-drop**:
  - reordenar columnas arrastrándolas por su cabecera;
  - mover tareas de una columna a otra (la tarea se coloca al final de la columna destino).
- **Miembros del tablero**: ver la lista de miembros con su rol (OWNER / MEMBER), invitar por email y expulsar a los MEMBER.
- **Asignación de tareas**: cada tarjeta tiene un selector para asignarla a un miembro del tablero o dejarla "Sin asignar".

Los errores que devuelve el backend (por ejemplo, un 403 al invitar si no eres OWNER, o "el usuario ya es miembro") se muestran en pantalla tal cual.

---

## Arquitectura

```
src/
├── App.jsx                 # Sesión y navegación (login ↔ lista de tableros ↔ tablero)
├── components/             # UI: estado de pantalla, formularios y renderizado
│   ├── Login.jsx / Register.jsx
│   ├── BoardList.jsx       # Lista de tableros
│   ├── BoardDetail.jsx     # Un tablero: columnas, tareas, miembros y drag-and-drop
│   ├── ColumnCard.jsx      # Una columna y sus tarjetas de tarea
│   └── InlineEdit.jsx      # Componente reutilizable de edición inline
├── services/               # Acceso a la API: una función por endpoint, sin lógica de UI
│   ├── config.js           # URL base de la API (VITE_API_URL)
│   ├── apiClient.js        # Cliente HTTP centralizado
│   ├── authService.js
│   ├── boardService.js · columnService.js · taskService.js · boardMemberService.js
└── utils/
    └── dragAndDrop.js      # Lógica pura del drag-and-drop (testeable sin React)
```

### `components/` y `services/`

Los componentes nunca llaman a `fetch` directamente: llaman a funciones con nombre de negocio (`renameColumn`, `moveTask`, `inviteBoardMember`…) definidas en `services/`. Así la UI no conoce URLs ni formatos de petición, y cada endpoint del backend está en un único sitio.

### Cliente HTTP centralizado (`apiClient.js`)

Todos los servicios, salvo login y registro, pasan por `apiFetch()`, que:

- añade la cabecera `Authorization: Bearer <token>` si hay sesión;
- ante un **401** hace **logout forzoso** (borra el token y recarga la app, que vuelve a la pantalla de login);
- convierte las respuestas no-OK en un `Error` con el mensaje que devuelve el backend (`{ error: "..." }`);
- gestiona el `204 No Content` de los `DELETE`.

`authService.js` usa `fetch` directamente porque login y registro son precisamente las peticiones que aún no tienen token.

### Optimistic update

Todas las mutaciones (renombrar, borrar, mover, asignar, invitar, expulsar) siguen el mismo patrón:

1. **Actualizar el estado local al instante**, para que la interfaz responda sin esperar a la red.
2. **Llamar al backend.**
3. **Si falla**, mostrar el error y **recargar los datos reales** del servidor (`loadBoard()`, `loadBoards()` o `loadMembers()`), descartando el cambio optimista.

Hay dos excepciones: crear elementos e invitar miembros. El identificador (y, al invitar, el nombre del usuario) lo asigna el backend, así que tras confirmarse se recarga la parte afectada. Al invitar se muestra una fila provisional ("invitando…") mientras tanto.

### Levantamiento de estado

El estado vive en el componente más alto que lo necesita, y baja por props junto con los callbacks para modificarlo:

- **`App`** guarda la sesión (`loggedIn`) y qué tablero está abierto (`selectedBoardId`). `BoardList` y `BoardDetail` no navegan por sí mismos: avisan a `App` con `onSelectBoard` / `onBack`.
- **`BoardDetail`** es la única fuente de verdad del tablero abierto: `columns`, `tasksByColumn` (`{ columnId: [tareas] }`) y `members`.
- **`ColumnCard`** no carga datos: recibe sus tareas y la lista de miembros por props, y delega todas las operaciones en callbacks de `BoardDetail` (`onCreateTask`, `onDeleteTask`, `onAssignTask`…).

El estado de las tareas se subió de `ColumnCard` a `BoardDetail` para poder usar el drag-and-drop: con un único `onDragEnd`, una tarea tiene que poder pasar del array de una columna al de otra. De paso, los miembros se piden **una sola vez** por tablero y se reutilizan tanto en la sección de miembros como en el selector de asignación de cada tarjeta.

### Drag-and-drop

Hay un único `DragDropContext` con dos tipos de `Droppable` (`type="column"` y `type="task"`) para que columnas y tareas no se mezclen. La columna solo se arrastra desde su cabecera, para no interferir con el arrastre de las tareas que contiene.

La decisión de *qué ha pasado y cuál es el nuevo estado* está extraída a una función pura, `computeDragResult()` en `utils/dragAndDrop.js`. `handleDragEnd` solo aplica ese resultado y lo persiste. Esto permite testear las reglas del drag-and-drop sin montar componentes ni simular arrastres.

---

## Cómo arrancar

### Requisitos

- **Node.js** `^20.19.0` o `>=22.12.0` (lo exige Vite 8).
- El backend **[task-manager-api](https://github.com/janlo-dev/task-manager-api)** en marcha (por defecto en `http://localhost:8080`).

### Instalación y arranque

```bash
npm install
cp .env.example .env   # opcional si el backend está en http://localhost:8080
npm run dev
```

La app queda en `http://localhost:5173`.

### Configuración: `VITE_API_URL`

La URL base de la API se configura con la variable de entorno **`VITE_API_URL`**, que incluye el prefijo `/api`:

```bash
# .env
VITE_API_URL=http://localhost:8080/api
```

- Se lee en un único sitio, `src/services/config.js`, del que la importan tanto `apiClient.js` como `authService.js`.
- Si no está definida, se usa `http://localhost:8080/api`, así que en desarrollo local funciona sin crear ningún `.env`.
- `.env.example` sirve de plantilla y está versionado. Los `.env` / `.env.*` reales están en `.gitignore` para no subir configuración local.
- Como toda variable `VITE_*`, Vite la inserta en el código **al compilar**: para un build contra otro backend, defínela antes de `npm run build`.

### Otros scripts

| Comando | Qué hace |
|---|---|
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción en local |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm test` | Vitest en modo watch |
| `npm run test:run` | Ejecuta los tests una vez |

---

## Testing

Tests con **Vitest** y **React Testing Library** (entorno `jsdom`; `jest-dom` cargado globalmente en `src/test/setup.js`).

```bash
npm run test:run
```

El [backend](https://github.com/janlo-dev/task-manager-api) ya tiene su propia batería de tests, así que aquí no se busca cobertura exhaustiva, sino cubrir los puntos de más riesgo del frontend:

| Archivo | Qué cubre |
|---|---|
| `src/utils/dragAndDrop.test.js` | La lógica pura del drag-and-drop: casos en los que no se hace nada (soltar fuera, misma posición, misma columna), reordenar columnas hacia delante y hacia atrás, y mover tareas entre columnas (va al final del destino, se actualiza su `columnId`, columna destino vacía, y nunca se muta el estado original). |
| `src/services/authService.test.js` | `login` y `register` con éxito (se guarda el token en `sessionStorage`) y con error (se lanza el mensaje correcto y no se guarda nada), y `logout`. `fetch` está mockeado. |
| `src/components/Login.test.jsx` | El formulario de login como lo usaría una persona (`userEvent`): envía los valores escritos al servicio y, si falla, muestra el error sin dar la sesión por iniciada. |

---

## Decisiones de diseño

**JavaScript en lugar de TypeScript.** El proyecto se planteó como aprendizaje incremental: primero asentar bien React (componentes, hooks, levantamiento de estado, efectos) sin añadir a la vez la capa de tipos. La migración a TypeScript queda como siguiente paso natural (ver más abajo).

**Edición inline en lugar de modales.** Inspirado en Trello: haces clic en ✏️, el texto se convierte en un campo editable y **Enter** o hacer clic fuera guarda (**Escape** cancela). Es más rápido para cambios pequeños, que son los más habituales, y no saca al usuario del contexto del tablero. La lógica vive en un único componente reutilizable, `InlineEdit`, que usan tableros, columnas y descripciones de tareas. Los borrados, en cambio, siempre piden confirmación, porque no hay deshacer.

**Sin router ni gestor de estado global.** Con tres pantallas y un único tablero abierto a la vez, `useState` y props son suficientes y mantienen el flujo de datos explícito. Si la app crece (URLs compartibles por tablero, más vistas), serían los primeros candidatos a introducir.

---

## Pendiente / mejoras futuras

- **Reordenar tareas dentro de una misma columna.** Ahora mismo soltar una tarea en su propia columna no hace nada: el modelo de tarea del backend aún no tiene un campo de orden, así que las tareas movidas se colocan siempre al final.
- **Acceso directo en el email de bienvenida.** Cuando haya un despliegue real, añadir en el email de bienvenida un botón que lleve directamente a la app.
- **Migración a TypeScript**, empezando por `services/` y `utils/`, donde los tipos de las respuestas de la API darían más valor.
