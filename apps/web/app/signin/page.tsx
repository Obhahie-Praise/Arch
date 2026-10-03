import React from "react";
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import Link from "next/link";

const AuthPage = () => {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-medium text-center">Sign in to your account</h2>
      <div className="min-w-md space-y-2">
        <button className="flex gap-2 justify-center border-2 border-border rounded-full py-3 w-full cursor-pointer hover:border-foreground/60 transition-all duration-300">
          <GoogleIcon />
          <p className="">Continue with Google</p>
        </button>
        <button className="flex gap-2 justify-center border-2 border-border rounded-full py-3 w-full cursor-pointer hover:border-foreground/60 transition-all duration-300">
          <GitHubIcon />
          <p className="">Continue with Github</p>
        </button>
        <Link href={"/signin/email"} className="flex gap-2 justify-center border-2 border-border rounded-full py-3 w-full cursor-pointer hover:border-foreground/60 transition-all duration-300">
          <MailOutlinedIcon />
          <p className="">Continue with Email</p>
        </Link>
      </div>
      <p className="text-muted-foreground text-sm text-center">Don't have an account? <Link href={"/auth"} className="cursor-pointer hover:underline text-foreground">Create an account </Link></p>
    </div>
  );
};

export default AuthPage;
