"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendNewsletterAction, type AdminState } from "../actions";

export default function Newsletter() {
  const [state, action, pending] = useActionState<AdminState, FormData>(sendNewsletterAction, null);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin" className="text-sm text-brand hover:underline">← Back</Link>
      <div className="card">
        <h1 className="text-xl font-bold">Send a newsletter</h1>
        <p className="mt-1 text-sm text-stone-600">Goes to all confirmed subscribers via Resend.</p>
        <form action={action} className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="subject">Subject</label>
            <input id="subject" name="subject" required className="input" placeholder="This Saturday's dinner + Sunday route" />
          </div>
          <div>
            <label className="label" htmlFor="body">Message</label>
            <textarea id="body" name="body" rows={10} required className="input" placeholder="Write your update. Line breaks are preserved." />
          </div>
          {state && (
            <p className={state.ok ? "text-sm text-green-700" : "text-sm text-red-600"}>{state.message}</p>
          )}
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Sending…" : "Send to subscribers"}
          </button>
        </form>
      </div>
    </div>
  );
}
