"use client";

import {usePathname} from "next/navigation";
import type {ReactNode} from "react";
import {useCallback, useEffect, useRef, useState} from "react";

import LoadingScreen from "@/components/storefront/loading/LoadingScreen";

type RouteLoadingProviderProps = {
  children: ReactNode;
};

type LoadingState = "visible" | "complete" | "hidden";

function isVisibleImage(image: HTMLImageElement) {
  const rect = image.getBoundingClientRect();

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth
  );
}

async function waitForContentReady() {
  if (document.readyState !== "complete") {
    await new Promise<void>((resolve) => {
      window.addEventListener("load", () => resolve(), {once: true});
    });
  }

  if ("fonts" in document) {
    await document.fonts.ready.catch(() => undefined);
  }

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

  if (document.querySelector("[data-route-loading='true']")) {
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (!document.querySelector("[data-route-loading='true']")) {
          cleanup();
          resolve();
        }
      });
      const timeout = setTimeout(() => {
        cleanup();
        resolve();
      }, 8000);

      function cleanup() {
        clearTimeout(timeout);
        observer.disconnect();
      }

      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true
      });
    });
  }

  const images = Array.from(document.images)
    .filter(isVisibleImage)
    .filter((image) => !image.complete);

  await Promise.race([
    Promise.all(
      images.map((image) =>
        image.decode ? image.decode().catch(() => undefined) : undefined
      )
    ),
    new Promise((resolve) => setTimeout(resolve, 1200))
  ]);
}

export default function RouteLoadingProvider({
  children
}: RouteLoadingProviderProps) {
  const pathname = usePathname();
  const [state, setState] = useState<LoadingState>("visible");
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previousPathRef = useRef(pathname);
  const loadingRef = useRef(true);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const startLoading = useCallback(() => {
    clearTimers();
    loadingRef.current = true;
    setState("visible");
    setProgress(0);

    requestAnimationFrame(() => setProgress(8));
    [
      [180, 28],
      [520, 52],
      [1000, 74],
      [1700, 88],
      [2600, 94]
    ].forEach(([delay, value]) => {
      timersRef.current.push(
        setTimeout(() => setProgress(value), delay)
      );
    });
  }, [clearTimers]);

  const finishLoading = useCallback(async () => {
    await waitForContentReady();
    clearTimers();
    setProgress(100);

    timersRef.current.push(
      setTimeout(() => {
        setState("complete");
        timersRef.current.push(
          setTimeout(() => {
            loadingRef.current = false;
            setState("hidden");
          }, 500)
        );
      }, 280)
    );
  }, [clearTimers]);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      startLoading();
      finishLoading();
    }, 0);

    return () => {
      clearTimeout(initialTimer);
      clearTimers();
    };
  }, [clearTimers, finishLoading, startLoading]);

  useEffect(() => {
    if (previousPathRef.current === pathname) return;

    previousPathRef.current = pathname;
    if (loadingRef.current) {
      finishLoading();
    }
  }, [finishLoading, pathname]);

  useEffect(() => {
    function shouldHandleNavigation(event: MouseEvent, anchor: HTMLAnchorElement) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        anchor.target ||
        anchor.hasAttribute("download")
      ) {
        return false;
      }

      const url = new URL(anchor.href);
      const current = new URL(window.location.href);

      return (
        url.origin === current.origin &&
        url.href !== current.href &&
        !(url.pathname === current.pathname && url.search === current.search)
      );
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor || !shouldHandleNavigation(event, anchor)) return;

      startLoading();
    }

    function handlePopState() {
      startLoading();
      timersRef.current.push(
        setTimeout(() => {
          if (loadingRef.current) {
            finishLoading();
          }
        }, 0)
      );
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted || loadingRef.current) {
        finishLoading();
      }
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [finishLoading, startLoading]);

  return (
    <>
      {children}
      {state !== "hidden" ? (
        <LoadingScreen progress={progress} complete={state === "complete"} />
      ) : null}
    </>
  );
}
