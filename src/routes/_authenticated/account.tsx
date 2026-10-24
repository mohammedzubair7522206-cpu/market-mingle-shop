import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Account — Bazaaro" },
      { name: "description", content: "Manage your Bazaaro profile and saved delivery addresses." },
      { property: "og:title", content: "My Account — Bazaaro" },
      { property: "og:description", content: "Manage your profile and addresses." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const PIN = /^[1-9][0-9]{5}$/;
const PHONE = /^[6-9][0-9]{9}$/;
const emptyAddr = { full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", is_default: false };

function AccountPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle()).data,
  });
  const addresses = useQuery({
    queryKey: ["addresses", user.id],
    queryFn: async () => (await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at")).data ?? [],
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => { setName(profile.data?.full_name ?? ""); setPhone(profile.data?.phone ?? ""); }, [profile.data]);
  const [addr, setAddr] = useState(emptyAddr);
  const [adding, setAdding] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && !PHONE.test(phone)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), phone: phone || null }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  const saveAddr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PIN.test(addr.pincode)) { toast.error("Enter a valid 6-digit PIN code"); return; }
    if (!PHONE.test(addr.phone)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    const first = (addresses.data?.length ?? 0) === 0;
    if (addr.is_default || first) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const { error } = await supabase.from("addresses").insert({ ...addr, line2: addr.line2 || null, is_default: addr.is_default || first, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    setAddr(emptyAddr); setAdding(false);
    qc.invalidateQueries({ queryKey: ["addresses", user.id] });
  };

  const delAddr = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["addresses", user.id] });
  };
  const makeDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["addresses", user.id] });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "catalog" });
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  const input = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Account</h1>
        <button onClick={signOut} className="rounded-md border bg-background px-4 py-2 text-sm font-semibold">Sign out</button>
      </div>

      <form onSubmit={saveProfile} className="space-y-3 rounded-xl bg-background p-5 shadow-card">
        <h2 className="text-lg font-bold">Profile</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          <input className={input} placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
        <button className="btn-primary px-5 py-2 text-sm">Save profile</button>
      </form>

      <section className="rounded-xl bg-background p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Saved addresses</h2>
          {!adding && <button onClick={() => setAdding(true)} className="text-sm font-semibold text-accent-foreground">+ Add address</button>}
        </div>
        {addresses.data?.length === 0 && !adding && <p className="text-sm text-muted-foreground">No saved addresses yet.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.data?.map((a) => (
            <div key={a.id} className="rounded-lg border p-3 text-sm">
              <p className="font-bold">{a.full_name} {a.is_default && <span className="ml-1 rounded bg-accent px-1.5 text-xs">Default</span>}</p>
              <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
              <p>{a.city}, {a.state} {a.pincode}</p>
              <p className="text-muted-foreground">{a.phone}</p>
              <div className="mt-2 flex gap-3 text-xs font-semibold">
                {!a.is_default && <button onClick={() => makeDefault(a.id)}>Make default</button>}
                <button className="text-destructive" onClick={() => delAddr(a.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        {adding && (
          <form onSubmit={saveAddr} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input required className={input} placeholder="Full name" value={addr.full_name} onChange={(e) => setAddr({ ...addr, full_name: e.target.value })} />
            <input required className={input} placeholder="Mobile number" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
            <input required className={`${input} sm:col-span-2`} placeholder="House no., building, street" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
            <input className={`${input} sm:col-span-2`} placeholder="Area, landmark (optional)" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} />
            <input required className={input} placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
            <input required className={input} placeholder="State" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
            <input required className={input} placeholder="PIN code" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addr.is_default} onChange={(e) => setAddr({ ...addr, is_default: e.target.checked })} /> Make default</label>
            <div className="flex gap-2 sm:col-span-2">
              <button className="btn-primary px-5 py-2 text-sm">Save address</button>
              <button type="button" onClick={() => setAdding(false)} className="rounded-md border px-4 text-sm">Cancel</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
