import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchSiteMedia,
  SITE_MEDIA_BUCKET,
  siteMediaSections,
  type SiteMediaItem,
  type SiteMediaSection,
} from "@/lib/site-media";
import { refreshMediaManagement, useMediaManagement } from "@/lib/media-management";

function normalizeOrder(records: SiteMediaItem[]) {
  const order = new Map<string, number>();
  for (const section of siteMediaSections) {
    records
      .filter((item) => item.section === section.id)
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
      .forEach((item, index) => order.set(item.id, (index + 1) * 10));
  }
  return records.map((item) => ({ ...item, sort_order: order.get(item.id) ?? item.sort_order }));
}

export function UploadedMediaManager() {
  const state = useMediaManagement();
  const [records, setRecords] = useState<SiteMediaItem[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    let live = true;
    void fetchSiteMedia(true)
      .then((items) => {
        if (live) setRecords(normalizeOrder(items));
      })
      .catch(() => {
        if (live) setStatus("تعذّر تحميل سجلات الملفات.");
      });
    return () => {
      live = false;
    };
  }, [state.uploads]);

  const groups = useMemo(
    () =>
      siteMediaSections.map((section) => ({
        ...section,
        items: records
          .filter((item) => item.section === section.id)
          .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
      })),
    [records],
  );

  function edit(id: string, values: Partial<SiteMediaItem>) {
    setRecords((old) =>
      normalizeOrder(old.map((record) => (record.id === id ? { ...record, ...values } : record))),
    );
  }

  function move(id: string, direction: -1 | 1) {
    setRecords((old) => {
      const item = old.find((record) => record.id === id);
      if (!item) return old;
      const sectionItems = old
        .filter((record) => record.section === item.section)
        .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
      const current = sectionItems.findIndex((record) => record.id === id);
      const target = current + direction;
      if (current < 0 || target < 0 || target >= sectionItems.length) return old;
      const currentItem = sectionItems[current];
      const targetItem = sectionItems[target];
      if (!currentItem || !targetItem) return old;
      sectionItems[current] = targetItem;
      sectionItems[target] = currentItem;
      const order = new Map(sectionItems.map((record, index) => [record.id, (index + 1) * 10]));
      return old.map((record) => ({
        ...record,
        sort_order: order.get(record.id) ?? record.sort_order,
      }));
    });
  }

  function drop(overId: string) {
    if (!dragged || dragged === overId) return setDragged(null);
    const source = records.find((item) => item.id === dragged);
    const over = records.find((item) => item.id === overId);
    if (!source || !over || source.section !== over.section) {
      setStatus("انقل الملف إلى القسم المطلوب أولًا، ثم رتّبه داخله.");
      return setDragged(null);
    }
    const ordered = records
      .filter((item) => item.section === source.section)
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
    const from = ordered.findIndex((item) => item.id === dragged);
    const to = ordered.findIndex((item) => item.id === overId);
    const [moved] = ordered.splice(from, 1);
    if (!moved) return setDragged(null);
    ordered.splice(to, 0, moved);
    const order = new Map(ordered.map((item, index) => [item.id, (index + 1) * 10]));
    setRecords((old) =>
      old.map((item) => ({ ...item, sort_order: order.get(item.id) ?? item.sort_order })),
    );
    setDragged(null);
  }

  async function saveAll() {
    if (busy || !records.length) return;
    setBusy(true);
    setStatus("جارٍ حفظ النصوص والترتيب…");
    const normalized = normalizeOrder(records);
    try {
      const { error } = await supabase.from("site_media").upsert(
        normalized.map((item) => ({
          id: item.id,
          section: item.section,
          kind: item.kind,
          storage_path: item.storage_path,
          poster_path: item.poster_path,
          title_ar: item.title_ar.trim(),
          title_en: item.title_en.trim(),
          sort_order: item.sort_order,
        })),
        { onConflict: "id" },
      );
      if (error) throw error;
      setRecords(normalized);
      await refreshMediaManagement(true);
      setStatus("حُفظ ترتيب جميع الأقسام وبيانات الملفات.");
    } catch {
      setStatus("لم يكتمل الحفظ. طبّق ترحيل إدارة الوسائط ثم تحقق من الاتصال والصلاحيات.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: SiteMediaItem) {
    if (busy) return;
    if (
      state.overrides.some(
        (override) =>
          override.replacement_id === `upload-${item.id}` ||
          override.target_key.endsWith(`:upload-${item.id}`),
      )
    ) {
      setStatus("الملف مرتبط بتخصيص محفوظ. استعد الأصول في تلك المواضع قبل الحذف.");
      return;
    }
    if (!confirm("حذف هذا الملف المرفوع نهائيًا؟ لا تتأثر الصور الأصلية المرفقة.")) return;
    setBusy(true);
    try {
      const result = await supabase.from("site_media").delete().eq("id", item.id);
      if (result.error) throw result.error;
      const paths = [item.storage_path, item.poster_path].filter(Boolean) as string[];
      const cleanup = await supabase.storage.from(SITE_MEDIA_BUCKET).remove(paths);
      setRecords((old) => old.filter((record) => record.id !== item.id));
      setStatus(
        cleanup.error
          ? "أُزيل من العرض؛ تعذّر تنظيف بعض ملفات التخزين."
          : "حُذف الملف وغلافه من المكتبة.",
      );
      await refreshMediaManagement(true);
    } catch {
      setStatus("لم تكتمل عملية الحذف. تحقق من الاتصال والصلاحيات.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="admin-card media-organizer" open>
      <summary>تنظيم الملفات المرفوعة ({records.length})</summary>
      <p>
        اسحب بطاقة داخل قسمها، أو استخدم زري أعلى وأسفل. غيّر القسم والنصوص ثم احفظ الكل مرة واحدة.
      </p>
      <p role="status" aria-live="polite">
        {status}
      </p>
      <button className="admin-primary" disabled={busy || !records.length} onClick={saveAll}>
        {busy ? "جارٍ الحفظ…" : "حفظ كل الترتيب والتعديلات"}
      </button>
      {groups.map((group) => (
        <section className="media-organizer__section" key={group.id}>
          <header>
            <h3>{group.ar}</h3>
            <span>{group.items.length} ملف</span>
          </header>
          {!group.items.length && <p className="media-organizer__empty">لا توجد ملفات مرفوعة.</p>}
          <div className="media-organizer__list">
            {group.items.map((item, index) => (
              <article
                className={`media-organizer__item${dragged === item.id ? " is-dragging" : ""}`}
                key={item.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => drop(item.id)}
              >
                <div className="media-organizer__preview">
                  {item.kind === "image" || item.poster_url ? (
                    <img src={item.poster_url ?? item.url} alt="" loading="lazy" />
                  ) : (
                    <video src={item.url} muted preload="metadata" aria-label={item.title_ar} />
                  )}
                </div>
                <div className="media-organizer__fields">
                  <label>
                    العربية
                    <input
                      value={item.title_ar}
                      maxLength={240}
                      onChange={(event) => edit(item.id, { title_ar: event.target.value })}
                    />
                  </label>
                  <label>
                    English
                    <input
                      value={item.title_en}
                      dir="ltr"
                      maxLength={240}
                      onChange={(event) => edit(item.id, { title_en: event.target.value })}
                    />
                  </label>
                  <label>
                    القسم
                    <select
                      value={item.section}
                      onChange={(event) =>
                        edit(item.id, { section: event.target.value as SiteMediaSection })
                      }
                    >
                      {siteMediaSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.ar}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="media-organizer__actions">
                  <button
                    draggable
                    aria-label={`اسحب لترتيب ${item.title_ar || item.id}`}
                    title="اسحب لترتيب الملف"
                    onDragStart={() => setDragged(item.id)}
                    onDragEnd={() => setDragged(null)}
                  >
                    سحب
                  </button>
                  <button disabled={busy || index === 0} onClick={() => move(item.id, -1)}>
                    أعلى
                  </button>
                  <button
                    disabled={busy || index === group.items.length - 1}
                    onClick={() => move(item.id, 1)}
                  >
                    أسفل
                  </button>
                  <button className="admin-danger" disabled={busy} onClick={() => remove(item)}>
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </details>
  );
}
