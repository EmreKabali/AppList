"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

export function SessionProvider({ children }: Readonly<Props>) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
