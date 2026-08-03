import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePdfBlob } from "@/lib/newsletter/pdf-runtime";
import type { NewsletterState } from "@/lib/newsletter/types";

interface Props {
  state: NewsletterState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsPromise: Promise<any> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export function PdfPreview({ state }: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      (async () => {
        const [pdfjs, blob] = await Promise.all([getPdfjs(), generatePdfBlob(state)]);
        const data = new Uint8Array(await blob.arrayBuffer());
        const doc = await pdfjs.getDocument({ data }).promise;
        const rendered: string[] = [];
        const scale = 1.6;
        for (let index = 1; index <= doc.numPages; index += 1) {
          if (cancelled) break;
          const page = await doc.getPage(index);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const context = canvas.getContext("2d");
          if (!context) continue;
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          rendered.push(canvas.toDataURL("image/png"));
        }
        if (!cancelled) setPages(rendered);
      })()
        .catch((caught: unknown) => {
          if (!cancelled) {
            setError(caught instanceof Error ? caught.message : "Could not render the preview.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state, nonce]);

  return (
    <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-xl border border-border bg-muted">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-card px-3 py-2">
        <p className="min-w-0 truncate text-sm font-medium">
          Preview
          {loading ? (
            <span className="ml-2 inline-flex items-center text-xs text-muted-foreground">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> rendering…
            </span>
          ) : pages.length ? (
            <span className="ml-2 text-xs text-muted-foreground">
              {pages.length} page{pages.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setNonce((value) => value + 1)}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {error ? (
        <p className="p-4 text-sm text-destructive">{error}</p>
      ) : pages.length ? (
        <div ref={containerRef} className="flex-1 space-y-4 overflow-auto p-4">
          {pages.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Newsletter page ${index + 1}`}
              className="mx-auto w-full max-w-full rounded-md border border-border bg-card shadow-sm"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building your newsletter…
        </div>
      )}
    </div>
  );
}
