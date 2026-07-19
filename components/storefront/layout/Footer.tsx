"use client";

import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";
import type {FormEvent} from "react";
import {useState} from "react";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isRtl = locale === "ar";

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(false);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email})
      });

      if (!response.ok) throw new Error("Subscription failed");

      setSubscribed(true);
      setEmail("");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const localizedPath = (path: string) => {
    if (path.startsWith("#")) return path;
    return `/${locale}${path}`;
  };

  return (
    <footer className="w-full border-t border-muted-brass/30 bg-surface-container-low px-6 py-10 font-body-md text-body-md text-primary dark:bg-deep-onyx dark:text-on-primary md:px-margin-desktop md:py-12">
      <div className="mx-auto grid w-full max-w-container-max grid-cols-1 gap-10 text-center md:grid-cols-12 md:gap-x-gutter md:text-start" dir={isRtl ? "rtl" : "ltr"}>
        {/* Brand Signature */}
        <div className="flex flex-col items-center gap-4 md:col-span-4 md:items-start">
          <h2 className="font-headline-lg text-headline-lg text-primary dark:text-warm-gold">VALENTRO</h2>
          <p className="font-body-md text-body-md text-muted-brass max-w-sm leading-relaxed">
            {t("brandDescription")}
          </p>
        </div>

        {/* Navigation Columns */}
        <div className="grid grid-cols-2 gap-8 md:col-span-3">
          {/* Collections */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <h3 className="font-label-caps text-label-caps text-warm-gold uppercase tracking-widest">{t("collections.title")}</h3>
            <ul className="flex flex-col items-center sm:items-start gap-3">
              <li>
                <Link className="text-muted-brass hover:text-warm-gold transition-colors duration-300" href={localizedPath("/fragrances?type=collection")}>
                  {t("collections.all")}
                </Link>
              </li>
              <li>
                <Link className="text-muted-brass hover:text-warm-gold transition-colors duration-300" href={localizedPath("/fragrances")}>
                  {t("collections.fragrances")}
                </Link>
              </li>
              <li>
                <Link className="text-muted-brass hover:text-warm-gold transition-colors duration-300" href={localizedPath("/about-us")}>
                  {t("collections.story")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Assistance */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <h3 className="font-label-caps text-label-caps text-warm-gold uppercase tracking-widest">{t("assistance.title")}</h3>
            <ul className="flex flex-col items-center sm:items-start gap-3">
              <li>
                <Link className="text-muted-brass hover:text-warm-gold transition-colors duration-300" href={localizedPath("/privacy-policy")}>
                  {t("assistance.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link className="text-muted-brass hover:text-warm-gold transition-colors duration-300" href={localizedPath("/terms-and-conditions")}>
                  {t("assistance.termsConditions")}
                </Link>
              </li>
              <li>
                <Link className="text-muted-brass hover:text-warm-gold transition-colors duration-300" href={localizedPath("/refund-policy")}>
                  {t("assistance.refundPolicy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* The Invitation (Newsletter) */}
        <div className={`flex flex-col items-center gap-4 md:col-span-5 md:items-start ${isRtl ? "md:pr-8" : "md:pl-8"}`}>
          <h3 className="font-headline-md text-headline-md text-primary dark:text-on-primary">{t("newsletter.title")}</h3>
          <p className="font-body-md text-body-md text-muted-brass max-w-sm">{t("newsletter.description")}</p>
          {subscribed ? (
            <p className="text-warm-gold font-body-md py-2">{t("newsletter.success")}</p>
          ) : (
            <form className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none" onSubmit={handleSubscribe}>
              <div className="relative w-full">
                <input
                  className="w-full bg-transparent border-0 border-b border-muted-brass text-deep-onyx outline-none focus:border-muted-brass focus:outline-none focus:ring-0 focus-visible:outline-none transition-colors pb-2 px-0 font-body-md placeholder-muted-brass/50 text-center md:text-start"
                  type="email"
                  placeholder={t("newsletter.placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                className="bg-deep-onyx text-parchment-base hover:bg-warm-gold transition-colors duration-300 font-label-caps text-label-caps uppercase px-8 py-3 whitespace-nowrap shrink-0 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "..." : t("newsletter.button")}
              </button>
            </form>
          )}
          {error && <p className="text-sm text-red-700" role="alert">{t("newsletter.error")}</p>}
        </div>
      </div>

      {/* Social & Legal Bottom Bar */}
      <div className="mx-auto mt-10 flex w-full max-w-container-max flex-col items-center justify-between gap-5 border-t border-muted-brass/20 pt-6 md:flex-row" dir={isRtl ? "rtl" : "ltr"}>
        {/* Social Icons */}
        <div className="flex items-center gap-5">
          <a
            aria-label="Instagram"
            className="footer-social-link"
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="footer-social-icon h-[22px] w-[22px] stroke-current" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            aria-label="Facebook"
            className="footer-social-link"
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="footer-social-icon h-[22px] w-[22px] fill-current" viewBox="0 0 24 24">
              <path d="M9 8H7v3h2v9h3v-9h2.72l.42-3H12V6c0-.57.24-1 1-1h2V2h-3c-3.07 0-5 1.89-5 5v1z"/>
            </svg>
          </a>
          <a
            href="https://karimessac.github.io/My-Portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-md text-body-md text-muted-brass transition-colors hover:text-gold"
          >
            Developed by Karim Essac
          </a>
        </div>
        <div className="text-center md:text-right flex flex-col md:flex-row gap-2 md:gap-8 opacity-80 hover:opacity-100 transition-opacity">
          <span className="font-body-md text-body-md text-muted-brass uppercase">{t("rights")}</span>
          <span className="font-body-md text-body-md text-muted-brass italic hidden md:inline">{t("origin")}</span>
        </div>
      </div>
    </footer>
  );
}
