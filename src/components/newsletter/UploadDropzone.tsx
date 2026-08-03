import { useRef, useState } from "react";
import { Upload, FileJson, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseItems, ParseError } from "@/lib/newsletter/parse";
import type { Item, Lang } from "@/lib/newsletter/types";

interface Props {
  lang: Lang;
  label: string;
  count: number;
  onLoaded: (items: Item[]) => void;
}

export function UploadDropzone({ lang, label, count, onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const items = parseItems(JSON.parse(text), lang);
      if (items.length === 0) {
        setError("That file contains no items.");
        return;
      }
      onLoaded(items);
    } catch (caught) {
      setError(
        caught instanceof ParseError
          ? caught.message
          : "Could not read that file — is it valid JSON?",
      );
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/60"
        }`}
      >
        {count > 0 ? (
          <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
        )}
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {count > 0 ? `${count} items loaded` : "Drop the JSON file here, or click to browse"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
          <FileJson className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
      {count > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-7 px-2 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          Replace file
        </Button>
      ) : null}
    </div>
  );
}
