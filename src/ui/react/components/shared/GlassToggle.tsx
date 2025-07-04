import React, { forwardRef, useState } from "react";

// Utility function to combine class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

export interface GlassToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  glowColor?: "blue" | "green" | "purple" | "pink" | "yellow";
  size?: "sm" | "md" | "lg";
  showReflection?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const glowColors = {
  blue: {
    trackGlow:
      "shadow-[0_0_20px_rgba(59,130,246,0.6),inset_0_0_10px_rgba(59,130,246,0.2)]",
    thumbGlow: "shadow-[0_0_15px_rgba(59,130,246,0.8)]",
    gradient: "from-blue-500/80 to-blue-400/80",
  },
  green: {
    trackGlow:
      "shadow-[0_0_20px_rgba(34,197,94,0.6),inset_0_0_10px_rgba(34,197,94,0.2)]",
    thumbGlow: "shadow-[0_0_15px_rgba(34,197,94,0.8)]",
    gradient: "from-green-500/80 to-green-400/80",
  },
  purple: {
    trackGlow:
      "shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_10px_rgba(168,85,247,0.2)]",
    thumbGlow: "shadow-[0_0_15px_rgba(168,85,247,0.8)]",
    gradient: "from-purple-500/80 to-purple-400/80",
  },
  pink: {
    trackGlow:
      "shadow-[0_0_20px_rgba(236,72,153,0.6),inset_0_0_10px_rgba(236,72,153,0.2)]",
    thumbGlow: "shadow-[0_0_15px_rgba(236,72,153,0.8)]",
    gradient: "from-pink-500/80 to-pink-400/80",
  },
  yellow: {
    trackGlow:
      "shadow-[0_0_20px_rgba(250,204,21,0.6),inset_0_0_10px_rgba(250,204,21,0.2)]",
    thumbGlow: "shadow-[0_0_15px_rgba(250,204,21,0.8)]",
    gradient: "from-yellow-500/80 to-yellow-400/80",
  },
};

const sizes = {
  sm: {
    track: "w-9 h-5",
    thumb: "w-4 h-4",
    thumbOffset: 0.125, // in rem (0.5 in Tailwind)
    thumbTravel: 1, // in rem (4 in Tailwind = 1rem)
  },
  md: {
    track: "w-12 h-6",
    thumb: "w-5 h-5",
    thumbOffset: 0.125,
    thumbTravel: 1.5, // 6 in Tailwind = 1.5rem
  },
  lg: {
    track: "w-16 h-8",
    thumb: "w-7 h-7",
    thumbOffset: 0.125,
    thumbTravel: 2, // 8 in Tailwind = 2rem
  },
};

export const GlassToggle = forwardRef<HTMLInputElement, GlassToggleProps>(
  (
    {
      className,
      glowColor = "blue",
      size = "md",
      showReflection = true,
      onCheckedChange,
      checked: controlledChecked,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = useState(false);
    const isChecked =
      controlledChecked !== undefined ? controlledChecked : internalChecked;

    const sizeConfig = sizes[size];
    const colorConfig = glowColors[glowColor];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;

      if (controlledChecked === undefined) {
        setInternalChecked(newChecked);
      }

      onCheckedChange?.(newChecked);
      props.onChange?.(e);
    };

    // Calculate thumb position based on checked state
    const thumbStyle = {
      transform: `translateX(${isChecked ? `${sizeConfig.thumbTravel}rem` : "0"}) translateY(-50%)`,
      left: `${sizeConfig.thumbOffset}rem`,
    };

    return (
      <label
        className={cn(
          "relative inline-block",
          "cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />

        {/* Track */}
        <div
          className={cn(
            "relative rounded-full transition-all duration-300",
            sizeConfig.track,
            isChecked
              ? cn(
                  "bg-gradient-to-r",
                  colorConfig.gradient,
                  colorConfig.trackGlow
                )
              : "bg-gradient-to-r from-white/10 to-white/5",
            "backdrop-blur-md",
            "border border-white/20",
            "shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
            "hover:border-white/30",
            "overflow-hidden"
          )}
        >
          {/* Reflection effect */}
          {showReflection && (
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
          )}

          {/* Inner glow effect when checked */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-opacity duration-300",
              isChecked ? "opacity-100" : "opacity-0",
              "bg-gradient-to-r from-transparent via-white/20 to-transparent"
            )}
          />

          {/* Thumb with dynamic positioning */}
          <div
            style={thumbStyle}
            className={cn(
              "absolute top-1/2",
              "block rounded-full",
              "transition-all duration-300 ease-out",
              sizeConfig.thumb,
              "bg-gradient-to-br",
              isChecked
                ? cn("from-white to-gray-50", colorConfig.thumbGlow)
                : "from-white to-gray-100",
              "shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]",
              "hover:scale-110",
              "before:absolute before:inset-0 before:rounded-full",
              "before:bg-gradient-to-br before:from-transparent before:via-white/30 before:to-transparent",
              "before:opacity-70"
            )}
          >
            {/* Center highlight */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/60 to-transparent" />
          </div>
        </div>
      </label>
    );
  }
);

GlassToggle.displayName = "GlassToggle";
