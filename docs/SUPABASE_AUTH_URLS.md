# Supabase: URLs de confirmación y dominio Vercel

Si los correos de “Confirm your signup” llevan `redirect_to=https://…-ii4b.vercel.app` (u otro preview **borrado**), al hacer clic verás **404 DEPLOYMENT_NOT_FOUND** en Vercel. Eso se arregla en **Supabase Dashboard** y, en producción, con la variable **`NEXT_PUBLIC_APP_URL`** en Vercel.

## Lo que hace el código

- **Signup:** envía `emailRedirectTo` = `{origen}/auth/callback`.
- En **producción**, si existe `NEXT_PUBLIC_APP_URL`, ese origen es siempre esa URL (no el host del navegador).
- En **localhost**, siempre se usa el origen actual (puerto incluido).

## Paso 1 — Vercel (variables de entorno)

1. Vercel → tu proyecto → **Settings** → **Environment Variables**.
2. Añade (Production):

   | Name | Value (ejemplo) |
   |------|------------------|
   | `NEXT_PUBLIC_APP_URL` | `https://calendar-dapp.vercel.app` |

   Sin barra final. Usa el dominio **que sí abre** tu app hoy (producción o dominio custom).

3. **Redeploy** el proyecto para que el cliente reciba la variable.

## Paso 2 — Supabase → Site URL

1. [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto.
2. **Authentication** → **URL Configuration**.
3. **Site URL:** pon exactamente el mismo dominio de producción, por ejemplo:

   `https://calendar-dapp.vercel.app`

   (No uses el antiguo `…-ii4b.vercel.app` si ese despliegue ya no existe.)

4. Guarda.

## Paso 3 — Supabase → Redirect URLs

En la misma pantalla, en **Redirect URLs**, asegúrate de tener (ajusta el dominio):

- `https://calendar-dapp.vercel.app/auth/callback`
- `https://calendar-dapp.vercel.app/update-password`
- Para desarrollo: `http://localhost:3000/auth/callback` (o el puerto que uses, p. ej. `3001`)

Opcional si tu plan lo permite: `https://*.vercel.app/auth/callback` para previews.

## Paso 4 — Probar

1. Regístrate de nuevo desde **`https://TU-DOMINIO/signup`** (o el correo nuevo).
2. En Gmail, **pasa el ratón** sobre “Confirm your mail” y comprueba que `redirect_to=` apunte a **tu dominio actual**, no a `ii4b`.
3. Los correos **antiguos** seguirán con el enlace viejo: ignóralos y usa solo el correo **nuevo**.

## Si el enlace sigue mostrando ii4b

- No has guardado **Site URL** en Supabase, o
- `NEXT_PUBLIC_APP_URL` no está en Vercel / no redeployaste, o
- Estás mirando un **email antiguo** (antes del cambio).
