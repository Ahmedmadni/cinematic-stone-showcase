import { ManagedImage } from '@/components/ManagedImage';
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpLeft, X } from "lucide-react";
import { useSiteLanguage } from "@/lib/site-language";
import type { SuppliedDocument } from "@/data/official-documents";

function DocumentDialog({ document, title, onClose }: { document: SuppliedDocument; title: string; onClose: () => void }) {
  const { language } = useSiteLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const en = language === "en";
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = window.document.activeElement;
    const previousOverflow = window.document.body.style.overflow;
    if (!node) return;
    window.document.body.style.overflow = "hidden";
    node.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      if (node.open) node.close();
      window.document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const node = event.currentTarget;
    const focusable = Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = window.document.activeElement;
    if (event.shiftKey && (active === first || !node.contains(active))) {
      event.preventDefault();
      last?.focus({ preventScroll: true });
    } else if (!event.shiftKey && (active === last || !node.contains(active))) {
      event.preventDefault();
      first?.focus({ preventScroll: true });
    }
  }
  return <dialog ref={dialog} onKeyDown={handleKeyDown} className="evidence-document-dialog" aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="evidence-document-dialog__bar"><strong>{title}</strong><button ref={closeButton} type="button" onClick={onClose} aria-label={en ? "Close document" : "إغلاق المستند"}><X size={22} aria-hidden="true" /></button></div>
    <p>{en ? "Supplied document copy. Current validity and surveillance reviews require verification with the issuing authority." : "نسخة المستند المرفقة. يلزم التحقق من السريان الحالي ومراجعات المتابعة لدى الجهة المصدرة."}</p>
    <div className="evidence-document-dialog__image"><ManagedImage mediaContext="EvidenceDocument" src={document.image} width={document.width} height={document.height} alt={title} decoding="async" /></div>
    <a href={document.image} target="_blank" rel="noopener noreferrer">{en ? "Open original scan" : "فتح نسخة المستند الأصلية المرفقة"}<ArrowUpLeft size={18} aria-hidden="true" /></a>
  </dialog>;
}

/** No visual grading on documentary scans. Full scan loads only when opened. */
export function EvidenceDocument({ document, title }: { document: SuppliedDocument | undefined; title: string }) {
  const { language } = useSiteLanguage();
  const [open, setOpen] = useState(false);
  if (!document) return null;
  return <div className="evidence-document">
    <button type="button" className="evidence-document__trigger" onClick={() => setOpen(true)}>
      <ManagedImage mediaContext="EvidenceDocument" src={document.thumbnail} width={document.width} height={document.height} alt="" loading="lazy" decoding="async" />
      <span><small>{language === "en" ? "SUPPLIED DOCUMENT" : "المستند المرفق"}</small><strong>{language === "en" ? "View supplied scan" : "عرض نسخة المستند"}</strong><span>{title}</span></span><ArrowUpLeft size={21} aria-hidden="true" />
    </button>
    {open && <DocumentDialog document={document} title={title} onClose={() => setOpen(false)} />}
  </div>;
}
