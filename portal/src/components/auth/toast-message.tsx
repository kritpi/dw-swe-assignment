import type { ToastState } from "@/lib/auth";

type ToastMessageProps = {
  toast: NonNullable<ToastState>;
  onClose: () => void;
};

export function ToastMessage({ toast, onClose }: ToastMessageProps) {
  return (
    <div className={`toast toast--${toast.kind}`}>
      <span>{toast.message}</span>
      <button onClick={onClose}>x</button>
    </div>
  );
}
