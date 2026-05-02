import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

export function PollingMapClient() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     // Simulate loading delay to prevent blocking initial render
     const timer = setTimeout(() => {
          setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
  }, []);

  if (loading) {
     return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-muted">
           <div className="absolute inset-0 grid place-items-center bg-muted/60 text-sm text-muted-foreground">
             <div className="flex items-center gap-2">
               <MapPin className="h-4 w-4" />
               Loading map…
             </div>
           </div>
        </div>
      );
  }

  // Default to New Delhi
  const center: L.LatLngTuple = [28.6139, 77.209];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl z-0">
         <MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
             className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={center}>
                <Popup>
                    Sample polling area
                </Popup>
            </Marker>
            <LocationMarker />
          </MapContainer>
    </div>
  );
}
