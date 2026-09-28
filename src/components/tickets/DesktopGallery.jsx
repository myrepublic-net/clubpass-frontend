import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

/**
 * The event's banners for the desktop event page: one square slide at a time,
 * centred over a blurred copy of itself that fills the width. Same behaviour
 * as the mobile gallery — native swipe/scroll, arrows, dots, and a play
 * button only on video slides.
 */
export default function DesktopGallery({ media, title }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(null);
  const trackRef = useRef(null);
  const videoRefs = useRef([]);

  if (!media?.length) return null;

  const current = media[active] ?? media[0];
  // The blurred backdrop needs a still; a video slide falls back to the first image.
  const backdrop = current.type === "image" ? current.url : media.find((item) => item.type === "image")?.url;

  const sync = () => {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive((prev) => (prev === index ? prev : index));
  };

  const go = (index) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="evx-gallery">
      {backdrop && (
        <div className="evx-gallery-backdrop" style={{ backgroundImage: `url("${backdrop}")` }} aria-hidden="true" />
      )}

      <div className="evx-gallery-stage">
        <span className="evx-gallery-counter">
          {active + 1}/{media.length}
        </span>

        <div className="evx-gallery-track" ref={trackRef} onScroll={sync}>
          {media.map((item, index) =>
            item.type === "video" ? (
              <video
                key={item.url}
                ref={(node) => { videoRefs.current[index] = node; }}
                className="evx-gallery-slide"
                src={item.url}
                playsInline
                preload="metadata"
                controls={playing === index}
                onPlay={() => setPlaying(index)}
                onPause={() => setPlaying((prev) => (prev === index ? null : prev))}
              />
            ) : (
              <img
                key={item.url}
                className="evx-gallery-slide"
                src={item.url}
                alt={`${title} — photo ${index + 1}`}
              />
            ),
          )}
        </div>

        {current.type === "video" && playing !== active && (
          <button
            type="button"
            className="evx-gallery-play"
            onClick={() => videoRefs.current[active]?.play()}
            aria-label="Play event video"
          >
            <Play size={22} fill="currentColor" />
          </button>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              className="evx-gallery-arrow evx-gallery-arrow--prev"
              onClick={() => go(active - 1)}
              disabled={active === 0}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="evx-gallery-arrow evx-gallery-arrow--next"
              onClick={() => go(active + 1)}
              disabled={active === media.length - 1}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>

            <div className="evx-gallery-dots">
              {media.map((item, index) => (
                <button
                  key={item.url}
                  type="button"
                  className={`evx-gallery-dot${index === active ? " is-active" : ""}`}
                  aria-label={`Show image ${index + 1}`}
                  onClick={() => go(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
