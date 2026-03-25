import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCcw, Music, Terminal, AlertTriangle, Zap } from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: "SIGNAL_LOST_01",
    artist: "VOID_ENGINE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "NEURAL_DECAY",
    artist: "VOID_ENGINE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "GHOST_IN_SHELL",
    artist: "VOID_ENGINE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

export default function App() {
  // Music Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Snake Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const directionRef = useRef(INITIAL_DIRECTION);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("SIGNAL_INTERRUPTED:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  // --- Snake Game Logic ---
  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setFood(generateFood(INITIAL_SNAKE));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && (!gameStarted || gameOver)) {
        resetGame();
        return;
      }

      if (!gameStarted || gameOver) return;

      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const speed = Math.max(40, 120 - Math.floor(score / 50) * 8);
    const intervalId = setInterval(moveSnake, speed);

    return () => clearInterval(intervalId);
  }, [gameStarted, gameOver, food, score, generateFood]);

  // --- Canvas Drawing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines
    ctx.strokeStyle = '#00ffff22';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
    }

    // Food (Magenta Glitch)
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(food.x * CELL_SIZE + 2, food.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    // Snake (Cyan Glitch)
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#00ffff' : '#00ffffaa';
      ctx.shadowBlur = index === 0 ? 15 : 5;
      ctx.shadowColor = '#00ffff';
      ctx.fillRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });

    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ffff] font-mono crt-flicker relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="scanlines" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="mb-12 border-b-4 border-[#ff00ff] pb-4 flex justify-between items-end tear-effect">
          <div>
            <h1 className="text-6xl font-black tracking-tighter glitch" data-text="SYSTEM_OVERRIDE">
              SYSTEM_OVERRIDE
            </h1>
            <p className="text-xl text-[#ff00ff] mt-2 opacity-80">
              [STATUS: UNSTABLE] [AUTH: GRANTED]
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-50">NODE_ID: 0x7F2A9B</div>
            <div className="text-sm opacity-50">UPTIME: 00:00:00:00</div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-[350px_1fr_350px] gap-8">
          
          {/* AUDIO_PROCESSOR */}
          <section className="neon-border p-6 bg-[#050505] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff] animate-pulse" />
            <div className="flex items-center gap-2 mb-6">
              <Terminal size={20} />
              <h2 className="text-lg font-bold uppercase tracking-widest">AUDIO_PROCESSOR</h2>
            </div>

            <div className="mb-8 p-4 border border-[#00ffff44] bg-[#00ffff05]">
              <div className="text-xs text-[#ff00ff] mb-1">STREAMING_DATA:</div>
              <div className="text-2xl font-bold truncate glitch" data-text={TRACKS[currentTrackIndex].title}>
                {TRACKS[currentTrackIndex].title}
              </div>
              <div className="text-sm opacity-60">SOURCE: {TRACKS[currentTrackIndex].artist}</div>
            </div>

            <div className="flex justify-center gap-6 mb-8">
              <button onClick={prevTrack} className="hover:text-[#ff00ff] transition-colors">
                <SkipBack size={32} />
              </button>
              <button onClick={togglePlay} className="text-[#ff00ff] hover:scale-110 transition-transform">
                {isPlaying ? <Pause size={48} /> : <Play size={48} />}
              </button>
              <button onClick={nextTrack} className="hover:text-[#ff00ff] transition-colors">
                <SkipForward size={32} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 size={16} />
                <div className="flex-1 h-2 bg-[#00ffff22] relative">
                  <div className="absolute top-0 left-0 h-full bg-[#00ffff] w-3/4" />
                </div>
              </div>
              <div className="text-[10px] opacity-40 leading-tight">
                CAUTION: HIGH FREQUENCY OSCILLATIONS DETECTED. NEURAL INTERFACE MAY EXPERIENCE JITTER.
              </div>
            </div>

            <audio ref={audioRef} src={TRACKS[currentTrackIndex].url} onEnded={handleTrackEnded} />
          </section>

          {/* NEURAL_SIMULATOR */}
          <section className="flex flex-col items-center">
            <div className="w-full flex justify-between mb-4 px-2">
              <div className="neon-border-magenta px-4 py-2 bg-[#ff00ff11]">
                <div className="text-[10px] text-[#ff00ff] uppercase">DATA_HARVESTED</div>
                <div className="text-3xl font-bold">{score}</div>
              </div>
              <div className="neon-border px-4 py-2 bg-[#00ffff11] text-right">
                <div className="text-[10px] text-[#00ffff] uppercase">SIM_STATE</div>
                <div className="text-xl font-bold">{gameOver ? "TERMINATED" : gameStarted ? "ACTIVE" : "STANDBY"}</div>
              </div>
            </div>

            <div className="relative p-1 bg-[#ff00ff] shadow-[0_0_20px_#ff00ff]">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="block"
              />
              
              {(!gameStarted || gameOver) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505ee] backdrop-blur-sm z-20">
                  <div className="mb-8 text-center">
                    <AlertTriangle size={64} className="mx-auto mb-4 text-[#ff00ff] animate-bounce" />
                    <h3 className="text-5xl font-black glitch mb-2" data-text={gameOver ? "CRITICAL_ERROR" : "INIT_SEQUENCE"}>
                      {gameOver ? "CRITICAL_ERROR" : "INIT_SEQUENCE"}
                    </h3>
                    {gameOver && <p className="text-[#ff00ff]">CORE_INTEGRITY: 0%</p>}
                  </div>
                  
                  <button
                    onClick={resetGame}
                    className="pixel-button text-2xl font-bold px-12 py-4"
                  >
                    {gameOver ? "REBOOT_SYSTEM" : "EXECUTE_PROGRAM"}
                  </button>
                  
                  <div className="mt-8 text-[10px] opacity-50 animate-pulse">
                    INPUT_REQUIRED: [SPACE_BAR] TO OVERRIDE
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-8 w-full max-w-[400px]">
              <div className="text-[10px] opacity-50 border-l border-[#00ffff] pl-2">
                [W][A][S][D] :: NAVIGATE_VECTORS
                <br />
                [SPACE] :: REBOOT_KERNEL
              </div>
              <div className="text-[10px] opacity-50 border-r border-[#ff00ff] pr-2 text-right">
                WARNING: PROLONGED EXPOSURE TO SIMULATION MAY RESULT IN TEMPORAL DISPLACEMENT.
              </div>
            </div>
          </section>

          {/* SYSTEM_LOGS */}
          <section className="neon-border-magenta p-6 bg-[#050505] flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-[#ff00ff]">
              <Zap size={20} />
              <h2 className="text-lg font-bold uppercase tracking-widest">SYSTEM_LOGS</h2>
            </div>

            <div className="flex-1 space-y-4 overflow-hidden">
              {TRACKS.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); }}
                  className={`p-3 border cursor-pointer transition-all ${
                    currentTrackIndex === idx 
                      ? 'border-[#ff00ff] bg-[#ff00ff22] text-[#ff00ff]' 
                      : 'border-[#00ffff22] hover:border-[#00ffff] text-[#00ffff88] hover:text-[#00ffff]'
                  }`}
                >
                  <div className="text-[10px] opacity-50 mb-1">ENTRY_00{idx + 1}</div>
                  <div className="font-bold truncate">{track.title}</div>
                  <div className="text-[10px] opacity-70">SIZE: 4.2MB // TYPE: AUDIO_WAVE</div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#ff00ff44]">
              <div className="text-[10px] text-[#ff00ff] animate-pulse">
                {">"} ANALYZING_NEURAL_PATTERNS...
                <br />
                {">"} ENCRYPTING_DATA_STREAMS...
                <br />
                {">"} CONNECTION_ESTABLISHED.
              </div>
            </div>
          </section>

        </main>

        <footer className="mt-12 pt-4 border-t border-[#00ffff44] flex justify-between text-[10px] opacity-30">
          <div>© 2026 VOID_INDUSTRIES // ALL_RIGHTS_RESERVED</div>
          <div className="flex gap-4">
            <span>PRIVACY_PROTOCOL</span>
            <span>TERMS_OF_SERVICE</span>
            <span>REBOOT_MANUAL</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
