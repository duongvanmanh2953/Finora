import { driver, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';

export type TourPageKey = 'dashboard' | 'assets' | 'transactions' | 'budgets' | 'settings' | 'adminUsers' | 'adminHealth';

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
