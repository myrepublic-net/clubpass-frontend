import { Fragment } from "react";

/**
 * Renders Strapi rich text (Markdown) as React elements.
 *
 * Deliberately small: headings, paragraphs, line breaks, bullet and numbered
 * lists, bold, italic and links — what the CMS editor actually produces. It
 * never uses innerHTML, so nothing typed into the CMS can inject markup.
 */

const SAFE_URL = /^(https?:|mailto:|tel:|\/)/i;

/** **bold**, *italic* / _italic_, [text](url) inside one line. */
function inline(text, keyPrefix) {
  const pattern = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\(([^)\s]+)\))/g;
  const out = [];
  let last = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${match.index}`;

    if (match[2] ?? match[3]) {
      out.push(<strong key={key}>{inline(match[2] ?? match[3], key)}</strong>);
    } else if (match[4] ?? match[5]) {
      out.push(<em key={key}>{inline(match[4] ?? match[5], key)}</em>);
    } else if (SAFE_URL.test(match[7])) {
      out.push(
        <a key={key} href={match[7]} target="_blank" rel="noopener noreferrer">
          {match[6]}
        </a>,
      );
    } else {
      out.push(match[6]);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Single newlines inside a paragraph are real line breaks in the editor. */
function withBreaks(lines, keyPrefix) {
  return lines.map((line, index) => (
    <Fragment key={`${keyPrefix}-${index}`}>
      {index > 0 && <br />}
      {inline(line, `${keyPrefix}-${index}`)}
    </Fragment>
  ));
}

export default function Markdown({ children, className }) {
  const source = String(children ?? "").replace(/\r\n?/g, "\n").trim();
  if (!source) return null;

  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const key = `p${blocks.length}`;
    blocks.push(<p key={key}>{withBreaks(paragraph, key)}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const key = `l${blocks.length}`;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={key}>
        {list.items.map((item, index) => (
          <li key={index}>{inline(item, `${key}-${index}`)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  for (const line of source.split("\n")) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      // Page already has an h2 title, so content headings start at h3.
      const Tag = `h${Math.min(6, heading[1].length + 2)}`;
      const key = `h${blocks.length}`;
      blocks.push(<Tag key={key}>{inline(heading[2], key)}</Tag>);
    } else if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }

  flushParagraph();
  flushList();

  return <div className={className}>{blocks}</div>;
}
