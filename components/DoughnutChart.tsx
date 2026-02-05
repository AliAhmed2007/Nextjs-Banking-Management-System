"use client";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

function DoughnutChart({ accounts }: DoughnutChartProps) {

  const balances = accounts.map(item => item.currentBalance)
  const accountNames = accounts.map(item => item.name)
  const data = {
    datasets: [
      {
        label: "Banks",
        data: balances,
        backgroundColor: ["#0179FE", "#4893FF", "#85B7FF"],
      },
    ],
    labels: accountNames,
  };

  return (
    <Doughnut
      data={data}
      options={{
        cutout: "60%",
        plugins: {
          legend: {
            display: false,
          },
        },
      }}
    />
  );
}

export default DoughnutChart;
