import HeaderBox from "@/components/HeaderBox";
import RecentTransactions from "@/components/RecentTransactions";
import RightSideBar from "@/components/RightSideBar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { getAccount, getAccounts } from "@/lib/bank.actions";
import { getLoggedInUser } from "@/lib/user.actions";

async function Dashbaord({ searchParams: { id, page } }: SearchParamProps) {
  const pageNumber = Number(page as string)
  const loggedUser = await getLoggedInUser();
  const accounts = await getAccounts({ userId: loggedUser.$id });
  if (!accounts) return;

  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId; // id of the required bank object to show

  const account = await getAccount({ appwriteItemId });

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
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>
        <RecentTransactions
          accounts={accounts?.data}
          appwriteItemId={appwriteItemId}
          transactions={account?.transactions}
          page={pageNumber}
        />
      </div>
      <RightSideBar
        user={loggedUser}
        banks={accountsData.slice(0, 2)}
        transactions={accounts?.transactions}
      />
    </section>
  );
}

export default Dashbaord;
