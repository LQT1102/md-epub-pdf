# Markdown to EPUB Converter

Công cụ Node.js để convert nhiều file markdown thành một file HTML hoặc EPUB.

## Tính năng

- ✅ Convert nhiều file `.md` thành một file HTML tổng hợp
- ✅ Hỗ trợ GitHub Flavored Markdown (GFM)
- ✅ Tự động tạo mục lục (Table of Contents)
- ✅ Styling đẹp mắt với CSS tùy chỉnh
- ✅ Tương thích với Windows, macOS, Linux
- ✅ Hướng dẫn convert HTML thành EPUB

## Cài đặt

1. **Clone hoặc tải về dự án**
```bash
git clone <repository-url>
cd md-epub-pdf
```

2. **Cài đặt dependencies**
```bash
npm install
# hoặc
pnpm install
```

## Sử dụng

### Cách 1: Sử dụng mặc định

1. **Đặt các file markdown vào thư mục `markdown/`**
```
markdown/
├── 01-gioi-thieu.md
├── 02-noi-dung.md
├── 03-ket-luan.md
└── ...
```

2. **Chạy converter**
```bash
npm start
# hoặc
node index.js
```

3. **Kiểm tra kết quả trong thư mục `output/`**

### Cách 2: Tùy chỉnh cấu hình

```javascript
const MarkdownToEpubConverter = require('./index.js');

const converter = new MarkdownToEpubConverter({
  inputDir: './your-markdown-folder',    // Thư mục chứa file markdown
  outputDir: './your-output-folder',     // Thư mục output
  title: 'Tên sách của bạn',             // Tiêu đề sách
  author: 'Tên tác giả',                 // Tên tác giả
  publisher: 'Nhà xuất bản'              // Nhà xuất bản
});

converter.convertToEpub().then(result => {
  if (result) {
    console.log('✅ Thành công:', result);
  } else {
    console.log('❌ Thất bại');
  }
});
```

## Convert HTML thành EPUB

Sau khi có file HTML, bạn có thể convert thành EPUB bằng các cách sau:

### 1. Sử dụng Calibre (Khuyến nghị)

1. Tải và cài đặt [Calibre](https://calibre-ebook.com/)
2. Mở Calibre
3. Click "Add books" và chọn file HTML
4. Click "Convert books"
5. Chọn "Output format" là EPUB
6. Click "OK"

### 2. Sử dụng công cụ online

- [CloudConvert](https://cloudconvert.com/html-to-epub)
- [Zamzar](https://www.zamzar.com/convert/html-to-epub/)
- [Online-Convert](https://www.online-convert.com/)

### 3. Sử dụng Pandoc

```bash
# Cài đặt Pandoc
# Windows: choco install pandoc
# macOS: brew install pandoc
# Ubuntu: sudo apt install pandoc

# Convert HTML thành EPUB
pandoc input.html -o output.epub
```

## Cấu trúc dự án

```
md-epub-pdf/
├── markdown/           # Thư mục chứa file markdown
│   ├── 01-chapter1.md
│   ├── 02-chapter2.md
│   └── ...
├── output/             # Thư mục output
│   └── book.html
├── index.js            # Script chính
├── package.json        # Dependencies
└── README.md           # File này
```

## Tùy chỉnh CSS

Bạn có thể tùy chỉnh giao diện bằng cách sửa method `getDefaultCSS()` trong file `index.js`:

```javascript
getDefaultCSS() {
  return `
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.8;
      color: #000;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #e74c3c;
    }
    // ... thêm CSS tùy chỉnh
  `;
}
```

## Supported Markdown Features

- ✅ Headers (H1-H6)
- ✅ Bold, Italic text
- ✅ Lists (ordered, unordered)
- ✅ Links
- ✅ Images
- ✅ Code blocks với syntax highlighting
- ✅ Tables
- ✅ Blockquotes
- ✅ Line breaks
- ✅ GitHub Flavored Markdown (GFM)

## Troubleshooting

### Không tìm thấy file markdown
- Kiểm tra đường dẫn thư mục `markdown/`
- Đảm bảo file có extension `.md`
- Kiểm tra quyền đọc file

### Lỗi khi convert
- Kiểm tra syntax markdown trong file
- Đảm bảo file không bị corrupted
- Kiểm tra dung lượng file (file quá lớn có thể gây lỗi)

### File HTML không hiển thị đúng
- Kiểm tra encoding UTF-8
- Mở file bằng trình duyệt hiện đại
- Kiểm tra CSS trong file

## Requirements

- Node.js >= 14.0.0
- npm hoặc pnpm

## Dependencies

- `marked`: Parse markdown thành HTML
- `fs-extra`: File system operations
- `glob`: Pattern matching cho file
- `path`: Path utilities

## License

MIT License

## Contributing

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

---

**Lưu ý:** Tool này tạo file HTML tổng hợp. Để có file EPUB thực sự, bạn cần sử dụng thêm công cụ convert như Calibre hoặc Pandoc. 