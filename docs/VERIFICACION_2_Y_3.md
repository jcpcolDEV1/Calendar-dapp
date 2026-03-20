# Verificación puntos 2 y 3

## Resumen de las consultas (tus fotos)

### Consulta 1 - Entrada con recordatorio
| Campo | Valor |
|-------|-------|
| id | `5de5fe61-0848-4a8b-91d8-37a181c6ed91` |
| title | j |
| created_by_user_id | `25f9454d-2476-4549-a3c9-431b47879c77` |
| reminder_sent_at | 2026-03-16 18:51:04 (ya enviado) |

### Consulta 2 - Suscripción push
| Campo | Valor |
|-------|-------|
| user_id | `25f94540-2476-4549-83c9-431b47879c77` |
| endpoint | https://fcm.googleapis.com/fcm/send/... |

---

## ⚠️ Posible problema: user_id no coincide

- **Entrada** `created_by_user_id`: `25f9454d`...`a3c9`...
- **Suscripción** `user_id`: `25f94540`...`83c9`...

Si no es un error de visualización (0 vs d, 8 vs a), son usuarios distintos y el cron nunca encontrará la suscripción.

**Comprueba en Supabase** que el `user_id` de `push_subscriptions` sea exactamente `25f9454d-2476-4549-a3c9-431b47879c77`. Si es `25f94540` o `83c9`, hay que corregirlo.

---

## Punto 2: VAPID en Vercel

### Estado actual (desde /api/debug/verify)
- ✅ `vapid_public_configured`: true
- ✅ `vapid_private_configured`: true
- ✅ `vapid_public_prefix`: `BH4g0strsMyjI-maytfD...`
- ✅ `vapid_public_length`: 87

### Cómo verificar que son las mismas claves

1. En tu proyecto local, ejecuta:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Compara la **clave pública** que genera con el prefijo de Vercel: `BH4g0strsMyjI-maytfD...`
3. Si los primeros ~20 caracteres coinciden → **SÍ**, son las mismas.
4. Si no coinciden → **NO**, hay que actualizar las variables en Vercel con las claves que acabas de generar.

---

## Punto 3: cron-job.org

### Estado actual
- El endpoint responde **200 OK** cuando se llama con el header correcto.
- Respuesta típica: `{"sent":0,"message":"No reminders due"}` (normal si no hay recordatorios pendientes).

### Configuración que debe tener cron-job.org

| Campo | Valor correcto |
|-------|----------------|
| **URL** | `https://calendar-dapp.vercel.app/api/cron/reminders` |
| **Método** | GET |
| **Header** | `Authorization: Bearer miClaveSecreta123xyz789` |
| **Frecuencia** | Cada 2 minutos (o la que prefieras) |

### Cómo comprobar en cron-job.org

1. Entra en tu cuenta de cron-job.org.
2. Abre el job que llama al calendario.
3. Revisa que la URL sea exactamente la de arriba.
4. En la sección de headers, verifica que exista:
   - Nombre: `Authorization`
   - Valor: `Bearer miClaveSecreta123xyz789` (o tu CRON_SECRET real)
5. En el historial de ejecuciones, revisa el código de estado: debe ser **200**.

Si todo coincide → **SÍ**, la configuración es correcta.
