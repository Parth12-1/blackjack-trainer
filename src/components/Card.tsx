import { motion } from 'framer-motion'
import type { Card as CardType } from '../engine/cards'

interface Props {
  card: CardType
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  fromTop?: boolean
  fromSide?: 'left' | 'right'
}

const SIZES = {
  sm: { w: 56, h: 80 },
  md: { w: 72, h: 100 },
  lg: { w: 88, h: 124 },
}

function CardBack({ w, h }: { w: number; h: number }) {
  const r = Math.min(w, h) * 0.1
  return (
    <g>
      <rect width={w} height={h} rx={r} ry={r} fill="#1a237e" />
      {/* Inner border */}
      <rect x={w*0.06} y={w*0.06} width={w*0.88} height={h-w*0.12} rx={r*0.7} ry={r*0.7}
        fill="none" stroke="#3949ab" strokeWidth={w*0.025} />
      {/* Diagonal pattern */}
      <defs>
        <pattern id="cardPattern" patternUnits="userSpaceOnUse" width={w*0.15} height={w*0.15} patternTransform="rotate(45)">
          <rect width={w*0.075} height={w*0.15} fill="#283593" />
        </pattern>
        <clipPath id={`cardClip-${w}`}>
          <rect x={w*0.09} y={w*0.09} width={w*0.82} height={h-w*0.18} rx={r*0.5} ry={r*0.5} />
        </clipPath>
      </defs>
      <rect x={w*0.09} y={w*0.09} width={w*0.82} height={h-w*0.18}
        fill="url(#cardPattern)" clipPath={`url(#cardClip-${w})`} opacity={0.5} />
      {/* Center diamond */}
      <text x={w/2} y={h/2 + w*0.06} textAnchor="middle" fontSize={w*0.35} fill="#3949ab" opacity={0.7}>♦</text>
    </g>
  )
}

export function Card({ card, size = 'md', delay = 0, fromTop = false, fromSide }: Props) {
  const { w, h } = SIZES[size]
  const isRed = card.suit === '♥' || card.suit === '♦'
  const suitColor = isRed ? '#dc2626' : '#111827'
  const rank = card.rank === 'T' ? '10' : card.rank
  const fontSize = size === 'sm' ? 12 : size === 'md' ? 15 : 18
  const suitSize = fontSize * 1.1

  return (
    <motion.div
      layout
      initial={{
        x: fromSide === 'left' ? -90 : fromSide === 'right' ? 90 : 0,
        y: fromTop ? -120 : 100,
        opacity: 0,
        scale: 0.86,
        rotateZ: fromTop ? -7 : 7,
      }}
      animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotateZ: 0 }}
      whileHover={{ y: -3 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 23 }}
      style={{ width: w, height: h, flexShrink: 0 }}
    >
      {card.faceDown ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: 'drop-shadow(1px 3px 4px rgba(0,0,0,0.6))' }}>
          <CardBack w={w} h={h} />
        </svg>
      ) : (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ filter: 'drop-shadow(1px 3px 4px rgba(0,0,0,0.5))' }}>
          <rect x={1} y={1} width={w - 2} height={h - 2} rx={5} fill="#fafafa" stroke="#d1d5db" strokeWidth={1} />
          {/* top-left rank + suit */}
          <text x={5} y={fontSize + 2} fontSize={fontSize} fill={suitColor} fontFamily="Georgia, serif" fontWeight="bold">{rank}</text>
          <text x={5} y={fontSize + suitSize + 4} fontSize={suitSize} fill={suitColor}>{card.suit}</text>
          {/* center large suit */}
          <text x={w / 2} y={h / 2 + suitSize} textAnchor="middle" fontSize={suitSize * 2.2} fill={suitColor} opacity={0.12}>{card.suit}</text>
          {/* bottom-right rotated */}
          <g transform={`rotate(180, ${w / 2}, ${h / 2})`}>
            <text x={5} y={fontSize + 2} fontSize={fontSize} fill={suitColor} fontFamily="Georgia, serif" fontWeight="bold">{rank}</text>
            <text x={5} y={fontSize + suitSize + 4} fontSize={suitSize} fill={suitColor}>{card.suit}</text>
          </g>
        </svg>
      )}
    </motion.div>
  )
}
