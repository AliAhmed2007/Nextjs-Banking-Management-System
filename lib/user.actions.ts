"use server"

import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "./appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "./utils";
import { CountryCode, LinkTokenCreateRequest, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "./plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
    APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID
} = process.env

export async function signUp({ password, ...userData }: SignUpParams) {
    const { email, lastName, firstName } = userData
    let newUserAccount;
    try {
        const { account, database } = await createAdminClient();

        newUserAccount = await account.create(
            ID.unique(),
            email,
            password,
            `${firstName} ${lastName}`
        );

        if (!newUserAccount) throw Error("Error Creating User Account")

        const dwollaCustomerUrl = await createDwollaCustomer({
            ...userData,
            type: 'personal'
        })

        if (!dwollaCustomerUrl) throw Error("Error Creating Dwolla Customer")

        const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl)

        const createdUser = await database.createDocument(
            DATABASE_ID!,
            USER_COLLECTION_ID!,
            newUserAccount.$id,
            {
                ...userData,
                dwollaCustomerUrl,
                dwollaCustomerId
            }
        )

        const session = await account.createEmailPasswordSession(email, password);

        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        // Return the complete user object with $id
        return parseStringify(createdUser)
    } catch (error) {
        console.error("Error: ", error)
        throw error; // Re-throw so the UI can handle it
    }
}

export async function signIn({ email, password }: signInProps) {

    try {
        const { account } = await createAdminClient()
        const session = await account.createEmailPasswordSession({
            email,
            password
        });
        return parseStringify(session)
    } catch (error) {
        console.error("Error", error)
    }
}

// ... your initilization functions

export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        return parseStringify(user)
    } catch (error) {
        console.error("Error:", error)
        return null
    }
}

export async function logoutAccount() {
    try {
        const { account } = await createSessionClient()
        await account.deleteSession('current')
        cookies().delete('appwrite-session')
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function creatLinkToken(user: User) {
    try {
        const tokenParams: LinkTokenCreateRequest = {
            user: {
                client_user_id: user.$id,
            },
            client_name: `${user.firstName} ${user.lastName}`,
            products: ['auth'] as Products[],
            language: "en",
            country_codes: ["US"] as CountryCode[]
        }

        const response = await plaidClient.linkTokenCreate(tokenParams)
        return parseStringify({ linkToken: response.data.link_token })
    } catch (error) {
        console.error("Error:", error)
    }
}


export async function createBankAccount({
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
    sharableId,
}: createBankAccountProps) {
    try {
        const { database } = await createAdminClient();

        const bankAccount = await database.createDocument(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            ID.unique(),
            {
                userId,
                bankId,
                accountId,
                accessToken,
                fundingSourceUrl,
                sharableId,
            },
        );

        return parseStringify(bankAccount);
    } catch (error) {
        console.error("Error creating bank account:", error);
        throw error; // optional: propagate error to caller
    }
}


// This function exchanges a public token for an access token and item ID
export async function exchangePublicToken({ publicToken, user }: exchangePublicTokenProps) {
    try {
        // Exchange public token for access token and item ID
        const response = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
        });

        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // Get account information from Plaid using the access token
        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken,
        });

        const accountData = accountsResponse.data.accounts[0];

        // Create a processor token for Dwolla using the access token and account ID
        const request: ProcessorTokenCreateRequest = {
            access_token: accessToken,
            account_id: accountData.account_id,
            processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
        };

        const processorTokenResponse =
            await plaidClient.processorTokenCreate(request);
        const processorToken = processorTokenResponse.data.processor_token;

        // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
        const fundingSourceUrl = await addFundingSource({
            dwollaCustomerId: user.dwollaCustomerId,
            processorToken,
            bankName: accountData.name,
        });

        // If the funding source URL is not created, throw an error
        if (!fundingSourceUrl) throw Error;

        // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and sharable ID
        await createBankAccount({
            userId: user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
            fundingSourceUrl,
            sharableId: encryptId(accountData.account_id),
        });

        // Revalidate the path to reflect the changes
        revalidatePath("/");

        // Return a success message
        return parseStringify({
            publicTokenExchange: "complete",
        });
    } catch (error) {
        // Log any errors that occur during the process
        console.error("An error occurred while creating exchanging token:", error);
    }
};