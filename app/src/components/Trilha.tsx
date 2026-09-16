import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * "Trilha visual com contador regressivo" — a continuous, mobile-first
 * narrative guided by a dashed vertical line, ending in a live countdown
 * to a fixed target date. Single exportable component: React + Tailwind
 * CSS + Framer Motion, matching the Claude Design prototype pixel-for-pixel.
 */

const TARGET_DATE = new Date(2026, 10, 8, 13, 0, 0); // 08 nov 2026, 13:00

const EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];
const VIEWPORT = { once: true, amount: 0.15, margin: '0px 0px -12% 0px' };

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
      className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
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
    text: 'O primeiro Surf Day pós-prova',
    height: 260,
    media: { src: '/surf.webp', alt: 'Surf', placeholder: 'Foto do surf day' },
  },
  {
    text: 'Tardes no Café',
    height: 260,
    media: { src: '/cafe.webp', alt: 'Café', placeholder: 'Foto do café' },
  },
  {
    text: 'Cinemas e Noites de Jogo',
    height: 220,
    media: { src: '/cinema.webp', alt: 'Cinema', placeholder: 'Foto do cinema' },
  },
  {
    text: 'Corridas e Pedaladas às 5h da manhã',
    height: 260,
    media: { src: '/pedalada.webp', alt: 'Pedalada', placeholder: 'Foto da pedalada' },
  },
  {
    text: 'Fim de semana em Serrambi',
    height: 260,
    media: { src: '/serrambi.webp', alt: 'Serrambi', placeholder: 'Foto de Serrambi' },
  },
  {
    text: 'E claro, mais momentos como esse:',
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

export default function Trilha() {
  const target = useMemo(() => TARGET_DATE, []);
  const t = useCountdown(target);

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background: 'linear-gradient(180deg,#faf7f1 0%,#f4efe6 45%,#eef2f5 100%)',
      }}
    >
      <div className="relative mx-auto max-w-[440px] px-[22px]">
        <div className="relative">
          {/* the dashed thread running the whole trail */}
          <div
            className="absolute bottom-0 left-0 top-[96px] w-0 border-l border-dashed"
            style={{ borderColor: '#cbbfae' }}
          />

          {/* start of the trail */}
          <div className="relative pl-[46px] pt-[96px]">
            <div
              className="absolute left-[-5.5px] top-[96px] h-[11px] w-[11px] rounded-full"
              style={{ background: '#a8bfd0', boxShadow: '0 0 0 5px rgba(168,191,208,.18)' }}
            />
            <p
              className="font-heading text-[27px] font-normal leading-[1.25] tracking-[-0.01em] text-[#3a352f]"
              style={{ textWrap: 'pretty' }}
            >
              Quantos dias faltam para...
            </p>

            <div className="mt-[26px] flex gap-[14px]">
              {COUNTDOWN_UNITS.map(({ key, label }) => (
                <div key={key} className="flex min-w-[52px] flex-col gap-[3px]">
                  <span
                    className="font-heading text-[30px] leading-none tabular-nums"
                    style={{ color: key === 'ss' ? '#c0a48c' : '#8aa4b8' }}
                  >
                    {t[key]}
                  </span>
                  <span className="font-body text-[10.5px] uppercase tracking-[0.14em] text-[#a49a8c]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 font-body text-[12.5px] leading-[1.5] text-[#b0a698]">
              08 de novembro de 2026, 13:00
            </p>
          </div>

          {/* the milestones, revealed as they come into view */}
          {MILESTONES.map((milestone, i) => (
            <motion.div
              key={milestone.text}
              className="relative pl-[46px]"
              style={{ paddingTop: i === 0 ? 92 : 76 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.85, ease: EASE }}
            >
              <div
                className="absolute left-[-4.5px] h-[9px] w-[9px] rounded-full border-[1.5px]"
                style={{ top: i === 0 ? 98 : 82, background: '#f4efe6', borderColor: '#c1b4a2' }}
              />
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
          ))}

          {/* end of the trail */}
          <motion.div
            className="relative pl-[46px] pt-[86px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 1, ease: EASE }}
          >
            <div
              className="absolute left-[-8.5px] top-[86px] h-[17px] w-[17px] rounded-full"
              style={{ background: '#a8bfd0', boxShadow: '0 0 0 7px rgba(168,191,208,.14)' }}
            />
            <p
              className="mt-[62px] font-heading text-[23px] font-normal leading-[1.45] tracking-[-0.005em] text-[#3a352f]"
              style={{ textWrap: 'pretty' }}
            >
              isso que vale a pena contar KKKKKKKK
            </p>
            <div className="relative mt-[22px] h-[190px] w-[190px] overflow-hidden rounded-[24px]">
              <MediaSlot
                src="/figurinha.webp"
                alt="Figurinha"
                placeholder="Gif da figurinha"
                fit="contain"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
