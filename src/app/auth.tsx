"use client";

import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

const Auth = ({ session }: { session: Session | null }) => {
  return !session ? (
    <button type="button" onClick={() => signIn()} className="default">
      Log in
    </button>
  ) : (
    <button type="button" onClick={() => signOut()} className="danger">
      Log out
    </button>
  );
};

export default Auth;
