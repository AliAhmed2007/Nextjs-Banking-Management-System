import HeaderBox from "@/components/HeaderBox";
import PaymentTransferForm from "@/components/PaymentTransferForm";
import { getAccounts } from "@/lib/bank.actions";
import { getLoggedInUser } from "@/lib/user.actions";

async function page() {
    const loggedUser = await getLoggedInUser();
  
  const accounts = await getAccounts({ userId: loggedUser.$id });
  if (!accounts) return;

  const accountsData = accounts?.data;
  return (
    <section className="payment-transfer">
      <HeaderBox
        title="Payment Transfer"
        subtext="Please Provide Any Specific Details or Notes Related to the Payment Transfer"
      />
      <section className="size-full pt-5">
        <PaymentTransferForm accounts={accountsData} />
      </section>
    </section>
  );
}

export default page;
