/**
 * Turns a legal page's Strapi rich text (Markdown) into the shape LegalBlocks
 * renders (see components/LegalPage.jsx), so CMS copy looks exactly like the
 * hand-written data it replaces:
 *
 * - text before the first "##" is the lede;
 * - "## n. Title" opens a section, "### n.n Title" a sub-heading inside it;
 * - "1.1 …" / "a. …" lines are clauses, "(i) …" lines points, "- …" lines a list;
 * - a run of lines after a "…:" line, each ending ";" / "; or" / "; and", is a
 *   list even without bullets (how the editor stores pasted lists);
 * - a ``` block of "**Label**  text" rows is the penalties table, any other
 *   ``` block a contact card.
 *
 * Never uses innerHTML, so nothing typed into the CMS can inject markup.
 */

const SAFE_URL = /^(https?:|mailto:|tel:|\/)/i;

/** **bold**, [text](url), bare emails and bare URLs inside one line. */
export function inline(text) {
  const pattern =
    /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(https?:\/\/[^\s<>()]+)/g;
  const out = [];
  let last = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = match.index;

    if (match[1]) {
      out.push(<strong key={key}>{match[1]}</strong>);
    } else if (match[2]) {
      out.push(
        SAFE_URL.test(match[3]) ? (
          <a key={key} href={match[3]} target="_blank" rel="noopener noreferrer">
            {match[2]}
          </a>
        ) : (
          match[2]
        ),
      );
    } else if (match[4]) {
      out.push(
        <a key={key} href={`mailto:${match[4]}`}>
          {match[4]}
        </a>,
      );
    } else {
      out.push(
        <a key={key} href={match[5]} target="_blank" rel="noopener noreferrer">
          {match[5]}
        </a>,
      );
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out.length === 1 && typeof out[0] === "string" ? out[0] : out;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-06T11:02:40Z" → "06-Oct-2026", the format the legal pages show. */
export function formatLegalDate(iso) {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return `${String(date.getDate()).padStart(2, "0")}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

function slugify(title) {
  return title
    .replace(/^\d+\.\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BULLET = /^[-*+•]\s+(.*)$/;
const POINT = /^(\([ivxlcdm]+\))\s+(.*)$/i;
const CLAUSE = /^([a-z]\.|\d+(?:\.\d+)+)\s+(.*)$/i;
const PENALTY = /^\*\*(.+?)\*\*\s+(.+)$/;
/** An item that more items follow: "…;", "…; or", "…; and". */
const CONTINUES = /;\s*(?:and|or)?$/i;

/** Blank-line separated paragraphs, headings and ``` blocks, in order. */
function chunk(markdown) {
  const chunks = [];
  let lines = null;
  let fence = null;

  const flush = () => {
    if (lines) chunks.push({ lines });
    lines = null;
  };

  for (const raw of String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();

    if (fence) {
      if (line.startsWith("```")) {
        chunks.push({ fence });
        fence = null;
      } else if (line) {
        fence.push(line);
      }
      continue;
    }

    if (line.startsWith("```")) {
      flush();
      fence = [];
      continue;
    }

    if (!line) {
      flush();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flush();
      chunks.push({ level: heading[1].length, text: heading[2].trim() });
      continue;
    }

    (lines ??= []).push(line);
  }

  flush();
  if (fence) chunks.push({ fence });
  return chunks;
}

export function parseLegal(markdown) {
  const lede = [];
  const sections = [];
  let blocks = null;
  // The last line emitted, to spot "…:" introducing an unbulleted list.
  let lastText = "";

  const push = (block, text) => {
    blocks.push(block);
    lastText = text;
  };

  const addLine = (line) => {
    const tail = blocks[blocks.length - 1];
    const bullet = line.match(BULLET);
    const point = line.match(POINT);
    const clause = line.match(CLAUSE);

    if (bullet) {
      if (tail?.list) tail.list.push(inline(bullet[1]));
      else blocks.push({ list: [inline(bullet[1])] });
      lastText = bullet[1];
    } else if (point) {
      const item = [point[1], inline(point[2])];
      if (tail?.points) tail.points.push(item);
      else blocks.push({ points: [item] });
      lastText = point[2];
    } else if (clause) {
      push({ clause: clause[1], text: inline(clause[2]) }, clause[2]);
    } else {
      push({ p: inline(line) }, line);
    }
  };

  const addParagraph = (lines) => {
    const unmarked = !lines.some((line) => BULLET.test(line) || POINT.test(line) || CLAUSE.test(line));

    if (unmarked && lastText.endsWith(":") && (lines.length > 1 || CONTINUES.test(lines[0]))) {
      const items = [lines[0]];
      while (items.length < lines.length && CONTINUES.test(items[items.length - 1])) {
        items.push(lines[items.length]);
      }
      push({ list: items.map((item) => inline(item)) }, items[items.length - 1]);
      lines.slice(items.length).forEach(addLine);
      return;
    }

    lines.forEach(addLine);
  };

  const addFence = (lines) => {
    const rows = lines.map((line) => line.match(PENALTY));

    if (rows.every(Boolean)) {
      push({ penalties: rows.map((row) => [row[1].trim(), row[2].trim()]) }, "");
      return;
    }

    // Drop lines repeated by mistake in the editor.
    const unique = lines.filter((line, index) => lines.indexOf(line) === index);
    push({ address: unique.map((line) => inline(line)) }, "");
  };

  for (const item of chunk(markdown)) {
    if (item.level) {
      if (item.level <= 2 || !sections.length) {
        const section = {
          id: slugify(item.text) || `section-${sections.length + 1}`,
          title: item.text,
          blocks: [],
        };
        sections.push(section);
        blocks = section.blocks;
      } else {
        const sub = { sub: item.text, blocks: [] };
        sections[sections.length - 1].blocks.push(sub);
        blocks = sub.blocks;
      }
      lastText = "";
    } else if (!blocks) {
      (item.lines ?? item.fence).forEach((line) => lede.push(inline(line)));
    } else if (item.fence) {
      addFence(item.fence);
    } else {
      addParagraph(item.lines);
    }
  }

  return { lede, sections };
}
