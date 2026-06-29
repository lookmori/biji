/**
 * 命令式弹窗管理器
 * 无需 React Context，任何组件可调用 Dialog.confirm() / Dialog.prompt()
 */

type DialogType = "confirm" | "prompt";

interface DialogState {
  type: DialogType;
  open: boolean;
  title?: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: string | boolean) => void;
}

let _state: DialogState | null = null;
let _listeners: Array<() => void> = [];

function getState() {
  return _state;
}

function subscribe(fn: () => void) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}

function notify() {
  _listeners.forEach((fn) => fn());
}

function showDialog(
  type: DialogType,
  message: string,
  options?: {
    title?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }
): Promise<string | boolean> {
  return new Promise((resolve) => {
    _state = {
      type,
      open: true,
      message,
      title: options?.title,
      defaultValue: options?.defaultValue,
      placeholder: options?.placeholder,
      confirmLabel: options?.confirmLabel,
      cancelLabel: options?.cancelLabel,
      resolve,
    };
    notify();
  });
}

function closeDialog(value: string | boolean) {
  if (_state) {
    _state.resolve(value);
    _state = null;
    notify();
  }
}

export const Dialog = {
  /** 确认弹窗 — 返回 boolean */
  confirm: (message: string, options?: { title?: string; confirmLabel?: string; cancelLabel?: string }) =>
    showDialog("confirm", message, options) as Promise<boolean>,

  /** 输入弹窗 — 返回 string 或空字符串（取消时） */
  prompt: (message: string, options?: { title?: string; defaultValue?: string; placeholder?: string; confirmLabel?: string; cancelLabel?: string }) =>
    showDialog("prompt", message, options) as Promise<string>,

  getState,
  subscribe,
  closeDialog,
};
