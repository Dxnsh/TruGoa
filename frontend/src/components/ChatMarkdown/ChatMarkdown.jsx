import { Fragment } from "react";

// A small, dependency-free renderer for the subset of Markdown the GoaGuide
// model actually emits: headings, bold/italic, inline code, links, bullet and
// numbered lists, and paragraphs separated by blank lines. Anything it doesn't
// recognise falls through as plain text, so a stray character never breaks the
// bubble. React escapes every value, so there is no XSS surface here.
//
// This is deliberately not a full CommonMark parser — pulling react-markdown +
// remark in for a chat bubble is a lot of bundle for what the model produces.

// Inline: **bold**, *italic* / _italic_, `code`, [text](url).
const renderInline = (text, keyBase) => {
  const nodes = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[2] !== undefined) nodes.push(<strong key={key}>{m[2]}</strong>);
    else if (m[4] !== undefined) nodes.push(<em key={key}>{m[4]}</em>);
    else if (m[6] !== undefined) nodes.push(<em key={key}>{m[6]}</em>);
    else if (m[8] !== undefined) nodes.push(<code key={key}>{m[8]}</code>);
    else if (m[10] !== undefined)
      nodes.push(
        <a key={key} href={m[11]} target="_blank" rel="noreferrer noopener">
          {m[10]}
        </a>
      );
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

const ChatMarkdown = ({ text = "", className = "" }) => {
  const lines = String(text).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let list = null; // { ordered: bool, items: [] }
  let para = []; // buffered plain lines

  const flushPara = () => {
    if (!para.length) return;
    const key = `p-${blocks.length}`;
    blocks.push(
      <p key={key}>
        {para.map((ln, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {renderInline(ln, `${key}-${i}`)}
          </Fragment>
        ))}
      </p>
    );
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const key = `l-${blocks.length}`;
    const items = list.items.map((it, i) => (
      <li key={i}>{renderInline(it, `${key}-${i}`)}</li>
    ));
    blocks.push(list.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (heading) {
      flushPara();
      flushList();
      const level = Math.min(heading[1].length + 1, 5); // #→h2 … ####→h5
      const H = `h${level}`;
      blocks.push(<H key={`h-${blocks.length}`}>{renderInline(heading[2], `h-${blocks.length}`)}</H>);
      continue;
    }
    if (bullet) {
      flushPara();
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
      continue;
    }
    if (ordered) {
      flushPara();
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(ordered[1]);
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    // plain line — part of a paragraph
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();

  return <div className={`chat-md ${className}`.trim()}>{blocks}</div>;
};

export default ChatMarkdown;
