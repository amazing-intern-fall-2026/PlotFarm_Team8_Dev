## Reusable UI Components (Customer Portal)

Hệ thống UI Component dùng chung nằm tại `src/components/`:

### 1. Navbar (`src/components/layout/Navbar.tsx`)
Thanh điều hướng topbar của portal.
- **Props**: `brandTitle`, `brandHighlight`, `portalBadge`, `user`, `onLogout`.

### 2. StatCard (`src/components/ui/StatCard.tsx`)
Thẻ hiển thị chỉ số thống kê dạng card nhỏ.
- **Props**: `title`, `value`, `subtext`, `icon`, `iconBgColor`, `valueClassName`.

### 3. Modal (`src/components/ui/Modal.tsx`)
Popup hội thoại chung.
- **Props**: `isOpen`, `onClose`, `title`, `description`, `footer`, `children`.

### 4. Basic UI Components (`src/components/ui/`)
- `Button`: Nút bấm chuẩn với các variant (`primary`, `outline`), size (`sm`, `md`), trạng thái `loading`.
- `Badge`: Nhãn trạng thái (`success`, `warning`, `error`).
- `Alert`: Bảng thông báo thành công / lỗi.
- `Card`: Khung bọc nội dung chuẩn.
- `EmptyState`: Giao diện hiển thị khi không có dữ liệu.