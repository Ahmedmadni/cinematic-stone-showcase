import { useEffect, useRef, useState, type FormEvent } from "react";
import { createAssistantStreamParser } from "@/lib/assistant-stream";
import { useSiteLanguage } from "@/lib/site-language";
import { ArrowUpLeft, Pickaxe, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = ["كم عدد المحاجر ومساحاتها؟", "ما المعدات المتوفرة في الموقع؟", "ما الشهادات التي يحملها المشروع؟", "أين يقع المحجر بالتحديد؟"];

export function ProjectAssistant({ active = true }: { active?: boolean }) {
  const { language, t } = useSiteLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Closing the drawer keeps its conversation; unmounting aborts outstanding
  // metered requests so the server can free its concurrent-request permit.
  useEffect(() => () => abortRef.current?.abort(), []);

  // The drawer stays mounted so a completed conversation is preserved when
  // reopened. A hidden drawer must NOT keep consuming a paid streaming request.
  // Closing via icon, floating trigger or Escape flips active to false here.
  useEffect(() => {
    if (!active) abortRef.current?.abort();
  }, [active]);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 3 || loading) return;
    const failure = language === "en"
      ? "The answer was interrupted. Please try again."
      : "انقطعت الإجابة قبل اكتمالها. يرجى المحاولة مرة أخرى.";
    setError("");
    setQuestion("");
    // Do not send half-written or blank assistant responses as prior facts.
    const history = messages.filter(message => message.content.trim()).slice(-6);
    setMessages(previous => [...previous, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let completed = false;

    try {
      const response = await fetch("/api/public/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history, language }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data: unknown = await response.json().catch(() => null);
        const detail = data && typeof data === "object" && "error" in data
          ? (data as { error?: unknown }).error
          : null;
        throw new Error(typeof detail === "string" && detail.length <= 300 ? detail : failure);
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      const parser = createAssistantStreamParser();
      let receivedText = false;

      function consume(events: ReturnType<typeof parser.push>) {
        let delta = "";
        for (const event of events) {
          if (event.kind === "error") throw new Error(failure);
          if (event.kind === "done") completed = true;
          if (event.kind === "delta") delta += event.text;
        }
        if (delta) {
          receivedText = true;
          // One state update per network chunk, instead of per SSE line/token.
          setMessages(previous => {
            const last = previous.at(-1);
            if (!last || last.role !== "assistant") return previous;
            const next = [...previous];
            next[next.length - 1] = { ...last, content: last.content + delta };
            return next;
          });
        }
      }

      while (!completed) {
        const { done, value } = await reader.read();
        if (done) {
          consume(parser.finish());
          break;
        }
        consume(parser.push(decoder.decode(value, { stream: true })));
      }
      if (!completed) throw new Error(failure);
      if (!receivedText) throw new Error(failure);
    } catch (cause) {
      const cancelled = controller.signal.aborted ||
        (cause instanceof DOMException && cause.name === "AbortError");
      if (cancelled) {
        // Remove an unanswered placeholder; keep an already streamed excerpt.
        setMessages(previous => previous.at(-1)?.role === "assistant" &&
          !previous.at(-1)?.content ? previous.slice(0, -1) : previous);
      } else {
        setError(cause instanceof Error && cause.message ? cause.message : failure);
        setMessages(previous => previous.at(-1)?.role === "assistant" &&
          !previous.at(-1)?.content ? previous.slice(0, -1) : previous);
      }
    } finally {
      // Early completion, error and Stop all release the server-side stream.
      if (reader) await reader.cancel().catch(() => {});
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
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
      <div className="assistant-log" role="log" aria-live="polite" aria-relevant="additions text" aria-busy={loading}>
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
          <Button type="button" variant="outline" size="icon" aria-label={t("إيقاف")} onClick={() => abortRef.current?.abort()}><Square size={16} /></Button>
        ) : (
          <Button type="submit" size="icon" aria-label={t("إرسال السؤال")} disabled={question.trim().length < 3}><ArrowUpLeft size={18} /></Button>
        )}
      </form>
      <p className="assistant-note">{t("إجابات آلية للاسترشاد. التفاصيل المالية تُناقش مباشرة مع مسؤول الاستثمار.")}</p>
    </div>
  );
}
