import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchSiteMedia,
  SITE_MEDIA_BUCKET,
  siteMediaSections,
  type SiteMediaItem,
  type SiteMediaSection,
} from "@/lib/site-media";
import { compareMediaOrder, normalizeMediaOrder, placeMediaItem } from "@/lib/media-order";
import { refreshMediaManagement, useMediaManagement } from "@/lib/media-management";

const sectionIds = siteMediaSections.map((section) => section.id);

function normalized(records: SiteMediaItem[]) {
  return normalizeMediaOrder(records, sectionIds);
}

function comparable(records: SiteMediaItem[]) {
  return JSON.stringify(
    normalized(records)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, section, title_ar, title_en, sort_order }) => ({
        id,
        section,
        title_ar,
        title_en,
        sort_order,
      })),
  );
}

export function UploadedMediaManager() {
  const state = useMediaManagement();
  const [records, setRecords] = useState<SiteMediaItem[]>([]);
  const [savedRecords, setSavedRecords] = useState<SiteMediaItem[]>([]);
  const [activeSection, setActiveSection] = useState<SiteMediaSection>("hero");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let live = true;
    void fetchSiteMedia(true)
      .then((items) => {
        if (!live) return;
        const next = normalized(items);
        setRecords(next);
        setSavedRecords(next);
        const firstPopulated = siteMediaSections.find((section) =>
          next.some((item) => item.section === section.id),
        );
        if (firstPopulated) setActiveSection(firstPopulated.id);
      })
      .catch(() => {
        if (live) setStatus("تعذّر تحميل سجلات الملفات.");
      });
    return () => {
      live = false;
    };
  }, [state.uploads]);

  const dirty = comparable(records) !== comparable(savedRecords);
  const groups = useMemo(
    () =>
      siteMediaSections.map((section) => ({
        ...section,
        items: records.filter((item) => item.section === section.id).sort(compareMediaOrder),
      })),
    [records],
  );
  const currentGroup = groups.find((group) => group.id === activeSection) ?? groups[0];
  const visibleItems = (currentGroup?.items ?? []).filter((item) =>
    `${item.title_ar} ${item.title_en} ${item.storage_path}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  function edit(id: string, values: Partial<SiteMediaItem>) {
    setRecords((old) =>
      normalized(old.map((record) => (record.id === id ? { ...record, ...values } : record))),
    );
  }

  function move(id: string, targetIndex: number, section = activeSection) {
    setRecords((old) => placeMediaItem(old, id, section, targetIndex, sectionIds));
  }

  function dropOnItem(overId: string) {
    if (!dragged) return;
    const over = records.find((item) => item.id === overId);
    if (!over) return;
    const index = records
      .filter((item) => item.section === over.section && item.id !== dragged)
      .sort(compareMediaOrder)
      .findIndex((item) => item.id === overId);
    move(dragged, Math.max(index, 0), over.section);
    setActiveSection(over.section);
    setDragged(null);
    setDragOver(null);
    setStatus("تم تغيير الموضع محليًا. اضغط حفظ لاعتماد الترتيب.");
  }

  function dropOnSection(section: SiteMediaSection) {
    if (!dragged) return;
    const targetCount = records.filter(
      (item) => item.section === section && item.id !== dragged,
    ).length;
    move(dragged, targetCount, section);
    setActiveSection(section);
    setExpanded(dragged);
    setDragged(null);
    setDragOver(null);
    setStatus("نُقل الملف إلى نهاية القسم. اضغط حفظ لاعتماد التغيير.");
  }

  async function saveAll() {
    if (busy || !records.length || !dirty) return;
    setBusy(true);
    setStatus("جارٍ حفظ النصوص والترتيب…");
    const next = normalized(records);
    try {
      const { error } = await supabase.from("site_media").upsert(
        next.map((item) => ({
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
      setRecords(next);
      setSavedRecords(next);
      await refreshMediaManagement(true);
      setStatus("حُفظ ترتيب الأقسام وبيانات الملفات، وسيظهر في الموقع بعد التحديث.");
    } catch {
      setStatus("لم يكتمل الحفظ. تحقق من الاتصال وصلاحية الإدارة.");
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
      setPendingDelete(null);
      return;
    }
    setBusy(true);
    setStatus("جارٍ حذف الملف…");
    try {
      const result = await supabase.from("site_media").delete().eq("id", item.id);
      if (result.error) throw result.error;
      const paths = [item.storage_path, item.poster_path].filter(Boolean) as string[];
      const cleanup = await supabase.storage.from(SITE_MEDIA_BUCKET).remove(paths);
      const next = normalized(records.filter((record) => record.id !== item.id));
      setRecords(next);
      setSavedRecords(next);
      setExpanded(null);
      setPendingDelete(null);
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
    <section className="admin-card media-organizer" aria-labelledby="media-organizer-title">
      <div className="media-organizer__heading">
        <div>
          <span className="media-studio__eyebrow">ARRANGE / EDIT / REMOVE</span>
          <h2 id="media-organizer-title">تنظيم الملفات المرفوعة</h2>
          <p>اسحب بين الأقسام، أو اختر رقم الموضع مباشرة. لن يُنشر أي ترتيب قبل الضغط على حفظ.</p>
        </div>
        <div className="media-organizer__savebar">
          <span className={dirty ? "is-dirty" : ""}>{dirty ? "تغييرات غير محفوظة" : "محفوظ"}</span>
          <button
            disabled={busy || !dirty}
            onClick={() => {
              setRecords(savedRecords);
              setStatus("تم التراجع عن التعديلات غير المحفوظة.");
            }}
          >
            تراجع
          </button>
          <button className="admin-primary" disabled={busy || !dirty} onClick={saveAll}>
            {busy ? "جارٍ الحفظ…" : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      <p className="admin-status" role="status" aria-live="polite">
        {status}
      </p>

      <div className="media-organizer__tabs" role="tablist" aria-label="أقسام الوسائط">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={activeSection === group.id}
            className={activeSection === group.id ? "is-active" : ""}
            onClick={() => setActiveSection(group.id)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(`section:${group.id}`);
            }}
            onDrop={() => dropOnSection(group.id)}
          >
            {group.ar} <span>{group.items.length}</span>
          </button>
        ))}
      </div>

      <div className="media-organizer__filters">
        <label>
          بحث داخل القسم
          <input
            type="search"
            value={query}
            placeholder="ابحث بالاسم أو الملف…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p>{currentGroup?.items.length ?? 0} ملف · اسحب البطاقة إلى تبويب قسم آخر لنقلها.</p>
      </div>

      <div
        className={`media-organizer__list${dragOver === `section:${activeSection}` ? " is-drop-target" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => dropOnSection(activeSection)}
      >
        {!visibleItems.length && (
          <p className="media-organizer__empty">
            {query
              ? "لا توجد نتائج مطابقة."
              : "لا توجد ملفات مرفوعة في هذا القسم. اسحب ملفًا إلى هنا."}
          </p>
        )}
        {visibleItems.map((item) => {
          const sectionItems = currentGroup?.items ?? [];
          const index = sectionItems.findIndex((record) => record.id === item.id);
          const open = expanded === item.id;
          const confirming = pendingDelete === item.id;
          return (
            <article
              className={`media-organizer__item${dragged === item.id ? " is-dragging" : ""}${dragOver === item.id ? " is-drop-target" : ""}`}
              key={item.id}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragOver(item.id);
              }}
              onDrop={(event) => {
                event.stopPropagation();
                dropOnItem(item.id);
              }}
            >
              <button
                className="media-organizer__drag"
                draggable
                aria-label={`اسحب لتغيير موضع ${item.title_ar || item.id}`}
                title="اسحب داخل القسم أو إلى تبويب قسم آخر"
                onDragStart={() => setDragged(item.id)}
                onDragEnd={() => {
                  setDragged(null);
                  setDragOver(null);
                }}
              >
                <span aria-hidden="true">⋮⋮</span>
              </button>
              <div className="media-organizer__preview">
                {item.kind === "image" || item.poster_url ? (
                  <img src={item.poster_url ?? item.url} alt="" loading="lazy" />
                ) : (
                  <video src={item.url} muted preload="metadata" aria-label={item.title_ar} />
                )}
                <span>{index + 1}</span>
              </div>
              <div className="media-organizer__summary">
                <strong>{item.title_ar || "بدون عنوان"}</strong>
                <small dir="ltr">{item.title_en || item.storage_path}</small>
                <div>
                  <label>
                    الموضع
                    <select
                      value={index + 1}
                      onChange={(event) => move(item.id, Number(event.target.value) - 1)}
                    >
                      {sectionItems.map((_, optionIndex) => (
                        <option key={optionIndex} value={optionIndex + 1}>
                          {optionIndex + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button disabled={busy || index === 0} onClick={() => move(item.id, index - 1)}>
                    ↑<span className="sr-only">تحريك لأعلى</span>
                  </button>
                  <button
                    disabled={busy || index === sectionItems.length - 1}
                    onClick={() => move(item.id, index + 1)}
                  >
                    ↓<span className="sr-only">تحريك لأسفل</span>
                  </button>
                </div>
              </div>
              <div className="media-organizer__actions">
                <button onClick={() => setExpanded(open ? null : item.id)} aria-expanded={open}>
                  {open ? "إغلاق" : "تعديل"}
                </button>
                {!confirming ? (
                  <button
                    className="admin-danger"
                    disabled={busy}
                    onClick={() => setPendingDelete(item.id)}
                  >
                    حذف
                  </button>
                ) : (
                  <div className="media-organizer__confirm" role="group" aria-label="تأكيد الحذف">
                    <strong>حذف نهائي؟</strong>
                    <button disabled={busy} onClick={() => setPendingDelete(null)}>
                      إلغاء
                    </button>
                    <button className="admin-danger" disabled={busy} onClick={() => remove(item)}>
                      نعم، احذف
                    </button>
                  </div>
                )}
              </div>
              {open && (
                <div className="media-organizer__fields">
                  <label>
                    الوصف العربي
                    <input
                      value={item.title_ar}
                      maxLength={240}
                      onChange={(event) => edit(item.id, { title_ar: event.target.value })}
                    />
                  </label>
                  <label>
                    English description
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
                      onChange={(event) => {
                        const nextSection = event.target.value as SiteMediaSection;
                        const targetCount = records.filter(
                          (record) => record.section === nextSection,
                        ).length;
                        setRecords((old) =>
                          placeMediaItem(old, item.id, nextSection, targetCount, sectionIds),
                        );
                        setActiveSection(nextSection);
                      }}
                    >
                      {siteMediaSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.ar}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

