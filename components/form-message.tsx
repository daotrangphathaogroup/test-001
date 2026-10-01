"use client";

import { Alert } from "@/components/primitives";

export function FormMessage({
  state,
}: {
  state: { ok: boolean; error?: string } | null | undefined;
}) {
  if (!state || state.ok || !state.error) return null;
  return <Alert tone="error">{state.error}</Alert>;
}
