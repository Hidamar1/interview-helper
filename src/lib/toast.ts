/** 轻量级 Toast 系统——无需第三方库 */

type ToastListener = (msg: string) => void;
let listener: ToastListener | null = null;

export function toast(message: string) {
  listener?.(message);
}

export function onToast(cb: ToastListener) {
  listener = cb;
  return () => {
    listener = null;
  };
}
