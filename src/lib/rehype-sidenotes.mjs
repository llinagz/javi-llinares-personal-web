// Convierte las notas al pie de Markdown (`[^1]`, GFM) en notas al margen.
// Cada referencia pasa a ser: checkbox + etiqueta numerada + <span class="sidenote"> con el texto de la nota,
// y la sección de notas al pie desaparece. El CSS (`.sidenote*` en global.css) hace el resto: en `lg` la nota
// flota en el margen y en móvil el número la despliega. Sin JavaScript de cliente.

const isElement = (node, tagName) => node.type === "element" && node.tagName === tagName;

// Recorre el árbol; si `fn` devuelve un array, sustituye el nodo por esos nodos (sin descender en ellos).
function visit(node, fn) {
  if (!node.children) return;

  for (let i = 0; i < node.children.length; i++) {
    const replacement = fn(node.children[i], node);
    if (Array.isArray(replacement)) {
      node.children.splice(i, 1, ...replacement);
      i += replacement.length - 1;
    } else {
      visit(node.children[i], fn);
    }
  }
}

// Contenido en línea de una nota: párrafos unidos con <br>, sin el enlace de vuelta.
function noteContent(item) {
  const parts = [];

  for (const child of item.children) {
    if (child.type === "text") continue;

    if (!isElement(child, "p")) {
      parts.push([child]);
      continue;
    }

    const inline = child.children.filter((node) => !(isElement(node, "a") && node.properties?.dataFootnoteBackref !== undefined));
    const last = inline.at(-1);
    if (last?.type === "text") last.value = last.value.trimEnd();
    parts.push(inline);
  }

  return parts.flatMap((part, index) => (index === 0 ? part : [{ type: "element", tagName: "br", properties: {}, children: [] }, ...part]));
}

export default function rehypeSidenotes() {
  return (tree) => {
    const notes = new Map();

    visit(tree, (node) => {
      if (!isElement(node, "section") || node.properties?.dataFootnotes === undefined) return undefined;

      for (const list of node.children.filter((child) => isElement(child, "ol"))) {
        for (const item of list.children.filter((child) => isElement(child, "li"))) {
          notes.set(String(item.properties?.id), noteContent(item));
        }
      }
      return [];
    });

    if (notes.size === 0) return;

    let count = 0;
    visit(tree, (node) => {
      if (!isElement(node, "sup")) return undefined;

      const link = node.children.find((child) => isElement(child, "a") && child.properties?.dataFootnoteRef !== undefined);
      const content = link && notes.get(String(link.properties.href).replace(/^#/, ""));
      if (!content) return undefined;

      const id = `sidenote-${++count}`;
      return [
        { type: "element", tagName: "input", properties: { type: "checkbox", id, className: ["sidenote-toggle"], ariaLabel: `Mostrar la nota ${count}` }, children: [] },
        { type: "element", tagName: "label", properties: { htmlFor: id, className: ["sidenote-number"] }, children: [] },
        { type: "element", tagName: "span", properties: { className: ["sidenote"] }, children: structuredClone(content) }
      ];
    });
  };
}
