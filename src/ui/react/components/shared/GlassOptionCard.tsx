import React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./Glass";
import { Icon } from "./Icon";
import { IconType } from "@/ui/icons/SvgIcons";

interface GlassOptionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: IconType;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  variant?: "default" | "compact" | "detailed";
}

export const GlassOptionCard: React.FC<GlassOptionCardProps> = ({
  title,
  description,
  icon,
  selected = false,
  disabled = false,
  onSelect,
  variant = "default",
  className,
  ...props
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect();
    }
  };

  const variantStyles = {
    default: "min-h-[120px]",
    compact: "min-h-[80px]",
    detailed: "min-h-[160px]",
  };

  return (
    <div
      className={cn(
        "relative group cursor-pointer",
        "transform transition-all duration-300",
        !disabled && "hover:scale-105 hover:z-10",
        selected && "scale-105 z-10"
      )}
      onClick={onSelect}
    >
      {/* Glow effect for selected state */}
      {selected && (
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 blur-xl animate-pulse" />
      )}

      <div
        className={cn(
          "relative h-full min-h-[80px] rounded-xl overflow-hidden",
          "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
          "backdrop-blur-md backdrop-saturate-150",
          "border-2 transition-all duration-300",
          selected
            ? "border-white/40 shadow-[0_0_30px_rgba(59,130,246,0.5),inset_0_0_20px_rgba(255,255,255,0.2)]"
            : "border-white/20 hover:border-white/30",
          disabled && "opacity-50 cursor-not-allowed",
          "before:absolute before:inset-0 before:bg-gradient-to-br",
          selected
            ? "before:from-blue-500/10 before:to-purple-500/10"
            : "before:from-white/5 before:to-transparent",
          "before:opacity-50"
        )}
      >
        {/* Top reflection */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4
                className={cn(
                  "font-semibold text-white",
                  variant === "compact" ? "text-sm" : "text-base"
                )}
              >
                {title}
              </h4>

              {description && (
                <p
                  className={cn(
                    "text-white/70",
                    variant === "compact" ? "text-xs" : "text-sm"
                  )}
                >
                  {description}
                </p>
              )}
            </div>

            {selected && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  strokeWidth="3"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl",
            "bg-gradient-to-t from-white/0 via-white/5 to-white/10",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-300"
          )}
        />
      </div>
    </div>
  );
};

// Variant for simple text-only options
export const GlassOptionButton: React.FC<{
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
}> = ({ label, selected = false, disabled = false, onSelect, className }) => {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative px-6 py-3 rounded-lg",
        "backdrop-blur-md transition-all duration-300",
        "border text-white font-medium",
        selected
          ? "bg-white/20 border-white/40 shadow-lg scale-105"
          : "bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:scale-105 active:scale-100",
        className
      )}
    >
      {label}
      {selected && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
      )}
    </button>
  );
};
