"use client";

import { useId, type ChangeEvent } from "react";

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  type?: string;
  large?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function InputField({
  label,
  placeholder,
  value,
  type = "text",
  large = false,
  onChange,
}: InputFieldProps) {
  const id = useId();
  const fieldClass =
    "w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-sm text-black/85 shadow-sm transition-colors outline-none placeholder:text-black/30 focus:border-lime-400/70 focus:ring-2 focus:ring-lime-400/25 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/85 dark:placeholder:text-white/25 dark:focus:border-lime-400/60";

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-black/70 dark:text-white/70"
      >
        {label}
      </label>

      {large ? (
        <textarea
          id={id}
          rows={4}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${fieldClass} resize-y`}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={fieldClass}
        />
      )}
    </div>
  );
}
