import { Box, Typography, Tooltip, Paper } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export interface GaugeZone {
  min: number;
  max: number;
  color: string;
  label: string;
}

export interface SemiCircleGaugeProps {
  score: number; // 0 to 100
  title: string;
  subtitle?: string;
  formulaExplanation?: string;
  factors?: { label: string; impact: string; isPositive?: boolean }[];
  recommendation?: string;
  size?: number; // default width 220
  inverted?: boolean; // if true, 0 is best (green) and 100 is worst (red). Default: 100 is best (green), 0 is worst (red)
  unitLabel?: string; // default '/100'
}

// 4 equal contiguous zones (25% each): Đỏ -> Vàng -> Xanh dương -> Xanh lá (Bright & High-Contrast)
const HEALTH_ZONES: GaugeZone[] = [
  { min: 0, max: 25, color: '#FF5252', label: 'Báo động' },
  { min: 25, max: 50, color: '#FBBF24', label: 'Cần chú ý' },
  { min: 50, max: 75, color: '#38BDF8', label: 'An toàn' },
  { min: 75, max: 100, color: '#34D399', label: 'Rất tốt' }
];

// Inverted risk zones: Xanh lá -> Xanh dương -> Vàng -> Đỏ
const RISK_ZONES: GaugeZone[] = [
  { min: 0, max: 25, color: '#34D399', label: 'An toàn' },
  { min: 25, max: 50, color: '#38BDF8', label: 'Thấp' },
  { min: 50, max: 75, color: '#FBBF24', label: 'Cảnh báo' },
  { min: 75, max: 100, color: '#FF5252', label: 'Nguy cấp' }
];

export function SemiCircleGauge({
  score,
  title,
  subtitle,
  formulaExplanation,
  factors = [],
  recommendation,
  size = 220,
  inverted = false,
  unitLabel = '/100'
}: SemiCircleGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const zones = inverted ? RISK_ZONES : HEALTH_ZONES;

  // Find active zone
  const activeZone = zones.find(z => clampedScore >= z.min && clampedScore <= z.max) || zones[0];

  // SVG Geometry Constants
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Needle Angle: Unrotated needle points straight UP (0deg = NORTH = 50 score)
  // Score 0 = WEST (-90deg), Score 50 = NORTH (0deg), Score 100 = EAST (+90deg)
  const needleAngle = -90 + (clampedScore / 100) * 180;

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

  // 4 equal contiguous segments (45 degrees each), perfectly meeting without gaps
  const zoneArcs = zones.map((z, idx) => {
    const startAngle = -180 + idx * 45;
    const endAngle = -180 + (idx + 1) * 45;
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
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 1.5,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'text.secondary',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }
      }}
    >
      {/* Header: Title & Info Tooltip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 750, color: 'text.primary', fontSize: '0.88rem' }}>
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

      {/* Speedometer Gauge Visual */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 0.5, width: '100%' }}>
        <svg
          width="100%"
          height={size / 2 + 16}
          viewBox={`0 0 ${size} ${size / 2 + 16}`}
          style={{ maxWidth: size, display: 'block', overflow: 'visible' }}
        >
          {/* Background Arc: 4 equal seamless contiguous segments */}
          {zoneArcs.map((arc, i) => {
            const isActive = arc === activeZone;
            return (
              <path
                key={i}
                d={arc.d}
                fill="none"
                stroke={arc.color}
                strokeWidth={isActive ? strokeWidth + 1 : strokeWidth}
                strokeLinecap={i === 0 || i === zoneArcs.length - 1 ? 'round' : 'butt'}
                opacity={isActive ? 1 : 0.45}
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          })}

          {/* Needle Center Pivot Base */}
          <circle cx={centerX} cy={centerY} r={8} fill="var(--text-primary, #1e293b)" opacity={0.9} />
          <circle cx={centerX} cy={centerY} r={4} fill="#FFFFFF" />

          {/* Rotating Needle pointing accurately to current value */}
          <g transform={`rotate(${needleAngle}, ${centerX}, ${centerY})`}>
            <polygon
              points={`${centerX - 3},${centerY} ${centerX + 3},${centerY} ${centerX},${centerY - radius + 4}`}
              fill={activeZone.color}
              style={{ transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </g>
        </svg>

        {/* Value and Zone Badge sitting cleanly UNDER the speedometer needle pivot */}
        <Box sx={{ textAlign: 'center', mt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: activeZone.color,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontSize: { xs: '1.75rem', sm: '2rem' }
              }}
            >
              {clampedScore}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.85rem' }}>
              {unitLabel}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'inline-block',
              mt: 0.75,
              px: 1.25,
              py: 0.35,
              borderRadius: '6px',
              fontWeight: 750,
              fontSize: '0.74rem',
              bgcolor: `${activeZone.color}15`,
              color: activeZone.color,
              border: `1px solid ${activeZone.color}40`
            }}
          >
            {activeZone.label}
          </Typography>
        </Box>
      </Box>

      {/* Why this score? Contributing Factors */}
      {factors.length > 0 && (
        <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>
            Yếu tố tác động chính:
          </Typography>
          {factors.map((f, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
              <strong style={{ color: f.isPositive ? '#10B981' : f.isPositive === false ? '#EF4444' : 'inherit' }}>
                {f.impact}
              </strong>
            </Box>
          ))}
        </Box>
      )}

      {/* Actionable Recommendation */}
      {recommendation && (
        <Box sx={{ p: 1, borderRadius: '6px', bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
            💡 <strong>Khuyến nghị:</strong> {recommendation}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
