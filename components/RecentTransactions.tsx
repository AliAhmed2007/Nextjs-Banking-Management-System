import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankTabItem } from "./BankTabItem";
import BankInfo from "./BankInfo";
import TransactionsTable from "./TransactionsTable";

function RecentTransactions({
  accounts,
  appwriteItemId,
  page,
  transactions = [],
}: RecentTransactionsProps) {
  console.log(accounts);
  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between">
        <h2 className="recent-transactions-label">Recent Transactions</h2>
        {/* Filter Transactions by bankId via URL */}
        <Link
          href={`/transaction-history/?id=${appwriteItemId}`}
          className="view-all-btn"
        >
          View All
        </Link>
      </header>
      <Tabs defaultValue={appwriteItemId} className="w-full">
        <TabsList className="recent-transactions-tablist">
          {accounts.map((account: Account) => (
            <TabsTrigger key={account.id} value={account.appwriteItemId}>
              <BankTabItem
                key={account.id}
                account={account}
                appwriteItemId={appwriteItemId}
              />
            </TabsTrigger>
          ))}
        </TabsList>
        {accounts.map((account: Account) => (
          <TabsContent key={account.id} value={account.appwriteItemId}>
            <BankInfo
              key={account.id}
              account={account}
              type="full"
              appwriteItemId={appwriteItemId}
            />
            <TransactionsTable transactions={transactions} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

export default RecentTransactions;
