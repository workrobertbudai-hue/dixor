/** Kattintás-kezelő: csak akkor választ, ha lenyomás és felengedés ugyanazon a node-on történt. */
export class ClickController {
  constructor({ dom, onSelect }) {
    this.onSelect = onSelect;
    this.hovered = null;
    this.down = null;

    dom.addEventListener('pointerdown', (e) => {
      this.down = { x: e.clientX, y: e.clientY, node: this.hovered };
    });

    dom.addEventListener('pointerup', (e) => {
      //          ^^^ EZ hiányzott!
      if (!this.down) return;
      const dx = e.clientX - this.down.x;
      const dy = e.clientY - this.down.y;
      const moved = Math.hypot(dx, dy) > 6;

      if (!moved && this.down.node && this.down.node === this.hovered) {
        this.hovered.pulse = 1; // visszajelzés: „regisztrálva"
        this.onSelect?.(this.hovered.def);
      }
      this.down = null;
    });
  }

  update(hoveredNode) {
    this.hovered = hoveredNode;
  }
}