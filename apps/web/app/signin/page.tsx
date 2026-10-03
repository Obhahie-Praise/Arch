"use client";

import React from "react";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";

const SigninPage = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleSocial = async (provider: "google" | "github") => {
    setError(null);
    setLoading(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/home",
      });
    } catch {
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-medium text-center">
        Sign in to your account
      </h2>
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
      <div className="min-w-md space-y-2">
        <button
          onClick={() => handleSocial("google")}
          disabled={loading !== null}
          className="flex gap-2 justify-center border-2 border-border rounded-full py-3 w-full cursor-pointer hover:border-foreground/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          <p>{loading === "google" ? "Redirecting..." : "Continue with Google"}</p>
        </button>
        <button
          onClick={() => handleSocial("github")}
          disabled={loading !== null}
          className="flex gap-2 justify-center border-2 border-border rounded-full py-3 w-full cursor-pointer hover:border-foreground/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GitHubIcon />
          <p>{loading === "github" ? "Redirecting..." : "Continue with Github"}</p>
        </button>
        <Link
          href={"/signin/email"}
          className="flex gap-2 justify-center border-2 border-border rounded-full py-3 w-full cursor-pointer hover:border-foreground/60 transition-all duration-300"
        >
          <MailOutlinedIcon />
          <p className="">Continue with Email</p>
        </Link>
      </div>
      <p className="text-muted-foreground text-sm text-center">
        Don&apos;t have an account?{" "}
        <Link
          href={"/auth"}
          className="cursor-pointer hover:underline text-foreground"
        >
          Create an account{" "}
        </Link>
      </p>
    </div>
  );
};

export default SigninPage;
