"use client";

import Image from "next/image";
import {useEffect, useState} from "react";

type Props = {
  orderId: string;
  total: string;
  locale: string;
  initialClaimToken?: string | null;
  claimed: boolean;
  verified: boolean;
};

export default function InstapayPayment({orderId, total, locale, initialClaimToken, claimed, verified}: Props) {
  const [claimToken, setClaimToken] = useState(initialClaimToken ?? "");
  const [csrfToken, setCsrfToken] = useState("");
  const [isClaimed, setIsClaimed] = useState(claimed);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const amount = new Intl.NumberFormat(locale, {style: "currency", currency: "EGP"}).format(Number(total));

  useEffect(() => {
    const storageKey = `valentro-instapay-${orderId}`;
    const fragment = new URLSearchParams(window.location.hash.slice(1)).get("claim");
    const token = initialClaimToken || fragment || window.localStorage.getItem(storageKey) || "";
    if (/^[a-f0-9]{64}$/.test(token)) {
      window.localStorage.setItem(storageKey, token);
    }
    if (fragment) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    fetch("/api/orders/csrf")
      .then((response) => response.json())
      .then((data: {token?: string}) => {
        setClaimToken(/^[a-f0-9]{64}$/.test(token) ? token : "");
        setCsrfToken(data.token ?? "");
      })
      .catch(() => setMessage("Payment confirmation is temporarily unavailable. Please try again later."));
  }, [initialClaimToken, orderId]);

  async function claimPayment() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/instapay-claim`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({csrfToken, claimToken})
      });
      const data = await response.json() as {message?: string};
      if (!response.ok) throw new Error(data.message || "Could not record your claim");
      setIsClaimed(true);
      setMessage(data.message || "Your claim was recorded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not record your claim");
    } finally {
      setBusy(false);
    }
  }

  if (verified || isClaimed) {
    return (
      <section className="border border-outline bg-surface p-5 text-parchment sm:p-7">
        <p className="label-caps text-gold">InstaPay transfer</p>
        <h2 className="mt-2 font-serif text-3xl">{verified ? "Payment verified" : "Payment report received"}</h2>
        <p className="mt-3 text-sm leading-6 text-on-surface/75">
          {verified ? "Valentro has verified your InstaPay transfer." : "You reported your transfer. Valentro will verify it manually before preparing your order."}
        </p>
        <p className="mt-3 break-all font-mono text-xs text-on-surface/65">Order ID: {orderId}</p>
        {message ? <p role="status" className="mt-2 text-sm text-gold">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="border border-outline bg-surface p-5 text-parchment sm:p-7">
      <p className="label-caps text-gold">InstaPay transfer</p>
      <h2 className="mt-2 font-serif text-3xl">Complete your payment</h2>
      <p className="mt-3 text-sm leading-6 text-on-surface/75">
        Your order is reserved. Transfer the exact amount below, then tell us once you have sent it. We will verify the transfer manually before preparing your order.
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-center">
        <div className="bg-white p-3">
          <Image src="/instapay-qr.png" alt="Scan the Valentro InstaPay payment QR code" width={386} height={386} className="h-auto w-full" priority />
        </div>
        <div className="space-y-4 text-sm">
          <div><p className="label-caps text-on-surface/65">Transfer amount</p><p className="mt-1 font-serif text-2xl">{amount}</p></div>
          <div>
            <p className="label-caps text-on-surface/65">Order ID for the note</p>
            <p className="mt-1 break-all font-mono text-xs sm:text-sm">{orderId}</p>
            <button type="button" onClick={() => navigator.clipboard.writeText(orderId).then(() => setMessage("Order ID copied.")).catch(() => setMessage("Select the order ID above to copy it."))} className="mt-2 border-b border-gold text-xs text-gold">Copy order ID</button>
          </div>
          <ol className="list-decimal space-y-2 pl-5 leading-6 text-on-surface/80">
            <li>Scan the QR code in InstaPay and transfer <strong className="text-parchment">{amount}</strong>.</li>
            <li>Choose <strong className="text-parchment">Living Expenses</strong> as the transfer purpose.</li>
            <li>Enter the full order ID above in the transfer note.</li>
            <li>After sending the transfer, select “I sent payment” below.</li>
          </ol>
        </div>
      </div>
      <div className="mt-6 border-t border-outline/60 pt-5">
        <button type="button" disabled={!claimToken || !csrfToken || busy} onClick={claimPayment} className="label-caps min-h-11 border border-parchment bg-parchment px-6 text-surface-hi disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Recording..." : "I sent payment"}
        </button>
        {!claimToken ? <p className="mt-2 text-xs text-on-surface/65">Open the private link in your order email to confirm your transfer.</p> : null}
        {message ? <p role="status" className="mt-2 text-sm text-on-surface/75">{message}</p> : null}
      </div>
    </section>
  );
}
