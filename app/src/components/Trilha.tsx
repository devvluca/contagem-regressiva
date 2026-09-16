import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

/**
 * "Trilha visual com contador regressivo" — a continuous, mobile-first
 * narrative guided by a dashed vertical line, ending in a live countdown
 * to a fixed target date. Single exportable component: React + Tailwind
 * CSS + Framer Motion, matching the Claude Design prototype pixel-for-pixel.
 */

const TARGET_DATE = new Date(2026, 10, 8, 13, 0, 0); // 08 nov 2026, 13:00

const EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];
// strict enough that each milestone only wakes up once it is really on screen,
// so the trail is read one step at a time instead of all at once
const VIEWPORT = { once: true, amount: 0.3, margin: '0px 0px -22% 0px' };

const RAIL = '#cbbfae';
const ACCENT = '#a8bfd0';

type Side = 'left' | 'right';

// share of a block's scroll spent hopping sideways before heading down
const HOP = 0.12;

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, target.getTime() - Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSeconds = Math.floor(remaining / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    dd: Math.floor(totalSeconds / 86400),
    hh: pad(Math.floor(totalSeconds / 3600) % 24),
    mm: pad(Math.floor(totalSeconds / 60) % 60),
    ss: pad(totalSeconds % 60),
  };
}

function UploadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-45"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

type MediaProps = {
  src?: string;
  alt: string;
  placeholder: string;
  fit?: 'cover' | 'contain';
};

function MediaSlot({ src, alt, placeholder, fit = 'cover' }: MediaProps) {
  const [broken, setBroken] = useState(false);
  const filled = Boolean(src) && !broken;

  if (!filled) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-[inherit] border border-dashed border-[#c1b4a2]/70 bg-[#efe7d8] p-3 text-center text-[#a49a8c]">
        <UploadIcon />
        <span className="font-body text-[12.5px]">{placeholder}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className={`h-full w-full rounded-[inherit] ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
    />
  );
}

type Milestone = {
  text: string;
  height: number;
  media: MediaProps;
};

const MILESTONES: Milestone[] = [
  {
    text: 'primeiro surf day pós prova',
    height: 260,
    media: { src: '/surf.webp', alt: 'Surf', placeholder: 'Foto do surf day' },
  },
  {
    text: 'conhecer cafés novos',
    height: 260,
    media: { src: '/cafe.webp', alt: 'Café', placeholder: 'Foto do café' },
  },
  {
    text: 'cinemas',
    height: 220,
    media: { src: '/cinema.webp', alt: 'Cinema', placeholder: 'Foto do cinema' },
  },
  {
    text: 'corridas/pedadalas em dias superprodutivos às 5h da manhã',
    height: 260,
    media: { src: '/pedalada.webp', alt: 'Pedalada', placeholder: 'Foto da pedalada' },
  },
  {
    text: 'viagem pra serrambi do grupo amigos',
    height: 260,
    media: { src: '/serrambi.webp', alt: 'Serrambi', placeholder: 'Foto de Serrambi' },
  },
  {
    text: 'e claro, mais jantares sem o c7 marcando treino no dia',
    height: 230,
    media: { src: '/jantar.webp', alt: 'Jantar', placeholder: 'Foto do jantar' },
  },
];

const COUNTDOWN_UNITS: { key: 'dd' | 'hh' | 'mm' | 'ss'; label: string }[] = [
  { key: 'dd', label: 'dias' },
  { key: 'hh', label: 'horas' },
  { key: 'mm', label: 'min' },
  { key: 'ss', label: 'seg' },
];

/** The dashed rail for one block, plus the coloured part already walked. */
function Rail({ side, progress }: { side: Side; progress: MotionValue<number> }) {
  const pos = side === 'left' ? 'left-0' : 'right-0';
  // the vertical run only starts once the sideways hop is done
  const fill = useTransform(progress, [HOP, 1], [0, 1], { clamp: true });
  return (
    <>
      <div
        className={`absolute ${pos} bottom-0 top-0 w-0 border-l border-dashed`}
        style={{ borderColor: RAIL }}
      />
      <motion.div
        className={`absolute ${pos} top-0 h-full w-0 border-l`}
        style={{ borderColor: ACCENT, scaleY: fill, transformOrigin: 'top' }}
      />
    </>
  );
}

/** Horizontal dashed hop that carries the trail across to the other side. */
function Crossover({ side, progress }: { side: Side; progress?: MotionValue<number> }) {
  // fills from the side the trail arrives from, towards this block's rail
  const zero = useMotionValue(0);
  const fill = useTransform(progress ?? zero, [0, HOP], [0, 1], { clamp: true });
  return (
    <>
      <div
        className="absolute left-0 right-0 top-0 border-t border-dashed"
        style={{ borderColor: RAIL }}
      />
      <motion.div
        className="absolute left-0 right-0 top-0 w-full border-t"
        style={{
          borderColor: ACCENT,
          scaleX: fill,
          transformOrigin: side === 'right' ? 'left' : 'right',
        }}
      />
    </>
  );
}

function MilestoneRow({
  milestone,
  side,
  index,
}: {
  milestone: Milestone;
  side: Side;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // this block's progress through the viewport drives the travelling dot
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'end 45%'],
  });
  // the dot walks the whole path: sideways across the crossover, then down the rail
  const hopPct = useTransform(
    scrollYProgress,
    [0, HOP],
    side === 'right' ? [0, 100] : [100, 0],
    { clamp: true },
  );
  const downPct = useTransform(scrollYProgress, [HOP, 1], [0, 100], { clamp: true });
  const dotLeft = useMotionTemplate`calc(${hopPct}% - 5.5px)`;
  const dotTop = useMotionTemplate`calc(${downPct}% - 5.5px)`;

  return (
    <div
      ref={ref}
      className={`relative ${side === 'left' ? 'pl-[clamp(32px,11vw,46px)]' : 'pr-[clamp(32px,11vw,46px)] text-right'}`}
      style={{ paddingTop: index === 0 ? 92 : 76 }}
    >
      <Crossover side={side} progress={scrollYProgress} />
      <Rail side={side} progress={scrollYProgress} />

      <motion.div
        className="absolute h-[11px] w-[11px] rounded-full"
        style={{
          left: dotLeft,
          top: dotTop,
          background: ACCENT,
          boxShadow: '0 0 0 5px rgba(168,191,208,.18)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.85, ease: EASE }}
      >
        <p
          className="font-heading text-[21px] font-normal leading-[1.35] text-[#3a352f]"
          style={{ textWrap: 'pretty' }}
        >
          {milestone.text}
        </p>
        <div
          className="relative mt-[14px] w-full overflow-hidden rounded-[18px]"
          style={{ height: milestone.height, boxShadow: '0 2px 10px rgba(58,53,47,.07)' }}
        >
          <MediaSlot {...milestone.media} />
        </div>
      </motion.div>
    </div>
  );
}

export default function Trilha() {
  const target = useMemo(() => TARGET_DATE, []);
  const t = useCountdown(target);

  // the trail opens on the left, then zigzags; the closing block takes
  // whichever side the last milestone did not use
  const sideOf = (i: number): Side => (i % 2 === 0 ? 'right' : 'left');
  const endSide: Side = sideOf(MILESTONES.length - 1) === 'left' ? 'right' : 'left';

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background: 'linear-gradient(180deg,#faf7f1 0%,#f4efe6 45%,#eef2f5 100%)',
      }}
    >
      <div className="relative mx-auto max-w-[440px] px-[22px]">
        <div className="relative">
          {/* start of the trail */}
          <div className="relative min-h-[90svh] pl-[clamp(32px,11vw,46px)] pt-[96px]">
            <div
              className="absolute bottom-0 left-0 top-[96px] w-0 border-l border-dashed"
              style={{ borderColor: RAIL }}
            />
            <div
              className="absolute left-[-5.5px] top-[96px] h-[11px] w-[11px] rounded-full"
              style={{ background: ACCENT, boxShadow: '0 0 0 5px rgba(168,191,208,.18)' }}
            />
            <p
              className="font-heading text-[27px] font-normal leading-[1.25] tracking-[-0.01em] text-[#3a352f]"
              style={{ textWrap: 'pretty' }}
            >
              Quantos dias faltam pra...
            </p>

            <div className="mt-[30px] flex gap-[clamp(10px,3.2vw,18px)]">
              {COUNTDOWN_UNITS.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-[5px]">
                  <span
                    className="font-heading text-[clamp(32px,11vw,46px)] leading-none tabular-nums"
                    style={{ color: key === 'ss' ? '#c0a48c' : '#8aa4b8' }}
                  >
                    {t[key]}
                  </span>
                  <span className="font-body text-[clamp(9.5px,2.9vw,11.5px)] uppercase tracking-[0.12em] text-[#a49a8c]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-[22px] font-body text-[clamp(14px,4.1vw,16px)] leading-[1.5] text-[#a89d8d]">
              08 de novembro de 2026, 13:00
            </p>
          </div>

          {/* the milestones, one at a time, side to side */}
          {MILESTONES.map((milestone, i) => (
            <MilestoneRow
              key={milestone.text}
              milestone={milestone}
              side={sideOf(i)}
              index={i}
            />
          ))}

          {/* end of the trail */}
          <div
            className={`relative ${endSide === 'left' ? 'pl-[clamp(32px,11vw,46px)]' : 'pr-[clamp(32px,11vw,46px)] text-right'} pt-[86px]`}
          >
            <Crossover side={endSide} />
            <div
              className={`absolute ${endSide === 'left' ? 'left-0' : 'right-0'} bottom-0 top-0 w-0 border-l border-dashed`}
              style={{ borderColor: RAIL }}
            />
            <div
              className={`absolute ${endSide === 'left' ? 'left-[-8.5px]' : 'right-[-8.5px]'} top-[86px] h-[17px] w-[17px] rounded-full`}
              style={{ background: ACCENT, boxShadow: '0 0 0 7px rgba(168,191,208,.14)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 1, ease: EASE }}
            >
              <p
                className="mt-[62px] font-heading text-[23px] font-normal leading-[1.45] tracking-[-0.005em] text-[#3a352f]"
                style={{ textWrap: 'pretty' }}
              >
                isso que vale a pena contar KKKKKKKK
              </p>
              <div
                className={`relative mt-[22px] h-[340px] w-[272px] max-w-full overflow-hidden rounded-[32px] ${endSide === 'right' ? 'ml-auto' : ''}`}
              >
                <MediaSlot
                  src="/figurinha.webp"
                  alt="Figurinha"
                  placeholder="Gif da figurinha"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
