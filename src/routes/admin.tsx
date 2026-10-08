import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { fetchSiteMedia, SITE_MEDIA_BUCKET, siteMediaSections, type SiteMediaItem, type SiteMediaSection } from "@/lib/site-media";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة إدارة الصور والفيديو | محجر الصمان" },
      { name: "description", content: "لوحة داخلية لرفع صور وفيديوهات محجر وكسارة الصمان." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "لوحة إدارة وسائط محجر الصمان" },
      { property: "og:description", content: "رفع وإدارة صور وفيديوهات الموقع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<SiteMediaItem[]>([]);
  const [section, setSection] = useState<SiteMediaSection>("hero");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      if (data.user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        setIsAdmin(!!roles?.some(r => r.role === "admin"));
      } else setIsAdmin(false);
      setReady(true);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") load();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => setItems(await fetchSiteMedia(true)), []);
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin, refresh]);

  const signIn = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/admin" });
    if (r.error) setStatus("تعذّر تسجيل الدخول بجوجل.");
  };

  const upload = async () => {
    if (!files?.length) return;
    setBusy(true); setStatus("");
    let done = 0;
    for (const file of Array.from(files)) {
      const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
      if (!kind) continue;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${section}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(SITE_MEDIA_BUCKET).upload(path, file, { contentType: file.type });
      if (error) { setStatus(`فشل رفع ${file.name}: ${error.message}`); continue; }
      const { error: e2 } = await supabase.from("site_media").insert({ section, kind, storage_path: path, title_ar: titleAr, title_en: titleEn });
      if (e2) { setStatus(`فشل حفظ ${file.name}`); continue; }
      done++;
    }
    setBusy(false); setFiles(null); setTitleAr(""); setTitleEn("");
    setStatus(`تم رفع ${done} ملف.`);
    refresh();
  };

  const remove = async (item: SiteMediaItem) => {
    if (!confirm("حذف هذا الملف من الموقع؟")) return;
    await supabase.storage.from(SITE_MEDIA_BUCKET).remove([item.storage_path]);
    await supabase.from("site_media").delete().eq("id", item.id);
    refresh();
  };

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-header">
        <h1>لوحة إدارة صور وفيديوهات المحجر</h1>
        <div className="admin-header__actions">
          <Link to="/">العودة للموقع</Link>
          {user && <button type="button" onClick={async () => { await supabase.auth.signOut(); }}>تسجيل الخروج</button>}
        </div>
      </header>

      {!ready ? <p>جارٍ التحقق…</p> : !user ? (
        <section className="admin-card">
          <p>سجّل الدخول بحساب جوجل لإدارة صور وفيديوهات الموقع.</p>
          <button type="button" className="admin-primary" onClick={signIn}>تسجيل الدخول بجوجل</button>
        </section>
      ) : !isAdmin ? (
        <section className="admin-card"><p>حسابك ({user.email}) لا يملك صلاحية الإدارة.</p></section>
      ) : (
        <>
          <section className="admin-card">
            <h2>رفع ملفات جديدة</h2>
            <label>القسم<select value={section} onChange={e => setSection(e.target.value as SiteMediaSection)}>
              {siteMediaSections.map(s => <option key={s.id} value={s.id}>{s.ar}</option>)}
            </select></label>
            <label>الوصف بالعربية<input value={titleAr} onChange={e => setTitleAr(e.target.value)} maxLength={120} /></label>
            <label>الوصف بالإنجليزية<input value={titleEn} onChange={e => setTitleEn(e.target.value)} maxLength={120} dir="ltr" /></label>
            <label>الصور أو الفيديوهات (حتى 50 ميجابايت للملف)<input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" onChange={e => setFiles(e.target.files)} /></label>
            <button type="button" className="admin-primary" disabled={busy || !files?.length} onClick={upload}>{busy ? "جارٍ الرفع…" : "رفع"}</button>
            {status && <p className="admin-status">{status}</p>}
          </section>

          {siteMediaSections.map(s => {
            const list = items.filter(i => i.section === s.id);
            return (
              <section className="admin-card" key={s.id}>
                <h2>{s.ar} <small>({list.length})</small></h2>
                {!list.length ? <p className="admin-muted">لا ملفات مرفوعة — يعرض الموقع الصور الحالية.</p> : (
                  <div className="admin-grid">
                    {list.map(item => (
                      <div className="admin-tile" key={item.id}>
                        {item.kind === "video" ? <video src={item.url} muted playsInline controls preload="metadata" /> : <img src={item.url} alt={item.title_ar} loading="lazy" />}
                        <span>{item.title_ar || "—"}</span>
                        <button type="button" onClick={() => remove(item)}>حذف</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
