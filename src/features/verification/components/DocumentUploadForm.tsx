"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, FileText, ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  uploadDocumentAction,
  type VerificationFormState,
} from "@/features/verification/actions";
import {
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  documentTypeLabels,
  verificationDocumentTypeValues,
} from "@/features/verification/schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function formatMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<VerificationFormState, FormData>(
    uploadDocumentAction,
    {},
  );
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [docType, setDocType] = useState<"NGO_LICENSE" | "OFFICIAL_ID">("NGO_LICENSE");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.message && state.message !== lastMessageRef.current) {
      lastMessageRef.current = state.message;
      toast.success(state.message);
      setFile(null);
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  function acceptFile(f: File | null | undefined) {
    setLocalError(null);
    if (!f) return;
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(f.type)) {
      setLocalError("Only JPEG, PNG and PDF files are allowed.");
      return;
    }
    if (f.size > MAX_DOCUMENT_SIZE_BYTES) {
      setLocalError(`That file is ${formatMB(f.size)} — the limit is 10 MB.`);
      return;
    }
    // The hidden input carries the File into the server action's FormData.
    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(f);
      inputRef.current.files = dt.files;
    }
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload document — drag and drop or press Enter to browse"
        aria-describedby="upload-hint"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          acceptFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-primary bg-accent/60" : "border-border hover:bg-muted/50",
        )}
      >
        <CloudUpload className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {file ? file.name : "Drag & drop your document here"}
        </p>
        <p id="upload-hint" className="text-xs text-muted-foreground">
          {file
            ? `${formatMB(file.size)} — click to choose a different file`
            : "or click to browse · JPEG, PNG or PDF · up to 10 MB"}
        </p>
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          className="sr-only"
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {file.type === "application/pdf" ? (
              <FileText className="size-5 shrink-0 text-muted-foreground" />
            ) : (
              <ImageIcon className="size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatMB(file.size)}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={clearFile} aria-label="Remove selected file">
            <X className="size-4" />
          </Button>
        </div>
      )}

      {localError && (
        <Alert variant="destructive">
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label>Document type</Label>
        <Select name="documentType" value={docType} onValueChange={(v: typeof docType) => setDocType(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {verificationDocumentTypeValues.map((t) => (
              <SelectItem key={t} value={t}>
                {documentTypeLabels[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={pending || !file}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
        {pending ? "Uploading…" : "Upload for review"}
      </Button>

      {pending && (
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Uploading"
        >
          <div className="h-full w-1/3 rounded-full bg-primary animate-[upload-slide_1.2s_ease-in-out_infinite]" />
        </div>
      )}
    </form>
  );
}
