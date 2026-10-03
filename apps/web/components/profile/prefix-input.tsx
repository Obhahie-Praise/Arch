"use client";

import React, { ChangeEvent } from "react";

interface PrefixInputProps {
  label: string;
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  readOnly?: boolean;
  className?: string;
}

export const PrefixInput: React.FC<PrefixInputProps> = ({
  label,
  prefix,
  value,
  onChange,
  placeholder = "username",
  optional = false,
  required = false,
  readOnly = false,
  className = "",
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Strip prefix if user pastes full URL
    if (prefix && raw.toLowerCase().startsWith(prefix.toLowerCase())) {
      raw = raw.slice(prefix.length);
    } else if (prefix && raw.toLowerCase().startsWith(`https://${prefix.toLowerCase()}`)) {
      raw = raw.slice(`https://${prefix}`.length);
    } else if (prefix && raw.toLowerCase().startsWith(`http://${prefix.toLowerCase()}`)) {
      raw = raw.slice(`http://${prefix}`.length);
    }
    onChange(raw);
  };

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <label className="font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {optional && <span className="text-xs text-muted-foreground">Optional</span>}
      </div>

      <div className="flex items-center border-2 border-border rounded-full px-6 py-3 bg-background focus-within:border-foreground/60 focus-within:ring-1 focus-within:ring-foreground/60 transition-all duration-300">
        {prefix && (
          <span className="text-muted-foreground font-medium select-none pr-1 text-base">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className="w-full bg-transparent text-base outline-none text-foreground placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  );
};
