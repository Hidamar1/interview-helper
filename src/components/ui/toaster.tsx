"use client";

import { useState, useEffect } from "react";
import { onToast } from "@/lib/toast";

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onToast((msg) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 2000);
    });
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-8 z-[100] mx-auto flex justify-center transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {message && (
        <div className="rounded-full bg-ink px-5 py-2.5 text-sm text-white shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
}
