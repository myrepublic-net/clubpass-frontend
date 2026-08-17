import { createContext, useContext } from "react";

export const ClubpassUserContext = createContext({
  userName: "",
  user: null,
  // The RewardLand profile from SSO ({ rrId, username, email, phoneNumber }),
  // null when the member arrived without an rr_sso token.
  profile: null,
  setUser: () => {},
});

/**
 * Seconds until the pass fetches a fresh scan token. Kept in its own context
 * because it ticks every second — anything reading the user shouldn't re-render
 * along with it.
 */
export const ScanCountdownContext = createContext(0);

/**
 * The Strapi clubpass-user for the current ?userName=, once the gate is open.
 * `user` is null if the lookup failed; `setUser` refreshes it after a payment.
 */
export function useClubpassUser() {
  return useContext(ClubpassUserContext);
}

/** Seconds until the next token refresh. 0 when there is no live token. */
export function useScanCountdown() {
  return useContext(ScanCountdownContext);
}
