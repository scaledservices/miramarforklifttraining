import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "wouter";
import { Building2, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAllLocations } from "@shared/config/locations";

// --- Fix default marker icons (webpack/vite breaks them) ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// --- Custom div-icons for brand pins ---

const facilityIcon = L.divIcon({
  className: "miramar-facility-pin",
  html: `<div style="
    width:32px;height:32px;border-radius:50% 50% 50% 0;
    background:#FFC326;border:2px solid #4f3b3b;
    transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,.3);
  "><span style="transform:rotate(45deg);font-size:16px;">🏭</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

function companyIcon(hasRequests: boolean) {
  const bg = hasRequests ? "#019E7C" : "#6b7280";
  return L.divIcon({
    className: "miramar-company-pin",
    html: `<div style="
      width:24px;height:24px;border-radius:50% 50% 50% 0;
      background:${bg};border:2px solid #fff;
      transform:rotate(-45deg);
      box-shadow:0 1px 4px rgba(0,0,0,.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -20],
  });
}

// --- Approx lat/lng for known cities (avoids geocoding API dependency) ---
const CITY_COORDS: Record<string, [number, number]> = {
  "san diego": [32.7157, -117.1611],
  "las vegas": [36.1699, -115.1398],
  fresno: [36.7378, -119.7871],
  "los angeles": [34.0522, -118.2437],
  "san francisco": [37.7749, -122.4194],
  sacramento: [38.5816, -121.4944],
  "long beach": [33.7701, -118.1937],
  anaheim: [33.8366, -117.9143],
  "santa ana": [33.7455, -117.8677],
  irvine: [33.6846, -117.8265],
  chula: [32.6401, -117.0842],
  "chula vista": [32.6401, -117.0842],
  escondido: [33.1192, -117.0864],
  oceanside: [33.1959, -117.3795],
  "carlsbad": [33.1581, -117.3506],
  "el cajon": [32.7948, -116.9625],
  vista: [33.2001, -117.2425],
  "san marcos": [33.1434, -117.1661],
  "national city": [32.6781, -117.0992],
  "la mesa": [32.7678, -117.0231],
  "spring valley": [32.7446, -116.9814],
  temecula: [33.4936, -117.1484],
  murrieta: [33.5539, -117.2139],
  corona: [33.8753, -117.5664],
  riverside: [33.9533, -117.3962],
  "san bernardino": [34.1083, -117.2898],
  "fontana": [34.0922, -117.4351],
  "rancho cucamonga": [34.1064, -117.5931],
  "ontario": [34.0634, -117.6516],
  henderson: [36.0395, -114.9817],
  "north las vegas": [36.1989, -115.1175],
  boulder: [35.9788, -114.8485],
  "henderson nv": [36.0395, -114.9817],
};

function coordFor(city?: string | null, state?: string | null): [number, number] | null {
  if (!city) return null;
  const key = city.toLowerCase().trim();
  // Direct match
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // Try partial match
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

export interface MapCompany {
  id: number;
  name: string;
  billingCity: string | null;
  billingState: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  requestCount: number;
}

export interface MapViewProps {
  companies: MapCompany[];
  height?: number;
  showServiceAreas?: boolean;
  /** In km, how big the service area circle is */
  serviceAreaRadius?: number;
}

export default function MapView({
  companies,
  height = 400,
  showServiceAreas = true,
  serviceAreaRadius = 80,
}: MapViewProps) {
  const { t } = useTranslation();
  const facilities = getAllLocations().filter((l) => l.active);

  // Facility coordinates
  const facilityCoords: { slug: string; name: string; coord: [number, number]; address: string }[] = facilities.map((f) => ({
    slug: f.slug,
    name: `${f.city}, ${f.state}`,
    coord: CITY_COORDS[f.city.toLowerCase()] ?? [36.0, -117.0],
    address: f.address.full,
  }));

  // Company coordinates (approximate from city)
  const companyPins = useMemo(() => {
    return companies
      .map((c) => ({
        ...c,
        coord: coordFor(c.billingCity, c.billingState),
      }))
      .filter((c) => c.coord !== null) as (MapCompany & { coord: [number, number] })[];
  }, [companies]);

  // Default center: midpoint of all facility coords
  const center: [number, number] = facilityCoords.length > 0
    ? [
        facilityCoords.reduce((s, f) => s + f.coord[0], 0) / facilityCoords.length,
        facilityCoords.reduce((s, f) => s + f.coord[1], 0) / facilityCoords.length,
      ]
    : [34.0, -117.0];

  // Ensure leaflet CSS is loaded (for vite)
  useEffect(() => {
    // Force leaflet to recalc panes if map was hidden
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 200);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border" style={{ height }} data-testid="crm-map-view">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Training facility markers */}
        {facilityCoords.map((f) => (
          <Marker key={f.slug} position={f.coord} icon={facilityIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-bold text-sm">🏭 {t("adminUx.mapFacility", { defaultValue: "Training Facility" })}</p>
                <p className="text-sm">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Service area circles */}
        {showServiceAreas && facilityCoords.map((f) => (
          <Circle
            key={`area-${f.slug}`}
            center={f.coord}
            radius={serviceAreaRadius * 1000}
            pathOptions={{
              color: "#FFC326",
              fillColor: "#FFC326",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6 6",
            }}
          />
        ))}

        {/* Company markers */}
        {companyPins.map((c) => (
          <Marker
            key={c.id}
            position={c.coord}
            icon={companyIcon(c.requestCount > 0)}
          >
            <Popup>
              <div className="space-y-1 min-w-[180px]">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <p className="font-bold text-sm">{c.name}</p>
                </div>
                {c.billingCity && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {c.billingCity}{c.billingState ? `, ${c.billingState}` : ""}
                  </p>
                )}
                {c.industry && <p className="text-xs">{c.industry}</p>}
                {c.phone && <p className="text-xs">{c.phone}</p>}
                <Link
                  href={`/admin/companies/${c.id}`}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {t("adminUx.mapViewCompany", { defaultValue: "View company →" })}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-xs space-y-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full bg-[#FFC326] border border-[#4f3b3b]" />
          <span className="font-medium">{t("adminUx.mapLegendFacility", { defaultValue: "Training Facility" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#019E7C] border border-white" />
          <span>{t("adminUx.mapLegendActive", { defaultValue: "Active customer" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-500 border border-white" />
          <span>{t("adminUx.mapLegendCompany", { defaultValue: "Company" })}</span>
        </div>
        {showServiceAreas && (
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-dashed border-[#FFC326] bg-[#FFC326]/10" />
            <span>{t("adminUx.mapLegendServiceArea", { defaultValue: "Service area" })}</span>
          </div>
        )}
      </div>

      {/* Stats overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-xs space-y-1 pointer-events-none">
        <p className="font-bold text-sm">{t("adminUx.mapTitle", { defaultValue: "Customer Map" })}</p>
        <p className="text-muted-foreground">
          {companyPins.length} {t("adminUx.mapCompanies", { defaultValue: "companies" })} · {facilityCoords.length} {t("adminUx.mapFacilities", { defaultValue: "facilities" })}
        </p>
        {companyPins.length === 0 && (
          <p className="text-muted-foreground text-[11px] max-w-[200px]">
            {t("adminUx.mapNoGeocoded", { defaultValue: "Companies without a city in their address won't appear on the map." })}
          </p>
        )}
      </div>
    </div>
  );
}
