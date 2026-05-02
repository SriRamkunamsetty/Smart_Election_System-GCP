import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

export function PollingMap() {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    import("./PollingMapClient").then((mod) => {
      if (mounted) {
        setComponent(() => mod.PollingMapClient);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!Component) {
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

  return <Component />;
}
