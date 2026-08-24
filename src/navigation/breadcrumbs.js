/** Térbeli breadcrumb (§5): DIXOR ▸ WORK — a gyökér kattintható. */
export class Breadcrumbs {
  constructor({ onRootClick }) {
    this.onRootClick = onRootClick;
    this.el = document.createElement('nav');
    this.el.className = 'dx-breadcrumbs';
    document.body.appendChild(this.el);
    this.setTrail([{ id: 'core', label: 'CORE' }]);
  }

  setTrail(items) {
    this.el.innerHTML = '';
    items.forEach((item, i) => {
      const isLast = i === items.length - 1;

      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'dx-breadcrumbs__sep';
        sep.textContent = '▸';
        this.el.appendChild(sep);
      }

      const part = document.createElement(isLast ? 'span' : 'button');
      part.className =
        'dx-breadcrumbs__item' + (isLast ? ' dx-breadcrumbs__item--current' : '');
      part.textContent = item.label;
      if (!isLast) part.addEventListener('click', () => this.onRootClick?.());
      this.el.appendChild(part);
    });
  }
}