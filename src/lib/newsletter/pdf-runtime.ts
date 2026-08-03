import logoAsset from "@/assets/rso-logo.jpeg";
import coverAsset from "@/assets/cover-illustration.jpeg";
import { buildDocument, type BuildAssets } from "./pdf";
import type { NewsletterState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfMakePromise: Promise<any> | null = null;

async function getPdfMake() {
  if (!pdfMakePromise) {
    pdfMakePromise = (async () => {
      const mod = await import("pdfmake/build/pdfmake");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfMake: any = (mod as any).default ?? mod;
      const fonts = await import("pdfmake/build/vfs_fonts");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vfs = (fonts as any).default ?? fonts;
      if (typeof pdfMake.addVirtualFileSystem === "function") {
        pdfMake.addVirtualFileSystem(vfs);
      } else {
        pdfMake.vfs = vfs.vfs ?? vfs;
      }
      return pdfMake;
    })();
  }
  return pdfMakePromise;
}

const dataUrlCache = new Map<string, string>();

async function toDataUrl(url: string): Promise<string | null> {
  const cached = dataUrlCache.get(url);
  if (cached) return cached;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    dataUrlCache.set(url, result);
    return result;
  } catch {
    return null;
  }
}

export async function loadAssets(): Promise<BuildAssets> {
  const [logo, cover] = await Promise.all([
    toDataUrl(logoAsset.url),
    toDataUrl(coverAsset.url),
  ]);
  return { logo, cover };
}

export async function generatePdfBlob(state: NewsletterState): Promise<Blob> {
  const [pdfMake, assets] = await Promise.all([getPdfMake(), loadAssets()]);
  const { docDefinition } = buildDocument(state, assets);
  const pdf = pdfMake.createPdf(docDefinition);
  return await new Promise<Blob>((resolve, reject) => {
    try {
      const maybePromise = pdf.getBlob((result: Blob) => resolve(result));
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(resolve, (error: unknown) => {
          console.error("pdf build failed", error);
          reject(error);
        });
      }

    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export async function generatePdfBlobUrl(state: NewsletterState): Promise<string> {
  const [pdfMake, assets] = await Promise.all([getPdfMake(), loadAssets()]);
  const { docDefinition } = buildDocument(state, assets);
  const pdf = pdfMake.createPdf(docDefinition);
  // pdfmake 0.3 returns a promise from getBlob(); 0.2 only calls a callback.
  const blob = await new Promise<Blob>((resolve, reject) => {
    try {
      const maybePromise = pdf.getBlob((result: Blob) => resolve(result));
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(resolve, (error: unknown) => {
          console.error("pdf build failed", error);
          reject(error);
        });
      }

    } catch (error) {
      console.error("pdf build failed", error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }

  });
  return URL.createObjectURL(blob);
}


export async function downloadPdf(state: NewsletterState, filename: string): Promise<void> {
  const [pdfMake, assets] = await Promise.all([getPdfMake(), loadAssets()]);
  const { docDefinition } = buildDocument(state, assets);
  pdfMake.createPdf(docDefinition).download(filename);
}
