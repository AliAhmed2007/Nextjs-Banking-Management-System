"use client";
import CountUp from "react-countup";

function CurrentBalanceCountup({ amount }: { amount: number }) {
  return (
    <div className="w-full">
      <CountUp
        end={amount}
        separator=","
        decimals={2}
        decimal="."
        prefix="$"
      />
    </div>
  );
}

export default CurrentBalanceCountup;
