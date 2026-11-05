import { driver, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';

export type TourPageKey =
  | 'dashboard'
  | 'assets'
  | 'transactions'
  | 'budgets'
  | 'settings'
  | 'reports'
  | 'payroll'
  | 'savings'
  | 'debts'
  | 'recurring'
  | 'adminUsers'
  | 'adminHealth';

const TOUR_CONFIGS: Record<TourPageKey, Config['steps']> = {
  dashboard: [
    {
      element: '#tour-dashboard-add-tx',
      popover: {
        title: '👉 Nút Thêm Giao Dịch Mới',
        description: 'Bấm nút [+ Thêm giao dịch] tại đây bất kỳ lúc nào để ghi chép khoản thu, chi tiêu hoặc chuyển khoản ví.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-privacy-toggle',
      popover: {
        title: '👁️ Mắt Bảo Mật (Ẩn/Hiện Số Dư)',
        description: 'Nhấp biểu tượng này để che giấu toàn bộ số tiền trên màn hình khi bạn làm việc ở nơi công cộng.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-net-worth-card',
      popover: {
        title: '📊 7 Thẻ Chỉ Số Tài Chính Tổng Quan',
        description: 'Xem tức thì: Tổng tài sản ròng, Tổng thu nhập, Chi tiêu, Dòng tiền ròng, Tỷ lệ tiết kiệm, Tiến độ ngân sách và Nghĩa vụ nợ đến hạn.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-gauges-cluster',
      popover: {
        title: '⚡ Bộ 5 Tốc Kế Rủi Ro (Speedometer Gauges)',
        description: 'Đánh giá sức khỏe tài chính đa chiều: Rủi ro tổng thể, Áp lực nợ, Đòn bẩy, Khả năng trả nợ và Khả năng thanh toán tức thời.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#tour-quick-bar',
      popover: {
        title: '💬 Nhập Liệu Tự Nhiên & 1-Chạm (NLP)',
        description: 'Gõ tự nhiên như "ăn trưa 45k ví tiền mặt" hoặc bấm nhanh các chip số tiền để lưu giao dịch chỉ trong 3 giây.',
        side: 'bottom',
        align: 'start'
      }
    }
  ],

  assets: [
    {
      element: '#tour-add-asset-btn',
      popover: {
        title: '👉 Nút Thêm Mục Đầu Tư Mới',
        description: 'Bấm nút này để khai báo các tài sản mới: Cổ phiếu, Vàng, Bất động sản, Tiết kiệm hoặc Crypto.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-asset-net-worth',
      popover: {
        title: '💎 Bảng Điều Khiển Tổng Tài Sản & Safe Mode',
        description: 'Xem rõ ràng tiền mặt thực có, vốn đã bỏ ra và vốn chưa thu hồi. Có thể bật công tắc [Thận trọng (Safe Mode)] để loại trừ tài sản rủi ro cao.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-market-sync-btn',
      popover: {
        title: '🔄 Đồng Bộ Giá Thị Trường Tự Động',
        description: 'Cập nhật giá khớp lệnh thời gian thực của cổ phiếu và chứng chỉ quỹ qua kết nối Finnhub / WebMCP.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#tour-asset-tabs',
      popover: {
        title: '📑 4 Thẻ Phân Hệ Quản Trị Tài Sản',
        description: 'Dễ dàng chuyển đổi giữa: Dự phóng tương lai (3 kịch bản), Sổ theo dõi vốn & thu hồi, Vị thế danh mục và Sổ cái giao dịch.',
        side: 'bottom',
        align: 'start'
      }
    }
  ],

  transactions: [
    {
      element: '#tour-tx-add-btn',
      popover: {
        title: '👉 Nút Thêm Giao Dịch Mới',
        description: 'Bấm nút này để mở form chi tiết: chọn ví nguồn, danh mục thu/chi, đính kèm hóa đơn và ghi chú.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-tx-quick-bar',
      popover: {
        title: '⚡ Thanh Ghi Nhanh Thông Minh (NLP)',
        description: 'Gõ câu bình thường như "cà phê 35k" hoặc "lương dự án 15tr" — AI sẽ tự bóc tách và phân loại ngay.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-tx-subtabs',
      popover: {
        title: '📋 Chuyển Đổi Góc Nhìn Quản Lý',
        description: 'Chuyển giữa [Sổ giao dịch CRUD] để đối soát chi tiết và [Dòng thời gian & Hóa đơn] dạng lịch trực quan.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-tx-table',
      popover: {
        title: '🔍 Sổ Nhật Ký & Bộ Lọc Đa Chiều',
        description: 'Lọc nhanh theo ví, danh mục, thời gian; bấm vào nút cây bút để sửa hoặc thùng rác để xóa giao dịch.',
        side: 'top',
        align: 'center'
      }
    }
  ],

  budgets: [
    {
      element: '#tour-budget-month',
      popover: {
        title: '📅 Chọn Tháng Tài Chính',
        description: 'Chọn tháng bạn muốn lập kế hoạch và theo dõi hạn mức chi tiêu.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-budget-add-btn',
      popover: {
        title: '👉 Nút Tạo Ngân Sách Mới',
        description: 'Bấm vào đây để thiết lập hạn mức chi tối đa cho từng nhóm như Ăn uống, Mua sắm, Nhà ở...',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-budget-progress',
      popover: {
        title: '📈 Theo Dõi Tiến Độ & Cảnh Báo Vượt Chi',
        description: 'Thanh tiến độ phản ánh số tiền đã tiêu so với định mức. Hệ thống sẽ cảnh báo khi bạn chi tiêu chạm ngưỡng nguy hiểm.',
        side: 'top',
        align: 'center'
      }
    }
  ],

  settings: [
    {
      element: '#tour-settings-profile',
      popover: {
        title: '👤 Thông Tin Cá Nhân & Chu Kỳ Tài Chính',
        description: 'Cập nhật thông tin tài khoản và chọn ngày bắt đầu tháng tài chính trùng với ngày nhận lương hàng tháng.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-settings-favs',
      popover: {
        title: '⭐ Tùy Chỉnh Mục Yêu Thích Trên Sidebar',
        description: 'Bấm tích chọn các tính năng bạn thường xuyên sử dụng nhất để ghim lên đầu Menu Sidebar, giúp thao tác tiện lợi và không phải tìm kiếm.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#tour-settings-pro',
      popover: {
        title: '👑 Quản Lý Gói Cước & Dev Mode',
        description: 'Tra cứu hạn dùng gói VIP Gold hoặc dùng công tắc Dev Mode để linh hoạt chuyển đổi qua lại giữa bản Free và Pro.',
        side: 'bottom',
        align: 'start'
      }
    }
  ],

  reports: [
    {
      element: '#tour-reports-timeframe',
      popover: {
        title: '📅 Chọn Khung Thời Gian Báo Cáo',
        description: 'Chuyển đổi linh hoạt giữa 7 ngày qua, 30 ngày qua, Tháng này, Năm nay hoặc Tùy chỉnh khoảng ngày mong muốn.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-reports-kpi',
      popover: {
        title: '📊 Chỉ Số Dòng Tiền & Tỷ Lệ Tiết Kiệm',
        description: 'Đối chiếu tổng thu thực nhận, tổng chi thực tế và số tiền tích lũy ròng kèm tỷ lệ tiết kiệm (Savings Rate).',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#tour-reports-charts',
      popover: {
        title: '📉 Biểu Đồ Thác Dòng Tiền & Cơ Cấu Chi Phí',
        description: 'Trực quan hóa dòng tiền chuyển dịch và cơ cấu các danh mục chiếm tỷ trọng chi lớn nhất.',
        side: 'top',
        align: 'center'
      }
    }
  ],

  payroll: [
    {
      element: '#tour-payroll-inputs',
      popover: {
        title: '💼 Nhập Lương Gross & Phụ Cấp',
        description: 'Điền mức lương hợp đồng và các khoản phụ cấp miễn thuế để tính toán theo quy định bảo hiểm và thuế Việt Nam mới nhất.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-payroll-net',
      popover: {
        title: '💵 Lương Thực Nhận (Net Take-Home)',
        description: 'Xem số tiền thực lĩnh sau khi đã trích nộp bảo hiểm bắt buộc (BHXH, BHYT, BHTN) và Thuế TNCN từng bậc lũy tiến.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#tour-payroll-sync-btn',
      popover: {
        title: '📥 Ghi Nhận Thành Giao Dịch Thu Nhập',
        description: 'Bấm nút này để tự động tạo một giao dịch thu nhập lương vào ví mặc định mà không cần nhập tay lại.',
        side: 'top',
        align: 'end'
      }
    }
  ],

  savings: [
    {
      element: '#tour-savings-add-btn',
      popover: {
        title: '🎯 Tạo Mục Tiêu Tiết Kiệm Mới',
        description: 'Thiết lập quỹ khẩn cấp, mua nhà, đổi xe hoặc du lịch với số tiền mục tiêu và hạn hoàn thành cụ thể.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-savings-list',
      popover: {
        title: '📈 Theo Dõi Tiến Độ Tích Lũy',
        description: 'Quan sát thanh tiến độ % hoàn thành và phân bổ nguồn tiền tích lũy mỗi khi nhận lương hoặc tiền thưởng.',
        side: 'top',
        align: 'center'
      }
    }
  ],

  debts: [
    {
      element: '#tour-debts-add-btn',
      popover: {
        title: '📝 Ghi Khoản Nợ Phải Trả Hoặc Cho Vay',
        description: 'Quản lý các khoản nợ tín dụng, trả góp ngân hàng hoặc tiền cho bạn bè mượn kèm ngày đến hạn.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-debts-summary',
      popover: {
        title: '⚖️ Bảng Tổng Hợp Nghĩa Vụ Tài Chính',
        description: 'Xem rõ tổng tiền đang nợ và tổng tiền đang cho vay để lên kế hoạch trả nợ thông minh (Snowball / Avalanche).',
        side: 'top',
        align: 'center'
      }
    }
  ],

  recurring: [
    {
      element: '#tour-recurring-add-btn',
      popover: {
        title: '⏰ Thêm Giao Dịch Định Kỳ Mới',
        description: 'Lên lịch cho tiền thuê nhà, internet, gói Netflix hoặc tiền đóng học phí để hệ thống tự động ghi chép.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-recurring-table',
      popover: {
        title: '🔄 Lịch Trình Tự Động Hóa',
        description: 'Theo dõi chu kỳ (hàng tuần/tháng) và trạng thái tự động thực thi khi khởi chạy ứng dụng.',
        side: 'top',
        align: 'center'
      }
    }
  ],

  adminUsers: [
    {
      element: '#tour-admin-users-table',
      popover: {
        title: 'Quản Trị Người Dùng & Gói Cước',
        description: 'Tra cứu danh sách khách hàng, trạng thái tài khoản, thời hạn gói Pro và lịch sử hoạt động bảo mật.',
        side: 'bottom'
      }
    }
  ],

  adminHealth: [
    {
      element: '#tour-admin-system-metrics',
      popover: {
        title: 'Giám Sát Sức Khỏe Hệ Thống',
        description: 'Theo dõi thời gian phản hồi API, trạng thái kết nối Finnhub/MCP, tỷ lệ lỗi và tài nguyên vận hành 24/7.',
        side: 'bottom'
      }
    }
  ]
};

export function startGuidedTour(pageKey: TourPageKey) {
  const steps = TOUR_CONFIGS[pageKey];
  if (!steps || steps.length === 0) return;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.65,
    stagePadding: 6,
    stageRadius: 8,
    nextBtnText: 'Tiếp theo →',
    prevBtnText: '← Quay lại',
    doneBtnText: 'Hoàn tất ✓',
    steps
  });

  driverObj.drive();
}
