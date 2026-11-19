import React, { useMemo, useState } from 'react';
import {
  TextField,
  type TextFieldProps,
  FormControl,
  InputLabel,
  Select,
  type SelectProps,
  MenuItem,
  InputAdornment,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  FormHelperText,
  IconButton,
  Popover,
  Tooltip
} from '@mui/material';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { CalculatorKeypad } from '../calculator/CalculatorKeypad';

export function MuiTextField(props: TextFieldProps) {
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      {...props}
    />
  );
}

interface MuiCurrencyInputProps extends Omit<TextFieldProps, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  showDenominations?: boolean;
}

export function MuiCurrencyInput({
  value,
  onChange,
  showDenominations = true,
  label = 'Số tiền',
  ...rest
}: MuiCurrencyInputProps) {
  const [calcAnchor, setCalcAnchor] = useState<null | HTMLElement>(null);
  const strVal = String(value ?? '');
  const numericVal = parseInt(strVal.replace(/\D/g, ''), 10) || 0;
  const formattedDisplay = numericVal > 0 ? new Intl.NumberFormat('en-US').format(numericVal) : (strVal === '0' ? '0' : '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    onChange(rawDigits);
  };

  // Smart VND Denomination Suggestions
  const suggestions = useMemo(() => {
    if (!showDenominations || numericVal <= 0) return [];

    // If user typed small digits like 35, suggest 35,000, 350,000, 3,500,000
    if (numericVal < 1000) {
      return [
        numericVal * 1000,
        numericVal * 10000,
        numericVal * 100000
      ];
    } else if (numericVal < 10000) {
      return [
        numericVal * 1000,
        numericVal * 10000
      ];
    }
    return [];
  }, [numericVal, showDenominations]);

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        type="text"
        value={formattedDisplay}
        onChange={handleChange}
        placeholder="0"
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Mở máy tính số tiền">
                  <IconButton
                    size="small"
                    onClick={(e) => setCalcAnchor(e.currentTarget)}
                    aria-label="Mở máy tính số tiền"
                    sx={{ p: 0.5, color: 'primary.main' }}
                  >
                    <CalculateOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  ₫
                </Box>
              </InputAdornment>
            ),
            sx: {
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 650
            }
          }
        }}
        {...rest}
      />
      {suggestions.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          {suggestions.map((amt) => (
            <Chip
              key={amt}
              label={new Intl.NumberFormat('en-US').format(amt) + ' ₫'}
              size="small"
              onClick={() => onChange(String(amt))}
              variant="outlined"
              color="primary"
              sx={{
                fontSize: '0.72rem',
                height: 22,
                cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
                '&:hover': { bgcolor: 'primary.lighter' }
              }}
            />
          ))}
        </Box>
      )}

      {/* Embedded Safe Calculator Popover */}
      <Popover
        open={Boolean(calcAnchor)}
        anchorEl={calcAnchor}
        onClose={() => setCalcAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 3,
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)'
            }
          }
        }}
      >
        <CalculatorKeypad
          initialValue={numericVal > 0 ? numericVal : ''}
          onApply={(finalVal) => {
            onChange(String(finalVal));
            setCalcAnchor(null);
          }}
          onClose={() => setCalcAnchor(null)}
        />
      </Popover>
    </Box>
  );
}

interface MuiSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
}

interface MuiSelectProps extends Omit<SelectProps, 'onChange'> {
  label: string;
  options: MuiSelectOption[];
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
  helperText?: string;
}

export function MuiSelect({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  ...rest
}: MuiSelectProps) {
  const labelId = `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <FormControl fullWidth size="small" error={error}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        onChange={e => onChange(String(e.target.value))}
        MenuProps={{
          disablePortal: false,
          disableScrollLock: false,
          BackdropProps: {
            invisible: true,
            sx: {
              backgroundColor: 'transparent !important',
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important'
            }
          },
          slotProps: {
            backdrop: {
              invisible: true,
              sx: {
                backgroundColor: 'transparent !important',
                backdropFilter: 'none !important',
                WebkitBackdropFilter: 'none !important'
              }
            },
            paper: {
              sx: {
                zIndex: 1550,
                maxHeight: 340,
                borderRadius: '10px',
                boxShadow: '0 14px 40px rgba(0, 0, 0, 0.18)',
                border: '1px solid var(--border-subtle)',
                bgcolor: 'background.paper',
                backgroundImage: 'none',
                backdropFilter: 'none !important',
                WebkitBackdropFilter: 'none !important',
                '& .MuiMenuItem-root': {
                  fontSize: '0.85rem',
                  py: 1,
                  px: 1.5,
                  borderRadius: '6px',
                  m: '2px 6px',
                  transition: 'background-color 0.12s ease',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    fontWeight: 700
                  }
                }
              }
            }
          },
          ...(rest.MenuProps as any)
        }}
        {...rest}
      >
        {options.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              {opt.icon}
              <Box sx={{ flex: 1 }}>
                <Box component="span" sx={{ fontWeight: 500, fontSize: 13 }}>
                  {opt.label}
                </Box>
                {opt.subtitle && (
                  <Box component="div" sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {opt.subtitle}
                  </Box>
                )}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

interface MuiDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: any;
}

export function MuiDatePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  fullWidth = true,
  size = 'small',
  sx
}: MuiDatePickerProps) {
  const dayjsValue = value ? dayjs(value) : null;

  return (
    <DatePicker
      label={label}
      value={dayjsValue}
      disabled={disabled}
      onChange={(newValue: Dayjs | null) => {
        if (newValue && newValue.isValid()) {
          onChange(newValue.format('YYYY-MM-DD'));
        } else if (!newValue) {
          onChange('');
        }
      }}
      format="DD/MM/YYYY"
      slotProps={{
        popper: {
          sx: {
            zIndex: 1550
          }
        },
        textField: {
          fullWidth,
          size,
          error,
          helperText,
          sx
        }
      }}
    />
  );
}

interface MuiMonthPickerProps {
  label: string;
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: any;
}

export function MuiMonthPicker({
  label,
  value,
  onChange,
  disabled,
  fullWidth = false,
  size = 'small',
  sx
}: MuiMonthPickerProps) {
  const cleanMonth = value ? value.slice(0, 7) : '';
  const dayjsValue = cleanMonth ? dayjs(cleanMonth + '-01') : null;

  return (
    <DatePicker
      views={['year', 'month']}
      label={label}
      value={dayjsValue}
      disabled={disabled}
      onChange={(newValue: Dayjs | null) => {
        if (newValue && newValue.isValid()) {
          onChange(newValue.format('YYYY-MM'));
        } else if (!newValue) {
          onChange('');
        }
      }}
      format="MM/YYYY"
      slotProps={{
        popper: {
          sx: {
            zIndex: 1550
          }
        },
        textField: {
          size,
          fullWidth,
          sx: fullWidth ? sx : { minWidth: 140, ...sx }
        }
      }}
    />
  );
}

export function MuiTransactionTypeToggle({
  value,
  onChange,
  includeTransfer = true
}: {
  value: 'income' | 'expense' | 'transfer';
  onChange: (type: 'income' | 'expense' | 'transfer') => void;
  includeTransfer?: boolean;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      size="small"
      value={value}
      onChange={(_, next) => {
        if (next) onChange(next);
      }}
      sx={{
        p: 0.5,
        bgcolor: 'action.hover',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        gap: 0.5,
        '& .MuiToggleButtonGroup-grouped': {
          border: 'none !important',
          borderRadius: '6px !important',
          fontWeight: 700,
          fontSize: '0.84rem',
          textTransform: 'none',
          py: 0.8,
          color: 'text.secondary',
          transition: 'all 0.15s ease'
        },
        '& .MuiToggleButton-root.Mui-selected': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <ToggleButton
        value="expense"
        sx={{
          '&.Mui-selected': {
            bgcolor: '#EF4444 !important',
            color: '#FFFFFF !important',
            '&:hover': { bgcolor: '#DC2626 !important' }
          }
        }}
      >
        <ArrowUpRight size={16} style={{ marginRight: 6 }} /> Chi tiêu
      </ToggleButton>
      <ToggleButton
        value="income"
        sx={{
          '&.Mui-selected': {
            bgcolor: '#10B981 !important',
            color: '#FFFFFF !important',
            '&:hover': { bgcolor: '#059669 !important' }
          }
        }}
      >
        <ArrowDownLeft size={16} style={{ marginRight: 6 }} /> Thu nhập
      </ToggleButton>
      {includeTransfer && (
        <ToggleButton
          value="transfer"
          sx={{
            '&.Mui-selected': {
              bgcolor: '#2563EB !important',
              color: '#FFFFFF !important',
              '&:hover': { bgcolor: '#1D4ED8 !important' }
            }
          }}
        >
          <ArrowLeftRight size={16} style={{ marginRight: 6 }} /> Chuyển khoản
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
}
