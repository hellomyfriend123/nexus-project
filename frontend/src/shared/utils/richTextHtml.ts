// Only editor-supported markup is retained. No URLs, images, styles or event attributes.
const allowedTags = new Set(['P', 'DIV', 'BR', 'B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI']);
const discardedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'SVG', 'MATH', 'VIDEO', 'AUDIO', 'SOURCE', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'TEMPLATE', 'NOSCRIPT']);

export function sanitizeRichTextHtml(html: string): string {
  const source = new DOMParser().parseFromString(html, 'text/html');
  const result = document.createElement('div');
  function copy(node: Node, parent: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent ?? ''));
      return;
    }
    if (!(node instanceof HTMLElement) || discardedTags.has(node.tagName)) return;
    let target = parent;
    if (allowedTags.has(node.tagName)) {
      const element = document.createElement(node.tagName.toLowerCase());
      parent.appendChild(element);
      target = element;
    }
    // Word and browsers often encode bold/italic with spans instead of semantic tags.
    const weight = node.style.fontWeight;
    if (!['B', 'STRONG'].includes(node.tagName) && (weight === 'bold' || Number(weight) >= 600)) {
      const bold = document.createElement('strong');
      target.appendChild(bold);
      target = bold;
    }
    if (!['I', 'EM'].includes(node.tagName) && node.style.fontStyle === 'italic') {
      const italic = document.createElement('em');
      target.appendChild(italic);
      target = italic;
    }
    node.childNodes.forEach(child => copy(child, target));
    // Pasted tables become text; keep cell boundaries readable without retaining table markup.
    if (['TD', 'TH', 'TR'].includes(node.tagName)) target.appendChild(document.createElement('br'));
  }
  source.body.childNodes.forEach(node => copy(node, result));
  return result.innerHTML;
}

export function serializeRichTextHtml(html: string): string {
  const safe = sanitizeRichTextHtml(html);
  const container = document.createElement('div');
  container.innerHTML = safe;
  // Empty paragraphs and lists must not pass the existing required validation.
  return container.textContent?.replace(/[\s\u200b\u00a0]/g, '') ? safe : '';
}

export function textToRichTextHtml(text: string): string {
  const container = document.createElement('div');
  text.replace(/\r\n?/g, '\n').split('\n').forEach((line, index) => {
    if (index) container.appendChild(document.createElement('br'));
    container.appendChild(document.createTextNode(line));
  });
  return container.innerHTML;
}
