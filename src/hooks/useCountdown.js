import { useEffect, useRef, useState } from "react";

/**
 * Ticks a seconds counter down to 0 once `startedAt` changes. Used for the
 * OTP "Expires in: Ns" line — reset by requesting a fresh code.
 */
export default function useCountdown(seconds, startedAt) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startedAt) return undefined;

    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt]);

  return remaining;
}
