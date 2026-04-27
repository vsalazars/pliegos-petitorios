"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      closeButton
      richColors={false}
      gap={12}
      offset={24}
      visibleToasts={3}
      toastOptions={{
        duration: 4000,
        unstyled: false,
        classNames: {
          toast:
            "app-toast group relative w-[min(480px,calc(100vw-2rem))] rounded-[1.15rem] border px-5 py-4 pr-6 text-[#43353c] shadow-[0_18px_48px_rgba(70,39,49,0.18)] backdrop-blur-xl before:absolute before:inset-y-4 before:left-0 before:w-[5px] before:rounded-r-full before:bg-[#d7c3ca]",
          title:
            "font-body text-[0.97rem] font-semibold leading-6 tracking-[-0.015em] text-[#4f2130]",
          description: "mt-1 text-[0.875rem] leading-6 text-[#756870]",
          actionButton:
            "!h-9 !rounded-full !border-0 !bg-[#5f1024] !px-4 !text-sm !font-medium !text-white hover:!bg-[#4f0d1d]",
          cancelButton:
            "!h-9 !rounded-full !border !border-[#d7cdd2] !bg-white !px-4 !text-sm !font-medium !text-[#5d5d65] hover:!border-[#bcaeb5] hover:!bg-[#fcfafb]",
          closeButton:
            "app-toast-close !size-8 !rounded-full !border !border-[#e6d9de] !bg-white !text-[#8b7b83] !shadow-[0_10px_24px_rgba(79,33,48,0.12)] hover:!border-[#cebfc6] hover:!bg-white hover:!text-[#5f1024]",
          success:
            "!border-[#c5e3d0] !bg-[linear-gradient(180deg,rgba(222,247,231,1)_0%,rgba(204,239,217,1)_100%)] before:!bg-[#2f6e4a]",
          error:
            "!border-[#e8c7d1] !bg-[linear-gradient(180deg,rgba(254,232,239,1)_0%,rgba(248,214,225,1)_100%)] before:!bg-[#8d193f]",
          warning:
            "!border-[#edd295] !bg-[linear-gradient(180deg,rgba(255,243,210,1)_0%,rgba(250,231,173,1)_100%)] before:!bg-[#b56f00]",
          info:
            "!border-[#cfdcec] !bg-[linear-gradient(180deg,rgba(232,241,252,1)_0%,rgba(214,229,247,1)_100%)] before:!bg-[#456b98]",
        },
      }}
    />
  );
}
