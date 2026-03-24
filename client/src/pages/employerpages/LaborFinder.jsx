import { useState, useEffect, useRef } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
import HireButton from "../../components/HireComponent/HireButton";
const API_URL = import.meta.env.VITE_API_URL;
const AZURE_MAPS_KEY = import.meta.env.VITE_AZURE_MAPS_KEY;

export default function LaborFinder() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [employerCoords, setEmployerCoords] = useState(null);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [searched, setSearched] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [wallet, setWallet] = useState(0);
  useEffect(() => {
    if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading]);

  useEffect(() => {
    if (!profile?.location?.latitude || !profile?.location?.longitude) return;
    setEmployerCoords({
      lat: profile.location.latitude,
      lng: profile.location.longitude,
    });
  }, [profile]);
  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/wallet/${profile.id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setWallet(data);
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    }
  };

  // Initialize map
  useEffect(() => {
    fetchWallet();
    let script = null;

    const initializeMap = () => {
      try {
        const mapInstance = new atlas.Map("finderMap", {
          center: [120.8818, 14.3867],
          zoom: 13,
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

  // Draw pins + radius circle
  useEffect(() => {
    if (!map || !employerCoords) return;

    ["radiusLayer", "radiusBorderLayer", "employerLayer", "laborLayer"].forEach((id) => {
      if (map.layers.getLayerById(id)) map.layers.remove(id);
    });
    ["radiusSource", "employerSource", "laborSource"].forEach((id) => {
      if (map.sources.getById(id)) map.sources.remove(id);
    });

    // Radius circle
    const radiusPoints = atlas.math.getRegularPolygonPath(
      [employerCoords.lng, employerCoords.lat],
      512, 360, "meters"
    );
    const radiusSource = new atlas.source.DataSource("radiusSource");
    map.sources.add(radiusSource);
    radiusSource.add(new atlas.data.Feature(new atlas.data.Polygon([radiusPoints])));
    map.layers.add(new atlas.layer.PolygonLayer(radiusSource, "radiusLayer", {
      fillColor: "rgba(59, 130, 246, 0.08)",
    }), "labels");
    map.layers.add(new atlas.layer.LineLayer(radiusSource, "radiusBorderLayer", {
      strokeColor: "rgba(59, 130, 246, 0.6)",
      strokeWidth: 1.5,
      strokeDashArray: [4, 4],
    }), "labels");

    // Employer pin (blue)
    const employerSource = new atlas.source.DataSource("employerSource");
    map.sources.add(employerSource);
    employerSource.add(new atlas.data.Feature(
      new atlas.data.Point([employerCoords.lng, employerCoords.lat])
    ));
    map.layers.add(new atlas.layer.SymbolLayer(employerSource, "employerLayer", {
      iconOptions: { image: "pin-blue", anchor: "bottom", allowOverlap: true, size: 1.4 },
    }));

    // Labor pins (green bubbles)
    if (workers.length > 0) {
      const laborSource = new atlas.source.DataSource("laborSource");
      map.sources.add(laborSource);
      workers.forEach((w) => {
        laborSource.add(new atlas.data.Feature(
          new atlas.data.Point([w.longitude, w.latitude]),
          { name: `${w.firstName} ${w.lastName}`, jobTitle: w.jobTitle, distance: w.distanceKm.toFixed(2) }
        ));
      });

      const laborLayer = new atlas.layer.BubbleLayer(laborSource, "laborLayer", {
        color: "#22c55e", radius: 10, strokeColor: "#ffffff", strokeWidth: 2,
      });
      map.layers.add(laborLayer);

      const popup = new atlas.Popup({ pixelOffset: [0, -10], closeButton: true });

      map.events.add("click", laborLayer, (e) => {
        if (!e.shapes || e.shapes.length === 0) return;
        const props = e.shapes[0].getProperties();
        const coords = e.shapes[0].getCoordinates();
        popup.setOptions({
          position: coords,
          content: `
            <div style="padding: 10px 14px; font-family: monospace; min-width: 160px;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #111;">
                ${props.name}
              </p>
              <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280;">
                ${props.jobTitle || "No job title"}
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                ${props.distance} km away
              </p>
            </div>
          `,
        });
        popup.open(map);
      });

      map.events.add("mousemove", laborLayer, () => {
        map.getCanvasContainer().style.cursor = "pointer";
      });
      map.events.add("mouseleave", laborLayer, () => {
        map.getCanvasContainer().style.cursor = "";
      });
    }

    // Fit camera
    const positions = [[employerCoords.lng, employerCoords.lat]];
    if (workers.length > 0) workers.forEach((w) => positions.push([w.longitude, w.latitude]));

    if (positions.length === 1) {
      map.setCamera({ center: [employerCoords.lng, employerCoords.lat], zoom: 14, type: "ease", duration: 800 });
    } else {
      const bbox = atlas.data.BoundingBox.fromPositions(positions);
      map.setCamera({ bounds: bbox, padding: 80, type: "ease", duration: 800 });
    }
  }, [map, workers, employerCoords]);

  const handleSearch = async () => {
    setError(null);
    setLoadingWorkers(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (jobTitle.trim()) params.append("jobTitle", jobTitle.trim());

      const res = await fetch(`${API_URL}/employer/nearby-labors?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setWorkers(data);
    } catch (err) {
      setError(err.message);
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleMessage = (w) => {
    const receiver = w.username ||
      [w.firstName, w.lastName].filter(Boolean).join("").toLowerCase();
    navigate("/employer/message", { state: { receiver } });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  if (profileLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="font-mono text-xs text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <Navbar userRole={profile.userRole} />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-mono tracking-wide transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-gray-900 text-white"
        }`}>
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Employer
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Laborer Finder
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Find up to 5 available workers within 500 m of your location.
          </p>
        </div>
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
              Queue
            </p>
            <h1 className="text-2xl font-light tracking-tight text-gray-900">
              Nearby Work
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Let employers discover you based on your location.
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-1">
              Token Balance
            </p>
            <p className="text-2xl font-light text-gray-900">
              {wallet?.balance ?? 0}
              <span className="text-xs text-gray-400 ml-1 font-mono">tokens</span>
            </p>
          </div>
        </div>


        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Filter by job title (e.g. Electrician)"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-gray-400 text-gray-800 placeholder-gray-300 transition-colors bg-white"
          />
          <button
            onClick={handleSearch}
            disabled={loadingWorkers}
            className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer whitespace-nowrap"
          >
            {loadingWorkers ? "Searching…" : "Search Nearby →"}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400">You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400">Available Labor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-px border-t-2 border-dashed border-blue-400 inline-block" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400">500 m radius</span>
          </div>
        </div>

        {error && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-mono">
          <div className="flex items-center gap-2.5">
            <span>✕</span> {error}
          </div>
          {error.toLowerCase().includes("token") && (
            <button
              onClick={() => navigate("/employer/topup")}
              className="ml-4 font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Top Up →
            </button>
          )}
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-gray-100 h-[420px]">
            <div id="finderMap" className="w-full h-full" />
          </div>

          {/* Worker list */}
          <div className="flex flex-col gap-3">
            {!searched ? (
              <div className="border border-gray-100 rounded-xl px-5 py-6 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">Press "Search Nearby" to find workers.</p>
                <p className="font-mono text-xs text-gray-400 mt-1">
                  Results will appear here based on your location.
                </p>
              </div>
            ) : loadingWorkers ? (
              <p className="font-mono text-xs text-gray-400 animate-pulse">Searching nearby workers…</p>
            ) : workers.length === 0 ? (
              jobTitle.trim() ? null : (
                <div className="border border-gray-100 rounded-xl px-5 py-6 bg-gray-50 text-center">
                  <p className="text-sm text-gray-500">No available workers nearby.</p>
                  <p className="font-mono text-xs text-gray-400 mt-1">Try again later or expand your search area.</p>
                </div>
              )
            ) : (
              workers.map((w) => (
                <div key={w.userId} className="border border-gray-100 rounded-xl px-5 py-4 bg-gray-50 flex items-center justify-between hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-mono text-xs text-green-600 font-medium shrink-0">
                      {w.firstName?.[0]}{w.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{w.firstName} {w.lastName}</p>
                      <p className="font-mono text-xs text-gray-400 mb-1.5">{w.jobTitle || "No job title"}</p>
                      <HireButton
                        employerId={profile.id}
                        worker={w}
                        onSuccess={(msg) => {
                          setToast({ type: "success", message: msg });
                          setTimeout(() => setToast(null), 3000);
                        }}
                        onError={(msg) => {
                          setToast({ type: "error", message: msg });
                          setTimeout(() => setToast(null), 4000);
                        }}
                      />
                      <button
                        onClick={() => handleMessage(w)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-gray-600 border border-gray-200 rounded-full hover:border-gray-400 hover:text-gray-900 transition-colors bg-white cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Message
                      </button>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] tracking-wider text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-lg shrink-0">
                    {w.distanceKm.toFixed(2)} km
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}