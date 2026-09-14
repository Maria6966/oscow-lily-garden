import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KINDS, type Product } from "@/lib/shop";
import { ImageUploader } from "./ImageUploader";
import { inputClass } from "./types";

const RU: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .split("")
    .map((ch) => (ch in RU ? RU[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type Draft = {
  id?: string;
  slug: string;
  name: string;
  kind: string;
  color: string;
  description: string;
  price: number;
  stems: number;
  height_cm: number;
  vase_days: number;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

export const emptyDraft: Draft = {
  slug: "",
  name: "",
  kind: "Ориентальная",
  color: "",
  description: "",
  price: 3200,
  stems: 5,
  height_cm: 60,
  vase_days: 10,
  image_url: "",
  is_active: true,
  sort_order: 100,
};

export function draftFromProduct(product: Product, copy = false): Draft {
  return {
    id: copy ? undefined : product.id,
    slug: copy ? `${product.slug}-kopiya` : product.slug,
    name: copy ? `${product.name} (копия)` : product.name,
    kind: product.kind,
    color: product.color,
    description: product.description,
    price: product.price,
    stems: product.stems,
    height_cm: product.height_cm,
    vase_days: product.vase_days,
    image_url: product.image_url,
    is_active: product.is_active,
    sort_order: product.sort_order,
  };
}

type Props = {
  initial: Draft;
  onClose: () => void;
  onSaved: () => void;
};

/** Карточка редактирования товара во всплывающем окне. */
export function ProductForm({ initial, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const slug = draft.slug.trim() || slugify(draft.name);
    if (!slug) {
      setError("Укажите название товара.");
      return;
    }
    setSaving(true);
    const payload = {
      slug,
      name: draft.name.trim(),
      kind: draft.kind,
      color: draft.color.trim(),
      description: draft.description.trim(),
      price: Number(draft.price) || 0,
      stems: Number(draft.stems) || 1,
      height_cm: Number(draft.height_cm) || 1,
      vase_days: Number(draft.vase_days) || 1,
      image_url: draft.image_url.trim(),
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order) || 0,
    };
    const { error: saveError } = draft.id
      ? await supabase.from("products").update(payload).eq("id", draft.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (saveError) {
      setError("Не удалось сохранить. Проверьте, что адрес-ссылка уникальна.");
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-3xl rounded-3xl border border-ink/10 bg-card p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="label-caps mb-1">Каталог</p>
            <h2 className="font-display text-3xl text-ink">
              {draft.id ? draft.name || "Редактирование" : "Новая позиция"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-full border border-ink/15 p-2 text-inksoft hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-5">
          <ImageUploader value={draft.image_url} onChange={(v) => set("image_url", v)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Название">
            <input
              required
              value={draft.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((prev) => ({
                  ...prev,
                  name,
                  slug: prev.id || prev.slug !== slugify(prev.name) ? prev.slug : slugify(name),
                }));
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Адрес-ссылка (латиницей)">
            <input
              value={draft.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Вид">
            <select value={draft.kind} onChange={(e) => set("kind", e.target.value)} className={inputClass}>
              {KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Оттенок">
            <input value={draft.color} onChange={(e) => set("color", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Цена, ₽">
            <input type="number" min={0} value={draft.price} onChange={(e) => set("price", Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Стеблей">
            <input type="number" min={1} value={draft.stems} onChange={(e) => set("stems", Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Высота, см">
            <input type="number" min={1} value={draft.height_cm} onChange={(e) => set("height_cm", Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Стойкость, дней">
            <input type="number" min={1} value={draft.vase_days} onChange={(e) => set("vase_days", Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Порядок вывода">
            <input type="number" value={draft.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Показывать на сайте">
            <select
              value={draft.is_active ? "1" : "0"}
              onChange={(e) => set("is_active", e.target.value === "1")}
              className={inputClass}
            >
              <option value="1">Да</option>
              <option value="0">Нет</option>
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Описание">
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-ink px-7 py-2.5 text-[13px] text-cream hover:bg-inksoft disabled:opacity-60"
          >
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/20 px-6 py-2.5 text-[13px] text-ink hover:bg-cream"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-inksoft">{label}</span>
      {children}
    </label>
  );
}
