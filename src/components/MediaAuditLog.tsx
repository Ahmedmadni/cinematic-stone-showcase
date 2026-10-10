import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuditEntry = {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
};

const actionLabels: Record<string, string> = {
  insert: "إضافة",
  update: "تعديل",
  delete: "حذف",
};

const entityLabels: Record<string, string> = {
  site_media: "ملف مرفوع",
  media_overrides: "تخصيص صورة أو فيديو",
};

export function MediaAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [status, setStatus] = useState("جارٍ تحميل السجل…");

  async function load() {
    setStatus("جارٍ تحميل السجل…");
    const { data, error } = await supabase
      .from("media_audit_log")
      .select("id,actor_id,action,entity,entity_id,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      setStatus("السجل غير متاح بعد. طبّق ترحيل إدارة الوسائط الجديد أولًا.");
      return;
    }
    setEntries((data ?? []) as AuditEntry[]);
    setStatus(data?.length ? "" : "لا توجد تغييرات مسجلة حتى الآن.");
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <details className="admin-card media-audit">
      <summary>سجل تغييرات الوسائط ({entries.length})</summary>
      <p role="status">{status}</p>
      {!!entries.length && (
        <ol>
          {entries.map((entry) => (
            <li key={entry.id}>
              <strong>{actionLabels[entry.action] ?? entry.action}</strong>
              <span>{entityLabels[entry.entity] ?? entry.entity}</span>
              <code dir="ltr">{entry.entity_id}</code>
              <time dateTime={entry.created_at}>
                {new Intl.DateTimeFormat("ar-SA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(entry.created_at))}
              </time>
              {entry.actor_id && <small dir="ltr">{entry.actor_id.slice(0, 8)}</small>}
            </li>
          ))}
        </ol>
      )}
      <button onClick={load}>تحديث السجل</button>
    </details>
  );
}
