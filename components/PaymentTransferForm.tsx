"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";

import {
  createTransfer,
} from "@/lib/dwolla.actions";
import { createTransaction } from "@/lib/transaction.actions";
import { getBank, getBankByAccountId } from "@/lib/user.actions";
import { decryptId } from "@/lib/utils";

import { Button } from "./ui/button";
import { Field, FieldLabel, FieldError } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { BankDropdown } from "./BankDropdown";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(4, "Transfer note is too short"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a valid positive number",
    }),
  senderBank: z.string().min(4, "Please select a valid bank account"),
  shareableId: z.string().min(8, "Please select a valid sharable Id"),
});

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      amount: "",
      senderBank: "",
      shareableId: "",
    },
  });

  const submit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const receiverAccountId = decryptId(data.shareableId);

      const receiverBank = await getBankByAccountId({
        accountId: receiverAccountId,
      });

      const senderBank = await getBank({ bankId: data.senderBank });

      const transferParams = {
        sourceFundingSourceUrl: senderBank.fundingSourceUrl,
        destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
        amount: data.amount,
      };

      // create transfer
      const transfer = await createTransfer(transferParams);

      // create transfer transaction
      if (transfer) {
        const transaction = {
          name: data.name,
          amount: data.amount,
          senderId: senderBank.userId,
          senderBankId: senderBank.$id,
          receiverId: receiverBank.userId,
          receiverBankId: receiverBank.$id,
          email: data.email,
        };

        const newTransaction = await createTransaction(transaction);

        if (newTransaction) {
          form.reset();
          router.push("/");
        }
      } else {
        alert("Transfer creation failed. Please try again.");
      }
    } catch (error) {
      console.error("Submitting create transfer request failed: ", error);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="flex flex-col">
      {/* Sender Bank Field */}
      <Controller
        name="senderBank"
        control={form.control}
        render={({ fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className="border-t border-gray-200"
          >
            <div className="payment-transfer_form-item pb-6 pt-5">
              <div className="payment-transfer_form-content">
                <FieldLabel className="text-14 font-medium text-gray-700">
                  Select Source Bank
                </FieldLabel>
                <p className="text-12 font-normal text-gray-600">
                  Select the bank account you want to transfer funds from
                </p>
              </div>
              <div className="flex w-full flex-col">
                <BankDropdown
                  accounts={accounts}
                  setValue={form.setValue}
                  otherStyles="!w-full"
                />
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error!]}
                    className="text-12 text-red-500"
                  />
                )}
              </div>
            </div>
          </Field>
        )}
      />

      {/* Transfer Note Field */}
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className="border-t border-gray-200"
          >
            <div className="payment-transfer_form-item pb-6 pt-5">
              <div className="payment-transfer_form-content">
                <FieldLabel className="text-14 font-medium text-gray-700">
                  Transfer Note (Optional)
                </FieldLabel>
                <p className="text-12 font-normal text-gray-600">
                  Please provide any additional information or instructions
                  related to the transfer
                </p>
              </div>
              <div className="flex w-full flex-col">
                <Textarea
                  {...field}
                  placeholder="Write a short note here"
                  className="input-class"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error!]}
                    className="text-12 text-red-500"
                  />
                )}
              </div>
            </div>
          </Field>
        )}
      />

      <div className="payment-transfer_form-details">
        <h2 className="text-18 font-semibold text-gray-900">
          Bank account details
        </h2>
        <p className="text-16 font-normal text-gray-600">
          Enter the bank account details of the recipient
        </p>
      </div>

      {/* Email Field */}
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className="border-t border-gray-200"
          >
            <div className="payment-transfer_form-item py-5">
              <FieldLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                Recipient&apos;s Email Address
              </FieldLabel>
              <div className="flex w-full flex-col">
                <Input
                  {...field}
                  placeholder="ex: johndoe@gmail.com"
                  className="input-class"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error!]}
                    className="text-12 text-red-500"
                  />
                )}
              </div>
            </div>
          </Field>
        )}
      />

      {/* Sharable ID Field */}
      <Controller
        name="shareableId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className="border-t border-gray-200"
          >
            <div className="payment-transfer_form-item pb-5 pt-6">
              <FieldLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                Receiver&apos;s Plaid Sharable Id
              </FieldLabel>
              <div className="flex w-full flex-col">
                <Input
                  {...field}
                  placeholder="Enter the public account number"
                  className="input-class"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error!]}
                    className="text-12 text-red-500"
                  />
                )}
              </div>
            </div>
          </Field>
        )}
      />

      {/* Amount Field */}
      <Controller
        name="amount"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className="border-y border-gray-200"
          >
            <div className="payment-transfer_form-item py-5">
              <FieldLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                Amount
              </FieldLabel>
              <div className="flex w-full flex-col">
                <Input
                  {...field}
                  placeholder="ex: 5.00"
                  className="input-class"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error!]}
                    className="text-12 text-red-500"
                  />
                )}
              </div>
            </div>
          </Field>
        )}
      />

      <div className="payment-transfer_btn-box">
        <Button
          type="submit"
          className="payment-transfer_btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" /> &nbsp; Sending...
            </>
          ) : (
            "Transfer Funds"
          )}
        </Button>
      </div>
    </form>
  );
};

export default PaymentTransferForm;
