import { useEffect, useRef, useState } from "react";

function useMotionVisibility() {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [entry, setEntry] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { const on = Boolean(entry?.isIntersecting); setVisible(on); if (on) setEntry(value => value + 1); }, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, visible, entry };
}

export function SplitHeadline({ text }: { text: string; }) {
  const { ref, visible, entry: run } = useMotionVisibility();
  return <span className="headline-motion-row"><span ref={ref} className="split-headline" aria-label={text}>
    <span className="split-headline__measure" aria-hidden="true">{text}</span>
    <span key={`${text}-${run}`} className={visible ? "split-headline__layers is-playing" : "split-headline__layers"} aria-hidden="true">
      <span className="split-headline__top">{text}</span><span className="split-headline__bottom">{text}</span>
    </span>
  </span></span>;
}

export function WordSlide({ words }: { words: string[]; }) {
  const { ref, visible, entry: run } = useMotionVisibility();
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex(0); }, [run]);
  useEffect(() => {
    if (!visible || words.length < 2) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      if (timer) clearInterval(timer);
      if (!document.hidden && !motion.matches) timer = setInterval(() => setIndex(value => (value + 1) % words.length), 3600);
    };
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    update();
    return () => { if (timer) clearInterval(timer); document.removeEventListener("visibilitychange", update); motion.removeEventListener("change", update); };
  }, [visible, words.length, run]);
  return <span className="headline-motion-row word-slide-row"><span ref={ref} className="word-slide" aria-live="off">
    <span className="word-slide__measure" aria-hidden="true">{words.reduce((longest, word) => word.length > longest.length ? word : longest, "")}</span>
    <span className="sr-only">{words.join("، ")}</span>
    <span key={`${index}-${run}-${words[index]}`} className="word-slide__word" aria-hidden="true">{words[index]}</span>
  </span></span>;
}

export function TypewriterHeadline({ text, language }: { text: string; language: string }) {
  const { ref, visible, entry: run } = useMotionVisibility();
  const characters = Array.from(new Intl.Segmenter(language, { granularity: "grapheme" }).segment(text), part => part.segment);
  return <span className="headline-motion-row"><span ref={ref} className="typewriter-headline" aria-label={text}>
    <span key={`${text}-${run}`} className={visible ? "typewriter-headline__letters is-playing" : "typewriter-headline__letters"} aria-hidden="true">
      {characters.map((character, index) => <span key={index} className="typewriter-headline__character" style={{ animationDelay: `${Math.round(index * 2600 / Math.max(characters.length, 1))}ms` }}>{character}</span>)}
      <span className="typewriter-headline__caret" />
    </span>
  </span></span>;
}