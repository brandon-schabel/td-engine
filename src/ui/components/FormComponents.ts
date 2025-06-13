/**
 * Shared form component utilities for configuration UI
 * Extracted from the monolithic ConfigurationMenu.ts to promote reusability
 */

export interface ButtonConfig {
  text: string;
  type: 'primary' | 'secondary' | 'warning';
  onClick: () => void;
}

export interface SelectOption<T> {
  value: T;
  label: string;
  description?: string;
}

export interface FormFieldConfig {
  label: string;
  description?: string;
  helpText?: string;
}

export class FormComponents {
  static createButton(config: ButtonConfig): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = config.text;
    button.addEventListener('click', config.onClick);
    
    const colors = {
      primary: { bg: '#4CAF50', hover: '#45a049' },
      secondary: { bg: '#666', hover: '#555' },
      warning: { bg: '#FF9800', hover: '#e68900' }
    };
    
    const color = colors[config.type];
    button.style.cssText = `
      padding: 10px 20px;
      background: ${color.bg};
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background 0.2s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = color.hover;
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = color.bg;
    });
    
    return button;
  }

  static createFormSection(title: string, description?: string): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'form-section';
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: #1a1a1a;
      border-radius: 8px;
      border: 1px solid #333;
    `;

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.cssText = `
      margin: 0 0 10px 0;
      color: #4CAF50;
      font-size: 18px;
      font-weight: bold;
    `;
    section.appendChild(titleElement);

    if (description) {
      const descElement = document.createElement('p');
      descElement.textContent = description;
      descElement.style.cssText = `
        margin: 0 0 20px 0;
        color: #ccc;
        font-size: 14px;
        line-height: 1.4;
      `;
      section.appendChild(descElement);
    }

    return section;
  }

  static createFormRow(label: string, input: HTMLElement, helpText?: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      color: #fff;
      font-weight: bold;
      font-size: 14px;
    `;

    const inputContainer = document.createElement('div');
    inputContainer.appendChild(input);

    row.appendChild(labelElement);
    row.appendChild(inputContainer);

    if (helpText) {
      const helpElement = document.createElement('small');
      helpElement.textContent = helpText;
      helpElement.style.cssText = `
        color: #888;
        font-size: 12px;
        line-height: 1.3;
      `;
      row.appendChild(helpElement);
    }

    return row;
  }

  static createSelectDropdown<T>(
    currentValue: T,
    options: SelectOption<T>[],
    onChange: (value: T) => void
  ): HTMLSelectElement {
    const select = document.createElement('select');
    select.style.cssText = `
      padding: 8px;
      background: #2a2a2a;
      color: white;
      border: 1px solid #555;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    `;

    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = String(option.value);
      optionElement.textContent = option.label;
      optionElement.selected = option.value === currentValue;
      select.appendChild(optionElement);
    });

    select.addEventListener('change', () => {
      const selectedOption = options.find(opt => String(opt.value) === select.value);
      if (selectedOption) {
        onChange(selectedOption.value);
      }
    });

    return select;
  }

  static createNumberInput(
    currentValue: number,
    min: number,
    max: number,
    step: number,
    onChange: (value: number) => void
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(currentValue);
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    
    input.style.cssText = `
      padding: 8px;
      background: #2a2a2a;
      color: white;
      border: 1px solid #555;
      border-radius: 4px;
      font-size: 14px;
      width: 80px;
    `;

    input.addEventListener('input', () => {
      const value = parseFloat(input.value);
      if (!isNaN(value) && value >= min && value <= max) {
        onChange(value);
      }
    });

    return input;
  }

  static createSlider(
    currentValue: number,
    min: number,
    max: number,
    step: number,
    onChange: (value: number) => void,
    displayFormat?: (value: number) => string
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(currentValue);
    
    slider.style.cssText = `
      flex: 1;
      height: 6px;
      background: #333;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    `;

    const valueDisplay = document.createElement('span');
    valueDisplay.style.cssText = `
      min-width: 50px;
      text-align: right;
      color: #ccc;
      font-family: monospace;
      font-size: 12px;
    `;

    const updateDisplay = (value: number) => {
      valueDisplay.textContent = displayFormat ? displayFormat(value) : String(value);
    };

    updateDisplay(currentValue);

    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      updateDisplay(value);
      onChange(value);
    });

    container.appendChild(slider);
    container.appendChild(valueDisplay);
    
    return container;
  }

  static createCheckbox(
    currentValue: boolean,
    onChange: (value: boolean) => void
  ): HTMLInputElement {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = currentValue;
    
    checkbox.style.cssText = `
      width: 16px;
      height: 16px;
      cursor: pointer;
    `;

    checkbox.addEventListener('change', () => {
      onChange(checkbox.checked);
    });

    return checkbox;
  }

  static createTextInput(
    currentValue: string,
    placeholder: string,
    onChange: (value: string) => void
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.placeholder = placeholder;
    
    input.style.cssText = `
      padding: 8px;
      background: #2a2a2a;
      color: white;
      border: 1px solid #555;
      border-radius: 4px;
      font-size: 14px;
      width: 100%;
    `;

    input.addEventListener('input', () => {
      onChange(input.value);
    });

    return input;
  }
}