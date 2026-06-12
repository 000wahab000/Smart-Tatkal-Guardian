import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Restrict map panning to India boundaries
const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [5.0, 65.0],  // South-West
  [38.0, 100.0] // North-East
];

export interface MapDot {
  id: string;
  latlng: [number, number];
  city: string;
  isBot: boolean;
  userId: string;
  action: string;
  score: number;
  timestamp: Date;
}

interface IndiaMapProps {
  dots: MapDot[];
  center?: [number, number];
  zoom?: number;
}

export default function IndiaMap({ dots, center = [22.5, 82.5], zoom = 4.8 }: IndiaMapProps) {
  return (
    <div className="w-full h-full bg-card rounded-xl overflow-hidden relative border border-border">
      {/* Dynamic CSS styles for dark tile filter and pulsed threat markers */}
      <style>{`
        /* Apply CSS filters to invert OpenStreetMap tiles and create a beautiful cyber dark theme */
        .leaflet-container {
          background: #0d1117 !important;
        }
        .dark-leaflet-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(0.75) contrast(1.15) !important;
        }

        /* Pulsing bot threat marker animation (CSS stroke expansion) */
        .pulsing-bot-dot {
          animation: map-pulse 1.4s infinite ease-out;
          stroke: #ef4444;
          transform-origin: center;
        }
        @keyframes map-pulse {
          0% {
            stroke-width: 2px;
            stroke-opacity: 0.9;
          }
          100% {
            stroke-width: 20px;
            stroke-opacity: 0;
          }
        }

        /* Solid human booking marker styling */
        .solid-human-dot {
          stroke: #10b981;
          stroke-width: 1.5px;
          stroke-opacity: 0.8;
        }

        /* Popup wrapper styling overrides for seamless dashboard dark mode theme integration */
        .leaflet-popup-content-wrapper {
          background: #161b22 !important;
          color: #f0f6fc !important;
          border: 1px solid #30363d !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          font-family: inherit;
        }
        .leaflet-popup-tip {
          background: #161b22 !important;
          border: 1px solid #30363d !important;
        }
        .leaflet-popup-close-button {
          color: #8b949e !important;
        }
        .leaflet-popup-close-button:hover {
          color: #f0f6fc !important;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={4}
        maxZoom={7}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false} // Clean look without Zoom controls
        attributionControl={false} // Hidden attribution for premium minimal SOC aesthetic
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-leaflet-tiles"
        />

        {dots.map((dot) => (
          <CircleMarker
            key={dot.id}
            center={dot.latlng}
            radius={dot.isBot ? 8 : 5}
            pathOptions={{
              color: dot.isBot ? "#ef4444" : "#10b981",
              fillColor: dot.isBot ? "#ef4444" : "#10b981",
              fillOpacity: dot.isBot ? 0.85 : 0.6,
              className: dot.isBot ? "pulsing-bot-dot" : "solid-human-dot"
            }}
            eventHandlers={{
              mouseover: (e) => {
                e.target.openPopup();
              },
              mouseout: (e) => {
                e.target.closePopup();
              }
            }}
          >
            <Popup>
              <div className="text-[11px] font-mono leading-relaxed p-0.5">
                <div className="font-bold border-b border-border pb-1 mb-1 text-foreground flex items-center gap-1.5">
                  <span>{dot.isBot ? "🚨 Bot Alert" : "✅ Pass Booking"}</span>
                  <span className="ml-auto opacity-75">{dot.city}</span>
                </div>
                <div><strong>User ID:</strong> {dot.userId}</div>
                <div><strong>Action:</strong> <span className={dot.isBot ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{dot.action}</span></div>
                <div><strong>Score:</strong> <span className={dot.score > 70 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{dot.score}%</span></div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
