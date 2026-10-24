import headphones from "@/assets/p-headphones.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import cooker from "@/assets/p-cooker.jpg";
import serum from "@/assets/p-serum.jpg";
import watch from "@/assets/p-watch.jpg";
import backpack from "@/assets/p-backpack.jpg";
import yoga from "@/assets/p-yoga.jpg";

export type Category = { id: string; slug: string; name: string; description: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string; // category slug
  sku: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  isNew?: boolean;
  isDemo?: boolean;
  description: string;
  specs: Record<string, string>;
  variants?: { label: string; options: string[] } | undefined;
};

// Demo products store "asset:<key>" so they can use the bundled photos.
const assetImages: Record<string, string> = { headphones, sneakers, cooker, serum, watch, backpack, yoga };
export const resolveImage = (url: string) =>
  url.startsWith("asset:") ? (assetImages[url.slice(6)] ?? "") : url;

export const discount = (p: Pick<Product, "mrp" | "price">) =>
  p.mrp > 0 ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const deliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};
