# Diagnóstico: Notificaciones Push no llegan

## Flujo completo (lo que he inspeccionado)

1. **Service Worker** (`/sw.js`) → Se registra en CalendarDashboard. Escucha eventos `push` y muestra la notificación.
2. **Suscripción** → Usuario activa notificaciones → `syncSubscriptionToServer()` o `registerPushSubscription()` → POST `/api/push/subscribe` → guarda en `push_subscriptions` (user_id, endpoint, p256dh, auth).
3. **Entrada con recordatorio** → Formulario envía `time` + `reminder_offset_minutes` → `createEntryAction`/`updateEntryAction` calcula `reminder_at` = fecha + hora - offset → guarda en `entries`.
4. **Cron** → cron-job.org llama GET `/api/cron/reminders` cada 2 min → busca entradas con `reminder_at <= now`, `reminder_sent_at` null, `is_completed` false → para cada una, busca `push_subscriptions` por `created_by_user_id` → envía webpush → actualiza `reminder_sent_at`.

## Puntos de fallo posibles

| # | Punto | Condición para fallar |
|---|-------|------------------------|
| 1 | `reminder_at` no se guarda | Form no envía time/offset, o el server no los procesa bien |
| 2 | `reminder_at` en futuro | Zona horaria: servidor en UTC interpreta hora local como UTC |
| 3 | user_id no coincide | Entrada creada por usuario A, suscripción de usuario B |
| 4 | Suscripción no en DB | sync falla (401, etc.) o nunca se ejecuta |
| 5 | VAPID distinto | Claves en Vercel ≠ claves cuando se creó la suscripción |
| 6 | Cron no corre | cron-job.org mal configurado o no llama |
| 7 | webpush falla | Suscripción expirada (410), endpoint inválido, etc. |

## Datos que necesito de ti

Para cerrar el diagnóstico, necesito estos datos concretos:

### A) Supabase (misma base que usa la app en Vercel)

Ejecuta en SQL Editor y pégame el resultado:

```sql
-- 1. Entradas con reminder_offset_minutes (las que deberían tener recordatorio)
SELECT id, title, date, time, reminder_at, reminder_offset_minutes, reminder_sent_at, created_by_user_id
FROM entries
WHERE reminder_offset_minutes IS NOT NULL AND reminder_offset_minutes > 0
ORDER BY created_at DESC
LIMIT 10;
```

```sql
-- 2. Suscripciones push
SELECT id, user_id, LEFT(endpoint, 60) as endpoint_preview, created_at
FROM push_subscriptions;
```

### B) Vercel

1. En el proyecto de Vercel → Settings → Environment Variables, confirma que existen:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `CRON_SECRET`

2. ¿Las claves VAPID de Vercel son las mismas que usaste al generar con `npx web-push generate-vapid-keys`? (no las pegues, solo confirma sí/no)

### C) cron-job.org

1. URL configurada: ¿es exactamente `https://calendar-dapp.vercel.app/api/cron/reminders`?
2. Header: ¿`Authorization: Bearer [tu CRON_SECRET]`?
3. Frecuencia: ¿cada 2 minutos?
4. ¿Hay logs de ejecución? Si sí, ¿qué status code devuelve (200, 401, 500)?

### D) Navegador

1. ¿Permisos de notificaciones concedidos para el dominio?
2. En DevTools → Application → Service Workers: ¿está registrado `/sw.js`?
3. En Application → Push Messaging: ¿hay alguna suscripción activa?
