"use server"

import { ID, Query } from "node-appwrite";
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

export async function getUserInfo({ userId }: getUserInfoProps) {
    try {
        const { database } = await createAdminClient()
        const user = await database.listDocuments(
            DATABASE_ID!,
            USER_COLLECTION_ID!,
            [Query.equal('$id', userId)]
        )

        return parseStringify(user.documents[0])
    } catch (error) {
        console.log(error)
    }
}

export async function signIn({ email, password }: signInProps) {

    try {
        const { account } = await createAdminClient()

        const session = await account.createEmailPasswordSession({ email, password });

        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        const user = await getUserInfo({ userId: session.userId })

        return parseStringify(user)
    } catch (error) {
        console.error("Error", error)
    }
}

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

        const session = await account.createEmailPasswordSession({ email, password });

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



export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();
        const sessionUser = await account.get();
        const user = await getUserInfo({ userId: sessionUser.$id })
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

export async function createLinkToken(user: User) {
    try {
        const tokenParams: LinkTokenCreateRequest = {
            user: {
                client_user_id: user.$id,
            },
            client_name: `${user.firstName} ${user.lastName}`,
            products: ['auth', 'transactions'] as Products[],
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
    accountId,
    accessToken,
    fundingSourceUrl,
    shareableId,
}: createBankAccountProps) {
    try {
        const { database } = await createAdminClient();

        const bankAccount = await database.createDocument(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            ID.unique(), // This generates the document ID
            {
                userId,
                accountId,
                accessToken,
                fundingSourceUrl,
                shareableId,
            },
        );

        return parseStringify(bankAccount);
    } catch (error) {
        console.error("Error creating bank account:", error);
        throw error;
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

        const processorTokenResponse = await plaidClient.processorTokenCreate(request);
        const processorToken = processorTokenResponse.data.processor_token;

        // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
        const fundingSourceUrl = await addFundingSource({
            dwollaCustomerId: user.dwollaCustomerId,
            processorToken,
            bankName: accountData.name,
        });

        // If the funding source URL is not created, throw an error
        if (!fundingSourceUrl) throw new Error("Failed to create funding source");

        // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and sharable ID
        await createBankAccount({
            userId: user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
            fundingSourceUrl,
            shareableId: encryptId(accountData.account_id),
        });

        // Revalidate the path to reflect the changes
        revalidatePath("/");

        // Return a success message
        return parseStringify({
            publicTokenExchange: "complete",
        });
    } catch (error) {
        // Log any errors that occur during the process
        console.error("An error occurred while exchanging token:", error);
        throw error; // Re-throw to see the error in the UI
    }
};


export async function getBanks({ userId }: getBanksProps) {
    try {
        const { database } = await createAdminClient()
        const banks = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('userId', userId)]
        )

        return parseStringify(banks.documents)
    } catch (error) {
        console.log(error)
    }
}

export async function getBank({ bankId }: getBankProps) {
    try {
        const { database } = await createAdminClient()
        const bank = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('$id', bankId)]
        )

        return parseStringify(bank.documents[0])
    } catch (error) {
        console.log(error)
    }
}