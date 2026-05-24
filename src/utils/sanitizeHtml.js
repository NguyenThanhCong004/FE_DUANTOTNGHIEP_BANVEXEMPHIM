const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "u",
  "ul",
]);

const DROP_CONTENT_TAGS = new Set([
  "button",
  "embed",
  "form",
  "iframe",
  "input",
  "link",
  "math",
  "meta",
  "object",
  "script",
  "select",
  "style",
  "svg",
  "textarea",
]);

const TAG_ATTRS = {
  a: new Set(["href", "rel", "target", "title"]),
  img: new Set(["alt", "height", "src", "title", "width"]),
  li: new Set(["value"]),
  ol: new Set(["start"]),
  p: new Set(["class"]),
  span: new Set(["class"]),
};

function isSafeUrl(value, allowImageData = false) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return true;
  if (allowImageData && /^data:image\/[-+.\w]+;base64,/i.test(trimmed)) return true;

  try {
    const parsed = new URL(trimmed, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeClassList(value) {
  return String(value || "")
    .split(/\s+/)
    .filter((name) => /^ql-(align-(center|right|justify)|indent-\d+)$/.test(name))
    .join(" ");
}

export function sanitizeHtml(html) {
  if (html == null) return "";
  const raw = String(html);

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  }

  const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const visit = (node) => {
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();
    if (DROP_CONTENT_TAGS.has(tag)) {
      node.remove();
      return;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      const parent = node.parentNode;
      if (!parent) return;
      const children = [...node.childNodes];
      children.forEach((child) => parent.insertBefore(child, node));
      parent.removeChild(node);
      children.forEach(visit);
      return;
    }

    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const allowed = TAG_ATTRS[tag]?.has(name);
      if (!allowed || name.startsWith("on") || name === "style") {
        node.removeAttribute(attr.name);
        return;
      }

      if (name === "href" && !isSafeUrl(attr.value)) {
        node.removeAttribute(attr.name);
      } else if (name === "src" && !isSafeUrl(attr.value, true)) {
        node.removeAttribute(attr.name);
      } else if (name === "class") {
        const safeClass = sanitizeClassList(attr.value);
        if (safeClass) node.setAttribute("class", safeClass);
        else node.removeAttribute(attr.name);
      } else if ((name === "width" || name === "height" || name === "start" || name === "value")
          && !/^\d{1,4}$/.test(attr.value)) {
        node.removeAttribute(attr.name);
      } else if (name === "target" && !["_blank", "_self"].includes(attr.value)) {
        node.removeAttribute(attr.name);
      }
    });

    if (tag === "a") {
      if (node.getAttribute("target") === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      } else if (!node.getAttribute("href")) {
        node.removeAttribute("rel");
        node.removeAttribute("target");
      }
    }

    if (tag === "img" && !node.getAttribute("src")) {
      node.remove();
      return;
    }

    [...node.childNodes].forEach(visit);
  };

  [...root.childNodes].forEach(visit);
  return root.innerHTML;
}

export default sanitizeHtml;
