import { useId, useRef, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { uploadAdminImages } from "@/lib/api";
import { SiteImage } from "./site-image";
import "./admin-image-upload.css";

const imageAccept = "image/jpeg,image/png,image/webp";

type AdminImageUploadButtonProps = {
  onUploaded: (urls: string[]) => void;
  label?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  testId?: string;
  className?: string;
  onUploadingChange?: (isUploading: boolean) => void;
};

export function AdminImageUploadButton({
  onUploaded,
  label,
  multiple = false,
  maxFiles = 8,
  disabled = false,
  testId,
  className = "",
  onUploadingChange,
}: AdminImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const inputId = useId();
  const buttonLabel = label ?? (multiple ? "Upload images" : "Upload image");

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setError("");
    if (files.length === 0) return;
    if (files.length > maxFiles) {
      setError(`Choose no more than ${maxFiles} images at a time.`);
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const result = await uploadAdminImages(files);
      onUploaded(result.urls);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The images could not be uploaded. Please try again.",
      );
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  }

  return (
    <div className={`admin-image-upload-control ${className}`.trim()}>
      <input
        ref={inputRef}
        id={inputId}
        className="admin-image-file-input"
        type="file"
        accept={imageAccept}
        multiple={multiple}
        aria-label={buttonLabel}
        data-testid={testId ? `${testId}-file` : undefined}
        onChange={(event) => void handleFiles(event)}
      />
      <button
        className="admin-secondary admin-image-upload-button"
        type="button"
        data-testid={testId}
        disabled={disabled || isUploading || maxFiles < 1}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={15} aria-hidden="true" />
        {isUploading ? "Uploading…" : buttonLabel}
      </button>
      {isUploading && (
        <small className="admin-image-upload-status" role="status">
          Uploading image files…
        </small>
      )}
      {error && (
        <small
          className="admin-image-upload-error"
          role="alert"
          data-testid={testId ? `${testId}-error` : undefined}
        >
          {error}
        </small>
      )}
    </div>
  );
}

type AdminImageFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  testId?: string;
  multiple?: boolean;
  wide?: boolean;
  className?: string;
  onUploadingChange?: (isUploading: boolean) => void;
};

function imageLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AdminImageField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  testId,
  multiple = false,
  wide = true,
  className = "",
  onUploadingChange,
}: AdminImageFieldProps) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const values = multiple ? imageLines(value) : value.trim() ? [value.trim()] : [];

  function handleUpload(urls: string[]) {
    if (multiple) {
      onChange([...imageLines(value), ...urls].join("\n"));
    } else if (urls[0]) {
      onChange(urls[0]);
    }
  }

  return (
    <div
      className={`workspace-field admin-image-field${wide ? " wide" : ""} ${className}`.trim()}
    >
      <label className="admin-image-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="admin-image-input-row">
        {multiple ? (
          <textarea
            id={inputId}
            className="workspace-textarea"
            data-testid={testId}
            rows={3}
            value={value}
            disabled={isUploading}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={label}
          />
        ) : (
          <input
            id={inputId}
            className="workspace-input"
            data-testid={testId}
            type="text"
            maxLength={500}
            value={value}
            disabled={isUploading}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={label}
          />
        )}
        <AdminImageUploadButton
          onUploaded={handleUpload}
          multiple={multiple}
          maxFiles={8}
          testId={testId ? `${testId}-upload` : undefined}
          onUploadingChange={(uploading) => {
            setIsUploading(uploading);
            onUploadingChange?.(uploading);
          }}
        />
      </div>
      <small>
        {hint ? `${hint} ` : ""}
        Upload JPEG, PNG, or WebP images up to 12 MB each, or enter a public URL
        or image path.
      </small>
      {values.length > 0 && (
        <div className={multiple ? "trip-gallery-preview" : "trip-image-preview-wrap"}>
          {multiple ? (
            values.map((image, index) => (
              <SiteImage
                src={image}
                alt={`${label} preview ${index + 1}`}
                key={`${image}-${index}`}
              />
            ))
          ) : (
            <>
              <span>{label} preview</span>
              <SiteImage className="trip-image-preview" src={values[0]} alt={`${label} preview`} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
