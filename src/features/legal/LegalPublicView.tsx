import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button
} from '@mui/material';
import { ArrowLeft, ShieldCheck, Scale, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { legalService } from '../../services/legalService';

export default function LegalPublicView() {
  const navigate = useNavigate();
  const docs = legalService.getDocuments();
  const [selectedKey, setSelectedKey] = useState<string>(docs[0]?.key || 'terms');

  const currentDoc = docs.find(d => d.key === selectedKey) || docs[0];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--bg-app)', py: { xs: 3, md: 6 }, px: 2 }}>
      <Container maxWidth="lg">
        {/* Top Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/')}
            sx={{ fontWeight: 700, borderRadius: '8px', color: 'text.secondary' }}
          >
            Quay lại Ứng dụng
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                bgcolor: 'var(--brand-primary, #355E52)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <ShieldCheck size={16} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Tích Sản Legal & Trust Center
            </Typography>
          </Box>
        </Box>

        {/* Main Grid: Left Index Tabs & Right Content */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 3 }}>
          {/* Left Index */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '12px',
              height: 'fit-content',
              position: { md: 'sticky' },
              top: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>
              MỤC LỤC CHÍNH SÁCH
            </Typography>

            <Tabs
              orientation="vertical"
              value={selectedKey}
              onChange={(_, v) => setSelectedKey(v)}
              sx={{
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  minHeight: 40,
                  px: 1.5,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'action.hover',
                    color: 'var(--brand-primary)'
                  }
                }
              }}
            >
              {docs.map(doc => (
                <Tab
                  key={doc.key}
                  value={doc.key}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileText size={15} />
                      <span>{doc.title.split('(')[0].trim()}</span>
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Paper>

          {/* Right Document Content */}
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 4 },
              borderRadius: '12px',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5
            }}
          >
            {/* Document Header */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Scale size={20} style={{ color: 'var(--brand-primary)' }} />
                <Typography variant="h1" sx={{ fontWeight: 850, fontSize: { xs: '1.4rem', sm: '1.75rem' } }}>
                  {currentDoc.title}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                <Chip
                  size="small"
                  label={`Phiên bản v${currentDoc.version}`}
                  sx={{ borderRadius: '6px', fontWeight: 750, bgcolor: 'action.hover' }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                  Hiệu lực từ ngày: <strong>{currentDoc.effectiveDate}</strong> · Cập nhật lần cuối: <strong>{currentDoc.lastUpdated}</strong>
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5, fontStyle: 'italic' }}>
                {currentDoc.summary}
              </Typography>
            </Box>

            {/* Document Body */}
            <Box
              sx={{
                whiteSpace: 'pre-line',
                lineHeight: 1.7,
                fontSize: '0.92rem',
                color: 'text.primary',
                '& h3': {
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  mt: 2,
                  mb: 1,
                  color: 'var(--brand-primary)'
                }
              }}
            >
              {currentDoc.content}
            </Box>

            {/* Document Footer */}
            <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Ban hành bởi: {currentDoc.author} · Tích Sản Vietnam Compliance
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Liên hệ giải đáp pháp lý: <strong>legal@finora.vn</strong>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

