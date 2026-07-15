"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const SCRIPT_ID = "cf-turnstile-script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  /** Called with the fresh token whenever it (re)verifies, and with "" on expiry/error. */
  onVerify?: (token: string) => void;
  className?: string;
};

/**
 * Renders the Cloudflare Turnstile widget and surfaces the token both via a
 * `cf-turnstile-response` hidden input (so a parent `<form action={...}>` picks
 * it up in `FormData` automatically) and via the `onVerify` callback (for forms
 * that want to gate the submit button on a token being present). Handles
 * expiry/errors by resetting the token to "".
 */
export function TurnstileWidget({ onVerify, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !containerRef.current) return;

    const handleToken = (t: string) => {
      setToken(t);
      onVerify?.(t);
    };
    const handleExpireOrError = () => handleToken("");

    function render() {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current)
        return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: handleToken,
        "expired-callback": handleExpireOrError,
        "error-callback": handleExpireOrError,
      });
    }

    if (window.turnstile) {
      render();
      return;
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => script?.removeEventListener("load", render);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      <div ref={containerRef} />
      <input
        type="hidden"
        name="cf-turnstile-response"
        value={token}
        readOnly
      />
    </div>
  );
}
