import { useEffect, useRef, useState } from "react";
import { Scissors, X, Trophy } from "lucide-react";

/**
 * Hidden mini-game: "Scissor Run"
 * Click/tap falling hairs with the scissors before they reach the bottom.
 * Triggered by a tiny scissors icon in the bottom-right corner.
 */
export function HiddenGame() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hairs, setHairs] = useState<{ id: number; x: number; y: number; speed: number }[]>([]);
  const idRef = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("hair-game-hs") : null;
    if (stored) setHighScore(parseInt(stored));
  }, []);

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      const w = areaRef.current?.clientWidth || 300;
      setHairs((h) => [
        ...h,
        {
          id: idRef.current++,
          x: Math.random() * (w - 30),
          y: -20,
          speed: 1.5 + Math.random() * 2.5 + score * 0.05,
        },
      ]);
    }, 700);

    const move = setInterval(() => {
      const h = areaRef.current?.clientHeight || 400;
      setHairs((arr) => arr.map((p) => ({ ...p, y: p.y + p.speed })).filter((p) => p.y < h));
    }, 30);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawn);
      clearInterval(move);
      clearInterval(timer);
    };
  }, [running, score]);

  useEffect(() => {
    if (!running && score > highScore) {
      setHighScore(score);
      if (typeof window !== "undefined") localStorage.setItem("hair-game-hs", String(score));
    }
  }, [running, score, highScore]);

  const start = () => {
    setScore(0);
    setTimeLeft(30);
    setHairs([]);
    setRunning(true);
  };

  const cut = (id: number) => {
    setHairs((h) => h.filter((p) => p.id !== id));
    setScore((s) => s + 1);
  };

  return (
    <>
      {/* Tiny trigger — bottom right, very subtle */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Mini παιχνίδι"
        className="fixed bottom-4 right-4 z-30 w-9 h-9 rounded-full bg-card/40 hover:bg-card border border-border/30 hover:border-primary backdrop-blur-sm flex items-center justify-center text-muted-foreground/40 hover:text-primary transition-all duration-500 hover:scale-110 hover:rotate-12 group"
      >
        <Scissors className="h-3.5 w-3.5 group-hover:animate-pulse" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-elegant p-6 w-full max-w-md animate-scale-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-primary"
              aria-label="Κλείσιμο"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-4">
              <h3 className="font-serif text-2xl mb-1">✂️ Scissor Run</h3>
              <p className="text-xs text-muted-foreground">
                Κόψε όσες περισσότερες τρίχες μπορείς σε 30 δευτερόλεπτα!
              </p>
            </div>

            <div className="flex justify-between text-sm mb-3">
              <span>
                Σκορ: <strong className="text-primary">{score}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-primary" /> {highScore}
              </span>
              <span>
                ⏱ <strong>{timeLeft}s</strong>
              </span>
            </div>

            <div
              ref={areaRef}
              className="relative w-full h-80 bg-gradient-dark border border-border rounded-xl overflow-hidden cursor-crosshair"
            >
              {!running && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={start}
                    className="px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium hover-lift"
                  >
                    {score > 0 ? "Παίξε ξανά" : "Έναρξη"}
                  </button>
                </div>
              )}
              {hairs.map((h) => (
                <button
                  key={h.id}
                  onClick={() => cut(h.id)}
                  style={{ left: h.x, top: h.y }}
                  className="absolute w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform"
                  aria-label="Κόψε"
                >
                  <span className="text-2xl select-none">〰️</span>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
              Easter egg από τον Γιάννη 💈
            </p>
          </div>
        </div>
      )}
    </>
  );
}
