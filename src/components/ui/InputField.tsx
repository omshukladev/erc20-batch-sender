"use client";

import { useId, type ChangeEvent } from "react";

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  type?: string;
  large?: boolean;
  index?: string;
  hint?: string;
  errorMessage?: string;
  autoComplete?: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function AlertIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function InputField({
  label,
  placeholder,
  value,
  type = "text",
  large = false,
  index,
  hint,
  errorMessage,
  autoComplete = "off",
  onChange,
}: InputFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(errorMessage);
  const describedBy =
    [hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  // 16px on small screens: anything under 1rem makes iOS Safari zoom the viewport on focus
  const fieldClass = `mt-2 w-full rounded-[3px] border bg-paper px-3 py-2.5 font-mono text-base leading-relaxed text-ink transition-colors placeholder:text-ink-faint sm:text-[13px] ${
    invalid ? "border-progress/70" : "border-line focus:border-signal"
  }`;

  const sharedProps = {
    id,
    placeholder,
    value,
    onChange,
    spellCheck: false,
    autoComplete,
    autoCorrect: "off",
    autoCapitalize: "none",
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    className: large ? `${fieldClass} resize-y` : fieldClass,
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="font-mono text-[11px] tracking-[0.14em] text-ink-soft uppercase"
        >
          {index && (
            <span aria-hidden="true" className="mr-2 text-signal">
              {index}
            </span>
          )}
          {label}
        </label>
        {hint && (
          <span id={hintId} className="font-mono text-[11px] text-ink-faint">
            {hint}
          </span>
        )}
      </div>

      {large ? (
        <textarea rows={4} {...sharedProps} />
      ) : (
        <input type={type} {...sharedProps} />
      )}

      {invalid && (
        <p
          id={errorId}
          className="mt-2 flex items-start gap-1.5 font-mono text-[11px] leading-relaxed text-progress"
        >
          <span className="mt-px shrink-0">
            <AlertIcon />
          </span>
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
