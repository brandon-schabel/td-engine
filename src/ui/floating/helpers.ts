export function createHealthBar(current: number, max: number, options: {
  showPercentage?: boolean;
  width?: number;
  height?: number;
  color?: string;
} = {}): HTMLElement {
  const {
    showPercentage = false,
    width = 60,
    height = 8,
    color = '#4CAF50'
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = 'health-bar-wrapper';
  wrapper.style.setProperty('--bar-width', `${width}px`);
  wrapper.style.setProperty('--bar-height', `${height}px`);

  const fill = document.createElement('div');
  fill.className = 'health-fill';
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  fill.style.setProperty('--fill-percentage', `${percentage}%`);
  fill.style.setProperty('--fill-color', color);

  wrapper.appendChild(fill);

  if (showPercentage) {
    const text = document.createElement('div');
    text.className = 'health-text';
    text.textContent = `${Math.round((current / max) * 100)}%`;
    text.style.setProperty('--text-size', `${Math.min(10, height - 2)}px`);
    wrapper.appendChild(text);
  }

  return wrapper;
}

export function updateHealthBar(element: HTMLElement, current: number, max: number): void {
  const fill = element.querySelector('.health-fill') as HTMLElement;
  const text = element.querySelector('.health-text') as HTMLElement;

  if (fill) {
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    fill.style.setProperty('--fill-percentage', `${percentage}%`);
  }

  if (text) {
    text.textContent = `${Math.round((current / max) * 100)}%`;
  }
}

export function flashElement(element: HTMLElement, className = 'damaged', duration = 300): void {
  element.classList.add(className);
  setTimeout(() => {
    element.classList.remove(className);
  }, duration);
}

export function createDamageNumber(damage: number, isCritical = false): HTMLElement {
  const element = document.createElement('div');
  element.className = `damage-number ${isCritical ? 'critical' : 'normal'}`;
  element.textContent = damage.toString();
  return element;
}

export function createTooltip(content: string, title?: string): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip-helper';
  
  if (title) {
    const titleElement = document.createElement('div');
    titleElement.className = 'tooltip-title';
    titleElement.textContent = title;
    tooltip.appendChild(titleElement);
  }

  const contentElement = document.createElement('div');
  contentElement.textContent = content;
  tooltip.appendChild(contentElement);

  return tooltip;
}

export function createPopupContent(options: {
  title?: string;
  content?: string;
  buttons?: Array<{
    text: string;
    onClick: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}): HTMLElement {
  const popup = document.createElement('div');
  popup.className = 'popup-helper';

  if (options.title) {
    const title = document.createElement('h3');
    title.className = 'popup-title';
    title.textContent = options.title;
    popup.appendChild(title);
  }

  if (options.content) {
    const content = document.createElement('div');
    content.className = 'popup-content';
    content.textContent = options.content;
    popup.appendChild(content);
  }

  if (options.buttons && options.buttons.length > 0) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-button-container';

    options.buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.className = `popup-button ${button.style || 'default'}`;
      btn.textContent = button.text;
      
      // Add both click and touch support
      const handleClick = () => button.onClick();
      btn.addEventListener('click', handleClick);
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleClick();
      });

      buttonContainer.appendChild(btn);
    });

    popup.appendChild(buttonContainer);
  }

  return popup;
}