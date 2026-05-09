// src/utils/toast.tsx
"use client";

import toast, { ToastOptions, Toast } from "react-hot-toast";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

const typeOption = {
  loading: {
    Icon: Loader2,
    bg: "bg-zinc-800",
    border: "border-zinc-600",
    text: "text-zinc-100",
    spin: true,
  },
  success: {
    Icon: CheckCircle,
    bg: "bg-white",
    border: "border-emerald-500",
    text: "text-emerald-700",
    spin: false,
  },
  warning: {
    Icon: AlertTriangle,
    bg: "bg-white",
    border: "border-amber-500",
    text: "text-amber-700",
    spin: false,
  },
  error: {
    Icon: XCircle,
    bg: "bg-white",
    border: "border-red-500",
    text: "text-red-700",
    spin: false,
  },
};

type MessageType = keyof typeof typeOption;

const createToast = (type: MessageType) => {
  return (message: string, options?: ToastOptions) => {
    const { Icon, bg, border, text, spin } = typeOption[type];

    return toast.custom(
      (t: Toast) => (
        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all
            ${bg} ${border} ${t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          style={{ minWidth: 260, maxWidth: 420 }}
        >
          <Icon
            className={`shrink-0 size-5 ${text} ${spin ? "animate-spin" : ""}`}
          />
          <span className={`text-sm font-medium ${text}`}>{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-auto shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Close"
          >
            <XCircle className="size-4" />
          </button>
        </div>
      ),
      options
    );
  };
};

export const showToast: {
  loading: (msg: string, opt?: ToastOptions) => string;
  success: (msg: string, opt?: ToastOptions) => string;
  warning: (msg: string, opt?: ToastOptions) => string;
  error: (msg: string, opt?: ToastOptions) => string;
} = {
  loading: createToast("loading"),
  success: createToast("success"),
  warning: createToast("warning"),
  error: createToast("error"),
};
