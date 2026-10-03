import Link from "next/link";
import React from "react";

const EmailAuthPage = () => {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-medium text-center">
        Sign in with your email
      </h2>
      <form className="min-w-md space-y-2">
        <div className="flex flex-col gap-0.5">
          <label htmlFor="email" className="text-sm ">
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
          <label htmlFor="password" className="text-sm ">
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Enter your password"
            className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-full bg-foreground text-background font-medium cursor-pointer hover:bg-foreground/80 transition-all duration-300 text-sm"
        >
          Continue
        </button>
        <Link href={"/signin"}>
          {" "}
          <button
            type="button"
            className="border-2 border-border text-sm rounded-full px-6 py-3 w-full hover:border-foreground/60 transition-all duration-300"
          >
            Go back
          </button>
        </Link>
      </form>
      <p className="text-muted-foreground text-sm text-center">
        Don't have an account?{" "}
        <Link
          href={"/auth/email"}
          className="cursor-pointer hover:underline text-foreground"
        >
          Create an account{" "}
        </Link>
      </p>
    </div>
  );
};

export default EmailAuthPage;
