import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Avatar,
  Paper
} from '@mui/material';
import { Users, ArrowRight, CheckCircle2, Wallet } from 'lucide-react';
import {
  FamilyMember,
  SharedExpenseItem,
  calculateGroupSettlement
} from '../../lib/familyFinanceEngine';
import { money } from '../../lib/finance';
import { FINORA_TOKENS } from '../../theme/designTokens';

interface FamilySettlementModalProps {
  open: boolean;
  onClose: () => void;
  sharedAccountName?: string;
}

export const FamilySettlementModal: React.FC<FamilySettlementModalProps> = ({
  open,
  onClose,
  sharedAccountName = 'Ví Chung Gia Đình'
}) => {
  const primaryColor = FINORA_TOKENS.brand.primary;

  // Demo default members for Duo/Family
  const [members] = useState<FamilyMember[]>([
    { id: 'm-1', name: 'Bạn (Chủ ví)', role: 'owner', incomeShareRatio: 0.6 },
    { id: 'm-2', name: 'Bạn đời / Người đồng hành', role: 'editor', incomeShareRatio: 0.4 }
  ]);

  // Demo active shared expenses for the current cycle
  const [expenses] = useState<SharedExpenseItem[]>([
    {
      id: 'se-1',
      description: 'Tiền điện nước & Internet',
      totalAmount: 1850000,
      paidByMemberId: 'm-1',
      splitMethod: 'equal',
      date: new Date().toISOString().slice(0, 10)
    },
    {
      id: 'se-2',
      description: 'Đi siêu thị & Thực phẩm tuần 2',
      totalAmount: 1200000,
      paidByMemberId: 'm-2',
      splitMethod: 'equal',
      date: new Date().toISOString().slice(0, 10)
    }
  ]);

  const settlement = calculateGroupSettlement(expenses, members);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: 'rgba(53, 94, 82, 0.1)',
            color: primaryColor,
            display: 'flex'
          }}
        >
          <Users size={22} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Đối Soát & Quyết Toán Ví Chung
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {sharedAccountName} • Thuật toán tối ưu hóa chuyển khoản
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2, pb: 2 }}>
        {/* Total Pool */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.08) 100%)',
            border: '1px solid rgba(16,185,129,0.2)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tổng chi tiêu chung kỳ này
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: primaryColor }}>
                {money(settlement.totalGroupSpent)}
              </Typography>
            </Box>
            <Chip
              icon={<Wallet size={14} />}
              label={`${members.length} Thành viên`}
              size="small"
              sx={{ fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.7)' }}
            />
          </Box>
        </Paper>

        {/* Member balances */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Đóng góp thực tế & Nghĩa vụ từng người
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {settlement.memberBalances.map(mb => {
            const isCreditor = mb.netBalance > 0;
            const isSettled = Math.abs(mb.netBalance) <= 1;

            return (
              <Box
                key={mb.memberId}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: primaryColor, fontSize: '0.85rem' }}>
                    {mb.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {mb.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Đã chi: {money(mb.totalPaid)} • Phần chia: {money(mb.totalShare)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  {isSettled ? (
                    <Chip label="Cân bằng" size="small" color="default" variant="outlined" />
                  ) : (
                    <Chip
                      label={
                        isCreditor
                          ? `Nhận lại +${money(mb.netBalance)}`
                          : `Cần trả ${money(Math.abs(mb.netBalance))}`
                      }
                      size="small"
                      color={isCreditor ? 'success' : 'error'}
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Settlement suggestions */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Đề xuất Chuyển khoản Tối ưu (Minimal Transfers)
        </Typography>

        {settlement.suggestedTransfers.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            <CheckCircle2 size={28} color="#10b981" style={{ marginBottom: 4 }} />
            <Typography variant="body2">Tất cả chi tiêu chung đã được cân bằng chính xác 100%!</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {settlement.suggestedTransfers.map((st, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  border: '1px dashed rgba(59,130,246,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {st.fromName}
                  </Typography>
                  <ArrowRight size={16} color="#6b7280" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {st.toName}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {money(st.amount)}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};
