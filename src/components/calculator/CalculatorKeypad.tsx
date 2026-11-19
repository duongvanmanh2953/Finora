import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton
} from '@mui/material';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import { evaluatePreview } from '../../lib/calculatorEngine';

interface CalculatorKeypadProps {
  initialValue?: number | string;
  onApply: (finalAmount: number, rawExpression: string) => void;
  onClose?: () => void;
  compact?: boolean;
}

export function CalculatorKeypad({
  initialValue = '',
  onApply,
  onClose,
  compact = false
}: CalculatorKeypadProps) {
  const [expression, setExpression] = useState<string>(() => {
    if (typeof initialValue === 'number') {
      return initialValue > 0 ? String(initialValue) : '';
    }
    return String(initialValue || '');
  });

  const preview = evaluatePreview(expression);

  const handleAppend = (char: string) => {
    setExpression(prev => prev + char);
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setExpression('');
  };

  const handleApply = () => {
    if (preview.isValid && preview.value !== null) {
      onApply(preview.value, expression);
      onClose?.();
    }
  };

  const keys = [
    ['C', '(', ')', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '=']
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        width: '100%',
        maxWidth: 340,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalculateOutlined sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Máy tính số tiền
          </Typography>
        </Box>
        {onClose && (
          <IconButton size="small" onClick={onClose} aria-label="Đóng máy tính">
            <CloseRounded fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Expression & Result Display Screen */}
      <Box
        sx={{
          bgcolor: 'action.hover',
          p: 1.5,
          borderRadius: 2,
          mb: 1.5,
          textAlign: 'right',
          minHeight: 64,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            letterSpacing: 0.5,
            minHeight: 18,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'text.secondary'
          }}
        >
          {expression || '0'}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontFamily: 'var(--font-tabular, monospace)',
            color: preview.isValid ? 'success.main' : 'error.main'
          }}
        >
          {preview.isValid ? preview.formatted : (preview.error || 'Lỗi cú pháp')}
        </Typography>
      </Box>

      {/* 5x4 Grid of Buttons */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1
        }}
      >
        {keys.flat().map((k, idx) => {
          const isOp = ['+', '-', '*', '/', '(', ')'].includes(k);
          const isEquals = k === '=';

          if (isEquals) {
            return (
              <Button
                key={idx}
                variant="contained"
                color="primary"
                onClick={handleApply}
                disabled={!preview.isValid || preview.value === null}
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  py: 1,
                  minWidth: 0,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none'
                  }
                }}
              >
                <CheckRounded fontSize="small" />
              </Button>
            );
          }

          if (k === '⌫') {
            return (
              <Button
                key={idx}
                variant="outlined"
                color="secondary"
                onClick={handleBackspace}
                sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 1,
                  minWidth: 0
                }}
              >
                <DeleteOutlineRounded fontSize="small" />
              </Button>
            );
          }

          if (k === 'C') {
            return (
              <Button
                key={idx}
                variant="outlined"
                color="error"
                onClick={handleClear}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1,
                  minWidth: 0
                }}
              >
                C
              </Button>
            );
          }

          return (
            <Button
              key={idx}
              variant="outlined"
              color={isOp ? 'primary' : 'inherit'}
              onClick={() => handleAppend(k)}
              sx={{
                fontWeight: isOp ? 700 : 500,
                fontSize: isOp ? '1.1rem' : '1rem',
                borderRadius: 2,
                py: 1,
                minWidth: 0,
                bgcolor: isOp ? 'action.selected' : 'background.paper',
                borderColor: 'divider',
                color: isOp ? 'primary.main' : 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              {k}
            </Button>
          );
        })}
      </Box>
    </Paper>
  );
}
