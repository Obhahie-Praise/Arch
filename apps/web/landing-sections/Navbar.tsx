import Link from "next/link";
import React from "react";
import { ThemeImage } from "../components/theme-image";
import { ThemeSwitcher } from "../components/theme-switcher";

const Navbar = () => {
  return (
    <div className="flex items-center justify-between px-5 sm:px-10 lg:px-20 py-6">
      <Link href={"/"} className="flex items-center gap-2">
        <ThemeImage
          srcLight="/logo-lightmode.jpg"
          srcDark="/logo-darkmode.jpg"
          alt="Arch logo"
          width={30}
          height={30}
          className="rounded-lg"
        />
        <p className="font-display text-xl sm:text-2xl">Arch</p>
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        <ThemeSwitcher />
        <Link href={"./auth"} className="bg-foreground text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm transition-colors hover:bg-primary/90 cursor-pointer duration-300">Get started</Link>
      </div>
    </div>
  );
};

export default Navbar;
