import Link from "next/link";
import React from "react";
import { ThemeImage } from "../components/theme-image";
import { ThemeSwitcher } from "../components/theme-switcher";

const Navbar = () => {
  return (
    <div className="flex items-center justify-between px-40 py-6">
      <h1 className="flex items-center gap-2">
        <ThemeImage
          srcLight="/logo-lightmode.jpg"
          srcDark="/logo-darkmode.jpg"
          alt="Arch logo"
          width={30}
          height={30}
          className="rounded-lg"
        />
        <p className="font-display text-2xl">Arch</p>
      </h1>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <Link href={"./auth/login"} className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm transition-colors hover:bg-primary/90 cursor-pointer duration-300 shadow-inner shadow-white">Get started</Link>
      </div>
    </div>
  );
};

export default Navbar;
