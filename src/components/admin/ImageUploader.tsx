import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/shop";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  value: string;
  onChange: (value: string) => void;
};

/** Загрузка фотографии товара с компьютера: выбор файла или перетаскивание. */
export function ImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File) => {
    setError("");
    if (!ALLOWED.includes(file.type)) {
      setError("Подходят только файлы JPG, PNG или WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Файл больше 5 МБ. Сожмите фотографию и попробуйте снова.");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);
    if (uploadError) {
      setError("Не удалось загрузить фотографию. Попробуйте ещё раз.");
      return;
    }
    onChange(`storage:${path}`);
  };

  const preview = value ? productImage({ image_url: value }) : "";

  return (
    <div>
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-inksoft">
        Фотография
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={`flex items-center gap-4 rounded-2xl border border-dashed p-3 transition-colors ${
          dragging ? "border-ink/50 bg-cream" : "border-ink/20 bg-cream/40"
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Фотография товара"
            className="size-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-inksoft">
            <ImagePlus className="size-6" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-[12px] text-inksoft">
            Перетащите файл сюда или выберите на компьютере. JPG, PNG, WebP, до 5 МБ.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-[12px] text-cream hover:bg-inksoft disabled:opacity-60"
            >
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              {busy ? "Загружаем…" : value ? "Заменить фото" : "Выбрать файл"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-4 py-1.5 text-[12px] text-inksoft hover:text-ink"
              >
                <Trash2 className="size-3.5" /> Убрать
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
