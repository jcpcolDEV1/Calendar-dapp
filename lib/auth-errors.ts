type AuthErrorContext =
  | "login"
  | "signup"
  | "forgot_password"
  | "update_password";

function getErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return undefined;
}

export function getAuthErrorMessage(
  err: unknown,
  context: AuthErrorContext
): string {
  const code = getErrorCode(err);

  switch (context) {
    case "login":
      if (
        code === "invalid_credentials" ||
        code === "invalid_login_credentials"
      ) {
        return "Email o contraseña incorrectos.";
      }
      if (code === "email_not_confirmed") {
        return "Confirma tu correo antes de iniciar sesión.";
      }
      return "Error al iniciar sesión.";

    case "signup":
      if (
        code === "user_already_registered" ||
        code === "signup_disabled"
      ) {
        return "Ya existe una cuenta con este correo. Inicia sesión o usa '¿Olvidaste tu contraseña?'";
      }
      return "Error al crear la cuenta.";

    case "forgot_password":
      if (code === "email_rate_limit_exceeded" || code === "over_email_send_limit") {
        return "Demasiados intentos. Espera unos minutos.";
      }
      return "Error al enviar el enlace.";

    case "update_password":
      if (
        code === "invalid_request" ||
        code === "invalid_token" ||
        code === "expired_token"
      ) {
        return "El enlace ha expirado. Solicita uno nuevo.";
      }
      return "Error al actualizar la contraseña.";

    default:
      return "Ha ocurrido un error.";
  }
}
