/** User chose "Ahora no" while permission was still `default` — don't show banner every visit */
export const PUSH_BANNER_DISMISSED_KEY = "calendar_push_banner_dismissed";

export function isPushBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPushBannerDismissed(): void {
  try {
    localStorage.setItem(PUSH_BANNER_DISMISSED_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
