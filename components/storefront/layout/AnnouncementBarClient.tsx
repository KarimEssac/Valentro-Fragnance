"use client";

import type {MouseEvent} from "react";
import {useSyncExternalStore} from "react";

type AnnouncementBarClientProps = {
  announcement: {
    id: string;
    text: string;
    linkUrl: string | null;
    bgColor: string;
    textColor: string;
  };
};

export default function AnnouncementBarClient({
  announcement
}: AnnouncementBarClientProps) {
  const storageKey = `valentro-announcement-dismissed-${announcement.id}`;
  const dismissed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("valentro-announcement-dismissed", onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(
          "valentro-announcement-dismissed",
          onStoreChange
        );
      };
    },
    () => sessionStorage.getItem(storageKey) === "true",
    () => false
  );

  if (dismissed) {
    return null;
  }

  function dismiss(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    sessionStorage.setItem(storageKey, "true");
    window.dispatchEvent(new Event("valentro-announcement-dismissed"));
  }

  function openLink() {
    if (announcement.linkUrl) {
      window.location.assign(announcement.linkUrl);
    }
  }

  return (
    <div
      className="relative flex min-h-8 w-full cursor-default items-center justify-center px-12 py-2 text-center"
      style={{
        backgroundColor: announcement.bgColor,
        color: announcement.textColor
      }}
      role={announcement.linkUrl ? "link" : undefined}
      tabIndex={announcement.linkUrl ? 0 : undefined}
      onClick={announcement.linkUrl ? openLink : undefined}
      onKeyDown={(event) => {
        if (
          announcement.linkUrl &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          openLink();
        }
      }}
    >
      <p className="label-caps">{announcement.text}</p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={dismiss}
        className="focus-gold absolute end-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-current opacity-80 transition-opacity duration-300 hover:opacity-100"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
