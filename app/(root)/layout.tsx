export const dynamic = "force-dynamic";
import MobileNavbar from "@/components/MobileNavbar";
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser } from "@/lib/user.actions";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedUser = await getLoggedInUser()

  if (!loggedUser) redirect('sign-in')

  return (
    <main className="font-inter flex h-screen w-full">
        <Sidebar user={loggedUser} />
        <div className="flex size-full flex-col">
          <div className="root-layout">
            <Image src="/icons/logo.svg" width={30} height={30} alt="Horizon Logo" />
            <div>
              <MobileNavbar user={loggedUser}/>
            </div>
          </div>
        {children}
        </div>
    </main>
  );
}
