interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  variant?: "tab" | "mode";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "tab",
}: SegmentedControlProps<T>) {
  const isMode = variant === "mode";

  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F0F3EF]"
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`
              px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
              focus:outline-none focus-visible:outline-3 focus-visible:outline-green/25 focus-visible:outline-offset-1
              ${
                active
                  ? isMode
                    ? "bg-green-dark text-white shadow-s"
                    : "bg-white text-ink shadow-s"
                  : "text-muted hover:text-ink"
              }
            `}
            style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
