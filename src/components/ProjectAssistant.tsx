import { useRef, useState, type FormEvent } from "react";
import { ArrowUpLeft, Pickaxe, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = ["كم عدد المحاجر ومساحاتها؟", "ما المعدات المتوفرة في الموقع؟", "ما الشهادات التي يحملها المشروع؟", "أين يقع المحجر بالتحديد؟"];

export function ProjectAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 3 || loading) return;
    setError("");
    setQuestion("");
    const history = messages.slice(-6);
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/public/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "تعذّرت الإجابة الآن.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, content: last.content + evt.delta };
                return copy;
              });
            } else if (evt.type === "response.failed" || evt.type === "error") {
              throw new Error("تعذّر إكمال الإجابة.");
            }
          } catch (e) {
            if (e instanceof Error && e.message.startsWith("تعذّر")) throw e;
          }
        }
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError(e instanceof Error ? e.message : "تعذّرت الإجابة الآن.");
        setMessages((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
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
        <div><strong>مساعد الصمان</strong><small>يجيب من معلومات المشروع المعتمدة فقط</small></div>
      </div>
      <div className="assistant-log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="assistant-suggestions">
            {suggestions.map((s) => <button type="button" key={s} onClick={() => void ask(s)}>{s}</button>)}
          </div>
        ) : messages.map((m, i) => (
          <div key={i} className={`assistant-msg ${m.role}`}>
            {m.content || (loading && i === messages.length - 1 ? <span className="assistant-typing">جارٍ إعداد الإجابة…</span> : null)}
          </div>
        ))}
      </div>
      {error && <p className="assistant-error" role="alert">{error}</p>}
      <form className="assistant-form" onSubmit={onSubmit}>
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} rows={2} placeholder="اكتب سؤالك عن المحجر أو الكسارة…" aria-label="سؤالك عن المشروع" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(question); } }} />
        {loading ? (
          <Button type="button" variant="outline" size="icon" aria-label="إيقاف" onClick={() => abortRef.current?.abort()}><Square size={16} /></Button>
        ) : (
          <Button type="submit" size="icon" aria-label="إرسال السؤال" disabled={question.trim().length < 3}><ArrowUpLeft size={18} /></Button>
        )}
      </form>
      <p className="assistant-note">إجابات آلية للاسترشاد. التفاصيل المالية تُناقش مباشرة مع مسؤول الاستثمار.</p>
    </div>
  );
}
