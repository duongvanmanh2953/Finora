import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  Check,
  Edit2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import type { ActionPlan, ActionItem } from '../../server/ai/types';
import { StatusBadge } from '../ui/StatusBadge';
import { FinoraButton } from '../ui/FinoraButton';

interface AIActionPlanCardProps {
  plan: ActionPlan;
  onExecute: (planId: string, updatedPlan: ActionPlan) => void;
  onPlanChange?: (updatedPlan: ActionPlan) => void;
}

export function AIActionPlanCard({
  plan,
  onExecute,
  onPlanChange
}: AIActionPlanCardProps) {
  const [currentPlan, setCurrentPlan] = useState<ActionPlan>(plan);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; amount: string }>({ name: '', amount: '' });
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const selectedCount = currentPlan.actions.filter(a => a.isSelected).length;
  const totalCount = currentPlan.actions.length;

  const handleToggleSelect = (actionId: string) => {
    const updatedActions = currentPlan.actions.map(a =>
      a.id === actionId ? { ...a, isSelected: !a.isSelected } : a
    );
    const updated = { ...currentPlan, actions: updatedActions };
    setCurrentPlan(updated);
    onPlanChange?.(updated);
  };

  const handleSelectAll = (select: boolean) => {
    const updatedActions = currentPlan.actions.map(a => ({
      ...a,
      isSelected: select && a.validationStatus !== 'invalid'
    }));
    const updated = { ...currentPlan, actions: updatedActions };
    setCurrentPlan(updated);
    onPlanChange?.(updated);
  };

  const handleStartEdit = (action: ActionItem) => {
    setEditingActionId(action.id);
    setEditValues({
      name: action.proposedValues.name || '',
      amount: String(action.proposedValues.amount || action.proposedValues.limit || '')
    });
  };

  const handleSaveEdit = (actionId: string) => {
    const amountNum = parseInt(editValues.amount.replace(/\D/g, ''), 10) || 0;
    const updatedActions = currentPlan.actions.map(a => {
      if (a.id === actionId) {
        const newProposed = {
          ...a.proposedValues,
          name: editValues.name.trim() || a.proposedValues.name,
          amount: a.entityType === 'transaction' ? amountNum : undefined,
          limit: a.entityType === 'budget' ? amountNum : undefined
        };
        const isValid = amountNum > 0;

        return {
          ...a,
          proposedValues: newProposed,
          validationStatus: isValid ? 'valid' as const : 'invalid' as const,
          description: `${newProposed.name} · ${new Intl.NumberFormat('vi-VN').format(amountNum)} ₫`
        };
      }
      return a;
    });

    const updated = { ...currentPlan, actions: updatedActions };
    setCurrentPlan(updated);
    onPlanChange?.(updated);
    setEditingActionId(null);
  };

  const handleConfirmExecution = async () => {
    setIsExecuting(true);
    try {
      setConfirmModalOpen(false);
      onExecute(currentPlan.id, currentPlan);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: '6px', // Strictly 6px outer container
        bgcolor: 'background.paper',
        borderColor: 'primary.main',
        boxShadow: '0 2px 10px rgba(23, 107, 82, 0.08)'
      }}
    >
      {/* Plan Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, pb: 1.25, borderBottom: '1px solid var(--border-subtle)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '4px',
              bgcolor: 'rgba(23, 107, 82, 0.12)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={16} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13.5 }}>
              {currentPlan.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
              Đã chọn: <strong style={{ color: '#16865B' }}>{selectedCount}/{totalCount}</strong> hành động (Mặc định chọn 100%)
            </Typography>
          </Box>
        </Box>

        {/* Bulk select controls */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <FinoraButton
            variant="ghost"
            size="small"
            onClick={() => handleSelectAll(true)}
            sx={{ fontSize: 11, py: 0.25, px: 0.75 }}
          >
            Chọn tất cả
          </FinoraButton>
          <FinoraButton
            variant="ghost"
            size="small"
            onClick={() => handleSelectAll(false)}
            sx={{ fontSize: 11, py: 0.25, px: 0.75 }}
          >
            Bỏ chọn
          </FinoraButton>
        </Box>
      </Box>

      {/* Action Items List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        {currentPlan.actions.map(action => {
          const isEditing = editingActionId === action.id;

          return (
            <Paper
              key={action.id}
              variant="outlined"
              sx={{
                p: 1.25,
                borderRadius: '4px', // Strictly 4px inner
                bgcolor: action.isSelected ? 'rgba(23, 107, 82, 0.03)' : 'action.hover',
                borderColor: action.isSelected ? 'primary.light' : 'var(--border-subtle)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              <Checkbox
                checked={action.isSelected}
                disabled={action.validationStatus === 'invalid'}
                onChange={() => handleToggleSelect(action.id)}
                size="small"
                sx={{ p: 0.25, mt: 0.25 }}
              />

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                  <StatusBadge
                    label={action.actionType}
                    status={action.actionType === 'CREATE' ? 'success' : action.actionType === 'UPDATE' ? 'info' : 'danger'}
                    size="small"
                    variant="soft"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                    {action.title}
                  </Typography>
                </Box>

                {isEditing ? (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="Tên"
                      value={editValues.name}
                      onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                    />
                    <TextField
                      size="small"
                      label="Số tiền / Hạn mức (₫)"
                      value={editValues.amount}
                      onChange={e => setEditValues({ ...editValues, amount: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                    />
                    <FinoraButton
                      variant="primary"
                      size="small"
                      icon={<Check size={14} />}
                      onClick={() => handleSaveEdit(action.id)}
                    >
                      Lưu
                    </FinoraButton>
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 12 }}>
                    {action.description}
                  </Typography>
                )}
              </Box>

              {!isEditing && (
                <Tooltip title="Chỉnh sửa giá trị trực tiếp">
                  <IconButton
                    size="small"
                    onClick={() => handleStartEdit(action)}
                    sx={{ p: 0.5, borderRadius: '4px' }}
                  >
                    <Edit2 size={13} />
                  </IconButton>
                </Tooltip>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* Execute Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1, borderTop: '1px solid var(--border-subtle)' }}>
        <FinoraButton
          variant="primary"
          size="small"
          icon={<Zap size={14} />}
          disabled={selectedCount === 0 || isExecuting}
          onClick={() => setConfirmModalOpen(true)}
        >
          {isExecuting ? 'Đang thực thi...' : `Thực thi ${selectedCount} hành động đã chọn`}
        </FinoraButton>
      </Box>

      {/* Two-Phase Confirmation Modal */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '6px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldCheck size={20} color="#16865B" />
          Xác nhận Thực thi Hành động Tài chính
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" icon={<AlertTriangle size={18} />} sx={{ borderRadius: '4px', mb: 2 }}>
            Hệ thống sẽ ghi nhận <strong>{selectedCount} hành động</strong> vào Sổ cái tài chính cá nhân của bạn.
          </Alert>

          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            Danh sách hành động được phê duyệt:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {currentPlan.actions.filter(a => a.isSelected).map((a, idx) => (
              <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12.5 }}>
                <CheckCircle2 size={14} color="#16865B" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {idx + 1}. {a.title} ({a.description})
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <FinoraButton variant="neutral" size="small" onClick={() => setConfirmModalOpen(false)}>
            Hủy bỏ
          </FinoraButton>
          <FinoraButton
            variant="success"
            size="small"
            icon={<Check size={14} />}
            onClick={handleConfirmExecution}
          >
            Xác nhận & Ghi vào Sổ cái
          </FinoraButton>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
