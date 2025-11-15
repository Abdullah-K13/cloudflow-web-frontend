// components/UsageTypeSelect.tsx
import React, { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

export default function UsageTypeSelect({
  label = "Usage Type",
  value,
  onChange,
  options,
  placeholder = "Select usage type",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on outside click + Esc
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    setActiveIdx(idx >= 0 ? idx : -1);
  }, [value, options]);

  const select = (i: number) => {
    const opt = options[i];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (["Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen((o) => !o);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => (i >= 0 ? i : 0));
    }
  };

  const onOptionKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, i: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(i);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((p) => Math.min(p + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((p) => Math.max(p - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(options.length - 1);
    }
  };

  const current = options.find((o) => o.value === value)?.label;

  return (
    <div className="space-y-2" ref={rootRef}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Trigger */}
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKeyDown}
        className={[
          "w-full rounded-2xl bg-white px-4 py-2.5 text-left text-sm shadow-sm",
          "border border-teal-500/60 hover:border-orange-400 focus:border-orange-500",
          "focus:outline-none focus:ring-4 focus:ring-orange-200/70 transition-all relative",
        ].join(" ")}
      >
        <span className="flex items-center gap-2">
          {/* Badge/icon area */}
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-teal-100 text-teal-700">
            {/* bars icon */}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
              <path d="M3 7h18v2H3zM3 11h18v2H3zM3 15h18v2H3z" />
            </svg>
          </span>
          <span className={current ? "text-gray-900" : "text-gray-400"}>
            {current ?? placeholder}
          </span>
        </span>

        {/* Chevron */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 text-orange-500 transition-transform ${open ? "rotate-180" : ""}`}
            fill="currentColor"
            aria-hidden
          >
            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.18l3.71-2.95a.75.75 0 1 1 .94 1.16l-4.24 3.37a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      <div
        className={[
          "relative z-10",
          open ? "block" : "hidden",
        ].join(" ")}
      >
        <ul
          role="listbox"
          className={[
            "mt-2 max-h-56 w-full overflow-auto rounded-2xl bg-white shadow-xl",
            "ring-1 ring-teal-500/30",
          ].join(" ")}
        >
          {options.map((opt, i) => {
            const selected = opt.value === value;
            const active = i === activeIdx;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={selected}
                tabIndex={0}
                onKeyDown={(e) => onOptionKeyDown(e, i)}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => select(i)}
                className={[
                  "px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between",
                  active ? "bg-orange-50" : "bg-white",
                  selected ? "text-teal-700 font-medium" : "text-gray-800",
                  "hover:bg-orange-50 focus:bg-orange-50 outline-none",
                  "transition-colors",
                ].join(" ")}
              >
                <span>{opt.label}</span>
                {selected && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-600" fill="currentColor" aria-hidden>
                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
