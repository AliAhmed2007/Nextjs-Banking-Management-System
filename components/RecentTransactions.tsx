import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankTabItem } from "./BankTabItem";
import BankInfo from "./BankInfo";
import { Suspense } from "react";
import TransactionsTableWrapper from "./TransactionsTableWrapper";

function RecentTransactions({
  accounts,
  appwriteItemId,
  page,
}: RecentTransactionsProps) {
  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between">
        <h2 className="recent-transactions-label">Recent Transactions</h2>
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
              <BankTabItem account={account} appwriteItemId={appwriteItemId} />
            </TabsTrigger>
          ))}
        </TabsList>

        {accounts.map((account: Account) => (
          <TabsContent key={account.id} value={account.appwriteItemId}>
            <BankInfo
              account={account}
              type="full"
              appwriteItemId={appwriteItemId}
            />
            <Suspense
              key={account.appwriteItemId}
              fallback={
                <span className="text-base text-blue-600">
                  Loading Transactions...
                </span>
              }
            >
              <TransactionsTableWrapper
                appwriteItemId={account.appwriteItemId}
                page={page}
              />
            </Suspense>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

export default RecentTransactions;
