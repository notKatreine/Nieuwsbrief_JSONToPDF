import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { NavSection } from "@/lib/newsletter/types";

interface Props {
  sections: NavSection[];
  allCategories: string[];
  onChange: (sections: NavSection[]) => void;
}

export function SectionNavigatorEditor({ sections, allCategories, onChange }: Props) {
  const update = (id: string, patch: Partial<NavSection>) =>
    onChange(sections.map((section) => (section.id === id ? { ...section, ...patch } : section)));

  const move = (index: number, direction: -1 | 1) => {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const toggleCategory = (section: NavSection, category: string) => {
    const has = section.categories.some((c) => c.toLowerCase() === category.toLowerCase());
    update(section.id, {
      categories: has
        ? section.categories.filter((c) => c.toLowerCase() !== category.toLowerCase())
        : [...section.categories, category],
    });
  };

  const addSection = () =>
    onChange([
      ...sections,
      {
        id: `sec-${Date.now().toString(36)}`,
        labelNl: "Nieuwe sectie",
        labelEn: "New section",
        categories: [],
      },
    ]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        These entries become the clickable navigator on both cover pages. Each one jumps to its
        section inside the PDF.
      </p>

      {sections.map((section, index) => (
        <div key={section.id} className="rounded-lg border border-border bg-card p-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-end sm:gap-3">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs" htmlFor={`${section.id}-nl`}>
                  Dutch label
                </Label>
                <Input
                  id={`${section.id}-nl`}
                  value={section.labelNl}
                  maxLength={40}
                  onChange={(event) => update(section.id, { labelNl: event.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs" htmlFor={`${section.id}-en`}>
                  English label
                </Label>
                <Input
                  id={`${section.id}-en`}
                  value={section.labelEn}
                  maxLength={40}
                  onChange={(event) => update(section.id, { labelEn: event.target.value })}
                />
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="Move section up"
                onClick={() => move(index, -1)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Move section down"
                onClick={() => move(index, 1)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Remove section"
                onClick={() => onChange(sections.filter((s) => s.id !== section.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Categories collected here
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allCategories.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Load your JSON files to pick categories.
                </span>
              ) : (
                allCategories.map((category) => {
                  const active = section.categories.some(
                    (c) => c.toLowerCase() === category.toLowerCase(),
                  );
                  return (
                    <button key={category} type="button" onClick={() => toggleCategory(section, category)}>
                      <Badge variant={active ? "default" : "outline"} className="cursor-pointer">
                        {category}
                      </Badge>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addSection}>
        <Plus className="mr-1.5 h-4 w-4" /> Add navigator entry
      </Button>
    </div>
  );
}
