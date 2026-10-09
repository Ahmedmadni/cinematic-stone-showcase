import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchSiteMedia,
  SITE_MEDIA_BUCKET,
  siteMediaSections,
  type SiteMediaItem,
} from "@/lib/site-media";
import { refreshMediaManagement, useMediaManagement } from "@/lib/media-management";

export function UploadedMediaManager() {
  const state = useMediaManagement();
  const [records, setRecords] = useState<SiteMediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    let live = true;
    void fetchSiteMedia(true)
      .then((items) => {
        if (live) setRecords(items);
      })
      .catch(() => {
        if (live) setStatus("تعذّر تحميل سجلات الملفات.");
      });
    return () => {
      live = false;
    };
  }, [state.uploads]);
  async function change(item: SiteMediaItem, remove = false) {
    if (busy) return;
    if (
      remove &&
      state.overrides.some(
        (o) =>
          o.replacement_id === `upload-${item.id}` || o.target_key.endsWith(`:upload-${item.id}`),
      )
    ) {
      setStatus("الملف مرتبط بتخصيص محفوظ. استعد الأصول في تلك المواضع قبل الحذف.");
      return;
    }
    if (remove && !confirm("حذف هذا الملف المرفوع نهائيًا؟ لا تتأثر الصور الأصلية المرفقة."))
      return;
    setBusy(true);
    try {
      const result = remove
        ? await supabase.from("site_media").delete().eq("id", item.id)
        : await supabase
            .from("site_media")
            .update({
              title_ar: item.title_ar,
              title_en: item.title_en,
              section: item.section,
              sort_order: item.sort_order,
            })
            .eq("id", item.id);
      if (result.error) throw result.error;
      if (remove) {
        const cleanup = await supabase.storage.from(SITE_MEDIA_BUCKET).remove([item.storage_path]);
        setStatus(
          cleanup.error
            ? `أُزيل من العرض؛ تعذّر تنظيف ملف التخزين: ${item.storage_path}`
            : "حُذف الملف المرفوع نهائيًا.",
        );
      } else setStatus("حُفظت بيانات الملف وترتيبه.");
      await refreshMediaManagement(true);
    } catch {
      setStatus("لم تكتمل العملية. تحقق من الاتصال والصلاحيات.");
    } finally {
      setBusy(false);
    }
  }
  function edit(id: string, values: Partial<SiteMediaItem>) {
    setRecords((old) => old.map((r) => (r.id === id ? { ...r, ...values } : r)));
  }
  return (
    <details className="admin-card">
      <summary>تنظيم الملفات المرفوعة ({records.length}) — الوصف والترتيب والحذف</summary>
      <p role="status">{status}</p>
      {records.map((item) => (
        <section className="admin-card" key={item.id}>
          <small dir="ltr">{item.id}</small>
          <label>
            العربية
            <input
              value={item.title_ar}
              maxLength={240}
              onChange={(e) => edit(item.id, { title_ar: e.target.value })}
            />
          </label>
          <label>
            English
            <input
              value={item.title_en}
              dir="ltr"
              maxLength={240}
              onChange={(e) => edit(item.id, { title_en: e.target.value })}
            />
          </label>
          <label>
            القسم
            <select
              value={item.section}
              onChange={(e) =>
                edit(item.id, { section: e.target.value as SiteMediaItem["section"] })
              }
            >
              {siteMediaSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ar}
                </option>
              ))}
            </select>
          </label>
          <label>
            الترتيب — الرقم الأصغر أولًا
            <input
              type="number"
              min="-10000"
              max="10000"
              value={item.sort_order}
              onChange={(e) => edit(item.id, { sort_order: Number(e.target.value) })}
            />
          </label>
          <button disabled={busy} onClick={() => change(item)}>
            حفظ بيانات الملف
          </button>
          <button disabled={busy} onClick={() => change(item, true)}>
            حذف الملف المرفوع
          </button>
        </section>
      ))}
    </details>
  );
}
