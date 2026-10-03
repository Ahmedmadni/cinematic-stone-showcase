import { useEffect, useRef, useState, type FormEvent } from "react";
import { createQuarryStreamDecoder } from "@/lib/quarry-stream-decoder";
import { useSiteLanguage } from "@/lib/site-language";
import { ArrowUpLeft, Pickaxe, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = ["كم عدد المحاجر ومساحاتها؟", "ما المعدات المتوفرة في الموقع؟", "ما الشهادات التي يحملها المشروع؟", "أين يقع المحجر بالتحديد؟"];

export function ProjectAssistant() {
  const { language, t } = useSiteLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; abortRef.current?.abort(); };
  }, []);

  async function ask(text: string) {
    const q = text.trim();
    // The ref closes the tiny gap between an Enter key and the state update:
    // no visitor can accidentally start two metered requests simultaneously.
    if (q.length < 3 || loading || abortRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setError("");
    setQuestion("");
    const history = messages.filter((m) => m.content.trim().length > 0).slice(-6);
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setLoading(true);

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let streamCompleted = false;
    try {
      const res = await fetch("/api/public/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history, language }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data: unknown = await res.json().catch(() => null);
        const serverError = data && typeof data === "object" && "error" in data &&
          typeof data.error === "string" ? data.error.slice(0, 350) : t("تعذّرت الإجابة الآن.");
        throw new Error(serverError);
      }

      const parser = createQuarryStreamDecoder();
      const decoder = new TextDecoder();
      reader = res.body.getReader();
      while (!streamCompleted) {
        const { done, value } = await reader.read();
        const events = parser.push(done ? decoder.decode() : decoder.decode(value, { stream: true }));
        for (const event of events) {
          if (event.kind === "error") throw new Error(t("تعذّر إكمال الإجابة."));
          if (event.kind === "complete") { streamCompleted = true; break; }
          if (event.kind === "text" && mountedRef.current) {
            setMessages((current) => {
              const last = current.at(-1);
              if (!last || last.role !== "assistant") return current;
              return [...current.slice(0, -1), { ...last, content: last.content + event.text }];
            });
          }
        }
        if (done) {
          if (!streamCompleted) parser.finish(); // incomplete upstream ≠ success
          break;
        }
      }
    } catch (e) {
      if (!mountedRef.current) return;
      if (!controller.signal.aborted) {
        setError(e instanceof Error && e.message.length < 400 ? e.message : t("تعذّرت الإجابة الآن."));
      }
      // Remove only a truly empty placeholder. A partial provider reply
      // remains visible with the failure message instead of silently vanishing.
      setMessages((current) => {
        const last = current.at(-1);
        return last?.role === "assistant" && !last.content ? current.slice(0, -1) : current;
      });
    } finally {
      if (reader) {
        // Explicitly release upstream concurrency even if the stream ends with
        // response.completed rather than closing its network connection.
        await reader.cancel("Assistant answer concluded").catch(() => {});
        reader.releaseLock();
      }
      if (abortRef.current === controller) abortRef.current = null;
      if (mountedRef.current) setLoading(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  return (
    <div className="assistant-panel">
      <div className="assistant-head">
        <span className="assistant-mark" aria-hidden="true"><Pickaxe size={20} strokeWidth={1.5} /></span>
        <div><strong>{t("مساعد الصمان")}</strong><small>{t("يجيب من معلومات المشروع المعتمدة فقط")}</small></div>
      </div>
      <div className="assistant-log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="assistant-empty">
            <p className="assistant-prompt-title">{t("اختر أحد الأسئلة الشائعة أو اكتب سؤالك بالأسفل")}</p>
            <div className="assistant-suggestions" role="group" aria-label={t("الأسئلة المقترحة")}>
              {suggestions.map((s) => (
                <button type="button" key={s} onClick={() => void ask(t(s))}>
                  <span>{t(s)}</span><ArrowUpLeft size={17} strokeWidth={1.6} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ) : messages.map((m, i) => (
          <div key={i} className={`assistant-msg ${m.role}`}>
            {m.content || (loading && i === messages.length - 1 ? <span className="assistant-typing">{t("جارٍ إعداد الإجابة…")}</span> : null)}
          </div>
        ))}
      </div>
      {error && <p className="assistant-error" role="alert">{error}</p>}
      <form className="assistant-form" onSubmit={onSubmit}>
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} rows={2} placeholder={t("اكتب سؤالك عن المحجر أو الكسارة…")} aria-label={t("سؤالك عن المشروع")} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(question); } }} />
        {loading ? (
          <Button type="button" variant="outline" size="icon" aria-label={t("إيقاف")} onClick={stop}><Square size={16} /></Button>
        ) : (
          <Button type="submit" size="icon" aria-label={t("إرسال السؤال")} disabled={question.trim().length < 3}><ArrowUpLeft size={18} /></Button>
        )}
      </form>
      <p className="assistant-note">{t("إجابات آلية للاسترشاد. التفاصيل المالية تُناقش مباشرة مع مسؤول الاستثمار.")}</p>
    </div>
  );
}
