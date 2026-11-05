type ProductImageTransition = {
  slug: string;
  imageUrl: string;
  imageAlt: string;
  previewUrl: string;
  finished: Promise<void>;
};

type StartProductTransitionOptions = {
  slug: string;
  imageUrl: string;
  imageAlt: string;
  source: HTMLElement;
  navigate: () => void;
};

const TRANSITION_DURATION_MS = 720;
const TRANSITION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
let pendingTransition: ProductImageTransition | null = null;

export function getProductTransitionName(slug: string) {
  return `product-image-${slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function getPendingProductTransition(slug: string) {
  return pendingTransition?.slug === slug ? pendingTransition : null;
}

function waitForElement<T>(read: () => T | null, timeoutMs: number) {
  const current = read();
  if (current) return Promise.resolve(current);

  return new Promise<T | null>((resolve) => {
    const observer = new MutationObserver(() => {
      const value = read();
      if (value) finish(value);
    });
    const timeout = window.setTimeout(() => finish(null), timeoutMs);

    function finish(value: T | null) {
      observer.disconnect();
      window.clearTimeout(timeout);
      resolve(value);
    }

    observer.observe(document.body, {childList: true, subtree: true});
  });
}

function waitForImage(image: HTMLImageElement, timeoutMs = 1200) {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(() => finish(false), timeoutMs);

    function finish(ready: boolean) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      image.removeEventListener("load", decode);
      image.removeEventListener("error", failed);
      resolve(ready);
    }

    function failed() {
      finish(false);
    }

    function decode() {
      if (!image.naturalWidth) return finish(false);
      if (image.decode) {
        void image.decode().then(() => finish(true), () => finish(false));
      } else {
        finish(true);
      }
    }

    image.addEventListener("load", decode, {once: true});
    image.addEventListener("error", failed, {once: true});
    if (image.complete) decode();
  });
}

async function prepareProductTarget(
  slug: string,
  previousTargets: Set<Element>,
  sourceDialog: Element | null
) {
  const [target] = await Promise.all([
    waitForElement(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-product-transition-target]"))
        .find((element) =>
          element.dataset.productTransitionTarget === slug &&
          !previousTargets.has(element) &&
          !element.closest("[data-route-loading='true']")
        ) ?? null,
    4000),
    // Let an outgoing cart/modal release its scroll lock before capturing the new page.
    sourceDialog
      ? waitForElement(() => sourceDialog.isConnected ? null : true, 400)
      : Promise.resolve(true)
  ]);

  if (!target?.isConnected) return null;
  // The router can settle its scroll without waiting for a paint, which a native
  // View Transition update callback can suppress.
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  const image = target.querySelector<HTMLImageElement>("[data-product-transition-preview]") ??
    target.querySelector<HTMLImageElement>("img");
  if (!image || !(await waitForImage(image))) return null;
  return target.isConnected ? target : null;
}

function clipToRect(rect: DOMRect) {
  return `inset(${rect.top}px ${window.innerWidth - rect.right}px ${window.innerHeight - rect.bottom}px ${rect.left}px)`;
}

function imageTransform(image: HTMLImageElement, rect: DOMRect) {
  const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
  const x = rect.left + (rect.width - image.naturalWidth * scale) / 2;
  const y = rect.top + (rect.height - image.naturalHeight * scale) / 2;
  return `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
}

async function runFallbackTransition(
  options: StartProductTransitionOptions,
  preview: ProductImageTransition,
  previousTargets: Set<Element>,
  sourceDialog: Element | null,
  complete: () => void
) {
  const {source, navigate, slug, imageAlt} = options;
  const sourceRect = source.getBoundingClientRect();
  const previousOpacity = source.style.opacity;
  const overlay = document.createElement("div");
  const image = document.createElement("img");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.productTransitionOverlay = slug;
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2600",
    overflow: "hidden",
    pointerEvents: "none",
    clipPath: clipToRect(sourceRect)
  });
  image.alt = imageAlt;
  image.src = preview.previewUrl;

  try {
    if (!(await waitForImage(image))) {
      navigate();
      return;
    }

    Object.assign(image.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: `${image.naturalWidth}px`,
      height: `${image.naturalHeight}px`,
      maxWidth: "none",
      transformOrigin: "0 0",
      transform: imageTransform(image, sourceRect),
      willChange: "transform"
    });
    overlay.appendChild(image);
    document.body.appendChild(overlay);
    source.style.opacity = "0";
    navigate();

    const target = await prepareProductTarget(slug, previousTargets, sourceDialog);
    if (!target) return;
    const targetRect = target.getBoundingClientRect();
    const timing = {
      duration: TRANSITION_DURATION_MS,
      easing: TRANSITION_EASING,
      fill: "forwards" as const
    };

    // Move a uniformly scaled image and its crop instead of animating layout
    // dimensions. This also preserves the photo's proportions across aspect ratios.
    await Promise.all([
      overlay.animate([
        {clipPath: clipToRect(sourceRect)},
        {clipPath: clipToRect(targetRect)}
      ], timing).finished,
      image.animate([
        {transform: imageTransform(image, sourceRect)},
        {transform: imageTransform(image, targetRect)}
      ], timing).finished
    ]);

    document.documentElement.dataset.productImageTransition = "handoff";
    await overlay.animate([{opacity: 1}, {opacity: 0}], {
      duration: 140, easing: "ease-out", fill: "forwards"
    }).finished;
  } finally {
    overlay.remove();
    source.style.opacity = previousOpacity;
    complete();
  }
}

export function startProductImageTransition(options: StartProductTransitionOptions) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (pendingTransition) return true;

  const {source, slug, imageUrl, imageAlt, navigate} = options;
  const sourceImage = source instanceof HTMLImageElement ? source : source.querySelector("img");
  const sourceRect = source.getBoundingClientRect();
  if (
    !sourceImage?.complete || !sourceImage.naturalWidth ||
    sourceRect.width <= 0 || sourceRect.height <= 0 ||
    sourceRect.bottom <= 0 || sourceRect.top >= window.innerHeight
  ) return false;

  const hasNativeTransition = typeof document.startViewTransition === "function";
  if (!hasNativeTransition && typeof source.animate !== "function") return false;

  let resolveFinished = () => {};
  const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });
  const preview: ProductImageTransition = {
    slug, imageUrl, imageAlt,
    // Reuse the exact decoded resource on screen, including Next.js srcset URLs.
    previewUrl: sourceImage.currentSrc || sourceImage.src || imageUrl,
    finished
  };
  const previousTargets = new Set(document.querySelectorAll("[data-product-transition-target]"));
  const sourceDialog = source.closest("[role='dialog']");
  const previousName = source.style.viewTransitionName;
  let target: HTMLElement | null = null;
  let previousTargetName = "";
  pendingTransition = preview;

  function complete() {
    source.style.viewTransitionName = previousName;
    if (target) target.style.viewTransitionName = previousTargetName;
    if (pendingTransition === preview) {
      pendingTransition = null;
      delete document.documentElement.dataset.productImageTransition;
    }
    resolveFinished();
  }

  if (!hasNativeTransition) {
    document.documentElement.dataset.productImageTransition = "fallback";
    void runFallbackTransition(options, preview, previousTargets, sourceDialog, complete)
      .catch(() => undefined);
    return true;
  }

  source.style.viewTransitionName = getProductTransitionName(slug);
  document.documentElement.dataset.productImageTransition = "native";

  try {
    const transition: ViewTransition = document.startViewTransition(async () => {
      navigate();
      target = await prepareProductTarget(slug, previousTargets, sourceDialog);
      if (!target) {
        transition.skipTransition();
        return;
      }
      previousTargetName = target.style.viewTransitionName;
      target.style.viewTransitionName = getProductTransitionName(slug);
      target.getBoundingClientRect();
    });
    void transition.ready.catch(() => undefined);
    void transition.updateCallbackDone.catch(() => undefined);
    void transition.finished.then(complete, complete);
    return true;
  } catch {
    complete();
    return false;
  }
}
