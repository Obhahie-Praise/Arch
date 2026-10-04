"use client";
import { API_URL } from "../../lib/api";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, Image as ImageIcon, CheckCircle, RefreshCw, X } from "lucide-react";

interface FileUploadProps {
  label: string;
  accept?: string;
  valueUrl?: string;
  valueFilename?: string;
  onUploadSuccess: (url: string, filename: string) => void;
  onRemove?: () => void;
  type?: "image" | "document";
  optional?: boolean;
  required?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = "image/*,.pdf,.doc,.docx",
  valueUrl = "",
  valueFilename = "",
  onUploadSuccess,
  onRemove,
  type = "document",
  optional = false,
  required = false,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setProgress(20);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 150);

      const apiUrl = API_URL;
      const res = await fetch(`${apiUrl}/api/profile/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(interval);

      if (!res.ok) {
        throw new Error("Upload failed. Please try again.");
      }

      const data = await res.json();
      setProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(data.url, file.name);
      }, 300);
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || "Failed to upload file");
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <label className="font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {optional && <span className="text-xs text-muted-foreground">Optional</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={onFileChange}
        className="hidden"
      />

      {valueUrl ? (
        // Preview State with Hover "Upload another"
        <div className="relative group border border-border rounded-3xl p-4 bg-card flex items-center justify-between transition-all duration-300 hover:border-foreground/40">
          <div className="flex items-center gap-3 overflow-hidden">
            {type === "image" ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border border-border shrink-0 bg-muted">
                <img
                  src={valueUrl.startsWith("/") ? `${API_URL}${valueUrl}` : valueUrl}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-3 bg-muted rounded-2xl text-foreground shrink-0">
                <FileText size={22} strokeWidth={1.5} />
              </div>
            )}
            <div className="truncate">
              <p className="text-sm font-medium text-foreground truncate">
                {valueFilename || (type === "image" ? "Uploaded Photo" : "Uploaded Document")}
              </p>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-0.5">
                <CheckCircle size={12} />
                <span>Uploaded</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-medium border border-border rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              Upload another
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-2 text-muted-foreground hover:text-red-500 rounded-full transition-colors cursor-pointer"
                title="Remove file"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ) : (
        // Upload Dropzone
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-foreground bg-muted/40 scale-[1.01]"
              : "border-border hover:border-foreground/50 bg-background"
          }`}
        >
          {isUploading ? (
            <div className="w-full max-w-xs flex flex-col items-center gap-2 py-2">
              <RefreshCw size={24} className="animate-spin text-foreground" />
              <p className="text-sm font-medium text-foreground">Uploading...</p>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-foreground h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-1.5 border border-border rounded-full text-xs font-medium hover:bg-muted transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-full text-foreground mb-1">
                {type === "image" ? <ImageIcon size={22} strokeWidth={1.5} /> : <UploadCloud size={22} strokeWidth={1.5} />}
              </div>
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-muted-foreground">
                {type === "image" ? "PNG, JPG or WEBP (max 5MB)" : "PDF, DOCX or DOC (max 10MB)"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
