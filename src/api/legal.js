/**
 * The legal pages from Strapi — single-type entries (privacy-policy,
 * term-and-condition) whose `body` is rich text (Markdown).
 */

const BASE_URL =
  import.meta.env.VITE_STRAPI_URL ?? "https://exciting-flower-bc33aab938.strapiapp.com";

const TOKEN = import.meta.env.VITE_STRAPI_TOKEN_GET;

const pending = new Map();

export function fetchLegalPage(type) {
  if (!pending.has(type)) {
    const request = (async () => {
      const res = await fetch(`${BASE_URL}/api/${type}`, {
        headers: {
          "Content-Type": "application/json",
          ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
        },
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.error?.message ?? `Couldn't load ${type} (${res.status})`);
      }

      return {
        body: body?.data?.body ?? "",
        updatedAt: body?.data?.updatedAt ?? null,
      };
    })();

    pending.set(type, request);
    request.catch(() => pending.delete(type));
  }

  return pending.get(type);
}
