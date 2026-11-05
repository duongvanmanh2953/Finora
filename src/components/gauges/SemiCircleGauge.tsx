import { useEffect, useRef, useState, useId } from 'react';
import { Box, Typography, Tooltip, Paper, useTheme } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import gsap from 'gsap';

export interface GaugeZone {
  min: number;
  max: number;
  color: string;
  label: string;
}

export interface SemiCircleGaugeProps {
  score: number; // 0 to 100
  targetScore?: number; // target benchmark, e.g. 80
  title: string;
  subtitle?: string;
  formulaExplanation?: string;
  factors?: { label: string; impact: string; isPositive?: boolean }[];
  recommendation?: string;
  size?: number; // default width 220
  inverted?: boolean;
  unitLabel?: string; // default '/100'
}

// 5 crisp status zones (Critical -> Poor -> Average -> Good -> Excellent/Tím Trần)
const HEALTH_ZONES: GaugeZone[] = [
  { min: 0, max: 20, color: '#EF4444', label: 'Nguy cấp' },
  { min: 20, max: 40, color: '#F97316', label: 'Cần chú ý' },
  { min: 40, max: 60, color: '#FBBF24', label: 'Trung bình' },
  { min: 60, max: 80, color: '#10B981', label: 'Tốt' },
  { min: 80, max: 100, color: '#8B5CF6', label: 'Rất tốt' }
];

const RISK_ZONES: GaugeZone[] = [
  { min: 0, max: 20, color: '#8B5CF6', label: 'Rất an toàn' },
  { min: 20, max: 40, color: '#10B981', label: 'An toàn' },
  { min: 40, max: 60, color: '#FBBF24', label: 'Trung bình' },
  { min: 60, max: 80, color: '#F97316', label: 'Rủi ro cao' },
  { min: 80, max: 100, color: '#EF4444', label: 'Báo động' }
];

export function SemiCircleGauge({
  score,
  targetScore = 80,
  title,
  subtitle,
  formulaExplanation,
  factors = [],
  recommendation,
  size = 220,
  inverted = false,
  unitLabel = '/100'
}: SemiCircleGaugeProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const filterId = useId().replace(/:/g, '-');

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const zones = inverted ? RISK_ZONES : HEALTH_ZONES;

  // Geometry
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Mathematical target angle:
  // At score 0 -> -90deg from North (points West / 9 o'clock)
  // At score 50 -> 0deg from North (points North / 12 o'clock)
  // At score 100 -> +90deg from North (points East / 3 o'clock)
  const targetAngle = -90 + (clampedScore / 100) * 180;

  // Animated display score for count-up
  const [displayScore, setDisplayScore] = useState(0);

  // Refs for GSAP
  const needleRef = useRef<SVGGElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const animObj = useRef({ scoreVal: 0, angleVal: -90 });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayScore(clampedScore);
      if (needleRef.current) {
        needleRef.current.setAttribute('transform', `rotate(${targetAngle}, ${centerX}, ${centerY})`);
      }
      return;
    }

    if (tweenRef.current) tweenRef.current.kill();

    // GSAP Tween on SVG rotate attribute with mathematically locked (centerX, centerY) pivot
    tweenRef.current = gsap.to(animObj.current, {
      scoreVal: clampedScore,
      angleVal: targetAngle,
      duration: 1.15,
      ease: 'power2.out',
      onUpdate: () => {
        const curAngle = animObj.current.angleVal;
        const curScore = Math.round(animObj.current.scoreVal);
        setDisplayScore(curScore);

        if (needleRef.current) {
          // Native SVG attribute: 100% immune to CSS transform-box/transform-origin browser deviations
          needleRef.current.setAttribute('transform', `rotate(${curAngle}, ${centerX}, ${centerY})`);
        }
      }
    });

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [clampedScore, targetAngle, centerX, centerY]);

  // Determine active zone based on current animated displayScore
  const activeIndex = zones.findIndex(
    z => displayScore >= z.min && (displayScore < z.max || (displayScore === 100 && z.max === 100))
  );
  const currentActiveZone = zones[activeIndex >= 0 ? activeIndex : 0];

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // 5 equal contiguous segments (36 degrees each: -180deg to 0deg)
  const zoneArcs = zones.map((z, idx) => {
    const startAngle = -180 + idx * 36;
    const endAngle = -180 + (idx + 1) * 36;
    return {
      ...z,
      d: describeArc(centerX, centerY, radius, startAngle, endAngle)
    };
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        borderRadius: '10px',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : '#E2E8F0',
        bgcolor: isDark ? '#111822' : '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 1.5,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
          boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.06)'
        }
      }}
    >
      {/* Header: Title, Subtitle & Info Tooltip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.88rem' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {formulaExplanation && (
          <Tooltip
            title={
              <Box sx={{ p: 0.5, maxWidth: 260 }}>
                <Typography variant="caption" sx={{ fontWeight: 750, display: 'block', mb: 0.5 }}>
                  Công thức & Tiêu chí đánh giá:
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.72rem', lineHeight: 1.4 }}>
                  {formulaExplanation}
                </Typography>
              </Box>
            }
          >
            <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'pointer' }} />
          </Tooltip>
        )}
      </Box>

      {/* Speedometer Gauge Visual with Locked Axis and Vivid Active Zone Illumination */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 0.5, width: '100%' }}>
        <svg
          width="100%"
          height={size / 2 + 18}
          viewBox={`0 0 ${size} ${size / 2 + 18}`}
          style={{ maxWidth: size, display: 'block', overflow: 'visible' }}
        >
          {/* SVG Glow Filter for the Active Zone */}
          <defs>
            <filter id={`glow-${filterId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. LAYER 1: 5 Zones with Active Zone Highlighting */}
          {zoneArcs.map((arc, i) => {
            const isActive = i === (activeIndex >= 0 ? activeIndex : 0);
            return (
              <g key={i}>
                {/* Glowing halo for the zone that needle is pointing to */}
                {isActive && (
                  <path
                    d={arc.d}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={strokeWidth + 6}
                    strokeLinecap="round"
                    opacity={0.5}
                    filter={`url(#glow-${filterId})`}
                  />
                )}
                {/* Sharp arc segment */}
                <path
                  d={arc.d}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={isActive ? strokeWidth + 3 : strokeWidth - 2}
                  strokeLinecap={i === 0 || i === zoneArcs.length - 1 ? 'round' : 'butt'}
                  opacity={isActive ? 1.0 : isDark ? 0.22 : 0.28}
                  style={{
                    transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                    filter: isActive ? 'brightness(1.15)' : 'none'
                  }}
                />
              </g>
            );
          })}

          {/* 2. LAYER 2: Rotating Needle (Strictly positioned UNDER pivot cap, locked on cx/cy) */}
          <g ref={needleRef} transform={`rotate(${targetAngle}, ${centerX}, ${centerY})`}>
            {/* Needle Body Shadow */}
            <polygon
              points={`${centerX - 3.5},${centerY} ${centerX + 3.5},${centerY} ${centerX},${centerY - radius + 4}`}
              fill="rgba(0,0,0,0.3)"
              transform="translate(1, 1)"
            />
            {/* Needle Body colored to match active zone */}
            <polygon
              points={`${centerX - 3},${centerY} ${centerX + 3},${centerY} ${centerX},${centerY - radius + 4}`}
              fill={currentActiveZone.color}
            />
            {/* Needle Center Anchor Extension */}
            <circle cx={centerX} cy={centerY} r={6} fill={currentActiveZone.color} />
          </g>

          {/* 3. LAYER 3: Center Pivot Cap (Rendered strictly on TOP of the needle) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={8.5}
            fill={isDark ? '#0F172A' : '#1E293B'}
            stroke={currentActiveZone.color}
            strokeWidth={1.5}
          />
          <circle cx={centerX} cy={centerY} r={4} fill={currentActiveZone.color} />
        </svg>

        {/* Value and Zone Badge sitting cleanly under the speedometer */}
        <Box sx={{ textAlign: 'center', mt: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: currentActiveZone.color,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontSize: { xs: '1.75rem', sm: '2rem' },
                fontFeatureSettings: '"tnum"'
              }}
            >
              {displayScore}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.85rem' }}>
              {unitLabel}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mt: 0.75 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.25,
                py: 0.35,
                borderRadius: '4px',
                fontWeight: 800,
                fontSize: '0.72rem',
                bgcolor: `${currentActiveZone.color}1A`,
                color: currentActiveZone.color,
                border: `1px solid ${currentActiveZone.color}40`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: currentActiveZone.color }} />
              {currentActiveZone.label}
            </Typography>

            {targetScore && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem' }}>
                Mục tiêu: ≥{targetScore}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Factors / Driver details if provided */}
      {factors.length > 0 && (
        <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {factors.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 'inherit' }}>
                  {f.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: 'inherit',
                    color: f.isPositive ? '#10B981' : '#EF4444'
                  }}
                >
                  {f.impact}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Action Recommendation */}
      {recommendation && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            p: 1,
            borderRadius: '6px',
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
            color: 'text.secondary',
            fontSize: '0.70rem',
            lineHeight: 1.4,
            borderLeft: `3px solid ${currentActiveZone.color}`
          }}
        >
          {recommendation}
        </Typography>
      )}
    </Paper>
  );
}
