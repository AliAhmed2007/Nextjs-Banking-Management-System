import HeaderBox from "@/components/HeaderBox";
import RecentTransactions from "@/components/RecentTransactions";
import RightSideBar from "@/components/RightSideBar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import {getDashboardData } from "@/lib/bank.actions";
import { getLoggedInUser } from "@/lib/user.actions";
import { redirect } from "next/navigation";

async function Dashbaord({
  searchParams: { id, page = "1" },
}: SearchParamProps) {
  const pageNumber = Number(page as string);
  const loggedUser = await getLoggedInUser();
  if (!loggedUser) redirect("/sign-in");

  const dashboardData = await getDashboardData({ userId: loggedUser.$id });
  const accountsData = dashboardData!.accounts; // all accounts summary
  const totalBanks = dashboardData!.totalBanks;
  const totalCurrentBalance = dashboardData?.totalCurrentBalance;

  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            title="Welcome"
            subtext="Access and Manage your account and transactions effiecently."
            type="greeting"
            user={loggedUser?.firstName || "Guest"}
          />
          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={totalBanks}
            totalCurrentBalance={totalCurrentBalance}
          />
        </header>
        <RecentTransactions
          accounts={accountsData}
          appwriteItemId={appwriteItemId}
          transactions={dashboardData!.transactions}
          page={pageNumber}
        />
      </div>
      <RightSideBar
        user={loggedUser}
        banks={accountsData.slice(0, 2)}
        transactions={dashboardData!.transactions}
      />
    </section>
  );
}

export default Dashbaord;
