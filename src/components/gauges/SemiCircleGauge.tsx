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
  inverted?: boolean; // if true, higher score is better (e.g. Feasibility)
  unitLabel?: string; // default '/100'
}

const DEFAULT_RISK_ZONES: GaugeZone[] = [
  { min: 0, max: 24, color: '#15803D', label: 'An toàn' },
  { min: 25, max: 49, color: '#D97706', label: 'Trung bình' },
  { min: 50, max: 74, color: '#EA580C', label: 'Cảnh báo' },
  { min: 75, max: 100, color: '#DC2626', label: 'Nguy cấp' }
];

const FEASIBILITY_ZONES: GaugeZone[] = [
  { min: 0, max: 39, color: '#DC2626', label: 'Khó đạt' },
  { min: 40, max: 69, color: '#D97706', label: 'Cần nỗ lực' },
  { min: 70, max: 89, color: '#2563EB', label: 'Khả thi tốt' },
  { min: 90, max: 100, color: '#15803D', label: 'Rất khả thi' }
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
  const zones = inverted ? FEASIBILITY_ZONES : DEFAULT_RISK_ZONES;

  // Find active zone
  const activeZone = zones.find(z => clampedScore >= z.min && clampedScore <= z.max) || zones[0];

  // SVG Geometry Constants
  const strokeWidth = 16;
  const radius = (size - strokeWidth * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2 + 10;

  // Arc Angle: 180 degrees (from PI to 2*PI, or -180 to 0)
  // Needle Angle: 0 score = -180deg (left), 100 score = 0deg (right)
  const needleAngle = -180 + (clampedScore / 100) * 180;

  // Generate 4 arc paths for the 4 zones with a small gap
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

  const zoneArcs = zones.map((z, idx) => {
    const startAngle = -180 + (z.min / 100) * 180 + (idx > 0 ? 1.5 : 0);
    const endAngle = -180 + (z.max / 100) * 180 - (idx < zones.length - 1 ? 1.5 : 0);
    return {
      ...z,
      d: describeArc(centerX, centerY, radius, startAngle, endAngle)
    };
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 0.5 }}>
        <svg width={size} height={size / 2 + 34} viewBox={`0 0 ${size} ${size / 2 + 34}`}>
          {/* Background Arc Tracks */}
          {zoneArcs.map((arc, i) => (
            <path
              key={i}
              d={arc.d}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={clampedScore >= arc.min && clampedScore <= arc.max ? 1 : 0.3}
            />
          ))}

          {/* Needle Center Pivot */}
          <circle cx={centerX} cy={centerY} r={8} fill="currentColor" opacity={0.85} />
          <circle cx={centerX} cy={centerY} r={4} fill="#FFFFFF" />

          {/* Rotating Needle */}
          <g transform={`rotate(${needleAngle}, ${centerX}, ${centerY})`}>
            <polygon
              points={`${centerX - 3},${centerY} ${centerX + 3},${centerY} ${centerX},${centerY - radius + 4}`}
              fill={activeZone.color}
              style={{ transition: 'transform 0.4s ease-out' }}
            />
          </g>
        </svg>

        {/* Center Score & Assessment Badge */}
        <Box sx={{ textAlign: 'center', mt: -2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: activeZone.color,
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}
            >
              {clampedScore}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
              {unitLabel}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'inline-block',
              mt: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: '6px',
              fontWeight: 750,
              fontSize: '0.72rem',
              bgcolor: `${activeZone.color}15`,
              color: activeZone.color,
              border: `1px solid ${activeZone.color}35`
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
              <strong style={{ color: f.isPositive ? '#15803D' : f.isPositive === false ? '#B91C1C' : 'inherit' }}>
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
