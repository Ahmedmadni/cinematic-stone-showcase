import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { hasSupabaseBrowserConfig, supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { mediaCatalog, mediaContexts, type CatalogAsset } from "@/data/media-catalog";
import {
  allowedMediaTypes,
  refreshMediaManagement,
  useMediaManagement,
  validateMediaFile,
} from "@/lib/media-management";
import { SITE_MEDIA_BUCKET, siteMediaSections, type SiteMediaSection } from "@/lib/site-media";
import { createVideoPoster, optimizeImageForUpload } from "@/lib/media-upload";
import { UploadedMediaManager } from "./UploadedMediaManager";
import { MediaAuditLog } from "./MediaAuditLog";
import provenance from "@/data/media-provenance.json";

export function MediaStudio() {
  const state = useMediaManagement();
  const editor = useRef<HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState("loading");
  const [isAdmin, setAdmin] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<CatalogAsset | null>(null);
  const [context, setContext] = useState("*");
  const [replacement, setReplacement] = useState("");
  const [ar, setAr] = useState("");
  const [en, setEn] = useState("");
  const [fit, setFit] = useState<"cover" | "contain">("contain");
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [files, setFiles] = useState<File[]>([]);
  const [section, setSection] = useState<SiteMediaSection>("production");
  const catalog = useMemo(() => [...mediaCatalog, ...state.uploads], [state.uploads]);
  useEffect(() => {
    if (selected && window.matchMedia("(max-width: 900px)").matches)
      editor.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [selected]);
  useEffect(() => {
    let live = true;
    let stop: (() => void) | undefined;
    if (!hasSupabaseBrowserConfig()) {
      setAuth("unavailable");
      return () => {
        live = false;
      };
    }
    const timeout = window.setTimeout(() => {
      if (live) setAuth("unavailable");
    }, 12000);
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (live) setUser(session?.user ?? null);
      });
      stop = () => data.subscription.unsubscribe();
      void supabase.auth
        .getUser()
        .then(({ data, error }) => {
          if (live) {
            setUser(data.user ?? null);
            setAuth(error && error.name !== "AuthSessionMissingError" ? "unavailable" : "ready");
          }
        })
        .catch(() => {
          if (live) setAuth("unavailable");
        })
        .finally(() => window.clearTimeout(timeout));
    } catch {
      setAuth("unavailable");
      window.clearTimeout(timeout);
    }
    return () => {
      live = false;
      stop?.();
      window.clearTimeout(timeout);
    };
  }, []);
  useEffect(() => {
    let live = true;
    setAdmin(false);
    if (user)
      void supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .then(({ data, error }) => {
          if (live) {
            setAdmin(!error && !!data?.some((r) => r.role === "admin"));
            setAuth(error ? "unavailable" : "ready");
          }
        });
    return () => {
      live = false;
    };
  }, [user]);
  function edit(asset: CatalogAsset, scope = context) {
    setSelected(asset);
    setContext(scope);
    const saved = state.overrides.find((o) => o.target_key === `${scope}:${asset.id}`);
    setReplacement(saved?.replacement_id ?? asset.id);
    setAr(saved?.title_ar ?? asset.ar);
    setEn(saved?.title_en ?? asset.en);
    setFit(saved?.fit ?? "contain");
    setX(saved?.focal_x ?? 50);
    setY(saved?.focal_y ?? 50);
  }
  async function save(reset = false) {
    if (!selected || !isAdmin || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const target_key = `${context}:${selected.id}`;
      const result = reset
        ? await supabase.from("media_overrides").delete().eq("target_key", target_key)
        : await supabase.from("media_overrides").upsert({
            target_key,
            replacement_id: replacement,
            title_ar: ar.trim(),
            title_en: en.trim(),
            fit,
            focal_x: x,
            focal_y: y,
            updated_at: new Date().toISOString(),
          });
      if (result.error) throw result.error;
      await refreshMediaManagement(true);
      setStatus(
        reset ? "تمت استعادة الأصل لهذا النطاق." : "حُفظ التخصيص. افتح معاينة الموقع للتحقق منه.",
      );
    } catch {
      setStatus("لم يُحفظ التغيير. تحقق من الاتصال وصلاحية الإدارة وتطبيق ترحيل الوسائط.");
    } finally {
      setBusy(false);
    }
  }
  async function upload() {
    if (!isAdmin || !files.length || busy) return;
    setBusy(true);
    const errors: string[] = [];
    let done = 0;
    try {
      for (const file of files) {
        const invalid = validateMediaFile(file);
        if (invalid) {
          errors.push(`${file.name}: ${invalid}`);
          continue;
        }
        let prepared = file;
        try {
          prepared = await optimizeImageForUpload(file);
        } catch {
          errors.push(`${file.name}: تعذّر تحويل الصورة إلى WebP.`);
          continue;
        }
        const preparedInvalid = validateMediaFile(prepared);
        if (preparedInvalid) {
          errors.push(`${file.name}: ${preparedInvalid}`);
          continue;
        }
        setStatus(
          file.type.startsWith("image/")
            ? `جارٍ تحسين ورفع ${file.name}…`
            : `جارٍ تجهيز غلاف ورفع ${file.name}…`,
        );
        const poster = await createVideoPoster(file);
        const path = `${section}/${crypto.randomUUID()}.${allowedMediaTypes[prepared.type]}`;
        const uploaded = await supabase.storage
          .from(SITE_MEDIA_BUCKET)
          .upload(path, prepared, { contentType: prepared.type, upsert: false });
        if (uploaded.error) {
          errors.push(`${file.name}: تعذّر الرفع.`);
          continue;
        }
        let posterPath: string | null = null;
        if (poster) {
          const candidate = `${section}/posters/${crypto.randomUUID()}.webp`;
          const posterUpload = await supabase.storage
            .from(SITE_MEDIA_BUCKET)
            .upload(candidate, poster, { contentType: "image/webp", upsert: false });
          if (posterUpload.error) errors.push(`${file.name}: رُفع الفيديو دون غلاف تلقائي.`);
          else posterPath = candidate;
        }
        const inserted = await supabase.from("site_media").insert({
          section,
          kind: prepared.type.startsWith("video/") ? "video" : "image",
          storage_path: path,
          poster_path: posterPath,
          title_ar: file.name.replace(/\.[^.]+$/, ""),
          title_en: file.name.replace(/\.[^.]+$/, ""),
        });
        if (inserted.error) {
          const cleanup = await supabase.storage
            .from(SITE_MEDIA_BUCKET)
            .remove([path, posterPath].filter(Boolean) as string[]);
          errors.push(
            `${file.name}: تعذّر حفظ السجل.${cleanup.error ? ` يلزم تنظيف ${path} من التخزين.` : " أُلغي رفع الملف."}`,
          );
        } else done++;
      }
      await refreshMediaManagement(true);
      setFiles([]);
      setStatus(`تم رفع ${done} ملف. ${errors.join(" ")}`);
    } catch {
      setStatus(`توقف الاتصال بعد رفع ${done} ملف. حدّث المكتبة قبل إعادة المحاولة.`);
    } finally {
      setBusy(false);
    }
  }
  const preview = catalog.find((a) => a.id === replacement) ?? selected;
  const filtered = catalog.filter(
    (a) =>
      (category === "all" || a.category === category) &&
      `${a.id} ${a.ar} ${a.en} ${provenance[a.id as keyof typeof provenance]?.file ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const categories: Record<string, string> = {
    production: "الإنتاج",
    equipment: "المعدات",
    facilities: "المرافق",
    quarry: "المحجر",
    video: "الفيديو",
    documents: "المستندات",
    brand: "الشعار",
    posters: "أغلفة الفيديو",
    hero: "الواجهة",
    fleet: "المعدات المرفوعة",
    supplementary: "تصورات المعدات فقط",
    decorative: "الرسوم الهندسية الزخرفية",
  };
  return (
    <main className="admin-page media-studio" dir="rtl">
      <header className="admin-header">
        <div>
          <span className="media-studio__eyebrow">AL SOMMAN / MEDIA STUDIO</span>
          <h1>مكتبة الموقع. تحت إدارتك.</h1>
          <p>
            الصور، الفيديوهات، أغلفتها والمستندات في مكان واحد. التصورات المولدة مسموحة للمعدات فقط.
          </p>
        </div>
        <div className="admin-header__actions">
          <a href="/" target="_blank" rel="noreferrer">
            معاينة الموقع ↗
          </a>
          {user && (
            <button
              disabled={busy}
              onClick={() => {
                void supabase.auth.signOut().catch(() => setStatus("تعذر تسجيل الخروج."));
              }}
            >
              خروج
            </button>
          )}
        </div>
      </header>
      <section className="media-studio__stats">
        <div>
          <strong>77</strong>
          <span>صورة في مكتبة الموقع</span>
        </div>
        <div>
          <strong>6</strong>
          <span>مقاطع وجولة كاملة</span>
        </div>
        <div>
          <strong>{state.error ? "—" : state.uploads.length}</strong>
          <span>ملفات مرفوعة</span>
        </div>
        <div>
          <strong>{state.error ? "—" : state.overrides.length}</strong>
          <span>تخصيصات محفوظة</span>
        </div>
      </section>
      <section className="admin-card">
        <strong>
          {isAdmin
            ? "متصل بحساب الإدارة"
            : auth === "loading"
              ? "جارٍ التحقق من الاتصال…"
              : "معاينة المكتبة — الحفظ يتطلب حساب إدارة"}
        </strong>
        {auth === "unavailable" && (
          <p>
            إعداد الاتصال السحابي غير متاح أو لم يستجب. المكتبة الأصلية تعمل؛ يلزم ضبط عنوان
            Supabase ومفتاحه العام في إعدادات البناء وتطبيق ترحيل الوسائط. لا تدخل أي مفتاح سري هنا.
          </p>
        )}
        {user && !isAdmin && (
          <p>
            لم تُثبت صلاحية الإدارة لهذا الحساب. يجب إسناد الدور بواسطة المالك من إعدادات قاعدة
            البيانات.
          </p>
        )}
        {!user && auth === "ready" && (
          <button
            className="admin-primary"
            onClick={async () => {
              try {
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: `${window.location.origin}/admin`,
                });
                if (result.error) throw result.error;
              } catch {
                setStatus("تعذر تسجيل الدخول بجوجل. تحقق من إعدادات الاتصال.");
              }
            }}
          >
            تسجيل الدخول بجوجل
          </button>
        )}
        {state.error && <p>{state.error}</p>}
        <button
          disabled={busy}
          onClick={() => {
            void refreshMediaManagement(true);
          }}
        >
          تحديث المكتبة
        </button>
      </section>
      <p className="admin-status" role="status" aria-live="polite">
        {status}
      </p>
      {isAdmin && <UploadedMediaManager />}
      {isAdmin && <MediaAuditLog />}
      {isAdmin && (
        <section className="admin-card">
          <h2>رفع وسائط الموقع</h2>
          <p>
            تُحوّل صور JPEG وPNG تلقائيًا إلى WebP، ويُنشأ غلاف للفيديو متى سمح المتصفح بذلك. يدعم
            الفيديو MP4 وWebM، وحد الملف 50 ميجابايت.
          </p>
          <label>
            القسم
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as SiteMediaSection)}
            >
              {siteMediaSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ar}
                </option>
              ))}
            </select>
          </label>
          <input
            type="file"
            multiple
            accept="image/webp,image/jpeg,image/png,video/mp4,video/webm"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <button className="admin-primary" disabled={busy || !files.length} onClick={upload}>
            {busy ? "جارٍ التنفيذ…" : `رفع ${files.length || ""} ملفات`}
          </button>
        </section>
      )}
      <div className="media-studio__workspace">
        <section className="admin-card">
          <div className="media-studio__filters">
            <label>
              بحث بالصورة أو وصفها
              <input
                type="search"
                placeholder="photo-033، المحجر، الموازين…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              التصنيف
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">جميع الأصول ({catalog.length})</option>
                {Array.from(new Set(catalog.map((a) => a.category))).map((c) => (
                  <option key={c} value={c}>
                    {categories[c] ?? c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p>{filtered.length} أصل — الأصول المرفقة محفوظة دائمًا ويمكن استعادتها.</p>
          <div className="admin-grid">
            {filtered.map((asset) => (
              <button
                type="button"
                className={`admin-tile media-studio__tile${selected?.id === asset.id ? " is-selected" : ""}`}
                key={asset.id}
                onClick={() => edit(asset)}
                aria-pressed={selected?.id === asset.id}
              >
                {asset.thumbnail ? (
                  <img src={asset.thumbnail} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className="media-studio__video-placeholder">▶ فيديو مرفوع</span>
                )}
                <small>
                  {asset.id} · {asset.kind === "video" ? "فيديو" : "صورة"}
                </small>
                <strong>{asset.ar || asset.id}</strong>
                {state.overrides.some((o) => o.target_key.endsWith(`:${asset.id}`)) && (
                  <span>● مخصص</span>
                )}
              </button>
            ))}
          </div>
        </section>
        <aside ref={editor} className="admin-card media-studio__editor">
          <h2>{selected ? "تحرير الأصل وموضع عرضه" : "اختر صورة أو فيديو"}</h2>
          {selected && preview ? (
            <>
              <small dir="ltr">{selected.id}</small>
              {provenance[selected.id as keyof typeof provenance] && (
                <details>
                  <summary>اسم الملف الأصلي وبصمة التوثيق</summary>
                  <p dir="ltr">{provenance[selected.id as keyof typeof provenance].file}</p>
                  <small style={{ overflowWrap: "anywhere" }} dir="ltr">
                    SHA-256: {provenance[selected.id as keyof typeof provenance].sha256}
                  </small>
                </details>
              )}
              {preview.kind === "video" ? (
                <video
                  key={preview.url}
                  src={preview.url}
                  controls
                  playsInline
                  preload="none"
                  poster={preview.thumbnail || undefined}
                />
              ) : (
                <img
                  src={preview.url}
                  alt={ar}
                  style={{ objectFit: fit, objectPosition: `${x}% ${y}%` }}
                />
              )}
              <label>
                نطاق التغيير
                <select value={context} onChange={(e) => edit(selected, e.target.value)}>
                  {Object.entries(mediaContexts).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="admin-muted">
                النطاق الخاص يغيّر هذا الأصل عندما يظهر في ذلك المكوّن فقط؛ «جميع المواضع» يربط
                الصورة ومصغّرها معًا.
              </p>
              <label>
                البديل
                <select value={replacement} onChange={(e) => setReplacement(e.target.value)}>
                  {catalog
                    .filter(
                      (a) =>
                        a.kind === selected.kind &&
                        (selected.origin === "decorative"
                          ? a.origin === "decorative"
                          : a.origin !== "decorative" &&
                            (a.origin !== "supplementary" || selected.origin === "supplementary")),
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.id} — {a.ar}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                النص البديل / وصف الفيديو بالعربية
                <input value={ar} maxLength={240} onChange={(e) => setAr(e.target.value)} />
              </label>
              <label>
                النص البديل / وصف الفيديو بالإنجليزية
                <input
                  value={en}
                  maxLength={240}
                  dir="ltr"
                  onChange={(e) => setEn(e.target.value)}
                />
              </label>
              {selected.kind === "image" && (
                <>
                  <label>
                    طريقة العرض
                    <select
                      value={fit}
                      onChange={(e) => setFit(e.target.value as "cover" | "contain")}
                    >
                      <option value="contain">الصورة كاملة — للمعدات والمستندات</option>
                      <option value="cover">ملء الإطار</option>
                    </select>
                  </label>
                  <label>
                    موضع التركيز الأفقي {x}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={x}
                      onChange={(e) => setX(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    موضع التركيز الرأسي {y}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={y}
                      onChange={(e) => setY(Number(e.target.value))}
                    />
                  </label>
                </>
              )}
              <button className="admin-primary" disabled={!isAdmin || busy} onClick={() => save()}>
                حفظ التخصيص
              </button>
              <button disabled={!isAdmin || busy} onClick={() => save(true)}>
                استعادة الأصل في هذا النطاق
              </button>
            </>
          ) : (
            <p>استعرض المكتبة حتى دون اتصال. الحفظ والرفع محصوران بحسابات الإدارة المعتمدة.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
