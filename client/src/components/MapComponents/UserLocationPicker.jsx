import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const AZURE_MAPS_KEY = import.meta.env.VITE_AZURE_MAPS_KEY;

export default function LocationPicker({ userId, onSave, onCancel }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [coords, setCoords] = useState(null);
  const [isExisting, setIsExisting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch existing location on mount
  useEffect(() => {
    if (!userId) return;
    const fetchExisting = async () => {
      try {
        const res = await fetch(`${API_URL}/user-location/${userId}`, {
          credentials: "include",
        });
        if (res.status === 404) return;
        if (!res.ok) throw new Error("Failed to fetch location.");
        const data = await res.json();
        if (data?.latitude && data?.longitude) {
          setCoords({ lat: data.latitude, lng: data.longitude });
          setIsExisting(true);
        }
      } catch (err) {
        console.warn("Could not fetch existing location:", err.message);
      }
    };
    fetchExisting();
  }, [userId]);

  // Load Azure Maps
  useEffect(() => {
    let script = null;

    const initializeMap = () => {
      try {
        const defaultCenter = coords
          ? [coords.lng, coords.lat]
          : [120.8818, 14.3867];
        const mapInstance = new atlas.Map("locationMap", {
          center: defaultCenter,
          zoom: coords ? 15 : 12,
          authOptions: {
            authType: "subscriptionKey",
            subscriptionKey: AZURE_MAPS_KEY,
          },
          view: "Auto",
          style: "road",
          showLogo: false,
          showFeedbackLink: false,
        });

        mapInstance.events.add("ready", () => {
          mapRef.current = mapInstance;
          setMap(mapInstance);

          mapInstance.events.add("click", (e) => {
            if (!e.position) return;
            setCoords({ lat: e.position[1], lng: e.position[0] });
            setIsExisting(false);
          });
        });

        mapInstance.events.add("error", () => {
          setError("Failed to load map.");
        });
      } catch {
        setError("Failed to initialize map.");
      }
    };

    if (typeof atlas !== "undefined") {
      initializeMap();
    } else {
      script = document.createElement("script");
      script.src =
        "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js";
      script.async = true;
      script.onload = initializeMap;
      script.onerror = () => setError("Failed to load map resources.");
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
      if (script?.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Update pin when coords change
  useEffect(() => {
    if (!map || !coords) return;

    const oldLayer = map.layers.getLayerById("pinLayer");
    const oldSource = map.sources.getById("pinSource");
    if (oldLayer) map.layers.remove(oldLayer);
    if (oldSource) map.sources.remove(oldSource);

    const source = new atlas.source.DataSource("pinSource");
    map.sources.add(source);

    source.add(
      new atlas.data.Feature(
        new atlas.data.Point([coords.lng, coords.lat])
      )
    );

    map.layers.add(
      new atlas.layer.SymbolLayer(source, "pinLayer", {
        iconOptions: {
          image: "pin-blue",
          anchor: "bottom",
          allowOverlap: true,
          size: 1.2,
        },
      })
    );

    map.setCamera({
      center: [coords.lng, coords.lat],
      zoom: 14,
      type: "ease",
      duration: 800,
    });
  }, [map, coords]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter an address.");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await fetch(
        `https://atlas.microsoft.com/search/address/json?api-version=1.0&query=${encodeURIComponent(
          searchQuery
        )}&subscription-key=${AZURE_MAPS_KEY}`
      );
      const data = await res.json();
      const result = data.results?.[0];
      if (!result) throw new Error("Address not found.");

      const { lat, lon } = result.position;
      setCoords({ lat, lng: lon });
      if (map) map.setCamera({ center: [lon, lat], zoom: 16, duration: 800 });
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSave = async () => {
    if (!coords) {
      setError("Please drop a pin on the map first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/user-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      });
      if (!res.ok) throw new Error("Failed to save location.");
      const saved = await res.json();
      onSave?.(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-900">
              {isExisting ? "Update Location" : "Set Your Location"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              Search an address or click on the map to drop a pin
            </p>
          </div>
          {isExisting && (
            <span className="font-mono text-[10px] tracking-widest uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded">
              Already set
            </span>
          )}
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search address…"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 text-gray-700 placeholder-gray-400 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="text-sm font-mono text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors cursor-pointer border-none whitespace-nowrap"
          >
            {searchLoading ? "Searching…" : "Search →"}
          </button>
        </div>

        {searchError && (
          <p className="px-5 pt-2 text-xs text-red-500">{searchError}</p>
        )}

        {/* Map */}
        <div className="relative h-72 w-full overflow-hidden">
          <div className="h-72 w-full" id="locationMap" />
          <style>{`
            #locationMap + div,
            #locationMap ~ div:not([class]),
            .azure-maps-attribution {
              display: none !important;
            }
          `}</style>
        </div>

        {error && (
          <p className="px-5 py-2 text-xs text-red-500">{error}</p>
        )}

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 hover:text-gray-900 transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !coords}
            className="text-sm font-mono text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 px-4 py-2 rounded-lg transition-colors border-none cursor-pointer"
          >
            {saving ? "Saving…" : isExisting ? "Update Location →" : "Save Location →"}
          </button>
        </div>

      </div>
    </div>
  );
}