"use client";

import Link from "next/link";
import React, { Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

function EmailSigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    // Honour the ?redirect= param so users land where they intended after sign-in.
    const redirectTo = searchParams.get("redirect") || "/home";

    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => {
          router.push(redirectTo);
        },
        onError: (ctx) => {
          const status = ctx.error?.status;
          if (status === 0 || status == null) {
            setError(
              "Could not reach the server. Check your connection and try again."
            );
          } else if (status === 401 || status === 403) {
            setError("Invalid email or password.");
          } else {
            setError(
              ctx.error?.message ?? "Something went wrong. Please try again."
            );
          }
          setLoading(false);
        },
      }
    );
  };

  return (
    <div className="space-y-10 w-full max-w-sm px-4 animate-page-enter">
      <h2 className="text-2xl font-medium text-center">
        Sign in with your email
      </h2>
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="w-full space-y-2">
        <div className="flex flex-col gap-0.5">
          <label htmlFor="email" className="text-sm">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Enter your email"
            className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label htmlFor="password" className="text-sm">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Enter your password"
              className="border-2 border-border text-base rounded-full px-6 py-3 pr-12 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff size={20} strokeWidth={1.5} />
              ) : (
                <Eye size={20} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-foreground text-background font-medium cursor-pointer hover:bg-foreground/80 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
        <Link href="/signin">
          <button
            type="button"
            className="border-2 border-border text-sm rounded-full px-6 py-3 w-full hover:border-foreground/60 transition-all duration-300"
          >
            Go back
          </button>
        </Link>
      </form>
      <p className="text-muted-foreground text-sm text-center">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/email"
          className="cursor-pointer hover:underline text-foreground"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

// useSearchParams requires a Suspense boundary in Next.js 15+.
const EmailSigninPage = () => (
  <Suspense>
    <EmailSigninForm />
  </Suspense>
);

export default EmailSigninPage;
