/** Hover-állapotgép: node-belépés/kilépés → tooltip, kurzor, effekt-jelzés. */
export class HoverController {
  constructor({ dom, label }) {
    this.dom = dom;
    this.label = label;
    this.current = null;
  }

  update(node, mouse) {
    if (node === this.current) {
      if (node) this.label.move(mouse.clientX, mouse.clientY);
      return;
    }

    if (this.current) {
      this.current.isHovered = false;
      this.label.hide();
      this.dom.style.cursor = '';
    }

    this.current = node;

    if (node) {
      node.isHovered = true;
      this.label.show(node.def, mouse.clientX, mouse.clientY);
      this.dom.style.cursor = 'pointer';
    }
  }
}