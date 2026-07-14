type ProductImageTransition = {
  slug: string;
  imageUrl: string;
  imageAlt: string;
};

type ViewTransitionHandle = {
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    update: () => void | Promise<void>
  ) => ViewTransitionHandle;
};

let pendingTransition: ProductImageTransition | null = null;

export function getProductTransitionName(slug: string) {
  return `product-image-${slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function getPendingProductTransition(slug: string) {
  return pendingTransition?.slug === slug ? pendingTransition : null;
}

function waitForProductTarget(slug: string, timeoutMs = 4000) {
  return new Promise<HTMLElement | null>((resolve) => {
    const findTarget = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-product-transition-target]"
        )
      ).find((element) => element.dataset.productTransitionTarget === slug);

    if (findTarget()) {
      resolve(findTarget() ?? null);
      return;
    }

    const observer = new MutationObserver(() => {
      if (findTarget()) {
        cleanup();
        resolve(findTarget() ?? null);
      }
    });
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeout);
      observer.disconnect();
    }

    observer.observe(document.body, {childList: true, subtree: true});
  });
}

function estimateProductTarget() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth < 768) {
    const width = viewportWidth - 48;
    return {left: 24, top: 144, width, height: width * 1.25};
  }

  const pageWidth = Math.min(viewportWidth - 128, 1280);
  const galleryColumnWidth = (pageWidth * 7) / 12;
  const width = galleryColumnWidth - 120;

  return {
    left: (viewportWidth - pageWidth) / 2 + 120,
    top: 128,
    width,
    height: width * 1.25
  };
}

function animateElement(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
) {
  return element.animate(keyframes, options).finished.catch(() => undefined);
}

async function runFallbackTransition({
  slug,
  imageUrl,
  imageAlt,
  source,
  navigate
}: StartProductTransitionOptions) {
  const sourceRect = source.getBoundingClientRect();
  const overlay = document.createElement("div");
  const image = document.createElement("img");

  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.productTransitionOverlay = slug;
  Object.assign(overlay.style, {
    position: "fixed",
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    zIndex: "2600",
    overflow: "hidden",
    pointerEvents: "none",
    background: "#201d19",
    border: "1px solid rgba(227, 210, 186, 0.35)",
    boxShadow: "0 18px 60px rgba(12, 10, 8, 0.18)"
  });
  Object.assign(image.style, {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  });
  image.src = imageUrl;
  image.alt = imageAlt;
  overlay.appendChild(image);
  document.body.appendChild(overlay);
  source.style.opacity = "0";
  document.documentElement.dataset.productImageTransition = "fallback";

  navigate();

  try {
    const target = await waitForProductTarget(slug, 650);
    const targetRect = target?.getBoundingClientRect() ?? estimateProductTarget();

    await animateElement(
      overlay,
      [
        {
          left: `${sourceRect.left}px`,
          top: `${sourceRect.top}px`,
          width: `${sourceRect.width}px`,
          height: `${sourceRect.height}px`,
          transform: "translateY(0) scale(1)",
          borderRadius: "0px"
        },
        {
          offset: 0.18,
          transform: "translateY(-14px) scale(1.025)",
          boxShadow: "0 28px 80px rgba(12, 10, 8, 0.28)"
        },
        {
          left: `${targetRect.left}px`,
          top: `${targetRect.top}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          transform: "translateY(0) scale(1)",
          borderRadius: "0px",
          boxShadow: "0 12px 42px rgba(12, 10, 8, 0.12)"
        }
      ],
      {
        duration: 820,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards"
      }
    );

    const resolvedTarget = target ?? (await waitForProductTarget(slug, 2600));
    if (resolvedTarget) {
      const resolvedRect = resolvedTarget.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();

      await animateElement(
        overlay,
        [
          {
            left: `${overlayRect.left}px`,
            top: `${overlayRect.top}px`,
            width: `${overlayRect.width}px`,
            height: `${overlayRect.height}px`
          },
          {
            left: `${resolvedRect.left}px`,
            top: `${resolvedRect.top}px`,
            width: `${resolvedRect.width}px`,
            height: `${resolvedRect.height}px`
          }
        ],
        {
          duration: 220,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );
    }

    document.documentElement.dataset.productImageTransition = "handoff";
    await animateElement(
      overlay,
      [{opacity: 1}, {opacity: 0}],
      {duration: 220, easing: "ease-out", fill: "forwards"}
    );
  } finally {
    overlay.remove();
    source.style.opacity = "";
    delete document.documentElement.dataset.productImageTransition;
    pendingTransition = null;
  }
}

type StartProductTransitionOptions = ProductImageTransition & {
  source: HTMLElement;
  navigate: () => void;
};

export function startProductImageTransition({
  slug,
  imageUrl,
  imageAlt,
  source,
  navigate
}: StartProductTransitionOptions) {
  const transitionDocument = document as ViewTransitionDocument;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!transitionDocument.startViewTransition || prefersReducedMotion) {
    if (prefersReducedMotion) return false;

    void runFallbackTransition({
      slug,
      imageUrl,
      imageAlt,
      source,
      navigate
    });
    return true;
  }

  pendingTransition = {slug, imageUrl, imageAlt};
  source.style.viewTransitionName = getProductTransitionName(slug);
  document.documentElement.dataset.productImageTransition = "native";

  try {
    const transition = transitionDocument.startViewTransition(async () => {
      navigate();
      await waitForProductTarget(slug);
    });

    transition.finished.finally(() => {
      source.style.viewTransitionName = "";
      delete document.documentElement.dataset.productImageTransition;
      pendingTransition = null;
    });

    return true;
  } catch {
    source.style.viewTransitionName = "";
    delete document.documentElement.dataset.productImageTransition;
    pendingTransition = null;
    return false;
  }
}
