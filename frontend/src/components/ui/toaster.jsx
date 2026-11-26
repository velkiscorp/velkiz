import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts
        .filter((t) => t.open !== false)
        .map(function ({ id, title, description, action, onOpenChange: _onOpenChange, open: _open, duration: _duration, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-0.5 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
              <ToastClose onClick={() => dismiss(id)} />
            </Toast>
          );
        })}
    </ToastProvider>
  );
}
