"use client";

import { useEffect, useRef } from "react";

interface LiveMapProps {
  deliveryLat: number;
  deliveryLng: number;
  customerLat?: number;
  customerLng?: number;
  height?: string;
}

export default function LiveMap({ deliveryLat, deliveryLng, customerLat, customerLng, height = "220px" }: LiveMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;
      if (mapInstanceRef.current) {
        // Just update marker positions
        if (deliveryMarkerRef.current) {
          deliveryMarkerRef.current.setLatLng([deliveryLat, deliveryLng]);
        }
        mapInstanceRef.current.setView([deliveryLat, deliveryLng], 14);
        return;
      }

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([deliveryLat, deliveryLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Delivery person marker (orange scooter icon)
      const deliveryIcon = L.divIcon({
        html: `<div style="background:#e87a1e;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🛵</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: "",
      });

      const dMarker = L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon }).addTo(map);
      dMarker.bindPopup("<b>Delivery Partner</b><br>On the way to you!").openPopup();
      deliveryMarkerRef.current = dMarker;

      // Customer marker
      if (customerLat && customerLng) {
        const customerIcon = L.divIcon({
          html: `<div style="background:#16a34a;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">📍</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          className: "",
        });
        const cMarker = L.marker([customerLat, customerLng], { icon: customerIcon }).addTo(map);
        cMarker.bindPopup("<b>Your Location</b>");
        customerMarkerRef.current = cMarker;

        // Fit map to show both markers
        const bounds = L.latLngBounds([deliveryLat, deliveryLng], [customerLat, customerLng]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    };

    initMap();
  }, [deliveryLat, deliveryLng]);

  // Update delivery marker when coords change
  useEffect(() => {
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLatLng([deliveryLat, deliveryLng]);
    }
  }, [deliveryLat, deliveryLng]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: "12px", zIndex: 0 }}
      className="border border-orange-100"
    />
  );
}
