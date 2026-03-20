"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getPasswordResetRedirectUrl } from "@/lib/auth-public-origin";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const redirectTo = getPasswordResetRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        ...(redirectTo ? { redirectTo } : {}),
      });
      if (error) throw error;
      // Always show same message to avoid email enumeration
      setSuccessMessage(
        "Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña."
      );
      toast.success("Revisa tu correo");
    } catch (err) {
      const message = getAuthErrorMessage(err, "forgot_password");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">
          Restablecer contraseña
        </h1>
        {successMessage && (
          <div
            className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm"
            role="status"
          >
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div
            className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm"
            role="alert"
          >
            {errorMessage}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              data-testid="forgot-password-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            data-testid="forgot-password-submit"
          >
            {loading ? "Enviando enlace..." : "Enviar enlace"}
          </button>
        </form>
        <p className="text-center mt-4 text-slate-600 dark:text-slate-400 text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
