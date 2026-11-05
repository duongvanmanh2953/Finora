import { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Paper,
  InputBase,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  X,
  Send,
  Crown,
  Sparkles,
  Bot
} from 'lucide-react';
import { useFinance } from '../store';
import { isProUser } from '../lib/subscription';
import { aiApiClient } from '../services/aiApiClient';
import type { AIChatMessage, ActionPlan } from '../server/ai/types';
import { AIActionPlanCard } from './ai/AIActionPlanCard';
import { FinoraButton } from './ui/FinoraButton';

export function AiAssistantDrawer({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update, openPricing } = useFinance();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      type: 'text',
      text: 'Xin chào! Tôi là **Tích Sản AI** — Trợ lý Trí tuệ & Điều hành Tài chính cá nhân của bạn.\n\nTôi có thể giúp bạn:\n• Phân tích thu chi, ngân sách và dòng tiền thực tế.\n• Kiểm tra danh mục đầu tư, lãi/lỗ và cảnh báo cắt lỗ SL/TP.\n• Đề xuất và tự động lập kế hoạch **Action Plan** nhiều bước (Ghi nhận chi tiêu, tạo ngân sách) có chọn lọc trước khi bạn phê duyệt.',
      timestamp: '18:00'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (!data) return null;

  const isPro = isProUser(data);
  const usage = aiApiClient.getUsage(data);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      type: 'text',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const responseMsg = await aiApiClient.sendMessage(textToSend, data);
      setMessages(prev => [...prev, responseMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          type: 'error',
          text: `Đã xảy ra lỗi khi xử lý: ${err?.message || 'Không thể kết nối đến máy chủ AI'}`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteActionPlan = async (planId: string, _approvedPlan: ActionPlan) => {
    setLoading(true);
    try {
      const result = await aiApiClient.executeActionPlan(planId, data);

      if (result.success || result.totalExecuted > 0) {
        // Commit deterministic state mutation to Finance store
        await update(() => result.updatedData, result.summaryText);

        setMessages(prev => [
          ...prev,
          {
            id: `ai-exec-${Date.now()}`,
            sender: 'assistant',
            type: 'action_result',
            text: `✅ **KẾT QUẢ THỰC THI THÀNH CÔNG**:\n\n${result.summaryText}\n\n` +
              result.results.map(r => `• [${r.status === 'success' ? 'THÀNH CÔNG' : 'THẤT BẠI'}]: ${r.message}`).join('\n'),
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-exec-err-${Date.now()}`,
          sender: 'assistant',
          type: 'error',
          text: `Không thể áp dụng hành động vào Sổ cái: ${err?.message}`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 460 },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.1)'
          }
        }
      }}
    >
      {/* Drawer Header with Gold PRO Identity */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '6px',
              bgcolor: 'rgba(23, 107, 82, 0.12)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bot size={22} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 15 }}>
                Tích Sản AI
              </Typography>

              {/* Gold PRO Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 0.75,
                  py: 0.2,
                  borderRadius: '4px',
                  bgcolor: '#FFF5D9',
                  border: '1px solid #EED99D',
                  color: '#A9791D',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}
              >
                <Crown size={11} color="#C99A32" />
                <span>{isPro ? 'PRO INTELLIGENCE' : 'PRO COPILOT'}</span>
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11.5 }}>
              {isPro
                ? 'Không giới hạn lượt hội thoại & Action Plans'
                : `Lượt dùng hôm nay: ${usage.freeQuotaUsedToday}/${usage.freeQuotaMaxDaily} (Gói Free)`}
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ borderRadius: '4px' }}>
          <X size={18} />
        </IconButton>
      </Box>

      {/* Message Feed */}
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map(msg => {
          const isUser = msg.sender === 'user';

          if (isUser) {
            return (
              <Box key={msg.id} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '85%',
                    borderRadius: '6px',
                    bgcolor: 'primary.main',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    lineHeight: 1.5
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.8, fontSize: 10 }}>
                    {msg.timestamp}
                  </Typography>
                </Paper>
              </Box>
            );
          }

          // Assistant Message
          return (
            <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: '96%' }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.75,
                  borderRadius: '6px',
                  bgcolor: msg.type === 'subscription_required' ? '#FFFDF5' : 'background.paper',
                  borderColor: msg.type === 'subscription_required' ? '#EED99D' : 'var(--border-subtle)',
                  fontSize: 13.5,
                  lineHeight: 1.6
                }}
              >
                {/* Pro Upgrade Message */}
                {msg.type === 'subscription_required' ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#A9791D' }}>
                      <Crown size={20} color="#C99A32" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Đạt Giới Hạn Gói Miễn Phí (Free Tier Quota)
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: 13 }}>
                      {msg.text}
                    </Typography>
                    <FinoraButton
                      variant="primary"
                      size="small"
                      icon={<Sparkles size={14} />}
                      onClick={() => openPricing('Nâng cấp gói VIP Gold để trò chuyện Tích Sản AI không giới hạn!')}
                      sx={{
                        alignSelf: 'flex-start',
                        bgcolor: '#C99A32',
                        '&:hover': { bgcolor: '#A9791D' }
                      }}
                    >
                      Nâng cấp Pro ngay
                    </FinoraButton>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', fontSize: 13.5 }}>
                    {msg.text}
                  </Typography>
                )}

                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', fontSize: 10 }}>
                  {msg.timestamp} · Tích Sản AI Copilot
                </Typography>
              </Paper>

              {/* Action Plan Interactive Cards */}
              {msg.type === 'action_plan' && msg.actionPlan && (
                <AIActionPlanCard
                  plan={msg.actionPlan}
                  onExecute={handleExecuteActionPlan}
                />
              )}
            </Box>
          );
        })}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.secondary', p: 1 }}>
            <CircularProgress size={16} color="primary" />
            <Typography variant="caption" sx={{ fontSize: 12 }}>
              Tích Sản AI đang phân tích dữ liệu và lập kế hoạch tài chính...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Suggestion Chips */}
      <Box sx={{ px: 2, pt: 1, pb: 0.5, borderTop: '1px solid var(--border-subtle)', bgcolor: 'background.paper' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11, display: 'block', mb: 0.75 }}>
          Gợi ý nhanh cho bạn:
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.5 }}>
          {[
            { label: '📊 Tổng quan tài chính', prompt: 'Tổng quan tình hình tài chính của tôi' },
            { label: '💸 Chi tiêu tháng này', prompt: 'Tháng này tôi tiêu hết bao nhiêu và khoản nào ngốn tiền nhất?' },
            { label: '🎯 Đặt 3 ngân sách', prompt: 'Tạo ngân sách tháng này: ăn uống 3 triệu, đi lại 1 triệu, mua sắm 1,5 triệu' },
            { label: '📝 Ghi 3 khoản chi', prompt: 'Thêm 3 khoản chi: 50k ăn sáng, 30k gửi xe, 80k ăn trưa' },
            { label: '📈 Rà soát đầu tư', prompt: 'Danh mục cổ phiếu và đầu tư của tôi đang ra sao?' }
          ].map((chip, idx) => (
            <Chip
              key={idx}
              label={chip.label}
              size="small"
              onClick={() => handleSend(chip.prompt)}
              sx={{
                borderRadius: '4px',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
                whiteSpace: 'nowrap'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Input Composer */}
      <Box sx={{ p: 1.5, bgcolor: 'background.paper' }}>
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: '4px 8px',
            borderRadius: '4px',
            borderColor: 'primary.light',
            '&:focus-within': { borderColor: 'primary.main', boxShadow: '0 0 0 1px #176B52' }
          }}
        >
          <InputBase
            fullWidth
            placeholder="Hỏi về chi tiêu, đầu tư hoặc gõ lệnh 'thêm 3 khoản chi'..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
            sx={{ fontSize: 13.5, px: 1 }}
          />

          <IconButton
            color="primary"
            disabled={!input.trim() || loading}
            onClick={() => handleSend()}
            sx={{ p: 0.75, borderRadius: '4px' }}
          >
            <Send size={16} />
          </IconButton>
        </Paper>
      </Box>
    </Drawer>
  );
}
