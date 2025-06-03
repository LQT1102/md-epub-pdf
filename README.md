# Công Cụ Chuyển Đổi Markdown sang HTML/EPUB

Công cụ này giúp chuyển đổi nhiều file Markdown thành một file HTML hoặc EPUB đẹp mắt, phù hợp cho việc tạo sách điện tử, tài liệu kỹ thuật và tài liệu hướng dẫn.

## Tính Năng

- ✅ Chuyển đổi nhiều file Markdown thành một file HTML tổng hợp
- ✅ Chuyển đổi HTML thành file EPUB chuẩn
- ✅ Tự động tạo mục lục
- ✅ Hỗ trợ hình ảnh (tự động nhúng dưới dạng base64)
- ✅ Tùy chỉnh CSS để tạo phong cách sách điện tử đẹp mắt
- ✅ Tự động xử lý các liên kết nội bộ

## Cài Đặt

```bash
# Sao chép mã nguồn
git clone https://github.com/your-username/md-to-epub-converter.git
cd md-to-epub-converter

# Cài đặt các gói phụ thuộc
npm install
```

## Cấu Trúc Dự Án

```
.
├── markdown/            # Thư mục chứa các file markdown đầu vào
├── output/              # Thư mục chứa các file đầu ra (HTML, EPUB)
├── md-to-html.js        # Script chuyển đổi Markdown sang HTML
├── html-to-epub.js      # Script chuyển đổi HTML sang EPUB
├── metadata.js          # Thông tin metadata cho sách
├── package.json         # Cấu hình dự án và dependencies
└── README.md            # Tệp hướng dẫn này
```

## Cách Sử Dụng

### Bước 1: Chuẩn Bị File Markdown

Đặt tất cả các file Markdown (.md) của bạn vào thư mục `markdown/`. Các file sẽ được xử lý theo thứ tự alphabet, vì vậy bạn nên đặt tên file theo thứ tự mong muốn (ví dụ: 01-introduction.md, 02-chapter1.md, ...).

### Bước 2: Cấu Hình Metadata

Chỉnh sửa file `metadata.js` để cấu hình thông tin cho sách của bạn:

```javascript
export default {
  title: "Tiêu đề sách của bạn",
  author: "Tên tác giả",
  publisher: "Nhà xuất bản",
  cover: "đường dẫn đến file ảnh bìa" // tùy chọn
};
```

### Bước 3: Chuyển Đổi Markdown sang HTML

Chạy lệnh sau để chuyển đổi các file Markdown thành một file HTML tổng hợp:

```bash
npm run html
```

File HTML sẽ được tạo trong thư mục `output/` với tên dựa trên tiêu đề sách đã cấu hình.

### Bước 4: Chuyển Đổi HTML sang EPUB

Sau khi đã có file HTML, chạy lệnh sau để chuyển đổi thành EPUB:

```bash
npm run epub
```

File EPUB sẽ được tạo trong thư mục `output/` với cùng tên file như HTML.

## Tùy Chỉnh Giao Diện

Bạn có thể tùy chỉnh giao diện của sách bằng cách chỉnh sửa CSS trong phương thức `getDefaultCSS()` trong file `md-to-html.js`.

## Lưu Ý

- Hình ảnh trong Markdown phải sử dụng đường dẫn tương đối với thư mục chứa file Markdown
- Công cụ tự động nhúng hình ảnh dưới dạng base64, vì vậy file EPUB đầu ra sẽ chứa tất cả hình ảnh mà không cần file riêng biệt
- Để có kết quả tốt nhất, hãy sử dụng cú pháp Markdown chuẩn

## Xử Lý Sự Cố

### Lỗi: Không tìm thấy file HTML

Nếu bạn gặp lỗi khi chạy `npm run epub`, hãy đảm bảo bạn đã chạy `npm run html` trước để tạo file HTML.

### Lỗi: Markdown không được xử lý đúng cách

Đảm bảo rằng các file Markdown của bạn tuân theo cú pháp Markdown chuẩn. Kiểm tra định dạng tiêu đề, danh sách, và các phần tử khác.

## Giấy Phép

Dự án này được phân phối dưới Giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

---

Tạo bởi [Tên của bạn] với ❤️