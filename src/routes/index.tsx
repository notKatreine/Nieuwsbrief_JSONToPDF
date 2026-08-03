import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UploadDropzone } from "@/components/newsletter/UploadDropzone";
import { SectionNavigatorEditor } from "@/components/newsletter/SectionNavigatorEditor";
import { ItemEditor } from "@/components/newsletter/ItemEditor";
import { ChecksPanel } from "@/components/newsletter/ChecksPanel";
import { PdfPreview } from "@/components/newsletter/PdfPreview";
import { useNewsletterState } from "@/lib/newsletter/use-newsletter-state";
import { downloadPdf } from "@/lib/newsletter/pdf-runtime";
import type { Lang } from "@/lib/newsletter/types";
import {
  findingsByItem,
  validateNewsletter,
  visibleFindings,
  type Finding,
} from "@/lib/newsletter/validate";
import { toast } from "sonner";


const TITLE = "Newsletter PDF Builder — merge JSON into one formatted newsletter";
const DESCRIPTION =
  "Merge Dutch and English JSON item lists into a single branded Research Support newsletter PDF, with a clickable section navigator and language switch.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsletterBuilder,
});

function NewsletterBuilder() {
  const {
    state,
    allCategories,
    setItems,
    updateItem,
    removeItem,
    moveItem,
    addItem,
    copyToOtherLanguage,
    dismissFinding,
    setSections,
    patch,
    reset,
    loadSample,
  } = useNewsletterState();
  const [downloading, setDownloading] = useState(false);
  const [lang, setLang] = useState<Lang>("nl");
  const [openNl, setOpenNl] = useState<string[]>([]);
  const [openEn, setOpenEn] = useState<string[]>([]);
  const [pendingErrors, setPendingErrors] = useState<Finding[] | null>(null);

  const hasContent = state.nl.length > 0 || state.en.length > 0;

  const findings = useMemo(
    () => visibleFindings(validateNewsletter(state), state.dismissedFindings ?? []),
    [state],
  );
  const itemSeverity = useMemo(() => findingsByItem(findings), [findings]);
  const errors = useMemo(() => findings.filter((f) => f.severity === "error"), [findings]);

  const categoryOptions = useMemo(() => {
    const seen = [...allCategories];
    for (const section of state.sections) {
      for (const category of section.categories) {
        if (!seen.includes(category)) seen.push(category);
      }
    }
    return seen.sort((a, b) => a.localeCompare(b));
  }, [allCategories, state.sections]);

  const jumpToItem = (target: Lang, itemId: string) => {
    setLang(target);
    const setOpen = target === "nl" ? setOpenNl : setOpenEn;
    setOpen((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    window.requestAnimationFrame(() => {
      document.getElementById(`${itemId}-title`)?.scrollIntoView({ block: "center" });
      document.getElementById(`${itemId}-title`)?.focus();
    });
  };

  const handleAddItem = () => {
    const fallback = state.sections[0]?.categories[0] ?? "Nieuws";
    const id = addItem(lang, fallback);
    const setOpen = lang === "nl" ? setOpenNl : setOpenEn;
    setOpen((prev) => [...prev, id]);
    window.requestAnimationFrame(() => {
      document.getElementById(`${id}-title`)?.scrollIntoView({ block: "center" });
      document.getElementById(`${id}-title`)?.focus();
    });
  };

  const handleCopyToOther = (from: Lang, id: string) => {
    const created = copyToOtherLanguage(from, id);
    toast.success(`Copied to the ${created.lang === "nl" ? "Dutch" : "English"} list`);
  };

  const buildPdf = async () => {
    setDownloading(true);
    try {
      await downloadPdf(state, `Nieuwsbrief_${state.month}_${state.year}.pdf`);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build the PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownload = async () => {
    if (errors.length > 0) {
      setPendingErrors(errors);
      return;
    }
    await buildPdf();
  };


  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar">
        <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              Research Support Newsletter Builder
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Merge your NL + EN JSON exports into one formatted PDF
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={loadSample}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Sample
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={!hasContent || downloading}>
              <Download className="mr-1.5 h-4 w-4" />
              {downloading ? "Building…" : "Download PDF"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              1. Source files
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <UploadDropzone
                lang="nl"
                label="Dutch items (items_nl.json)"
                count={state.nl.length}
                onLoaded={(items) => setItems("nl", items)}
              />
              <UploadDropzone
                lang="en"
                label="English items (items_en.json)"
                count={state.en.length}
                onLoaded={(items) => setItems("en", items)}
              />
            </div>
          </section>

          {hasContent && (
            <ChecksPanel findings={findings} onDismiss={dismissFinding} onJump={jumpToItem} />
          )}



          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              2. Header
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs" htmlFor="month">
                  Month
                </Label>
                <Input
                  id="month"
                  value={state.month}
                  maxLength={20}
                  onChange={(event) => patch({ month: event.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs" htmlFor="year">
                  Year
                </Label>
                <Input
                  id="year"
                  value={state.year}
                  maxLength={4}
                  onChange={(event) => patch({ year: event.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs" htmlFor="subtitle-nl">
                  Dutch cover title
                </Label>
                <Input
                  id="subtitle-nl"
                  value={state.headerNl.subtitle}
                  maxLength={120}
                  onChange={(event) =>
                    patch({ headerNl: { ...state.headerNl, subtitle: event.target.value } })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs" htmlFor="intro-nl">
                  Dutch intro
                </Label>
                <Textarea
                  id="intro-nl"
                  rows={3}
                  value={state.headerNl.intro}
                  maxLength={800}
                  onChange={(event) =>
                    patch({ headerNl: { ...state.headerNl, intro: event.target.value } })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs" htmlFor="reminder-nl">
                  Dutch reminder box
                </Label>
                <Textarea
                  id="reminder-nl"
                  rows={4}
                  value={state.headerNl.reminder}
                  maxLength={800}
                  onChange={(event) =>
                    patch({ headerNl: { ...state.headerNl, reminder: event.target.value } })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs" htmlFor="subtitle-en">
                  English cover title
                </Label>
                <Input
                  id="subtitle-en"
                  value={state.headerEn.subtitle}
                  maxLength={120}
                  onChange={(event) =>
                    patch({ headerEn: { ...state.headerEn, subtitle: event.target.value } })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs" htmlFor="intro-en">
                  English intro
                </Label>
                <Textarea
                  id="intro-en"
                  rows={3}
                  value={state.headerEn.intro}
                  maxLength={800}
                  onChange={(event) =>
                    patch({ headerEn: { ...state.headerEn, intro: event.target.value } })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs" htmlFor="reminder-en">
                  English reminder box
                </Label>
                <Textarea
                  id="reminder-en"
                  rows={4}
                  value={state.headerEn.reminder}
                  maxLength={800}
                  onChange={(event) =>
                    patch({ headerEn: { ...state.headerEn, reminder: event.target.value } })
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              3. Section navigator
            </h2>
            <SectionNavigatorEditor
              sections={state.sections}
              allCategories={allCategories}
              onChange={setSections}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                4. Items
              </h2>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="mr-1.5 h-4 w-4" /> Add item
              </Button>
            </div>
            <Tabs value={lang} onValueChange={(value) => setLang(value as Lang)}>
              <TabsList>
                <TabsTrigger value="nl">Dutch ({state.nl.length})</TabsTrigger>
                <TabsTrigger value="en">English ({state.en.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="nl">
                <ItemEditor
                  lang="nl"
                  items={state.nl}
                  categories={categoryOptions}
                  itemSeverity={itemSeverity}
                  open={openNl}
                  onOpenChange={setOpenNl}
                  onUpdate={(id, itemPatch) => updateItem("nl", id, itemPatch)}
                  onRemove={(id) => removeItem("nl", id)}
                  onMove={(id, direction) => moveItem("nl", id, direction)}
                  onCopyToOther={(id) => handleCopyToOther("nl", id)}
                />
              </TabsContent>
              <TabsContent value="en">
                <ItemEditor
                  lang="en"
                  items={state.en}
                  categories={categoryOptions}
                  itemSeverity={itemSeverity}
                  open={openEn}
                  onOpenChange={setOpenEn}
                  onUpdate={(id, itemPatch) => updateItem("en", id, itemPatch)}
                  onRemove={(id) => removeItem("en", id)}
                  onMove={(id, direction) => moveItem("en", id, direction)}
                  onCopyToOther={(id) => handleCopyToOther("en", id)}
                />
              </TabsContent>
            </Tabs>
          </section>

        </div>

        <div className="min-w-0 lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
          {hasContent ? (
            <PdfPreview state={state} />
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Upload your JSON files (or load the sample) to see the newsletter preview here.
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingErrors !== null}
        onOpenChange={(open) => !open && setPendingErrors(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingErrors?.length} issue{pendingErrors?.length === 1 ? "" : "s"} need attention
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <p>These items will not look right in the PDF:</p>
                <ul className="list-disc space-y-1 pl-4">
                  {pendingErrors?.slice(0, 5).map((finding) => (
                    <li key={finding.id}>{finding.message}</li>
                  ))}
                </ul>
                {(pendingErrors?.length ?? 0) > 5 && (
                  <p>and {(pendingErrors?.length ?? 0) - 5} more.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back to fixing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPendingErrors(null);
                void buildPdf();
              }}
            >
              Download anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>

  );
}
