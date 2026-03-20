import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Supabase redirects here after email confirmation (PKCE `code` in query)
 * or with `error` / `error_description` when the link expired or was invalid.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  const redirectWithAuthError = (
    messageKey: string,
    description?: string | null
  ) => {
    const login = new URL("/login", origin);
    login.searchParams.set("authError", messageKey);
    if (description) {
      login.searchParams.set(
        "authErrorDescription",
        decodeURIComponent(description.replace(/\+/g, " "))
      );
    }
    return NextResponse.redirect(login);
  };

  if (error) {
    return redirectWithAuthError(
      errorCode ?? error,
      errorDescription ?? error
    );
  }

  if (!code) {
    return redirectWithAuthError(
      "missing_code",
      "No se recibió el código de confirmación. Prueba el enlace del correo de nuevo o solicita uno nuevo."
    );
  }

  const cookieStore = await cookies();
  let redirectResponse = NextResponse.redirect(new URL("/app", origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: object }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return redirectWithAuthError(
      "exchange_failed",
      exchangeError.message
    );
  }

  return redirectResponse;
}
