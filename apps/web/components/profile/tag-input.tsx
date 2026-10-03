"use client";

import React, { useState, KeyboardEvent, ChangeEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  label?: string;
  placeholder?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  optional?: boolean;
  required?: boolean;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  placeholder = "Type and press comma (,) or Enter to add...",
  tags = [],
  onChange,
  optional = false,
  required = false,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",")) {
      const parts = val.split(",");
      parts.slice(0, -1).forEach((p) => addTag(p));
      setInputValue(parts[parts.length - 1] || "");
    } else {
      setInputValue(val);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <label className="font-medium text-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {optional && <span className="text-xs text-muted-foreground">Optional</span>}
        </div>
      )}

      <div className="border-2 border-border rounded-3xl p-3 min-h-[52px] flex flex-wrap items-center gap-2 bg-background focus-within:border-foreground/60 focus-within:ring-1 focus-within:ring-foreground/60 transition-all duration-300">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1.5 bg-muted text-foreground px-3.5 py-1.5 rounded-full text-sm font-medium border border-border group transition-all duration-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-muted-foreground hover:text-foreground hover:bg-foreground/10 rounded-full p-0.5 transition-colors cursor-pointer"
              aria-label={`Remove ${tag}`}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : "Add another..."}
          className="flex-1 bg-transparent border-none text-base outline-none min-w-[140px] px-2 py-1 text-foreground placeholder:text-muted-foreground/70"
        />
      </div>
    </div>
  );
};
