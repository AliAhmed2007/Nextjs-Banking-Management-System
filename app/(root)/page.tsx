import HeaderBox from "@/components/HeaderBox";
import RightSideBar from "@/components/RightSideBar";
import TotalBalanceBox from "@/components/TotalBalanceBox";

function Dashbaord() {
  const loggedIn = { firstName: "Ali", lastName: "Ahmed", email: "ali-ahmed@gmail.com" };
  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            title="Welcome"
            subtext="Access and Manage your account and transactions effiecently."
            type="greeting"
            user={loggedIn?.firstName || "Guest"}
          />
          <TotalBalanceBox accounts={[]} totalBanks={1} totalCurrentBalance={2500.20}/>
        </header>
      </div>
      <RightSideBar user={loggedIn} banks={[{currentBalance: 500.50}, {currentBalance: 500.50}]} transactions={[]}/>
    </section>
  );
}

export default Dashbaord;
