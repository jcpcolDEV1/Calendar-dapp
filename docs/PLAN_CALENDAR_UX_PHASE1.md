# Plan: Fase 1 – Rediseño UX Calendario

Implementar en pasos seguros sin romper funcionalidad existente. Cada **Update** es independiente y puede ejecutarse en una sesión separada.

---

## Update 1: Panel deslizante + estructura base

**Objetivo:** Cambiar el DayDetailPanel de modal centrado a panel deslizante desde la derecha.

**Archivos a modificar:**
- `components/entries/DayDetailPanel.tsx`

**Cambios:**
- Sustituir el overlay centrado por un panel que entra desde la derecha (`translate-x`, `transition`).
- Mantener el mismo contenido: header con fecha, botón cerrar, EntryList, botón "Add entry".
- Añadir `data-testid="day-detail-panel"` si no existe.
- En móvil: panel a ancho completo o casi completo.

**No tocar:** EntryForm, EntryList, EntryCard, acciones de Supabase.

**Verificación:** Click en día → panel se abre desde la derecha. Cerrar con X o Escape.

---

## Update 2: Quick Task Input

**Objetivo:** Añadir input rápido para crear tareas con Enter, sin abrir el formulario completo.

**Archivos a crear:**
- `components/entries/QuickTaskInput.tsx` – input con placeholder "Escribe una tarea..."

**Archivos a modificar:**
- `components/entries/DayDetailPanel.tsx` – integrar QuickTaskInput debajo de la lista.
- `app/actions/entries.ts` – ya soporta `createEntryAction`; no cambios necesarios.

**Lógica QuickTaskInput:**
- Input controlado, placeholder "Escribe una tarea..."
- `onKeyDown`: Enter → crear tarea (entry_type: "task", title: texto, date: fecha del panel, time: null).
- Llamar a `createEntryAction`, luego `onRefresh()`.
- Limpiar input tras crear.
- No modal, no form pesado.

**Orden en DayDetailPanel:**
1. Header (fecha + cerrar)
2. EntryList (tareas del día)
3. QuickTaskInput (siempre visible)
4. Botón "Add entry" (para abrir EntryForm completo, opcional) – puede quedar como "Añadir con más opciones" o similar.

**Verificación:** Escribir "comprar leche" + Enter → tarea creada, aparece en la lista.

---

## Update 3: Time parsing en Quick Task Input

**Objetivo:** Permitir "9:00 reunión con Juan" → crear tarea con time="09:00" y title="reunión con Juan".

**Archivos a crear:**
- `lib/parse-task-input.ts` – función `parseTaskInput(text: string): { title: string; time: string | null }`

**Archivos a modificar:**
- `components/entries/QuickTaskInput.tsx` – usar `parseTaskInput` antes de crear.

**Reglas de parsing (ejemplos):**
- `9:00 meeting` → time: "09:00", title: "meeting"
- `15:30 team call` → time: "15:30", title: "team call"
- `9am lunch` → time: "09:00", title: "lunch"
- `comprar comida` → time: null, title: "comprar comida"

**Formato de salida para Supabase:** `time` en formato "HH:mm" (ej. "09:00").

**Verificación:** "9:00 reunión" → tarea con hora. "comprar leche" → tarea sin hora.

---

## Update 4: Orden de tareas en Day Panel

**Objetivo:** Ordenar tareas: con hora (más temprano primero), luego sin hora.

**Archivos a modificar:**
- `components/entries/EntryList.tsx` – ordenar `entries` antes de renderizar.
- O `components/entries/DayDetailPanel.tsx` – pasar entries ya ordenados a EntryList.

**Lógica de orden:**
1. Tareas con `time` → ordenadas por `time` ascendente.
2. Tareas sin `time` → al final, orden arbitrario (ej. por `created_at`).

**Verificación:** Varias tareas con y sin hora → orden correcto en el panel.

---

## Update 5: Vista previa de tareas en celdas del calendario

**Objetivo:** Mostrar hasta 3 tareas en cada celda; si hay más, mostrar "+N more".

**Archivos a modificar:**
- `components/calendar/DayCell.tsx`

**Cambios:**
- Sustituir los puntos de colores por lista de tareas.
- Mostrar máximo 3 tareas.
- Con hora: `09:00 reunión`
- Sin hora: `• comprar comida`
- Si hay más de 3: texto "+2 more" (o similar).
- Mantener `data-testid={`day-cell-${dateKey}`}`.

**Verificación:** Celda con 5 tareas muestra 3 + "+2 more".

---

## Update 6: Resaltado de hoy y semana actual

**Objetivo:** Resaltar visualmente el día de hoy y la semana actual.

**Archivos a modificar:**
- `components/calendar/DayCell.tsx` – estilos para `isToday` y `isCurrentWeek`.
- `components/calendar/CalendarGrid.tsx` – pasar `isCurrentWeek` a DayCell (usar `isSameWeek` de date-fns).

**Estilos sugeridos:**
- Hoy: ya existe `bg-blue-600 text-white` en el número.
- Semana actual: fondo sutil (ej. `bg-blue-50/50 dark:bg-blue-900/10`).

**Verificación:** Hoy y la semana actual se distinguen visualmente.

---

## Update 7: Checkbox y strikethrough para tareas completadas

**Objetivo:** Mejorar la UX de tareas completadas (checkbox visible, strikethrough, estilo secundario).

**Archivos a modificar:**
- `components/entries/EntryCard.tsx`

**Estado actual:** Ya tiene checkbox y `line-through` para completadas.

**Cambios opcionales:**
- Asegurar que las tareas completadas tengan estilo más discreto (opacity, color).
- Mostrar checkbox para todas las tareas (no solo tasks) o mantener solo para tasks según diseño.

**Verificación:** Marcar tarea → strikethrough y estilo secundario.

---

## Update 8: Inline editing

**Objetivo:** Click en tarea → editar título inline. Enter → guardar.

**Archivos a modificar:**
- `components/entries/EntryCard.tsx` – modo edición inline para `title`.
- O crear `components/entries/EntryCardInline.tsx` si se prefiere separar.

**Lógica:**
- Click en el título → mostrar input en su lugar.
- Blur o Enter → guardar con `updateEntryAction(entry.id, { title: newTitle })`.
- Escape → cancelar, restaurar título original.

**No reemplazar:** El botón Edit (lápiz) puede seguir abriendo EntryForm completo para edición avanzada.

**Verificación:** Click en título → editar → Enter → título actualizado.

---

## Update 9: Opcional – End time (solo schema + UI)

**Objetivo:** Añadir soporte para hora de fin. Solo si se requiere en esta fase.

**Archivos a modificar:**
- `supabase/schema.sql` – añadir columna `end_time TIME`.
- `types/index.ts` – añadir `end_time: string | null` a Entry, EntryInsert, EntryUpdate.
- `app/actions/entries.ts` – incluir `end_time` en insert/update.
- `components/entries/EntryForm.tsx` – campo opcional para end time al editar.

**Nota:** Este update puede posponerse. El plan original dice "UI only for now" – si no se va a persistir aún, omitir.

---

## Update 10: Ajustes finales y tests

**Objetivo:** Revisar tests E2E y data-testid; traducir textos a español si aplica.

**Archivos a modificar:**
- `tests/calendar-flows.spec.ts` – actualizar si los flujos cambian (ej. "Add entry" → "Escribe una tarea...").
- Componentes – asegurar que `data-testid` se mantengan donde los tests los usan.

**Verificación:** `npm run test:e2e` pasa.

---

## Resumen de dependencias

```
Update 1 (Panel)     → base para todo
Update 2 (Quick)     → depende de 1
Update 3 (Time parse)→ depende de 2
Update 4 (Order)     → independiente, puede ir con 2
Update 5 (Cell preview) → independiente
Update 6 (Highlight)    → independiente
Update 7 (Checkbox)     → independiente, ya parcialmente hecho
Update 8 (Inline edit)  → independiente
Update 9 (End time)     → opcional, independiente
Update 10 (Tests)      → al final
```

**Orden recomendado:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 10 (9 si se necesita).

---

## Qué NO cambiar

- Lógica de autenticación
- Schema de Supabase (salvo Update 9)
- Servicios `services/entries.ts`, `services/calendars.ts`
- Estructura de `entries` en la base de datos
- RLS policies
