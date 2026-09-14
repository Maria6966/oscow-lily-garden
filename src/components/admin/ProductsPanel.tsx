import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, KINDS, productImage, type Product } from "@/lib/shop";
import { ProductForm, emptyDraft, draftFromProduct, type Draft } from "./ProductForm";
import { inputClass } from "./types";

/** Управление ассортиментом магазина. */
export function ProductsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("Все");
  const [draft, setDraft] = useState<Draft | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products", "admin"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });

  const products = productsQuery.data ?? [];
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (kind === "Все" || p.kind === kind) &&
        (!q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)),
    );
  }, [products, search, kind]);

  const toggleActive = async (product: Product) => {
    await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    refresh();
  };

  const remove = async (product: Product) => {
    if (!confirm(`Удалить «${product.name}» из каталога?`)) return;
    await supabase.from("products").delete().eq("id", product.id);
    refresh();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию"
          className={`${inputClass} max-w-xs`}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={`${inputClass} max-w-[200px]`}>
          {["Все", ...KINDS].map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <span className="text-[12px] text-inksoft">
          {products.length} позиций · скрыто {products.filter((p) => !p.is_active).length}
        </span>
        <button
          type="button"
          onClick={() => setDraft(emptyDraft)}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-[13px] text-cream hover:bg-inksoft"
        >
          <Plus className="size-4" /> Добавить товар
        </button>
      </div>

      {productsQuery.isLoading ? (
        <p className="text-[13px] text-inksoft">Загружаем каталог…</p>
      ) : visible.length === 0 ? (
        <p className="text-[13px] text-inksoft">Ничего не найдено.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => (
            <article
              key={product.id}
              className="flex gap-4 rounded-2xl border border-ink/5 bg-card/70 p-4"
            >
              <img
                src={productImage(product)}
                alt={product.name}
                loading="lazy"
                className="size-24 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl text-ink">{product.name}</p>
                <p className="text-[12px] text-inksoft">
                  {product.kind}
                  {product.color ? ` · ${product.color}` : ""}
                </p>
                <p className="mt-1 text-[13px] text-ink">{formatPrice(product.price)}</p>
                <p className="text-[12px] text-inksoft">
                  {product.stems} ст. · {product.height_cm} см · до {product.vase_days} дн.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(product)}
                    className={`rounded-full px-3 py-1 text-[11px] ${
                      product.is_active ? "bg-sage/50 text-ink" : "bg-ink/10 text-inksoft"
                    }`}
                  >
                    {product.is_active ? "На сайте" : "Скрыт"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(draftFromProduct(product))}
                    className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1 text-[11px] text-ink hover:bg-cream"
                  >
                    <Pencil className="size-3" /> Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(draftFromProduct(product, true))}
                    aria-label={`Дублировать ${product.name}`}
                    className="rounded-full border border-ink/15 p-1.5 text-inksoft hover:text-ink"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(product)}
                    aria-label={`Удалить ${product.name}`}
                    className="rounded-full border border-ink/15 p-1.5 text-inksoft hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft && (
        <ProductForm
          initial={draft}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
