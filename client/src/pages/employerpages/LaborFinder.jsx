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

  // Draw pins + radius circles
  useEffect(() => {
    if (!map || !employerCoords) return;

   [
    ...(profile?.upgraded ? [] : ["radiusLayer", "radiusBorderLayer"]),
    "grayRadiusLayer", "grayRadiusBorderLayer",
    "employerLayer", "laborLayer",
  ].forEach((id) => {
    if (map.layers.getLayerById(id)) map.layers.remove(id);
  });
  [
    ...(profile?.upgraded ? [] : ["radiusSource"]),
    "grayRadiusSource", "employerSource", "laborSource",
  ].forEach((id) => {
    if (map.sources.getById(id)) map.sources.remove(id);
  });

    if (!profile?.upgraded) {
    const radiusPoints = atlas.math.getRegularPolygonPath(
      [employerCoords.lng, employerCoords.lat],
      500, 360, "meters"
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
  }

    // Gray circle — 1024m search zone
    const grayRadiusPoints = atlas.math.getRegularPolygonPath(
      [employerCoords.lng, employerCoords.lat],
      1024, 360, "meters"
    );
    const grayRadiusSource = new atlas.source.DataSource("grayRadiusSource");
    map.sources.add(grayRadiusSource);
    grayRadiusSource.add(new atlas.data.Feature(new atlas.data.Polygon([grayRadiusPoints])));
    map.layers.add(new atlas.layer.PolygonLayer(grayRadiusSource, "grayRadiusLayer", {
      fillColor: "rgba(156, 163, 175, 0.08)",
    }), "labels");
    map.layers.add(new atlas.layer.LineLayer(grayRadiusSource, "grayRadiusBorderLayer", {
      strokeColor: "rgba(156, 163, 175, 0.6)",
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

    // Labor pins
    if (workers.length > 0) {
      const laborSource = new atlas.source.DataSource("laborSource");
      map.sources.add(laborSource);
      workers.forEach((w) => {
        laborSource.add(new atlas.data.Feature(
          new atlas.data.Point([w.longitude, w.latitude]),
          {
            name: w.hireStatus === "LOCKED" ? "——— ———" : `${w.firstName} ${w.lastName}`,
            jobTitle: w.jobTitle,
            distance: w.distanceKm.toFixed(2),
            hirable: w.hirable,
          }
        ));
      });

      const laborLayer = new atlas.layer.BubbleLayer(laborSource, "laborLayer", {
        color: ["case", ["get", "hirable"], "#22c55e", "#9ca3af"],
        radius: 10,
        strokeColor: "#ffffff",
        strokeWidth: 2,
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
              <p style="margin: 0 0 4px; font-size: 11px; color: #9ca3af;">
                ${props.distance} km away
              </p>
              <p style="margin: 0; font-size: 11px; color: ${props.hirable ? "#22c55e" : "#9ca3af"};">
                ${props.hirable ? "✓ Hirable" : "✕ Out of hire range"}
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
      <Navbar userRole={profile?.userRole} verified={profile?.verified} />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-mono tracking-wide transition-all ${
          toast.type === "error"
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-gray-900 text-white"
        }`}>
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
              Employer
            </p>
            <h1 className="text-2xl font-light tracking-tight text-gray-900">
              Laborer Finder
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Find available workers within 500 m. Workers up to 1024 m are shown but not hirable.
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
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400">You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400">Hirable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400">Out of range</span>
          </div>
          {!profile?.upgraded && (
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-px border-t-2 border-dashed border-blue-400 inline-block" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400">500 m</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-px border-t-2 border-dashed border-gray-400 inline-block" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-400">1024 m</span>
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
              <div className="border border-gray-100 rounded-xl px-5 py-6 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">No available workers nearby.</p>
                <p className="font-mono text-xs text-gray-400 mt-1">Try again later or expand your search area.</p>
              </div>
            ) : (
              workers.map((w) =>
                w.hireStatus === "LOCKED" ? (
                  // ── LOCKED card ───────────────────────────────────────────
                  <div
                    key={`${w.latitude}-${w.longitude}`}
                    className="border border-dashed border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between bg-gray-50/50 opacity-70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-gray-300 text-sm">🔒</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-400">——— ———</p>
                        <p className="font-mono text-xs text-gray-400">{w.jobTitle || "No job title"}</p>
                        <div className="flex items-center gap-1 my-1">
                          {w.averageStars != null ? (
                            <>
                              <span className="text-amber-400 text-xs">
                                {"★".repeat(Math.round(w.averageStars))}
                                {"☆".repeat(5 - Math.round(w.averageStars))}
                              </span>
                              <span className="font-mono text-[10px] text-gray-400">
                                {w.averageStars.toFixed(1)} ({w.totalRatings})
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-[10px] text-gray-300">No ratings yet</span>
                          )}
                        </div>
                        {!profile?.upgraded ? (
                          <button onClick={() => navigate("/employer/upgrade")}
                            className="font-mono text-[10px] tracking-wider text-blue-500 hover:text-blue-700 mt-1 block transition-colors">
                            Upgrade to unlock →
                          </button>
                        ) : (
                          <span className="font-mono text-[10px] text-gray-400 mt-1 block">
                            Out of hire range
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-gray-300 bg-white border border-gray-100 px-2 py-1 rounded-lg shrink-0">
                      {w.distanceKm.toFixed(2)} km
                    </span>
                  </div>
                ) : (
                  // ── HIRABLE card ──────────────────────────────────────────
                  <div
                    key={w.userId}
                    className="border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-mono text-xs font-medium shrink-0">
                        {w.firstName?.[0]}{w.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{w.firstName} {w.lastName}</p>
                        <p className="font-mono text-xs text-gray-400">{w.jobTitle || "No job title"}</p>
                        <div className="flex items-center gap-1 my-1">
                          {w.averageStars != null ? (
                            <>
                              <span className="text-amber-400 text-xs">
                                {"★".repeat(Math.round(w.averageStars))}
                                {"☆".repeat(5 - Math.round(w.averageStars))}
                              </span>
                              <span className="font-mono text-[10px] text-gray-400">
                                {w.averageStars.toFixed(1)} ({w.totalRatings})
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-[10px] text-gray-300">No ratings yet</span>
                          )}
                        </div>
                        <HireButton
                          employerId={profile.id}
                          worker={w}
                          walletBalance={wallet?.balance ?? 0}
                          onSuccess={(msg) => {
                            setToast({ type: "success", message: msg });
                            setTimeout(() => setToast(null), 3000);
                          }}
                          onError={(msg) => {
                            setToast({ type: "error", message: msg });
                            setTimeout(() => setToast(null), 4000);
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-lg shrink-0">
                      {w.distanceKm.toFixed(2)} km
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}