---
name: Valentro Light Luxury
colors:
  surface: '#fcf9f3'
  surface-dim: '#dcdad4'
  surface-bright: '#fcf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ed'
  surface-container: '#f0eee8'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e5e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#4b463e'
  inverse-surface: '#31312d'
  inverse-on-surface: '#f3f0ea'
  outline: '#7c766d'
  outline-variant: '#cdc5bb'
  surface-tint: '#655d51'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#201b11'
  on-primary-container: '#8b8375'
  inverse-primary: '#d0c5b5'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#010000'
  on-tertiary: '#ffffff'
  tertiary-container: '#251a05'
  on-tertiary-container: '#948164'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ece1d1'
  primary-fixed-dim: '#d0c5b5'
  on-primary-fixed: '#201b11'
  on-primary-fixed-variant: '#4d463a'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#f6dfbd'
  tertiary-fixed-dim: '#d9c4a3'
  on-tertiary-fixed: '#251a05'
  on-tertiary-fixed-variant: '#53452b'
  background: '#fcf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e5e2dc'
  parchment-base: '#F9F6F0'
  marble-vein: '#EAE4D8'
  warm-gold: '#D4AF37'
  deep-onyx: '#201B11'
  muted-brass: '#7A6A4F'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 84px
    fontWeight: '400'
    lineHeight: 92px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: 0em
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: 0em
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '300'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.15em
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 128px
---

## Brand & Style

This design system translates the "mysterious and opulent" essence of the brand into a luminous, high-contrast light theme. The aesthetic is **Cinematic Minimalism**, shifting from the dark, immersive void of the original identity to an airy, ethereal atmosphere inspired by sun-drenched marble and aged parchment.

The target audience remains the discerning luxury consumer, but the emotional response moves toward **timeless elegance and architectural clarity**. By combining vast negative space with warm, metallic accents, the UI evokes the feeling of a bright, high-end gallery or a heritage atelier. The style is strictly geometric, using sharp edges to maintain a sense of precision and "haute couture" construction.

## Colors

The "Light Theme" palette is anchored in **Parchment Neutrals** to provide a warmer, more sophisticated alternative to clinical pure white.

*   **Primary (Deep Onyx):** A near-black with a hint of warmth (#201B11). Used for all primary typography and structural lines to maintain the brand's authoritative weight.
*   **Secondary (Warm Gold):** Derived from the cinematic lighting of the reference image (#D4AF37). Reserved for interactive elements, call-to-actions, and premium signatures.
*   **Neutral (Parchment Base):** The primary surface color (#F9F6F0), creating an expansive, airy feel that mimics luxury stationary.
*   **Tertiary (Muted Brass):** Used for subtle borders, inactive states, and secondary labels to provide depth without high contrast.

## Typography

The typography maintains the tension between **Editorial Heritage** and **Modern Technicality**.

*   **Libre Caslon Text** is used for all headlines and display moments. It should be treated as a decorative element; generous leading and intentional tracking (especially in Display sizes) are required to evoke a "masthead" quality.
*   **Hanken Grotesk** handles all functional information. Use the "Light" (300) weight for large blocks of text to ensure the UI feels airy and expensive.
*   **Label Caps** are strictly for navigation and metadata. The increased letter-spacing (0.15em) is critical to achieving the catalog-like precision seen in premium fragrance branding.

## Layout & Spacing

This design system utilizes a **Fixed-Fluid Hybrid** layout with an emphasis on "negative space as a luxury."

*   **Grid:** A 12-column grid system is used for desktop. Components should rarely span the full width; use asymmetrical offsets (e.g., a 6-column image paired with a 4-column text block and 2 columns of empty margin) to create a curated, editorial rhythm.
*   **Vertical Rhythm:** Use large `section-gap` units (128px+) between major content blocks to prevent the interface from feeling "crowded," which is antithetical to the luxury experience.
*   **Mobile:** Collapses to a 4-column grid with increased vertical padding to maintain the "airy" feel on smaller viewports.

## Elevation & Depth

In this light-themed system, depth is achieved through **Tonal Layering and Surface Contrasts** rather than heavy drop shadows.

*   **The Layering Model:**
    *   **Base:** Parchment (#F9F6F0).
    *   **Raised Surfaces:** Subtle shift to Marble Vein (#EAE4D8) or 1px borders in Muted Brass.
*   **Shadows:** Avoid traditional shadows. If depth is required for overlays or menus, use a "Luminous Blur"—a very wide, low-opacity (5-10%) shadow tinted with Deep Onyx to ground the element without making it look "muddy."
*   **Glassmorphism:** Use high-diffusion backdrop blurs (20px+) on navigation bars to allow the warm background colors to bleed through, maintaining the cinematic light quality.

## Shapes

The shape language is **Strictly Sharp (0px)**. This reflects the architectural precision of the fragrance bottles and the "hard-edge" nature of high-end editorial design.

All buttons, image containers, input fields, and structural dividers must have 90-degree corners. This rigidity contrasts beautifully with the soft, organic textures of the product photography and the warmth of the parchment color palette.

## Components

*   **Primary Buttons:** Sharp-edged rectangles. Background: Deep Onyx (#201B11), Text: Parchment (#F9F6F0). No border. On hover, the background transitions to Warm Gold (#D4AF37).
*   **Secondary Buttons:** Ghost-style. Background: Transparent, Border: 1px Deep Onyx, Text: Deep Onyx.
*   **Input Fields:** Minimalist design with only a 1px bottom border in Muted Brass. Label sits above in `label-caps`. On focus, the border shifts to Warm Gold.
*   **Cards:** Product cards should be borderless and backgroundless. The image should be the focal point, with typography centered underneath. Apply a subtle 1.02x scale on the image during hover states.
*   **Navigation:** Top navigation is fixed. Use `label-caps` for links. A thin 1px Muted Brass line separates the navigation from the content only on scroll.
*   **Interactive Dividers:** Horizontal lines used to separate sections should be 1px thick in Muted Brass (#7A6A4F) to maintain the "fine-line" aesthetic.