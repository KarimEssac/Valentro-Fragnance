"use client";

import {usePathname, useSearchParams} from "next/navigation";
import type {ReactNode} from "react";
import {useCallback, useEffect, useRef, useState} from "react";

import LoadingScreen from "@/components/storefront/loading/LoadingScreen";

type RouteLoadingProviderProps = {
  children: ReactNode;
};

type LoadingState = "pending" | "visible" | "complete" | "hidden";

const LOADING_REVEAL_DELAY_MS = 500;

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
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [state, setState] = useState<LoadingState>("hidden");
  const [progress, setProgress] = useState(0);
  const [loadingCycle, setLoadingCycle] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loadingCycleRef = useRef(0);
  const loadingStateRef = useRef<LoadingState>("hidden");
  const finishStartedCycleRef = useRef<number | null>(null);
  const previousRouteRef = useRef(routeKey);
  const loadingRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const startLoading = useCallback((targetPath?: string) => {
    const nextCycle = loadingCycleRef.current + 1;

    loadingCycleRef.current = nextCycle;
    finishStartedCycleRef.current = null;
    clearTimers();
    loadingRef.current = true;
    loadingStateRef.current = "pending";
    setLoadingCycle(nextCycle);
    setState("pending");
    setProgress(0);

    const isAdminRoute = targetPath
      ? targetPath.split("/").some((part) => part === "admin")
      : false;
    const revealDelay = isAdminRoute ? 3000 : LOADING_REVEAL_DELAY_MS;

    timersRef.current.push(
      setTimeout(() => {
        if (
          nextCycle !== loadingCycleRef.current ||
          loadingStateRef.current !== "pending"
        ) {
          return;
        }

        loadingStateRef.current = "visible";
        setState("visible");
        requestAnimationFrame(() => {
          if (
            nextCycle === loadingCycleRef.current &&
            loadingStateRef.current === "visible"
          ) {
            setProgress(8);
          }
        });

        [
          [180, 28],
          [520, 52],
          [1000, 74],
          [1700, 88],
          [2600, 94]
        ].forEach(([delay, value]) => {
          timersRef.current.push(
            setTimeout(() => {
              if (
                nextCycle === loadingCycleRef.current &&
                loadingStateRef.current === "visible"
              ) {
                setProgress(value);
              }
            }, delay)
          );
        });
      }, revealDelay)
    );
  }, [clearTimers]);

  const finishLoading = useCallback(async () => {
    const cycle = loadingCycleRef.current;

    if (
      !loadingRef.current ||
      finishStartedCycleRef.current === cycle
    ) {
      return;
    }

    if (loadingStateRef.current === "pending") {
      clearTimers();
      loadingRef.current = false;
      loadingStateRef.current = "hidden";
      setState("hidden");
      return;
    }

    if (loadingStateRef.current !== "visible") return;

    finishStartedCycleRef.current = cycle;
    await waitForContentReady();

    if (cycle !== loadingCycleRef.current || !loadingRef.current) {
      return;
    }

    clearTimers();
    setProgress(100);

    timersRef.current.push(
      setTimeout(() => {
        if (cycle !== loadingCycleRef.current) return;

        loadingStateRef.current = "complete";
        setState("complete");
        timersRef.current.push(
          setTimeout(() => {
            if (cycle !== loadingCycleRef.current) return;

            loadingRef.current = false;
            loadingStateRef.current = "hidden";
            setState("hidden");
          }, 500)
        );
      }, 280)
    );
  }, [clearTimers]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    if (previousRouteRef.current === routeKey) return;

    previousRouteRef.current = routeKey;
    if (loadingRef.current) {
      finishLoading();
    }
  }, [finishLoading, routeKey]);

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
        anchor.hasAttribute("data-product-image-transition-link") ||
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

      startLoading(anchor.pathname);
    }

    function handlePopState() {
      startLoading(window.location.pathname);
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted && loadingRef.current) {
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
      {state === "visible" || state === "complete" ? (
        <LoadingScreen
          key={loadingCycle}
          progress={progress}
          complete={state === "complete"}
        />
      ) : null}
    </>
  );
}
