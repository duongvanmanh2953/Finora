import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Scale, Edit3, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { legalService, type LegalDocument } from '../../services/legalService';

export function AdminLegalView() {
  const [docs, setDocs] = useState<LegalDocument[]>(legalService.getDocuments());
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);

  const handleSave = (publish: boolean) => {
    if (!editingDoc) return;
    const updated: LegalDocument = {
      ...editingDoc,
      status: publish ? 'published' : 'draft',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    legalService.saveDocument(updated);
    setDocs(legalService.getDocuments());
    setEditingDoc(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Scale size={22} style={{ color: '#10B981' }} />
            <Typography variant="h2" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
              Legal & Policy Content Management (CMS)
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
            Quản trị các tài liệu pháp lý công khai, chính sách bảo mật, hoàn tiền và phiên bản tuân thủ Nghị định 13/2023/NĐ-CP
          </Typography>
        </Box>
      </Box>

      {/* Table of Legal Documents */}
      <Card sx={{ p: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>TÀI LIỆU PHÁP LÝ</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>PHIÊN BẢN</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>TRẠNG THÁI</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>NGÀY HIỆU LỰC</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>CẬP NHẬT GẦN NHẤT</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>NGƯỜI BIÊN SOẠN</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>THAO TÁC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map(doc => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileText size={16} style={{ color: '#6C63B5' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 750 }}>
                          {doc.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                          {doc.summary}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                    v{doc.version}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={doc.status === 'published' ? 'Đã xuất bản' : doc.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
                      sx={{
                        borderRadius: '6px',
                        fontWeight: 750,
                        fontSize: '0.7rem',
                        height: 22,
                        bgcolor: doc.status === 'published' ? 'rgba(21, 128, 61, 0.12)' : 'rgba(180, 83, 9, 0.12)',
                        color: doc.status === 'published' ? '#15803D' : '#B45309'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {doc.effectiveDate}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {doc.lastUpdated}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {doc.author}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Eye size={13} />}
                        onClick={() => setPreviewDoc(doc)}
                        sx={{ minHeight: 30, px: 1, fontSize: '0.72rem', borderRadius: '6px' }}
                      >
                        Xem
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit3 size={13} />}
                        onClick={() => setEditingDoc({ ...doc })}
                        sx={{ minHeight: 30, px: 1, fontSize: '0.72rem', borderRadius: '6px', bgcolor: '#315C50' }}
                      >
                        Sửa
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* MODAL: EDIT LEGAL DOCUMENT CMS */}
      <Dialog open={Boolean(editingDoc)} onClose={() => setEditingDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
          Soạn Thảo Văn Bản Pháp Lý: {editingDoc?.title}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              size="small"
              label="Tiêu đề tài liệu"
              value={editingDoc?.title || ''}
              onChange={e => setEditingDoc(prev => prev ? { ...prev, title: e.target.value } : null)}
            />
            <TextField
              size="small"
              label="Phiên bản (e.g. 1.3.0)"
              value={editingDoc?.version || ''}
              onChange={e => setEditingDoc(prev => prev ? { ...prev, version: e.target.value } : null)}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              size="small"
              type="date"
              label="Ngày hiệu lực"
              value={editingDoc?.effectiveDate || ''}
              onChange={e => setEditingDoc(prev => prev ? { ...prev, effectiveDate: e.target.value } : null)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              label="Tác giả / Bộ phận phê duyệt"
              value={editingDoc?.author || ''}
              onChange={e => setEditingDoc(prev => prev ? { ...prev, author: e.target.value } : null)}
            />
          </Box>

          <TextField
            size="small"
            label="Tóm tắt ngắn (Summary)"
            value={editingDoc?.summary || ''}
            onChange={e => setEditingDoc(prev => prev ? { ...prev, summary: e.target.value } : null)}
            fullWidth
          />

          <TextField
            multiline
            rows={10}
            label="Nội dung điều khoản (Hỗ trợ Markdown)"
            value={editingDoc?.content || ''}
            onChange={e => setEditingDoc(prev => prev ? { ...prev, content: e.target.value } : null)}
            fullWidth
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setEditingDoc(null)} sx={{ fontWeight: 600 }}>Hủy</Button>
          <Button
            variant="outlined"
            onClick={() => handleSave(false)}
            sx={{ fontWeight: 700, borderRadius: '6px' }}
          >
            Lưu Bản Nháp
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckCircle2 size={16} />}
            onClick={() => handleSave(true)}
            sx={{ fontWeight: 800, borderRadius: '6px', bgcolor: '#315C50' }}
          >
            Xuất Bản Chính Thức
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: PREVIEW LEGAL DOCUMENT */}
      <Dialog open={Boolean(previewDoc)} onClose={() => setPreviewDoc(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {previewDoc?.title}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '10px !important' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip size="small" label={`Phiên bản ${previewDoc?.version}`} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Hiệu lực: {previewDoc?.effectiveDate} · Cập nhật: {previewDoc?.lastUpdated}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              whiteSpace: 'pre-line',
              fontSize: '0.85rem',
              lineHeight: 1.6
            }}
          >
            {previewDoc?.content}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewDoc(null)} variant="outlined">Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
