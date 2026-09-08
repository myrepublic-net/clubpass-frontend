import { useCallback, useState } from "react";
import useCountdown from "./useCountdown.js";

const OTP_TTL_SECONDS = 120;

/**
 * Drives one "GET OTP -> boxes -> verified" cycle against a pair of
 * request/verify functions. Signup uses two of these side by side, one for
 * the email step and one for the phone step — same shape, different
 * identifier and API calls.
 */
export default function useOtpFlow({ requestOtp, verifyOtp }) {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(null);

  const secondsLeft = useCountdown(OTP_TTL_SECONDS, startedAt);
  const expired = sent && startedAt && secondsLeft === 0;

  const request = useCallback(
    async (id) => {
      setError("");
      setSending(true);
      try {
        await requestOtp(id);
        setIdentifier(id);
        setCode("");
        setVerified(false);
        setSent(true);
        setStartedAt(Date.now());
      } catch (err) {
        setError(err?.message ?? "Couldn't send that code. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [requestOtp],
  );

  const verify = useCallback(
    async (otp) => {
      setError("");
      setVerifying(true);
      try {
        await verifyOtp(identifier, otp);
        setVerified(true);
      } catch (err) {
        setError(err?.message ?? "That code didn't match. Please try again.");
      } finally {
        setVerifying(false);
      }
    },
    [identifier, verifyOtp],
  );

  return {
    identifier,
    sent,
    sending,
    code,
    setCode,
    verifying,
    verified,
    error,
    secondsLeft,
    expired,
    request,
    verify,
  };
}
