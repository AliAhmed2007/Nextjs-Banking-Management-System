"use client";
import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import PlaidLink from "./PlaidLink";

function Sidebar({ user }: SiderbarProps) {
  const pathname = usePathname();
  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link href="/" className="mb-12 flex items-center cursor-pointer gap-2">
          <Image
            src="/icons/logo.svg"
            className="size-[24px] max-xl:size-14"
            width={36}
            height={36}
            alt="Horizon Logo"
          />
          <h1 className="sidebar-logo">Horizon</h1>
        </Link>
        {sidebarLinks.map((item) => {
          const isActive =
            pathname === item.route || pathname.startsWith(`${item.route}/`);
          return (
            <Link
              key={item.label}
              href={item.route}
              className={cn("sidebar-link", {
                "bg-bank-gradient": isActive,
              })}
            >
              <div className="relative size-6">
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  fill
                  className={cn({ "brightness-[3] invert-0": isActive })}
                />
              </div>
              <span
                className={cn("sidebar-label", { "!text-white": isActive })}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <PlaidLink user={user} />
      </nav>

      <Footer user={user} type="desktop" />
    </section>
  );
}

export default Sidebar;
