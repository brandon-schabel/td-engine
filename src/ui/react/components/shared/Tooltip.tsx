import React, { useState, cloneElement, ReactElement, ReactNode } from "react";
import {
  useHover,
  useFocus,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingArrow,
  arrow,
  offset,
} from "@floating-ui/react";
import { cn } from "@/lib/utils";
import { useFloatingUI, floatingPresets } from "../../hooks/floating";
import { FloatingPortal } from "../floating";

export interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  offset?: number;
  maxWidth?: number;
  trigger?: "hover" | "click" | "focus";
  showArrow?: boolean;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 500,
  offset: offsetValue = 8,
  maxWidth = 200,
  trigger = "hover",
  showArrow = true,
  className,
  contentClassName,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = React.useRef(null);

  const { refs, floatingStyles, context, middlewareData, placement } =
    useFloatingUI({
      ...floatingPresets.tooltip,
      placement: position,
      offset: showArrow ? offsetValue + 4 : offsetValue,
      middleware: showArrow ? [arrow({ element: arrowRef })] : [],
      open: isOpen,
      onOpenChange: setIsOpen,
    });

  // Set up interactions based on trigger type
  const hover = useHover(context, {
    enabled: trigger === "hover",
    delay: {
      open: delay,
      close: 100,
    },
  });

  const focus = useFocus(context, {
    enabled: trigger === "focus" || trigger === "hover",
  });

  const click = useClick(context, {
    enabled: trigger === "click",
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  // Don't show if disabled or no content
  if (disabled || !content) {
    return children;
  }

  // Clone the child element and add props
  const referenceElement = cloneElement(
    children,
    getReferenceProps({
      ref: refs.setReference,
      ...children.props,
    })
  );

  return (
    <>
      {referenceElement}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              maxWidth: `${maxWidth}px`,
              pointerEvents: "none",
            }}
            className={cn(
              "z-[10000]",
              "transition-opacity duration-200",
              isOpen ? "opacity-100" : "opacity-0",
              className
            )}
            {...getFloatingProps()}
          >
            <div
              className={cn(
                "px-3 py-2 text-sm text-white glass-dark rounded-md whitespace-normal break-words !bg-transparent",
                contentClassName
              )}
            >
              {content}
              {showArrow && (
                <FloatingArrow
                  ref={arrowRef}
                  context={context}
                  className="fill-black/40"
                  strokeWidth={1}
                  stroke="rgba(255, 255, 255, 0.1)"
                />
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

// Utility components for common use cases
export const HelpTooltip: React.FC<Omit<TooltipProps, "delay" | "position">> = (
  props
) => <Tooltip delay={300} position="top" {...props} />;

export const ClickTooltip: React.FC<Omit<TooltipProps, "trigger">> = (
  props
) => <Tooltip trigger="click" {...props} />;

export const InfoTooltip: React.FC<{
  children: ReactElement;
  info: string;
}> = ({ children, info }) => (
  <Tooltip content={info} position="top" delay={300}>
    {children}
  </Tooltip>
);
