/** Reward Land's password policy, as shown under the password field. Shared by signup and reset. */
export const PASSWORD_RULES = [
  { label: "Eight characters minimum", test: (pw) => pw.length >= 8 },
  { label: "One lowercase character", test: (pw) => /[a-z]/.test(pw) },
  { label: "One uppercase character", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];
