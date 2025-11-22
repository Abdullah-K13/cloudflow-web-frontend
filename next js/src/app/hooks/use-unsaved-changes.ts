"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  onBeforeNavigate?: (targetPath: string) => void;
  enabled?: boolean;
}

/**
 * Hook to intercept navigation when there are unsaved changes.
 * Works with Next.js App Router.
 */
export function useUnsavedChanges({
  hasUnsavedChanges,
  onBeforeNavigate,
  enabled = true,
}: UseUnsavedChangesOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    // Intercept link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;
      
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Skip external links
      if (href.startsWith("http://") || href.startsWith("https://")) {
        return;
      }

      // Skip if already navigating
      if (isNavigatingRef.current) return;

      // Skip if clicking on the same page
      if (href === pathname) return;

      // Prevent default navigation
      e.preventDefault();
      e.stopPropagation();

      // Call the callback to show modal
      if (onBeforeNavigate) {
        isNavigatingRef.current = true;
        onBeforeNavigate(href);
      }
    };

    // Intercept browser back/forward
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges && !isNavigatingRef.current) {
        e.preventDefault();
        window.history.pushState(null, "", pathname);
        if (onBeforeNavigate) {
          onBeforeNavigate(window.location.pathname);
        }
      }
    };

    // Add event listeners
    document.addEventListener("click", handleLinkClick, true);
    window.addEventListener("popstate", handlePopState);

    // Push current state to prevent back navigation
    if (hasUnsavedChanges) {
      window.history.pushState(null, "", pathname);
    }

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges, onBeforeNavigate, enabled, pathname]);

  const allowNavigation = (targetPath: string) => {
    isNavigatingRef.current = true;
    // Use window.location for external navigation or router for internal
    if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
      window.location.href = targetPath;
    } else {
      router.push(targetPath);
    }
  };

  return { allowNavigation };
}

