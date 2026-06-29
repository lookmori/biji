"use client";

import { DialogContainer } from "./DialogContainer";

/** 挂载到根布局，提供全局弹窗能力 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DialogContainer />
    </>
  );
}
