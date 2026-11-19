import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useFinance } from '../../store';
import { money, formatVnDate } from '../../lib/finance';
import {
  analyzeCsvStructure,
  parseRawCsv,
  stageImportData,
  commitImportBatch,
  rollbackImportBatch,
  type ColumnMapping,
  type StagedTransaction,
  type ImportAnalysisResult,
  type ImportBatchRecord
} from '../../lib/importEngine';
import { MuiSelect } from '../mui/MuiInputs';

const STEPS = [
  'Chọn file',
  'Phân tích',
  'Mapping cột',
  'Mapping danh mục',
  'Xem trước',
  'Kiểm tra trùng',
  'Xác nhận',
  'Hoàn thành'
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DataImportWizard({ open, onClose }: Props) {
  const { data, update, notify } = useFinance();
  const accounts = data?.accounts || [];
  const categories = data?.categories || [];
  const existingTransactions = data?.transactions || [];

  const [activeStep, setActiveStep] = useState(0);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [analysis, setAnalysis] = useState<ImportAnalysisResult | null>(null);

  // Column Mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateCol: '',
    nameCol: '',
    amountCol: '',
    typeCol: '',
    categoryCol: '',
    accountCol: '',
    noteCol: ''
  });

  // Category mapping dictionary: oldName -> finoraCategoryId
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  // Target default account
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || '');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Staged result
  const [staged, setStaged] = useState<StagedTransaction[]>([]);
  const [committedBatch, setCommittedBatch] = useState<ImportBatchRecord | null>(null);

  // Extract unique old categories from parsed rows
  const rawRows = useMemo(() => {
    if (!fileContent) return [];
    return parseRawCsv(fileContent).rows;
  }, [fileContent]);

  const uniqueOldCategories = useMemo(() => {
    if (!mapping.categoryCol || rawRows.length === 0) return [];
    const set = new Set<string>();
    rawRows.forEach(r => {
      const val = r[mapping.categoryCol!]?.trim();
      if (val) set.add(val);
    });
    return Array.from(set);
  }, [rawRows, mapping.categoryCol]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setFileContent(content);
      const res = analyzeCsvStructure(content);
      setAnalysis(res);
      setMapping(res.suggestedMapping);
      setActiveStep(1); // Proceed to Step 2
    };
    reader.readAsText(file, 'utf-8');
  };

  // Move to Step 4 (Category Mapping)
  const handleProceedToCategoryMapping = () => {
    // Auto populate category mapping with fuzzy matches
    const initialMap: Record<string, string> = {};
    const defaultExpenseCat = categories.find(c => c.type === 'expense')?.id || 'other';

    uniqueOldCategories.forEach(oldCat => {
      const matched = categories.find(c => c.name.toLowerCase().includes(oldCat.toLowerCase()));
      initialMap[oldCat] = matched ? matched.id : defaultExpenseCat;
    });

    setCategoryMap(initialMap);
    setActiveStep(3);
  };

  // Generate staged preview
  const handleGeneratePreview = () => {
    const stagedResult = stageImportData(
      rawRows,
      mapping,
      categoryMap,
      targetAccountId,
      existingTransactions,
      categories
    );
    setStaged(stagedResult);
    setActiveStep(4); // Move to Step 5 (Preview)
  };

  // Perform Final Commit
  const handleCommitImport = async () => {
    const { newTransactions, batchRecord } = commitImportBatch(staged, fileName, skipDuplicates);

    await update(d => ({
      ...d,
      transactions: [...newTransactions, ...(d.transactions || [])]
    }), `Đã import thành công ${newTransactions.length} giao dịch!`);

    setCommittedBatch(batchRecord);
    setActiveStep(7); // Final success step
  };

  // Rollback Imported Batch
  const handleRollback = async () => {
    if (!committedBatch) return;

    await update(d => {
      const { remainingTransactions } = rollbackImportBatch(
        d.transactions || [],
        committedBatch.batchId
      );
      return {
        ...d,
        transactions: remainingTransactions
      };
    }, `Đã hoàn tác và xóa toàn bộ phiên import (${committedBatch.importedCount} giao dịch)!`);

    notify({ message: 'Đã hoàn tác phiên import thành công', severity: 'info' });
    onClose();
  };

  // Duplicate & Valid stats
  const validCount = staged.filter(s => s.isValid).length;
  const duplicateCount = staged.filter(s => s.isDuplicate).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '8px' } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        Trình Hướng Dẫn Chuyển Đổi Dữ Liệu (Import Wizard)
      </DialogTitle>

      <Box sx={{ px: 3, pt: 1, pb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem', fontWeight: 650 } }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ minHeight: 380 }}>
        {/* BƯỚC 1: CHỌN FILE */}
        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <FileSpreadsheet size={48} color="#3b82f6" style={{ margin: '0 auto 16px' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Chọn tệp dữ liệu CSV hoặc Excel
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 450, mx: 'auto', mb: 3 }}>
              Hỗ trợ sao kê ngân hàng, định dạng Money Lover, và bảng tính thu chi cá nhân. Hệ thống tự động phân tích cấu trúc.
            </Typography>

            <Button
              variant="contained"
              component="label"
              startIcon={<Upload size={18} />}
              sx={{ fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}
            >
              Tải file từ máy tính
              <input type="file" accept=".csv,.txt,.xlsx" hidden onChange={handleFileChange} />
            </Button>
          </Box>
        )}

        {/* BƯỚC 2: PHÂN TÍCH FILE */}
        {activeStep === 1 && analysis && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="success" icon={<CheckCircle2 size={18} />}>
              Đã phân tích tệp <strong>{fileName}</strong>: Tìm thấy <strong>{analysis.totalRows}</strong> dòng dữ liệu và <strong>{analysis.headers.length}</strong> cột.
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Định dạng phát hiện: {analysis.detectedFormat === 'money_lover' ? 'Money Lover Export' : 'Bảng tính CSV tiêu chuẩn'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Các cột được tìm thấy: {analysis.headers.join(' • ')}
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Mẫu 3 dòng đầu tiên trong file:
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      {analysis.headers.slice(0, 5).map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.sampleRows.slice(0, 3).map((r, i) => (
                      <TableRow key={i}>
                        {analysis.headers.slice(0, 5).map(h => (
                          <TableCell key={h} sx={{ fontSize: '0.75rem' }}>{r[h]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* BƯỚC 3: MAPPING CÁC CỘT */}
        {activeStep === 2 && analysis && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Gán các cột trong file tương ứng với trường dữ liệu của Finora:
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <MuiSelect
                label="Cột Ngày giao dịch *"
                value={mapping.dateCol}
                onChange={(val) => setMapping(prev => ({ ...prev, dateCol: val }))}
                options={analysis.headers.map(h => ({ value: h, label: h }))}
              />
              <MuiSelect
                label="Cột Nội dung / Diễn giải *"
                value={mapping.nameCol}
                onChange={(val) => setMapping(prev => ({ ...prev, nameCol: val }))}
                options={analysis.headers.map(h => ({ value: h, label: h }))}
              />
              <MuiSelect
                label="Cột Số tiền *"
                value={mapping.amountCol}
                onChange={(val) => setMapping(prev => ({ ...prev, amountCol: val }))}
                options={analysis.headers.map(h => ({ value: h, label: h }))}
              />
              <MuiSelect
                label="Cột Loại (Thu / Chi)"
                value={mapping.typeCol || ''}
                onChange={(val) => setMapping(prev => ({ ...prev, typeCol: val }))}
                options={[{ value: '', label: '(Không có - Tự nhận diện)' }, ...analysis.headers.map(h => ({ value: h, label: h }))]}
              />
              <MuiSelect
                label="Cột Danh mục"
                value={mapping.categoryCol || ''}
                onChange={(val) => setMapping(prev => ({ ...prev, categoryCol: val }))}
                options={[{ value: '', label: '(Không có - Dùng mặc định)' }, ...analysis.headers.map(h => ({ value: h, label: h }))]}
              />
              <MuiSelect
                label="Cột Tài khoản / Ví"
                value={mapping.accountCol || ''}
                onChange={(val) => setMapping(prev => ({ ...prev, accountCol: val }))}
                options={[{ value: '', label: '(Không có - Dùng mặc định)' }, ...analysis.headers.map(h => ({ value: h, label: h }))]}
              />
            </Box>
          </Box>
        )}

        {/* BƯỚC 4: MAPPING DANH MỤC */}
        {activeStep === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Ánh xạ danh mục từ file cũ sang danh mục Finora ({uniqueOldCategories.length} danh mục):
            </Typography>

            {uniqueOldCategories.length === 0 ? (
              <Alert severity="info">File không có cột danh mục hoặc tất cả giao dịch sẽ dùng danh mục mặc định.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Danh mục trong file cũ</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Danh mục Finora tương ứng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uniqueOldCategories.map(oldCat => (
                      <TableRow key={oldCat}>
                        <TableCell sx={{ fontWeight: 650 }}>{oldCat}</TableCell>
                        <TableCell>
                          <MuiSelect
                            label=""
                            value={categoryMap[oldCat] || categories[0]?.id || ''}
                            onChange={(val) => setCategoryMap(prev => ({ ...prev, [oldCat]: val }))}
                            options={categories.map(c => ({ value: c.id, label: `${c.name} (${c.type === 'income' ? 'Thu' : 'Chi'})` }))}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* BƯỚC 5: PREVIEW DỮ LIỆU */}
        {activeStep === 4 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Xem trước {staged.length} giao dịch đã được bóc tách:
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Ngày</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Giao dịch</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Số tiền</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Danh mục</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staged.slice(0, 15).map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>{formatVnDate(s.date)}</TableCell>
                      <TableCell sx={{ fontWeight: 650 }}>{s.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: s.type === 'income' ? '#10b981' : '#f43f5e' }}>
                        {s.type === 'income' ? '+' : '-'}{money(s.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.type === 'income' ? 'Thu' : s.type === 'transfer' ? 'Chuyển' : 'Chi'}
                          size="small"
                          color={s.type === 'income' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>{s.categoryName || 'Chi tiêu khác'}</TableCell>
                      <TableCell>
                        {s.isDuplicate ? (
                          <Chip label="Trùng khớp" color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        ) : s.isValid ? (
                          <Chip label="Hợp lệ" color="success" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        ) : (
                          <Chip label="Lỗi" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* BƯỚC 6: CẢNH BÁO TRÙNG LẶP */}
        {activeStep === 5 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Kiểm tra tính an toàn & dữ liệu trùng lặp:
            </Typography>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, textAlign: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tổng số dòng</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{staged.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>Hợp lệ</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>{validCount}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>Phát hiện trùng</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#f59e0b' }}>{duplicateCount}</Typography>
                </Box>
              </Box>

              {duplicateCount > 0 ? (
                <Alert severity="warning" icon={<AlertTriangle size={18} />}>
                  Phát hiện <strong>{duplicateCount}</strong> giao dịch có cùng số tiền và ngày trùng khớp với dữ liệu đã có trong sổ. Bật tùy chọn bỏ qua giao dịch trùng lặp để tránh cộng dồn hai lần.
                </Alert>
              ) : (
                <Alert severity="success" icon={<CheckCircle2 size={18} />}>
                  Không phát hiện giao dịch trùng lặp nào. Dữ liệu sạch sẽ và sẵn sàng để nhập!
                </Alert>
              )}
            </Paper>
          </Box>
        )}

        {/* BƯỚC 7: XÁC NHẬN IMPORT */}
        {activeStep === 6 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Xác nhận thông số nhập dữ liệu:
            </Typography>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <MuiSelect
                label="Chọn Tài khoản / Ví lưu trữ mặc định *"
                value={targetAccountId}
                onChange={(val) => setTargetAccountId(val)}
                options={accounts.map(a => ({ value: a.id, label: `${a.name} (${money(a.openingBalance)})` }))}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    color="primary"
                  />
                }
                label="Tự động loại bỏ các giao dịch trùng lặp"
              />

              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                * Sau khi xác nhận, toàn bộ giao dịch sẽ được ghi vào sổ kèm mã định danh phiên (Batch ID). Bạn luôn có thể Hoàn tác (Rollback) toàn bộ phiên nhập này bất kỳ lúc nào nếu muốn.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* BƯỚC 8: BÁO CÁO KẾT QUẢ & ROLLBACK */}
        {activeStep === 7 && committedBatch && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#10b981' }}>
              Nhập Dữ Liệu Thành Công!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              Đã ghi nhận <strong>{committedBatch.importedCount}</strong> giao dịch vào sổ. Bỏ qua {committedBatch.skippedCount} giao dịch trùng lặp hoặc lỗi.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, maxWidth: 450, mx: 'auto', mb: 3, textAlign: 'left', bgcolor: 'action.hover' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Mã phiên (Batch ID): <strong>{committedBatch.batchId}</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Tệp nguồn: {committedBatch.fileName}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<RotateCcw size={16} />}
                onClick={handleRollback}
                sx={{ fontWeight: 700 }}
              >
                Hoàn tác phiên này (Rollback)
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onClose}
                sx={{ fontWeight: 700 }}
              >
                Xong
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        {activeStep > 0 && activeStep < 7 ? (
          <Button startIcon={<ArrowLeft size={16} />} onClick={() => setActiveStep(prev => prev - 1)}>
            Quay lại
          </Button>
        ) : <Box />}

        {activeStep === 1 && (
          <Button variant="contained" endIcon={<ArrowRight size={16} />} onClick={() => setActiveStep(2)}>
            Tiếp tục: Cấu hình Cột
          </Button>
        )}

        {activeStep === 2 && (
          <Button variant="contained" endIcon={<ArrowRight size={16} />} onClick={handleProceedToCategoryMapping}>
            Tiếp tục: Danh mục
          </Button>
        )}

        {activeStep === 3 && (
          <Button variant="contained" endIcon={<ArrowRight size={16} />} onClick={handleGeneratePreview}>
            Xem trước dữ liệu
          </Button>
        )}

        {activeStep === 4 && (
          <Button variant="contained" endIcon={<ArrowRight size={16} />} onClick={() => setActiveStep(5)}>
            Kiểm tra trùng lặp
          </Button>
        )}

        {activeStep === 5 && (
          <Button variant="contained" endIcon={<ArrowRight size={16} />} onClick={() => setActiveStep(6)}>
            Xác nhận nhập
          </Button>
        )}

        {activeStep === 6 && (
          <Button variant="contained" color="primary" onClick={handleCommitImport} sx={{ fontWeight: 800 }}>
            Tiến hành Import ngay
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
