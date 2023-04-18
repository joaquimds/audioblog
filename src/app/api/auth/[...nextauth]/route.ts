import * as crypto from "crypto";
import NextAuth, { Account, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

const getHash = async (input: string) => {
  const textAsBuffer = new TextEncoder().encode(input);
  const hashBuffer = await crypto.webcrypto.subtle.digest(
    "SHA-256",
    textAsBuffer
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
  return hash;
};

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account && token.email) {
        token.emailHash = await getHash(token.email);
      }
      return token;
    },
    session: async ({ session, token }: { session: Session; token: JWT }) => {
      session.isAdmin =
        Boolean(session.user?.email) &&
        session.user?.email === process.env.ADMIN_EMAIL;
      session.emailHash = token.emailHash as string | undefined;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
