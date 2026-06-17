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
          <rect x={1} y={1} width={w - 2} height={h - 2} rx={5} fill="#1e3a5f" stroke="#3b82f6" strokeWidth={1.5} />
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={3} fill="none" stroke="#2563eb" strokeWidth={1} />
          <text x={w / 2} y={h / 2 + 8} textAnchor="middle" fontSize={28} fill="#2563eb" opacity={0.4}>🂠</text>
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
