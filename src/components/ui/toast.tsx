"use client"

import {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  useCallback,
} from "react"
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastContextType {
  showToast: (
    title: string,
    message: string,
    type: ToastType,
    duration?: number,
    position?: "top" | "bottom",
  ) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const toastConfig = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    titleColor: "text-green-800",
    messageColor: "text-green-700",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    titleColor: "text-blue-800",
    messageColor: "text-blue-700",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    titleColor: "text-yellow-800",
    messageColor: "text-yellow-700",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    titleColor: "text-red-800",
    messageColor: "text-red-700",
  },
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<{
    title: string
    message: string
    type: ToastType
    visible: boolean
    position: "top" | "bottom"
  } | null>(null)

  const showToast = useCallback(
    (
      title: string,
      message: string,
      type: ToastType,
      duration: number = 5000,
      position: "top" | "bottom" = "top",
    ) => {
      setToast({ title, message, type, visible: true, position })
      setTimeout(() => {
        setToast(null)
      }, duration)
    },
    [],
  )

  const hideToast = () => {
    setToast(null)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast &&
        toast.visible &&
        (() => {
          const Icon = toastConfig[toast.type].icon
          return (
            <div
              className={`fixed ${toast.position === "top" ? "top-1/2" : "bottom-1/2"} left-1/2 -translate-x-1/2 -translate-y-1/2 py-4 z-50 animate-fade-in-down`}
            >
              <div
                className={`flex items-center justify-center p-4 max-w-sm w-full rounded-lg shadow-lg border ${toastConfig[toast.type].bgColor} ${toastConfig[toast.type].borderColor}`}
              >
                <div className="flex-shrink-0">
                  <Icon
                    className={`h-6 w-6 ${toastConfig[toast.type].iconColor}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3 w-full flex-1 pt-0.5 break-words">
                  <p
                    className={`text-sm font-medium ${toastConfig[toast.type].titleColor}`}
                  >
                    {toast.title}
                  </p>
                  <p
                    className={`mt-1 text-sm ${toastConfig[toast.type].messageColor}`}
                  >
                    {toast.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={hideToast}
                    className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
