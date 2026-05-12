"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  return (
    <Button
      className="min-h-12 w-full rounded-full bg-[var(--accent)] !text-[rgba(255,250,244,0.98)] shadow-[0_16px_36px_rgba(35,70,58,0.2)] hover:bg-[var(--accent-strong)]"
      onClick={() => signIn("google", { callbackUrl: "/post-login" })}
    >
      <span className="text-[rgba(255,250,244,0.98)]">Entrar com Google</span>
    </Button>
  );
}
