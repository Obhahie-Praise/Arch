"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  disabled = false,
  searchable = false,
  required = false,
  optional = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={`flex flex-col gap-1 relative ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <label className="font-medium text-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {optional && <span className="text-xs text-muted-foreground">Optional</span>}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`flex items-center justify-between px-6 py-3 border border-border rounded-full w-full text-left bg-background text-base transition-all duration-300 ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:border-foreground/40 focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60"
        } ${isOpen ? "border-foreground/60 ring-1 ring-foreground/60" : ""}`}
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground/70"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          className={`transition-transform duration-200 text-muted-foreground ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto bg-background rounded-4xl border border-border shadow-xl px-2 pb-2  transition-all duration-200"
        >
          {searchable && (
            <div className="p-2 border-b border-border mb-1 sticky top-0 bg-background">
              <div className="flex items-center px-3 py-1.5 border border-border rounded-full bg-muted/30 gap-2">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No options available
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-foreground text-background font-medium"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={16} strokeWidth={2} className="shrink-0 ml-2" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
