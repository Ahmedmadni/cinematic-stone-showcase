import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function useMotionVisibility() {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Replay({ onClick, label }: { onClick: () => void; label: string }) {
  return <Button type="button" size="icon" variant="ghost" className="headline-replay" onClick={onClick} aria-label={label} title={label}><RotateCcw aria-hidden="true" size={18} /></Button>;
}

export function SplitHeadline({ text, replayLabel }: { text: string; replayLabel: string }) {
  const { ref, visible } = useMotionVisibility();
  const [run, setRun] = useState(0);
  return <span className="headline-motion-row"><span ref={ref} className="split-headline" aria-label={text}>
    <span className="split-headline__measure" aria-hidden="true">{text}</span>
    <span key={`${text}-${run}`} className={visible ? "split-headline__layers is-playing" : "split-headline__layers"} aria-hidden="true">
      <span className="split-headline__top">{text}</span><span className="split-headline__bottom">{text}</span>
    </span>
  </span><Replay label={replayLabel} onClick={() => setRun(value => value + 1)} /></span>;
}

export function WordSlide({ words, replayLabel }: { words: string[]; replayLabel: string }) {
  const { ref, visible } = useMotionVisibility();
  const [index, setIndex] = useState(0);
  const [run, setRun] = useState(0);
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
  </span><Replay label={replayLabel} onClick={() => { setIndex(0); setRun(value => value + 1); }} /></span>;
}

export function TypewriterHeadline({ text, replayLabel, language }: { text: string; replayLabel: string; language: string }) {
  const { ref, visible } = useMotionVisibility();
  const [run, setRun] = useState(0);
  const characters = Array.from(new Intl.Segmenter(language, { granularity: "grapheme" }).segment(text), part => part.segment);
  return <span className="headline-motion-row"><span ref={ref} className="typewriter-headline" aria-label={text}>
    <span key={`${text}-${run}`} className={visible ? "typewriter-headline__letters is-playing" : "typewriter-headline__letters"} aria-hidden="true">
      {characters.map((character, index) => <span key={index} className="typewriter-headline__character" style={{ animationDelay: `${Math.round(index * 2600 / Math.max(characters.length, 1))}ms` }}>{character}</span>)}
      <span className="typewriter-headline__caret" />
    </span>
  </span><Replay label={replayLabel} onClick={() => setRun(value => value + 1)} /></span>;
}