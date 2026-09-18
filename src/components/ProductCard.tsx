import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPrice, productImage, type Product } from "@/lib/shop";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="group rounded-2xl border border-ink/5 bg-card/70 p-3 transition-colors hover:border-petaldeep/40">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <img
          src={productImage(product)}
          alt={`Лилия ${product.name}`}
          loading="lazy"
          width={912}
          height={912}
          className="mb-3 aspect-square w-full rounded-xl object-cover"
        />
        <p className="text-[10px] uppercase tracking-widest text-sagedeep">{product.kind}</p>
        <h3 className="mt-1 font-display text-xl text-ink">{product.name}</h3>
        <p className="mt-1 text-[12px] text-inksoft">
          {product.color}, {product.stems} стеблей, {product.height_cm} см
        </p>
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">
          {formatPrice(product.price)} <span className="font-normal text-inksoft">/букет</span>
        </span>
        <button
          type="button"
          aria-label={`Добавить ${product.name} в корзину`}
          onClick={() => {
            add({
              slug: product.slug,
              name: product.name,
              kind: product.kind,
              stems: product.stems,
              price: product.price,
            });
            toast.success(`«${product.name}» добавлен в корзину`, {
              description: `${product.kind} · ${formatPrice(product.price)}`,
            });
          }}
          className="grid size-8 place-items-center rounded-full bg-ink text-lg leading-none text-cream transition-colors group-hover:bg-petaldeep group-hover:text-ink"
        >
          +
        </button>
      </div>
    </article>
  );
}
