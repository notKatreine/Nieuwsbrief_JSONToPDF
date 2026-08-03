import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryLabel } from "@/lib/newsletter/types";

interface Props {
  labels: CategoryLabel[];
  /** Category keys actually used by the loaded items, if any. */
  usedKeys: string[];
  onChange: (labels: CategoryLabel[]) => void;
}

export function CategoryLabelEditor({ labels, usedKeys, onChange }: Props) {
  const used = new Set(usedKeys);
  const visible = labels.filter((label) => used.size === 0 || used.has(label.key));

  const update = (key: string, patch: Partial<CategoryLabel>) =>
    onChange(labels.map((label) => (label.key === key ? { ...label, ...patch } : label)));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Category names are printed as subtitles and as links on the cover. Give each one a Dutch
        and an English label so the English half never shows Dutch words.
      </p>

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">Load your JSON files to see categories.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((label) => (
            <div key={label.key} className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs" htmlFor={`cat-${label.key}-nl`}>
                  Dutch label
                </Label>
                <Input
                  id={`cat-${label.key}-nl`}
                  value={label.labelNl}
                  maxLength={60}
                  onChange={(event) => update(label.key, { labelNl: event.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs" htmlFor={`cat-${label.key}-en`}>
                  English label
                </Label>
                <Input
                  id={`cat-${label.key}-en`}
                  value={label.labelEn}
                  maxLength={60}
                  onChange={(event) => update(label.key, { labelEn: event.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
