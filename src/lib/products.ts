import headphones from "@/assets/p-headphones.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import cooker from "@/assets/p-cooker.jpg";
import serum from "@/assets/p-serum.jpg";
import watch from "@/assets/p-watch.jpg";
import backpack from "@/assets/p-backpack.jpg";
import yoga from "@/assets/p-yoga.jpg";

export type Category = { slug: string; name: string; description: string };

export const categories: Category[] = [
  { slug: "electronics", name: "Electronics", description: "Audio, wearables and smart gadgets for everyday life." },
  { slug: "fashion", name: "Fashion", description: "Shoes, bags and clothing for every occasion." },
  { slug: "home-kitchen", name: "Home & Kitchen", description: "Cookware and essentials for a better home." },
  { slug: "beauty", name: "Beauty", description: "Skincare and personal care you'll love." },
  { slug: "sports", name: "Sports & Fitness", description: "Gear up for your workouts and outdoor play." },
];

export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  isNew?: boolean;
  description: string;
  specs: Record<string, string>;
  variants?: { label: string; options: string[] };
};

export const products: Product[] = [
  { slug: "aurawave-anc-headphones", name: "AuraWave ANC Wireless Headphones", brand: "AuraWave", category: "electronics", sku: "AW-H100", price: 4999, mrp: 9999, rating: 4.4, reviews: 2381, stock: 42, image: headphones, description: "Active noise cancellation, 40-hour battery and plush memory-foam cushions for all-day listening.", specs: { Battery: "40 hours", Connectivity: "Bluetooth 5.3", Weight: "250 g" }, variants: { label: "Colour", options: ["Midnight Black", "Stone Grey"] } },
  { slug: "pulsefit-smartwatch", name: "PulseFit Pro Smartwatch with SpO2", brand: "PulseFit", category: "electronics", sku: "PF-W22", price: 2799, mrp: 5999, rating: 4.1, reviews: 1204, stock: 8, image: watch, isNew: true, description: "1.8\" AMOLED display, heart-rate and SpO2 tracking, 100+ sports modes and 7-day battery.", specs: { Display: "1.8\" AMOLED", "Water resistance": "IP68", Battery: "7 days" } },
  { slug: "flexride-running-shoes", name: "FlexRide Men's Running Shoes", brand: "FlexRide", category: "fashion", sku: "FR-R7", price: 1899, mrp: 3499, rating: 4.3, reviews: 864, stock: 25, image: sneakers, description: "Breathable knit upper with responsive foam cushioning for daily runs.", specs: { Upper: "Knit mesh", Sole: "EVA foam", Closure: "Lace-up" }, variants: { label: "Size (UK)", options: ["6", "7", "8", "9", "10"] } },
  { slug: "heritage-canvas-backpack", name: "Heritage Canvas Laptop Backpack 25L", brand: "Heritage Supply", category: "fashion", sku: "HS-B25", price: 1299, mrp: 2199, rating: 4.5, reviews: 512, stock: 0, image: backpack, description: "Water-resistant canvas with a padded 15.6\" laptop sleeve and leather pull tabs.", specs: { Capacity: "25 L", Material: "Canvas", "Laptop size": "Up to 15.6\"" } },
  { slug: "steelchef-pressure-cooker", name: "SteelChef Stainless Steel Pressure Cooker 3L", brand: "SteelChef", category: "home-kitchen", sku: "SC-P3", price: 1549, mrp: 2450, rating: 4.6, reviews: 3120, stock: 60, image: cooker, description: "Induction-ready tri-ply base with a safety valve and 5-year warranty.", specs: { Capacity: "3 L", Base: "Induction & gas", Warranty: "5 years" }, variants: { label: "Capacity", options: ["3 L", "5 L"] } },
  { slug: "glow-rituals-vitamin-c-serum", name: "Glow Rituals Vitamin C Face Serum 30ml", brand: "Glow Rituals", category: "beauty", sku: "GR-VC30", price: 549, mrp: 899, rating: 4.2, reviews: 4410, stock: 120, image: serum, isNew: true, description: "15% Vitamin C with hyaluronic acid to brighten and even skin tone.", specs: { Volume: "30 ml", "Skin type": "All", Fragrance: "Free" } },
  { slug: "corezen-yoga-kit", name: "CoreZen Yoga Mat with Dumbbell Set", brand: "CoreZen", category: "sports", sku: "CZ-YK1", price: 1199, mrp: 1999, rating: 4.0, reviews: 288, stock: 15, image: yoga, isNew: true, description: "6mm anti-slip mat with carry strap plus a pair of 2.3 kg neoprene dumbbells.", specs: { Thickness: "6 mm", Dumbbells: "2 × 2.3 kg", Material: "TPE" } },
];

export const discount = (p: Product) => Math.round(((p.mrp - p.price) / p.mrp) * 100);
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const deliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};
