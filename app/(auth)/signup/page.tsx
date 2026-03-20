"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getEmailConfirmationCallbackUrl } from "@/lib/auth-public-origin";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const emailRedirectTo =
        getEmailConfirmationCallbackUrl() || undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
      });
      if (error) throw error;

      // Supabase does not return error for existing email when confirm is enabled; identities is empty
      if (data.user?.identities?.length === 0) {
        setErrorMessage(
          getAuthErrorMessage({ code: "user_already_registered" }, "signup")
        );
        return;
      }

      // Only redirect if we have a session (email confirmation disabled in Supabase)
      if (data.session) {
        toast.success("¡Cuenta creada!");
        router.push("/app");
        router.refresh();
      } else {
        // Email confirmation enabled: user must confirm email before logging in
        setSuccessMessage("Cuenta creada. Revisa tu correo para confirmar antes de iniciar sesión.");
      }
    } catch (err) {
      const message = getAuthErrorMessage(err, "signup");
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
          Crear cuenta
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
              data-testid="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              data-testid="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Al menos 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            data-testid="signup-submit"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="text-center mt-4 text-slate-600 dark:text-slate-400 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
