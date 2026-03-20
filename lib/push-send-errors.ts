/**
 * web-push throws objects with statusCode for failed FCM/endpoint responses.
 * Also match message strings for robustness across versions.
 */
export function shouldRemovePushSubscription(err: unknown): boolean {
  if (err && typeof err === "object" && "statusCode" in err) {
    const code = (err as { statusCode?: number }).statusCode;
    if (code === 410 || code === 404) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /\b410\b/.test(msg) ||
    /\b404\b/.test(msg) ||
    /gone/i.test(msg) ||
    msg.includes("unexpected response")
  );
}
