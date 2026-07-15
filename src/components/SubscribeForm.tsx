"use client";

import { useActionState } from "react";
import { subscribeAction, type FormState } from "@/app/actions";

export function SubscribeForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeAction, null);

  if (state?.ok) {
    return <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{state.message}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="you@email.com"
        className="input sm:flex-1"
      />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Joining…" : "Subscribe"}
      </button>
      {state && !state.ok && (
        <p className="text-sm text-red-600 sm:basis-full">{state.message}</p>
      )}
    </form>
  );
}
