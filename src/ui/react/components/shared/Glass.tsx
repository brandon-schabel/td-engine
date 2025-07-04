import React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark" | "colored";
  blur?: "xs" | "sm" | "md" | "lg" | "xl";
  opacity?: number;
  border?: boolean;
  glow?: boolean;
  reflection?: boolean;
}

// Enhanced GlassPanel Header Component
interface GlassPanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  noBorder?: boolean;
}

const GlassPanelHeader: React.FC<GlassPanelHeaderProps> = ({
  children,
  className,
  noBorder = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative px-6 py-4",
        !noBorder && "border-b border-white/10",
        "bg-gradient-to-r from-white/5 to-transparent",
        className
      )}
      {...props}
    >
      {children}
      {!noBorder && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  );
};

// GlassPanel Body Component
const GlassPanelBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("relative p-6", className)} {...props}>
      {children}
    </div>
  );
};

// GlassPanel Footer Component
const GlassPanelFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative px-6 py-4",
        "border-t border-white/10",
        "bg-gradient-to-b from-white/5 to-white/10",
        className
      )}
      {...props}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );
};

// Enhanced GlassPanel with advanced glass effects
export const GlassPanel: React.FC<GlassPanelProps> & {
  Header: typeof GlassPanelHeader;
  Body: typeof GlassPanelBody;
  Footer: typeof GlassPanelFooter;
} = ({
  children,
  className,
  variant = "dark",
  blur = "md",
  opacity = 90,
  border = true,
  glow = false,
  reflection = true,
  ...props
}) => {
  const blurClasses = {
    xs: "backdrop-blur-xs",
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md backdrop-saturate-150",
    lg: "backdrop-blur-lg backdrop-saturate-150",
    xl: "backdrop-blur-xl backdrop-saturate-200",
  };

  const variantClasses = {
    light: `bg-gradient-to-br from-white/${opacity} via-white/${opacity * 0.8} to-white/${opacity * 0.6}`,
    dark: `bg-gradient-to-br from-black/${opacity} via-gray-900/${opacity * 0.9} to-black/${opacity * 0.8}`,
    colored: `bg-gradient-to-br from-blue-950/${opacity} via-purple-950/${opacity * 0.9} to-pink-950/${opacity * 0.8}`,
  };

  const glowClasses = glow
    ? {
        light:
          "shadow-[0_0_30px_rgba(255,255,255,0.3),inset_0_0_20px_rgba(255,255,255,0.1)]",
        dark: "shadow-[0_0_40px_rgba(59,130,246,0.3),inset_0_0_20px_rgba(255,255,255,0.1)]",
        colored:
          "shadow-[0_0_50px_rgba(168,85,247,0.4),inset_0_0_30px_rgba(255,255,255,0.15)]",
      }[variant]
    : "shadow-[0_8px_32px_rgba(0,0,0,0.12)]";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "rounded-2xl",
        blurClasses[blur],
        variantClasses[variant],
        border && "border border-white/20",
        glowClasses,
        "transition-all duration-300",
        "before:absolute before:inset-0 before:rounded-2xl",
        "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
        "before:opacity-50 before:pointer-events-none",
        className
      )}
      {...props}
    >
      {/* Top reflection effect */}
      {reflection && (
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
      )}

      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-60 pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Attach compound components
GlassPanel.Header = GlassPanelHeader;
GlassPanel.Body = GlassPanelBody;
GlassPanel.Footer = GlassPanelFooter;

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  active?: boolean;
  blur?: "xs" | "sm" | "md" | "lg" | "xl";
  glow?: boolean;
}

// Enhanced GlassButton with more effects
export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = "ghost",
  size = "md",
  active = false,
  blur = "sm",
  glow = false,
  disabled,
  ...props
}) => {
  const blurClasses = {
    xs: "backdrop-blur-xs",
    sm: "backdrop-blur-sm backdrop-saturate-125",
    md: "backdrop-blur-md backdrop-saturate-150",
    lg: "backdrop-blur-lg backdrop-saturate-150",
    xl: "backdrop-blur-xl backdrop-saturate-200",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg",
  };

  const variantClasses = {
    primary: cn(
      "bg-gradient-to-r from-blue-500/20 to-purple-500/20",
      "hover:from-blue-500/30 hover:to-purple-500/30",
      "border border-white/30 hover:border-white/50",
      "text-white",
      glow &&
        "shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]",
      active && "from-blue-500/40 to-purple-500/40 border-white/60"
    ),
    secondary: cn(
      "bg-gradient-to-r from-white/10 to-white/20",
      "hover:from-white/20 hover:to-white/30",
      "border border-white/20 hover:border-white/30",
      "text-white",
      glow &&
        "shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]",
      active && "from-white/30 to-white/40 border-white/40"
    ),
    ghost: cn(
      "bg-white/5 hover:bg-white/10",
      "border border-white/10 hover:border-white/20",
      "text-white/80 hover:text-white",
      active && "bg-white/20 border-white/30 text-white"
    ),
  };

  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-lg",
        "font-medium transition-all duration-300",
        "inline-flex flex-row items-center justify-center gap-2",
        "whitespace-nowrap flex-nowrap",
        blurClasses[blur],
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed",
        "before:absolute before:inset-0 before:rounded-lg",
        "before:bg-gradient-to-t before:from-white/0 before:to-white/10",
        "before:opacity-0 hover:before:opacity-100",
        "before:transition-opacity before:duration-300",
        "hover:scale-105 active:scale-100",
        "group",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {/* Top reflection */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg opacity-50 pointer-events-none" />

      {/* Content */}
      <span className="relative z-10 inline-flex items-center">{children}</span>

      {/* Hover glow overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
};

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark" | "colored";
  blur?: "xs" | "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  glow?: boolean;
}

// GlassCard Header Component
const GlassCardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative px-4 py-3",
        "border-b border-white/10",
        "bg-gradient-to-r from-white/5 to-transparent",
        className
      )}
      {...props}
    >
      {children}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};

// GlassCard Body Component
const GlassCardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
};

// GlassCard Footer Component
const GlassCardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative px-4 py-3",
        "border-t border-white/10",
        "bg-gradient-to-b from-white/5 to-white/10",
        className
      )}
      {...props}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );
};

// Enhanced GlassCard
export const GlassCard: React.FC<GlassCardProps> & {
  Header: typeof GlassCardHeader;
  Body: typeof GlassCardBody;
  Footer: typeof GlassCardFooter;
} = ({
  children,
  className,
  variant = "dark",
  blur = "md",
  padding = "md",
  hover = false,
  glow = false,
  ...props
}) => {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <GlassPanel
      variant={variant}
      blur={blur}
      glow={glow}
      className={cn(
        "rounded-xl",
        paddingClasses[padding],
        hover &&
          cn(
            "cursor-pointer transition-all duration-300",
            "hover:bg-white/5 hover:border-white/20",
            "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
            "hover:scale-105"
          ),
        className
      )}
      {...props}
    >
      {children}
    </GlassPanel>
  );
};

// Attach compound components
GlassCard.Header = GlassCardHeader;
GlassCard.Body = GlassCardBody;
GlassCard.Footer = GlassCardFooter;

interface GlassIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  blur?: "xs" | "sm" | "md" | "lg" | "xl";
  glow?: boolean;
}

// Enhanced GlassIconButton
export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  icon,
  className,
  size = "md",
  active = false,
  blur = "sm",
  glow = false,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <GlassButton
      variant="ghost"
      size={size}
      active={active}
      blur={blur}
      glow={glow}
      disabled={disabled}
      className={cn(
        sizeClasses[size],
        "p-0 rounded-lg",
        "flex-shrink-0",
        "inline-flex items-center justify-center",
        "hover:bg-white/15",
        glow && "hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]",
        className
      )}
      {...props}
    >
      {icon}
    </GlassButton>
  );
};

interface GlassDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  variant?: "light" | "dark" | "gradient";
  glow?: boolean;
}

// Enhanced GlassDivider
export const GlassDivider: React.FC<GlassDividerProps> = ({
  orientation = "horizontal",
  variant = "light",
  glow = false,
  className,
  ...props
}) => {
  const baseClasses =
    orientation === "horizontal" ? "h-px w-full" : "w-px h-full";

  const variantClasses = {
    light: "bg-white/10",
    dark: "bg-black/10",
    gradient:
      orientation === "horizontal"
        ? "bg-gradient-to-r from-transparent via-white/20 to-transparent"
        : "bg-gradient-to-b from-transparent via-white/20 to-transparent",
  };

  return (
    <div
      className={cn(
        "relative",
        baseClasses,
        variantClasses[variant],
        glow && "shadow-[0_0_10px_rgba(255,255,255,0.3)]",
        className
      )}
      {...props}
    />
  );
};
