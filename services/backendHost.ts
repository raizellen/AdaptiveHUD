// Works out which machine the HUD should connect to for the backend.
//
// In development, Expo knows the address the phone used to reach the dev
// server (`Constants.expoConfig.hostUri`, e.g. "192.168.1.5:8081"). The
// backend runs on that same machine, so the app can find it without a
// hand-edited IP. Kept free of Expo imports so it can be tested alone.

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

// "192.168.1.5:8081" -> "192.168.1.5". Returns null for anything that
// isn't a plain IPv4 address or "localhost", such as a tunnel address,
// which the backend can't be reached through.
export function hostFromHostUri(
  hostUri: string | null | undefined
): string | null {
  if (!hostUri) return null;

  const host = hostUri
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "") // drop a scheme if present
    .split(/[/?#]/)[0] // drop any path
    .replace(/:\d+$/, ""); // drop the port

  return host === "localhost" || IPV4.test(host) ? host : null;
}

// The manual setting is optional now. Ignore it when it's empty or still
// the placeholder text from .env.example.
function cleanManualIp(value: string | null | undefined): string | null {
  const ip = value?.trim();
  if (!ip || ip.includes("<")) return null;
  return ip;
}

export interface BackendHostSources {
  // Constants.expoConfig?.hostUri
  hostUri?: string | null;
  // process.env.EXPO_PUBLIC_BACKEND_IP
  manualIp?: string | null;
  // window.location.hostname, when running in a browser
  webHostname?: string | null;
}

// Order of preference:
//   1. the dev server's address, so a stale IP in .env can't break things
//   2. EXPO_PUBLIC_BACKEND_IP, for cases where 1 isn't available
//      (e.g. Expo's tunnel mode)
//   3. the page's own host, when running in a browser
//   4. localhost
export function resolveBackendHost({
  hostUri,
  manualIp,
  webHostname,
}: BackendHostSources): string {
  return (
    hostFromHostUri(hostUri) ??
    cleanManualIp(manualIp) ??
    (webHostname || null) ??
    "localhost"
  );
}