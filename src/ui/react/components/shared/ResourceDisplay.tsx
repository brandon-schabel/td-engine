import React, {
  forwardRef,
  HTMLAttributes,
  useEffect,
  useState,
  useRef,
} from "react";
import { Icon } from "./Icon";
import { IconType } from "@/ui/icons/SvgIcons";
import { cn } from "@/lib/utils";

export interface ResourceDisplayProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: number | string;
  icon?: IconType;
  iconHtml?: string;
  label?: string;
  variant?: "default" | "compact" | "large" | "inline" | "badge";
  showLabel?: boolean;
  showIcon?: boolean;
  prefix?: string;
  suffix?: string;
  format?: "number" | "currency" | "percent" | "custom";
  formatter?: (value: number | string) => string;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning";
  tooltip?: string;
  animate?: boolean;
  onChange?: (oldValue: number | string, newValue: number | string) => void;
}

// Format value based on format type
function formatValue(value: number | string, format: string): string {
  if (format === "custom") {
    return String(value);
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return String(value);
  }

  switch (format) {
    case "currency":
      return numValue.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

    case "percent":
      return `${(numValue * 100).toFixed(1)}%`;

    case "number":
    default:
      if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(1)}M`;
      } else if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(1)}K`;
      }
      return String(numValue);
  }
}

const variantStyles = {
  default: {
    container:
      "flex items-center gap-2 px-3 py-2 bg-ui-bg-secondary rounded-md",
    icon: "w-5 h-5",
    iconSize: 20,
    label: "text-sm",
    value: "text-lg font-semibold",
  },
  compact: {
    container:
      "flex items-center gap-1 px-3 py-1.5 bg-ui-bg-secondary rounded-md",
    icon: "w-4 h-4",
    iconSize: 16,
    label: "text-sm",
    value: "text-base font-semibold",
  },
  large: {
    container: "flex items-center gap-3 p-3 bg-ui-bg-secondary rounded-lg",
    icon: "w-7 h-7",
    iconSize: 28,
    label: "text-base font-medium",
    value: "text-2xl font-bold",
  },
  inline: {
    container: "inline-flex items-baseline gap-1",
    icon: "w-3.5 h-3.5",
    iconSize: 14,
    label: "text-xs",
    value: "text-sm font-medium",
  },
  badge: {
    container:
      "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-ui-bg-secondary",
    icon: "w-3.5 h-3.5",
    iconSize: 14,
    label: "text-xs",
    value: "text-xs font-semibold",
  },
};

const colorStyles = {
  default: "",
  primary: "text-button-primary",
  secondary: "text-ui-text-secondary",
  success: "text-status-success",
  danger: "text-status-error",
  warning: "text-status-warning",
};

export const ResourceDisplay = forwardRef<HTMLDivElement, ResourceDisplayProps>(
  (
    {
      className,
      value,
      icon = IconType.COINS,
      iconHtml,
      label = "Coins",
      variant = "default",
      showLabel = false,
      showIcon = true,
      prefix,
      suffix,
      format = "number",
      formatter,
      color = "default",
      tooltip,
      animate = true,
      onChange,
      ...props
    },
    ref
  ) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const previousValueRef = useRef(value);
    const variantConfig = variantStyles[variant];

    // Detect value changes
    useEffect(() => {
      if (previousValueRef.current !== value) {
        if (onChange) {
          onChange(previousValueRef.current, value);
        }

        if (animate) {
          setIsAnimating(true);
          const timer = setTimeout(() => setIsAnimating(false), 300);
          return () => clearTimeout(timer);
        }

        previousValueRef.current = value;
      }
    }, [value, onChange, animate]);

    // Format the display value
    let formattedValue: string;
    if (formatter) {
      formattedValue = formatter(value);
    } else {
      formattedValue = formatValue(value, format);
    }

    // Add prefix/suffix
    const displayValue = [prefix, formattedValue, suffix]
      .filter(Boolean)
      .join("");

    return (
      <div
        ref={ref}
        className={cn(
          variantConfig.container,
          colorStyles[color],
          isAnimating && "transition-all duration-300 scale-105",
          className
        )}
        title={tooltip}
        {...props}
      >
        {showIcon && (icon || iconHtml) && (
          <span
            className={cn(
              "resource-icon flex-shrink-0",
              variantConfig.icon,
              icon === IconType.COINS && "text-game-currency"
            )}
          >
            {iconHtml ? (
              <span dangerouslySetInnerHTML={{ __html: iconHtml }} />
            ) : (
              <Icon type={icon} size={variantConfig.iconSize} />
            )}
          </span>
        )}

        {showLabel && label && (
          <span
            className={cn(
              "resource-label text-ui-text-secondary",
              variantConfig.label
            )}
          >
            {label}
          </span>
        )}

        <span
          className={cn(
            "resource-value text-ui-text-primary",
            variantConfig.value
          )}
        >
          {displayValue}
        </span>
      </div>
    );
  }
);

ResourceDisplay.displayName = "ResourceDisplay";

// Utility components for common use cases
export const CurrencyDisplay = forwardRef<
  HTMLDivElement,
  Omit<ResourceDisplayProps, "icon" | "format" | "showIcon">
>(({ ...props }, ref) => (
  <ResourceDisplay
    ref={ref}
    icon={IconType.COINS}
    format="currency"
    showIcon={true}
    {...props}
  />
));

CurrencyDisplay.displayName = "CurrencyDisplay";

export const CompactResource = forwardRef<
  HTMLDivElement,
  Omit<ResourceDisplayProps, "variant" | "showIcon">
>(({ icon, ...props }, ref) => (
  <ResourceDisplay
    ref={ref}
    icon={icon}
    variant="compact"
    showIcon={true}
    {...props}
  />
));

CompactResource.displayName = "CompactResource";

export const ResourceBadge = forwardRef<
  HTMLDivElement,
  Omit<ResourceDisplayProps, "variant" | "showLabel" | "showIcon">
>(({ label, ...props }, ref) => (
  <ResourceDisplay
    ref={ref}
    label={label}
    variant="badge"
    showLabel={true}
    showIcon={false}
    {...props}
  />
));

ResourceBadge.displayName = "ResourceBadge";
