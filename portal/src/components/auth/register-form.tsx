"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRegisterMutation } from "@/hooks/use-auth-mutations";
import { AuthShell } from "./auth-shell";
import { Field } from "./field";
import { ToastMessage } from "./toast-message";
import {
  getErrorMessage,
  normalizeRole,
  type ToastState,
} from "@/lib/auth";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = normalizeRole(searchParams.get("role"));
  const [toast, setToast] = useState<ToastState>(null);
  const registerMutation = useRegisterMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setToast({ kind: "error", message: "Passwords do not match." });
      return;
    }

    setToast(null);

    try {
      await registerMutation.mutateAsync({
        fullName: String(form.get("fullName") ?? ""),
        email: String(form.get("email") ?? ""),
        password,
        role,
      });
      setToast({ kind: "success", message: "Account created. Please log in." });
      router.push(`/login?role=${role}`);
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-black">
      {toast ? <ToastMessage toast={toast} onClose={() => setToast(null)} /> : null}
      <AuthShell quote="&quot;Powering the tools that power the team.&quot;">
        <form className="auth-form auth-form--signup" onSubmit={handleSubmit}>
          <h1>Sign Up</h1>
          <Field label="Full name" name="fullName" placeholder="Enter your Full Name" />
          <Field label="Email" name="email" placeholder="Enter your Email Address" />
          <Field
            label="Password"
            name="password"
            placeholder="Create a Password"
            type="password"
          />
          <Field
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Re-enter your Password"
            type="password"
          />
          <button className="primary-button" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Please wait..." : "Create an account"}
          </button>
          <p className="form-switch">
            Already have an account?
            <Link href={`/login?role=${role}`}>Login</Link>
          </p>
        </form>
      </AuthShell>
    </main>
  );
}
