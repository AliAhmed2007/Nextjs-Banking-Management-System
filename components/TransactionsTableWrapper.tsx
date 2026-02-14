import { Pagination } from "./Pagination";
import TransactionsTable from "./TransactionsTable";
import { getAccount } from "@/lib/bank.actions";

interface Props {
  appwriteItemId: string;
  page: number;
}

export default async function TransactionsTableWrapper({
  appwriteItemId,
  page,
}: Props) {
  const accountData = await getAccount({ appwriteItemId });

  const transactions = accountData.transactions || [];
  const rowsPerPage = 10;

  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  const start = (page - 1) * rowsPerPage;
  const displayedTransactions = transactions.slice(start, start + rowsPerPage);

  return (
    <>
      <TransactionsTable transactions={displayedTransactions} />
      {totalPages > 1 && (
        <div className="my-4 w-full">
          <Pagination page={page} totalPages={totalPages} />
        </div>
      )}
    </>
  );
}
