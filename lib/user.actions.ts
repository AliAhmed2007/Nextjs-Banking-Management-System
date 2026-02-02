"use server"

import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "./appwrite";
import { cookies } from "next/headers";
import { parseStringify } from "./utils";

export async function signUp(userData: SignUpParams) {
    const { email, password, lastName, firstName } = userData
    try {
        const { account } = await createAdminClient();

        const newUserAccount = await account.create({
            userId: ID.unique(),
            email,
            password,
            name: `${firstName} ${lastName}`
        });

        const session = await account.createEmailPasswordSession({
            email,
            password
        });

        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        console.log(parseStringify(newUserAccount))
        // in nextjs you cannot pass large objects through server actions rather we've to stringfy it first
        return parseStringify(newUserAccount)
    } catch (error) {
        console.error("Error: ", error)
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
        return null;
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