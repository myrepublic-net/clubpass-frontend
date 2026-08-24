import { useEffect, useState } from "react";

import { ROUTES, fetchPickupPoints } from "../api/driverStop.js";

/**
 * Route and pick-up point, as two dependent dropdowns.
 *
 * The driver picks these once when they get to a stop; the choice is kept in a
 * short-lived cookie so it survives a reload mid-queue but doesn't follow them
 * to the next stop. Changing either one is always available — a driver who
 * moves stop shouldn't have to wait for anything to expire.
 */
export default function StopPicker({ stop, onChange }) {
  const [route, setRoute] = useState(stop?.route ?? "");
  const [points, setPoints] = useState([]);
  const [state, setState] = useState({ status: route ? "loading" : "idle" });

  // Reloading the list on every route change is what keeps the second dropdown
  // honest — a stale list would let a driver pick a stop from another route.
  useEffect(() => {
    if (!route) {
      setPoints([]);
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    fetchPickupPoints(route).then(
      (found) => {
        if (cancelled) return;

        setPoints(found);
        setState({ status: "ready" });

        // A stop remembered from the cookie is only valid if it's still on this
        // route; anything else is cleared rather than silently kept.
        if (stop?.pickupPoint && !found.some((point) => point.name === stop.pickupPoint)) {
          onChange({ route, pickupPoint: "" });
        }
      },
      (error) => {
        console.error("Pick-up points failed to load", error);
        if (!cancelled) setState({ status: "error", message: error.message });
      },
    );

    return () => {
      cancelled = true;
    };
    // stop/onChange deliberately absent: this reacts to the route, and
    // including them would refetch the list on every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const chooseRoute = (value) => {
    setRoute(value);
    // The old pick-up point belongs to the old route.
    onChange({ route: value, pickupPoint: "" });
  };

  const empty = state.status === "ready" && points.length === 0;

  return (
    <div className="drv-stop">
      <label className="drv-field">
        <span>Route</span>
        <select value={route} onChange={(event) => chooseRoute(event.target.value)}>
          <option value="">Select a route</option>
          {ROUTES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="drv-field">
        <span>Pickup point</span>
        <select
          value={stop?.pickupPoint ?? ""}
          disabled={!route || state.status !== "ready" || empty}
          onChange={(event) => onChange({ route, pickupPoint: event.target.value })}
        >
          <option value="">
            {!route
              ? "Select a route first"
              : state.status === "loading"
                ? "Loading…"
                : empty
                  ? "None on this route"
                  : "Select a pickup point"}
          </option>
          {points.map((point) => (
            <option key={point.id} value={point.name}>
              {point.name}
            </option>
          ))}
        </select>
      </label>

      {empty && (
        <p className="drv-error">
          No pick-up points are set up on the {route} route. Please select another route.
        </p>
      )}

      {state.status === "error" && <p className="drv-error">{state.message}</p>}
    </div>
  );
}
