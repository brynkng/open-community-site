"use client";

import { useActionState } from "react";
import { loginAction, type AdminState } from "../actions";

export default function AdminLogin() {
  const [state, action, pending] = useActionState<AdminState, FormData>(loginAction, null);
  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="text-xl font-bold">Organizer sign in</h1>
        <p className="mt-1 text-sm text-stone-600">Enter the organizer password to manage events.</p>
        <form action={action} className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="input" autoFocus />
          </div>
          {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
