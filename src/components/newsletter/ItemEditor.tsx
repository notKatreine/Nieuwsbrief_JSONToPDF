import { AlertTriangle, ChevronDown, ChevronUp, Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Item, Lang } from "@/lib/newsletter/types";
import type { Severity } from "@/lib/newsletter/validate";

interface Props {
  lang: Lang;
  items: Item[];
  categories: string[];
  itemSeverity: Record<string, Severity>;
  open: string[];
  onOpenChange: (value: string[]) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onCopyToOther: (id: string) => void;
}

export function ItemEditor({
  lang,
  items,
  categories,
  itemSeverity,
  open,
  onOpenChange,
  onUpdate,
  onRemove,
  onMove,
  onCopyToOther,
}: Props) {
  const listId = `categories-${lang}`;
  const otherLabel = lang === "nl" ? "English" : "Dutch";

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No items yet — upload the {lang === "nl" ? "Dutch" : "English"} JSON file above, or use
        “Add item” to write one by hand.
      </p>
    );
  }

  return (
    <>
      <datalist id={listId}>
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <Accordion type="multiple" className="w-full" value={open} onValueChange={onOpenChange}>
        {items.map((item, index) => {
          const severity = itemSeverity[item.id];
          return (
            <AccordionItem key={item.id} value={item.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <AccordionTrigger className="min-w-0 py-3 text-left">
                  <span className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {severity && (
                        <AlertTriangle
                          aria-label={severity === "error" ? "Has an error" : "Has a warning"}
                          className={`h-3.5 w-3.5 shrink-0 ${
                            severity === "error" ? "text-destructive" : "text-muted-foreground"
                          }`}
                        />
                      )}
                      <span
                        className={`truncate text-sm font-medium ${item.included ? "" : "line-through opacity-50"}`}
                      >
                        {item.title || "Untitled item"}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.category}
                      {item.deadline ? ` · ${item.deadline}` : ""}
                    </span>
                  </span>
                </AccordionTrigger>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={item.included ? "Exclude item" : "Include item"}
                    onClick={() => onUpdate(item.id, { included: !item.included })}
                  >
                    {item.included ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Copy item to ${otherLabel}`}
                    title={`Copy to ${otherLabel}`}
                    onClick={() => onCopyToOther(item.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move item up"
                    disabled={index === 0}
                    onClick={() => onMove(item.id, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move item down"
                    disabled={index === items.length - 1}
                    onClick={() => onMove(item.id, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete item"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <AccordionContent>
                <div className="grid gap-3 pb-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="text-xs" htmlFor={`${item.id}-title`}>
                      Title
                    </Label>
                    <Input
                      id={`${item.id}-title`}
                      value={item.title}
                      maxLength={200}
                      onChange={(event) => onUpdate(item.id, { title: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs" htmlFor={`${item.id}-org`}>
                      Organisation
                    </Label>
                    <Input
                      id={`${item.id}-org`}
                      value={item.organization}
                      maxLength={80}
                      onChange={(event) => onUpdate(item.id, { organization: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs" htmlFor={`${item.id}-cat`}>
                      Category
                    </Label>
                    <Input
                      id={`${item.id}-cat`}
                      list={listId}
                      value={item.category}
                      maxLength={60}
                      placeholder="Pick or type a category"
                      onChange={(event) => onUpdate(item.id, { category: event.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs" htmlFor={`${item.id}-desc`}>
                      Description
                    </Label>
                    <Textarea
                      id={`${item.id}-desc`}
                      rows={3}
                      value={item.description}
                      maxLength={1200}
                      onChange={(event) => onUpdate(item.id, { description: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs" htmlFor={`${item.id}-deadline`}>
                      Deadline
                    </Label>
                    <Input
                      id={`${item.id}-deadline`}
                      value={item.deadline}
                      maxLength={80}
                      onChange={(event) => onUpdate(item.id, { deadline: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs" htmlFor={`${item.id}-url`}>
                      Link (optional)
                    </Label>
                    <Input
                      id={`${item.id}-url`}
                      value={item.url}
                      maxLength={2000}
                      placeholder="https://"
                      onChange={(event) => onUpdate(item.id, { url: event.target.value })}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
}
