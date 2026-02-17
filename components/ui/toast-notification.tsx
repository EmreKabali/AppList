"use client";

import { useEffect } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastNotificationProps {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  durationMs?: number;
}

const variantClasses: Record<ToastVariant, string> = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-gray-800 text-white",
};

export function ToastNotification({
  message,
  variant = "info",
  onClose,
  durationMs = 3500,
}: ToastNotificationProps) {
  useEffect(() => {
    const timeoutId = globalThis.setTimeout(onClose, durationMs);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [durationMs, onClose]);

  return (
    <div className="fixed right-4 top-4 z-[100] max-w-sm">
      <div className={`rounded-lg px-4 py-3 text-sm shadow-lg ${variantClasses[variant]}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="leading-5">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-white/90 hover:text-white"
            aria-label="Bildirimi kapat"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
