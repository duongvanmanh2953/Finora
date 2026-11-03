import { driver, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';

export type TourPageKey = 'dashboard' | 'assets' | 'transactions' | 'adminUsers' | 'adminHealth';

const TOUR_CONFIGS: Record<TourPageKey, Config['steps']> = {
  dashboard: [
    {
      element: '#tour-net-worth-card',
      popover: {
        title: 'Tổng Tài Sản Ròng (Net Worth)',
        description: 'Phản ánh chuẩn xác bức tranh tài sản thực: Tiền mặt có sẵn + Giá trị tài sản đầu tư ước tính - Toàn bộ các khoản nợ phải trả.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-safe-mode-toggle',
      popover: {
        title: 'Chế độ Thận trọng (Safe Mode)',
        description: 'Bật công tắc này khi bạn muốn loại trừ các tài sản biến động rủi ro cao (Crypto, Start-up, Lướt sóng) để chỉ xem số tiền chắc chắn 100% trong tay.',
        side: 'bottom'
      }
    },
    {
      element: '#tour-gauges-cluster',
      popover: {
        title: 'Bộ 5 Tốc Kế Rủi Ro (Speedometer Gauges)',
        description: 'Đánh giá chuyên sâu 5 khía cạnh sức khỏe: Rủi ro tổng thể, Áp lực nợ nần, Khả năng thanh toán tức thời, và Độ khả thi mục tiêu.',
        side: 'top'
      }
    },
    {
      element: '#tour-quick-bar',
      popover: {
        title: 'Ghi Nhanh Thông Minh (NLP & 1-Tap)',
        description: 'Nhập tự nhiên như "cf sáng 45k" hoặc bấm các nút tiền nhanh để hoàn thành ghi chép giao dịch trong 3 giây.',
        side: 'bottom'
      }
    }
  ],

  assets: [
    {
      element: '#tour-asset-net-worth',
      popover: {
        title: 'Bảng Điều Khiển Tổng Tài Sản',
        description: 'Phân định rõ ràng: Tiền thực có trong ví/ngân hàng, Vốn đầu tư đã bỏ ra và Vốn chưa thu hồi.',
        side: 'bottom'
      }
    },
    {
      element: '#tour-asset-tabs',
      popover: {
        title: 'Các Phân Hệ Quản Trị Tài Sản',
        description: 'Chuyển đổi giữa Phóng chiếu tương lai (3 kịch bản), Sổ theo dõi vốn & thu hồi, Vị thế thị trường và Sổ cái giao dịch.',
        side: 'bottom'
      }
    },
    {
      element: '#tour-unrecovered-table',
      popover: {
        title: 'Sổ Theo Dõi Vốn & Thu Hồi',
        description: 'Quản lý từng khoản đầu tư. Bạn có thể bấm con mắt để tạm ẩn khoản rủi ro, hoặc bấm "Thu hồi" để rút vốn về ví tiền mặt.',
        side: 'top'
      }
    }
  ],

  transactions: [
    {
      element: '#tour-tx-quick-bar',
      popover: {
        title: 'Nhập Giao Dịch Bằng Ngôn Ngữ Tự Nhiên',
        description: 'Nhập ví dụ: "Ăn trưa 65k" hoặc "Lương dự án 15tr", hệ thống sẽ tự động phân loại danh mục và ngày phát sinh.',
        side: 'bottom'
      }
    },
    {
      element: '#tour-tx-table',
      popover: {
        title: 'Sổ Nhật Ký Giao Dịch',
        description: 'Xem toàn bộ lịch sử chi tiêu, lọc theo danh mục, tài khoản nguồn và trạng thái hoàn tất.',
        side: 'top'
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
    overlayOpacity: 0.6,
    nextBtnText: 'Tiếp theo →',
    prevBtnText: '← Quay lại',
    doneBtnText: 'Hoàn tất ✓',
    steps
  });

  driverObj.drive();
}

