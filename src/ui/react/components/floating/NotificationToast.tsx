import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FloatingPortal } from "./FloatingPortal";
import { Icon } from "../shared/Icon";
import { IconType } from "@/ui/icons/SvgIcons";

export interface ToastNotification {
  id: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
  icon?: IconType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
  position?: "top" | "bottom";
  index: number;
}

const typeStyles = {
  info: {
    icon: IconType.INFO,
    className: "border-blue-500/20",
    iconClassName: "text-blue-400",
  },
  success: {
    icon: IconType.CHECKMARK,
    className: "border-green-500/20",
    iconClassName: "text-green-400",
  },
  warning: {
    icon: IconType.WARNING,
    className: "border-yellow-500/20",
    iconClassName: "text-yellow-400",
  },
  error: {
    icon: IconType.CLOSE,
    className: "border-red-500/20",
    iconClassName: "text-red-400",
  },
};

/**
 * Individual toast notification component
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  position = "top",
  index,
}) => {
  const {
    id,
    message,
    type = "info",
    duration = 3000,
    icon,
    action,
  } = notification;
  const typeStyle = typeStyles[type];
  const displayIcon = icon || typeStyle.icon;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss after duration
  React.useEffect(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onDismiss(id);
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, duration, onDismiss]);

  const offset =
    position === "top"
      ? `calc(80px + ${index * 70}px)`
      : `calc(80px + ${index * 70}px)`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      style={{
        position: "fixed",
        [position]: offset,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10000 - index,
      }}
      className={cn(
        "glass-dark rounded-lg px-4 py-3",
        "min-w-[300px] max-w-[500px]",
        "flex items-center gap-3",
        "border",
        typeStyle.className
      )}
    >
      {displayIcon && (
        <Icon
          type={displayIcon}
          size={20}
          className={cn("flex-shrink-0", typeStyle.iconClassName)}
        />
      )}

      <div className="flex-1 text-white text-sm">{message}</div>

      {action && (
        <button
          onClick={() => {
            action.onClick();
            onDismiss(id);
          }}
          className={cn(
            "text-xs font-medium text-white/80 hover:text-white",
            "transition-colors duration-200",
            "flex-shrink-0"
          )}
        >
          {action.label}
        </button>
      )}

      <button
        onClick={() => onDismiss(id)}
        className={cn(
          "text-white/50 hover:text-white",
          "transition-colors duration-200",
          "flex-shrink-0"
        )}
      >
        <Icon type={IconType.CLOSE} size={16} />
      </button>
    </motion.div>
  );
};

/**
 * Container for all toast notifications
 */
export const NotificationContainer: React.FC<{
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  position?: "top" | "bottom";
}> = ({ notifications, onDismiss, position = "top" }) => {
  return (
    <FloatingPortal>
      <AnimatePresence mode="sync">
        {notifications.map((notification, index) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            position={position}
            index={index}
          />
        ))}
      </AnimatePresence>
    </FloatingPortal>
  );
};

/**
 * Hook to manage toast notifications
 */
export function useToastNotifications() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const show = useCallback((notification: Omit<ToastNotification, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { ...notification, id }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const success = useCallback(
    (message: string, options?: Partial<ToastNotification>) => {
      return show({ ...options, message, type: "success" });
    },
    [show]
  );

  const error = useCallback(
    (message: string, options?: Partial<ToastNotification>) => {
      return show({ ...options, message, type: "error" });
    },
    [show]
  );

  const info = useCallback(
    (message: string, options?: Partial<ToastNotification>) => {
      return show({ ...options, message, type: "info" });
    },
    [show]
  );

  const warning = useCallback(
    (message: string, options?: Partial<ToastNotification>) => {
      return show({ ...options, message, type: "warning" });
    },
    [show]
  );

  const ToastContainer = useCallback(
    ({ position }: { position?: "top" | "bottom" }) => (
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismiss}
        position={position}
      />
    ),
    [notifications, dismiss]
  );

  return {
    show,
    dismiss,
    dismissAll,
    success,
    error,
    info,
    warning,
    ToastContainer,
    notifications,
  };
}
