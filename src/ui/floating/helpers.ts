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
  wrapper.style.cssText = `
    width: ${width}px;
    height: ${height}px;
    position: relative;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  `;

  const fill = document.createElement('div');
  fill.className = 'health-fill';
  fill.style.cssText = `
    width: ${Math.max(0, Math.min(100, (current / max) * 100))}%;
    height: 100%;
    background: ${color};
    border-radius: 2px;
    transition: width 0.3s ease;
  `;

  wrapper.appendChild(fill);

  if (showPercentage) {
    const text = document.createElement('div');
    text.className = 'health-text';
    text.textContent = `${Math.round((current / max) * 100)}%`;
    text.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: ${Math.min(10, height - 2)}px;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 2px rgba(0,0,0,0.8);
      pointer-events: none;
    `;
    wrapper.appendChild(text);
  }

  return wrapper;
}

export function updateHealthBar(element: HTMLElement, current: number, max: number): void {
  const fill = element.querySelector('.health-fill') as HTMLElement;
  const text = element.querySelector('.health-text') as HTMLElement;

  if (fill) {
    fill.style.width = `${Math.max(0, Math.min(100, (current / max) * 100))}%`;
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
  element.className = 'damage-number';
  element.textContent = damage.toString();
  
  element.style.cssText = `
    position: absolute;
    font-weight: bold;
    font-size: ${isCritical ? '24px' : '18px'};
    color: ${isCritical ? '#ff0000' : '#ffcc00'};
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    pointer-events: none;
    animation: damage-float 1s ease-out forwards;
    z-index: 1000;
  `;

  // Add animation keyframes if not already present
  if (!document.querySelector('#damage-number-animation')) {
    const style = document.createElement('style');
    style.id = 'damage-number-animation';
    style.textContent = `
      @keyframes damage-float {
        0% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        50% {
          transform: translateY(-30px) scale(1.2);
          opacity: 1;
        }
        100% {
          transform: translateY(-50px) scale(0.8);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return element;
}

export function createTooltip(content: string, title?: string): HTMLElement {
  const tooltip = document.createElement('div');
  
  if (title) {
    const titleElement = document.createElement('div');
    titleElement.style.cssText = 'font-weight: bold; margin-bottom: 4px;';
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

  if (options.title) {
    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0 0 12px 0; font-size: 18px;';
    title.textContent = options.title;
    popup.appendChild(title);
  }

  if (options.content) {
    const content = document.createElement('div');
    content.style.cssText = 'margin-bottom: 16px;';
    content.textContent = options.content;
    popup.appendChild(content);
  }

  if (options.buttons && options.buttons.length > 0) {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';

    options.buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.textContent = button.text;
      btn.onclick = button.onClick;

      // Style based on button type
      const baseStyle = 'padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;';
      switch (button.style) {
        case 'primary':
          btn.style.cssText = `${baseStyle} background: #4CAF50; color: white;`;
          break;
        case 'secondary':
          btn.style.cssText = `${baseStyle} background: #ddd; color: #333;`;
          break;
        case 'danger':
          btn.style.cssText = `${baseStyle} background: #f44336; color: white;`;
          break;
        default:
          btn.style.cssText = `${baseStyle} background: #2196F3; color: white;`;
      }

      buttonContainer.appendChild(btn);
    });

    popup.appendChild(buttonContainer);
  }

  return popup;
}