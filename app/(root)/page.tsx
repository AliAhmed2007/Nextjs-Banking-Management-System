import HeaderBox from "@/components/HeaderBox";
import RightSideBar from "@/components/RightSideBar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { getLoggedInUser } from "@/lib/user.actions";

async function Dashbaord() {
  const loggedUser = await getLoggedInUser();

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            title="Welcome"
            subtext="Access and Manage your account and transactions effiecently."
            type="greeting"
            user={loggedUser?.name || "Guest"}
          />
          <TotalBalanceBox
            accounts={[]}
            totalBanks={1}
            totalCurrentBalance={2500.2}
          />
        </header>
      </div>
      <RightSideBar
        user={loggedUser}
        banks={[{ currentBalance: 500.5 }, { currentBalance: 500.5 }]}
        transactions={[]}
      />
    </section>
  );
}

export default Dashbaord;
