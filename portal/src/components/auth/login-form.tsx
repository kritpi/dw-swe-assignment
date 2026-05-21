"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLoginMutation } from "@/hooks/use-auth-mutations";
import { AuthShell } from "./auth-shell";
import { Field } from "./field";
import { ToastMessage } from "./toast-message";
import {
  getErrorMessage,
  getRoleLabel,
  normalizeRole,
  type ToastState,
} from "@/lib/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const role = normalizeRole(searchParams.get("role"));
  const [toast, setToast] = useState<ToastState>(null);
  const loginMutation = useLoginMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setToast(null);

    try {
      await loginMutation.mutateAsync({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role,
      });

      setToast({ kind: "success", message: "Login successful." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-black">
      {toast ? <ToastMessage toast={toast} onClose={() => setToast(null)} /> : null}
      <AuthShell quote="&quot;Your digital workspace, simplified.&quot;">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Login</h1>
          <Field label="Email" name="email" placeholder="Enter your Email Address" />
          <Field
            label="Password"
            name="password"
            placeholder="Enter your Password"
            type="password"
          />
          <button className="primary-button" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Please wait..." : `Login as ${getRoleLabel(role)}`}
          </button>
          <p className="form-switch">
            Don&apos;t have an account?
            <Link href={`/register?role=${role}`}>Create an account</Link>
          </p>
        </form>
      </AuthShell>
    </main>
  );
}
