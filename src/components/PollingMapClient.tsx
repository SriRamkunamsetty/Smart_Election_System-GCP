/**
 * @module PollingMapClient
 * Google Maps integration for the "Find your booth" feature.
 * Uses the `@googlemaps/js-api-loader` to load the Maps JS SDK at runtime
 * with the API key served from the secure server function `getMapsKey()`.
 *
 * Features:
 *  - Geolocation via the browser's native API to center the map on the user.
 *  - Custom markers for the user's location and a sample polling booth.
 *  - Graceful fallback to New Delhi if geolocation is denied or unavailable.
 */
import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";
import { getMapsKey } from "@/api/maps.functions";

/** Default center: New Delhi, India */
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const DEFAULT_ZOOM = 13;

/**
 * PollingMapClient — renders an interactive Google Map centered on the user's
 * location (or New Delhi as fallback) with a sample polling booth marker.
 */
export function PollingMapClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Fetch the API key securely from the server
        const { key } = await getMapsKey();
        if (!key) {
          setErrorMsg("Google Maps API key is not configured.");
          setStatus("error");
          return;
        }
        if (cancelled) return;

        // Configure the loader with the API key
        setOptions({
          apiKey: key,
          version: "weekly",
        });

        // Load Google Maps SDK libraries
        const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = (await importLibrary(
          "marker",
        )) as google.maps.MarkerLibrary;

        if (cancelled || !containerRef.current) return;

        // Create the map
        const map = new Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          mapId: "voting-oracle-map",
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
          gestureHandling: "cooperative",
        });
        mapRef.current = map;

        // Add a sample polling booth marker at the default center
        new AdvancedMarkerElement({
          position: DEFAULT_CENTER,
          map,
          title: "Sample polling booth",
        });

        setStatus("ready");

        // Try to get user's real location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              const userPos = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              map.panTo(userPos);
              map.setZoom(14);

              // Add user location marker
              new AdvancedMarkerElement({
                position: userPos,
                map,
                title: "You are here",
              });
            },
            () => {
              // Geolocation denied or unavailable — keep the default center
            },
            { enableHighAccuracy: false, timeout: 8000 },
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[PollingMapClient] Failed to load Google Maps:", err);
          setErrorMsg("Could not load Google Maps.");
          setStatus("error");
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "error") {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-muted">
        <div className="absolute inset-0 grid place-items-center bg-muted/60 text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <MapPin className="h-5 w-5 opacity-60" />
            <span>{errorMsg || "Map unavailable"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-muted/60 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 animate-pulse" />
            Loading Google Maps…
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="Interactive Google Map showing your polling booth location"
        role="application"
      />
    </div>
  );
}
