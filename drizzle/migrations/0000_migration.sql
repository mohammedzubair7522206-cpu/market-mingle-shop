-- Roles
create type public.app_role as enum ('admin', 'customer');
create type public.order_status as enum ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Catalog
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Public reads active categories" on public.categories for select to anon, authenticated
  using (is_active or public.has_role(auth.uid(),'admin'));
create policy "Admins manage categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null default '',
  category_id uuid references public.categories(id) on delete restrict not null,
  sku text not null unique,
  price integer not null check (price >= 0),
  mrp integer not null check (mrp >= 0),
  rating numeric(2,1) not null default 0,
  reviews integer not null default 0,
  stock integer not null default 0 check (stock >= 0),
  image_url text not null default '',
  is_new boolean not null default false,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  description text not null default '',
  specs jsonb not null default '{}'::jsonb,
  variant_label text,
  variant_options text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Public reads active products" on public.products for select to anon, authenticated
  using (is_active or public.has_role(auth.uid(),'admin'));
create policy "Admins manage products" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

-- Addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "Own addresses" on public.addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cart & wishlist
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  variant text not null default '',
  qty integer not null check (qty between 1 and 10),
  created_at timestamptz not null default now(),
  unique (user_id, product_id, variant)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "Own cart" on public.cart_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, delete on public.wishlist_items to authenticated;
grant all on public.wishlist_items to service_role;
alter table public.wishlist_items enable row level security;
create policy "Own wishlist" on public.wishlist_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Orders: customers can only read; creation and status changes go through server code
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('BZ' || to_char(now(),'YYMMDD') || lpad((floor(random()*1000000))::text, 6, '0')),
  user_id uuid not null,
  status public.order_status not null default 'pending_payment',
  subtotal integer not null,
  shipping integer not null default 0,
  total integer not null,
  shipping_address jsonb not null,
  payment_provider text,
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Own or admin orders read" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Admins update orders" on public.orders for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  sku text not null,
  variant text not null default '',
  unit_price integer not null,
  qty integer not null,
  image_url text not null default ''
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Own or admin order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

-- Demo seed data (is_demo = true)
insert into public.categories (slug, name, description, sort_order) values
 ('electronics','Electronics','Audio, wearables and smart gadgets for everyday life.',1),
 ('fashion','Fashion','Shoes, bags and clothing for every occasion.',2),
 ('home-kitchen','Home & Kitchen','Cookware and essentials for a better home.',3),
 ('beauty','Beauty','Skincare and personal care you''ll love.',4),
 ('sports','Sports & Fitness','Gear up for your workouts and outdoor play.',5);

insert into public.products (slug,name,brand,category_id,sku,price,mrp,rating,reviews,stock,image_url,is_new,is_demo,description,specs,variant_label,variant_options) values
 ('aurawave-anc-headphones','AuraWave ANC Wireless Headphones','AuraWave',(select id from public.categories where slug='electronics'),'AW-H100',4999,9999,4.4,2381,42,'asset:headphones',false,true,'Active noise cancellation, 40-hour battery and plush memory-foam cushions for all-day listening.','{"Battery":"40 hours","Connectivity":"Bluetooth 5.3","Weight":"250 g"}','Colour',array['Midnight Black','Stone Grey']),
 ('pulsefit-smartwatch','PulseFit Pro Smartwatch with SpO2','PulseFit',(select id from public.categories where slug='electronics'),'PF-W22',2799,5999,4.1,1204,8,'asset:watch',true,true,'1.8" AMOLED display, heart-rate and SpO2 tracking, 100+ sports modes and 7-day battery.','{"Display":"1.8\" AMOLED","Water resistance":"IP68","Battery":"7 days"}',null,null),
 ('flexride-running-shoes','FlexRide Men''s Running Shoes','FlexRide',(select id from public.categories where slug='fashion'),'FR-R7',1899,3499,4.3,864,25,'asset:sneakers',false,true,'Breathable knit upper with responsive foam cushioning for daily runs.','{"Upper":"Knit mesh","Sole":"EVA foam","Closure":"Lace-up"}','Size (UK)',array['6','7','8','9','10']),
 ('heritage-canvas-backpack','Heritage Canvas Laptop Backpack 25L','Heritage Supply',(select id from public.categories where slug='fashion'),'HS-B25',1299,2199,4.5,512,0,'asset:backpack',false,true,'Water-resistant canvas with a padded 15.6" laptop sleeve and leather pull tabs.','{"Capacity":"25 L","Material":"Canvas","Laptop size":"Up to 15.6\""}',null,null),
 ('steelchef-pressure-cooker','SteelChef Stainless Steel Pressure Cooker 3L','SteelChef',(select id from public.categories where slug='home-kitchen'),'SC-P3',1549,2450,4.6,3120,60,'asset:cooker',false,true,'Induction-ready tri-ply base with a safety valve and 5-year warranty.','{"Capacity":"3 L","Base":"Induction & gas","Warranty":"5 years"}','Capacity',array['3 L','5 L']),
 ('glow-rituals-vitamin-c-serum','Glow Rituals Vitamin C Face Serum 30ml','Glow Rituals',(select id from public.categories where slug='beauty'),'GR-VC30',549,899,4.2,4410,120,'asset:serum',true,true,'15% Vitamin C with hyaluronic acid to brighten and even skin tone.','{"Volume":"30 ml","Skin type":"All","Fragrance":"Free"}',null,null),
 ('corezen-yoga-kit','CoreZen Yoga Mat with Dumbbell Set','CoreZen',(select id from public.categories where slug='sports'),'CZ-YK1',1199,1999,4.0,288,15,'asset:yoga',true,true,'6mm anti-slip mat with carry strap plus a pair of 2.3 kg neoprene dumbbells.','{"Thickness":"6 mm","Dumbbells":"2 × 2.3 kg","Material":"TPE"}',null,null);