import { Button, Tooltip, Box } from '@mui/material';
import { BookOpen } from 'lucide-react';
import { startGuidedTour, type TourPageKey } from '../lib/guidedTour';

interface HelpButtonProps {
  pageKey: TourPageKey;
  label?: string;
}

export function HelpButton({ pageKey, label = 'Hướng dẫn' }: HelpButtonProps) {
  return (
    <Tooltip title={`Khám phá tính năng & cách sử dụng trang này`}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<BookOpen size={15} style={{ color: 'var(--brand-primary)' }} />}
        onClick={() => startGuidedTour(pageKey)}
        sx={{
          minHeight: 32,
          py: 0.5,
          px: { xs: 1, sm: 1.5 },
          borderRadius: '8px',
          borderColor: 'divider',
          color: 'text.secondary',
          fontWeight: 650,
          fontSize: '0.78rem',
          textTransform: 'none',
          bgcolor: 'background.paper',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: 'var(--brand-primary)',
            color: 'var(--brand-primary)',
            bgcolor: 'action.hover'
          }
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {label}
        </Box>
      </Button>
    </Tooltip>
  );
}

