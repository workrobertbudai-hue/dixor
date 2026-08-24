/** KattintÃ¡s-kezelÅ‘: csak akkor vÃ¡laszt, ha lenyomÃ¡s Ã©s felengedÃ©s ugyanazon a node-on tÃ¶rtÃ©nt. */
export class ClickController {
  constructor({ dom, onSelect }) {
    this.onSelect = onSelect;
    this.hovered = null;
    this.down = null;

    dom.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.down = { x: e.clientX, y: e.clientY, node: this.hovered };
    });

    dom.addEventListener('pointerup', (e) => {
      if (e.button !== 0) return;
      //          ^^^ EZ hiÃ¡nyzott!
      if (!this.down) return;
      const dx = e.clientX - this.down.x;
      const dy = e.clientY - this.down.y;
      const moved = Math.hypot(dx, dy) > 6;

      if (!moved && this.down.node && this.down.node === this.hovered) {
        this.hovered.pulse = 1; // visszajelzÃ©s: â€žregisztrÃ¡lva"
        this.onSelect?.(this.hovered.def);
      }
      this.down = null;
    });
  }

  update(hoveredNode) {
    this.hovered = hoveredNode;
  }
}