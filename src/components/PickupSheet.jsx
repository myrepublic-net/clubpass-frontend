import { useEffect, useState } from "react";

/**
 * Details for one pick-up stop, as a bottom sheet.
 *
 * Only pick-ups get this: a member needs to know exactly where to stand at 1am,
 * whereas a drop-off is an MRT station they already know.
 */
export default function PickupSheet({ pickup, onClose }) {
  // A stop with no photo yet shouldn't leave a broken image in the sheet.
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [pickup?.id]);

  useEffect(() => {
    if (!pickup) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickup, onClose]);

  if (!pickup) return null;

  return (
    <div className="cmd-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="cmd-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${pickup.name} pick-up details`}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="cmd-sheet-grip" aria-hidden="true" />

        {pickup.photo && !photoFailed ? (
          <img
            className="cmd-sheet-photo"
            src={pickup.photo}
            alt={`The pick-up point at ${pickup.name}`}
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <div className="cmd-sheet-photo cmd-sheet-photo--none" aria-hidden="true" />
        )}

        <div className="cmd-sheet-body">
          <div className="cmd-sheet-head">
            <h3>{pickup.name}</h3>
            <span className="cmd-time">{pickup.time}</span>
          </div>

          <p>{pickup.instructions}</p>

          {pickup.mapUrl && (
            <a
              className="cmd-btn cmd-btn-quiet"
              href={pickup.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Maps
            </a>
          )}

          <button type="button" className="cmd-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
