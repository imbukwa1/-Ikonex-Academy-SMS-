import { Toaster } from "sonner";
import type { ReactNode } from "react";

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "8px",
            fontSize: "14px",
          },
        }}
      />
    </>
  );
}
