/**
 * @module api/maps
 * Securely provides the Google Maps API key to the client.
 * The key is stored in the environment and never hardcoded in frontend bundles.
 * Restrict the key by HTTP referrer in the Google Cloud Console.
 */
import { createServerFn } from "@tanstack/react-start";

/**
 * Server function that returns the Google Maps JS API key.
 * Called by `PollingMapClient` to initialize the Maps SDK at runtime.
 */
export const getMapsKey = createServerFn({ method: "GET" }).handler(async () => {
  // Frontend-loaded JS Maps key. Restrict by HTTP referrer in Google Cloud Console.
  return { key: process.env.GOOGLE_MAPS_API_KEY ?? "" };
});
