import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import MarkdownToEpubConverter from './md-to-html.js';
import convertHtmlToEpub from './html-to-epub.js';
import metadata from './metadata.js';

// Thiết lập __dirname trong ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Phục vụ file HTML từ thư mục public

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API lấy thông tin file và metadata
app.get('/api/files', (req, res) => {
  // Kiểm tra các thư mục
  const inputDir = path.join(__dirname, 'markdown');
  const outputDir = path.join(__dirname, 'output');
  
  // Đảm bảo thư mục tồn tại
  fs.ensureDirSync(inputDir);
  fs.ensureDirSync(outputDir);
  
  // Đọc danh sách file markdown nếu có
  const markdownFiles = fs.existsSync(inputDir) 
    ? fs.readdirSync(inputDir).filter(file => file.endsWith('.md'))
    : [];
    
  // Đọc danh sách file output nếu có
  const outputFiles = fs.existsSync(outputDir)
    ? fs.readdirSync(outputDir)
    : [];
    
  const htmlFiles = outputFiles.filter(file => file.endsWith('.html'));
  const epubFiles = outputFiles.filter(file => file.endsWith('.epub'));
  
  // Lấy metadata hiện tại
  const currentMetadata = {
    title: metadata.title || '',
    author: metadata.author || '',
    publisher: metadata.publisher || ''
  };
  
  res.json({
    markdownFiles,
    htmlFiles,
    epubFiles,
    metadata: currentMetadata
  });
});

// API chuyển đổi Markdown sang HTML
app.post('/convert-to-html', async (req, res) => {
  try {
    const { title, author, publisher } = req.body;
    
    // Cập nhật metadata tạm thời
    const tempMetadata = {
      title: title || metadata.title,
      author: author || metadata.author,
      publisher: publisher || metadata.publisher
    };
    
    // Khởi tạo converter
    const converter = new MarkdownToEpubConverter({
      inputDir: './markdown',
      outputDir: './output',
      title: tempMetadata.title,
      author: tempMetadata.author,
      publisher: tempMetadata.publisher
    });
    
    // Thực hiện chuyển đổi
    const result = await converter.convertToEpub();
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Chuyển đổi sang HTML thành công!',
        outputFile: result
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Chuyển đổi thất bại. Kiểm tra console để biết thêm chi tiết.'
      });
    }
  } catch (error) {
    console.error('Lỗi khi chuyển đổi:', error);
    res.status(500).json({ 
      success: false, 
      message: `Lỗi: ${error.message}`
    });
  }
});

// API chuyển đổi HTML sang EPUB
app.post('/convert-to-epub', async (req, res) => {
  try {
    await convertHtmlToEpub();
    
    // Tìm file EPUB mới nhất
    const outputDir = path.join(__dirname, 'output');
    const epubFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.epub'));
    
    if (epubFiles.length > 0) {
      // Sắp xếp theo thời gian sửa đổi, lấy file mới nhất
      const latestEpub = epubFiles
        .map(file => ({ 
          name: file, 
          time: fs.statSync(path.join(outputDir, file)).mtime.getTime() 
        }))
        .sort((a, b) => b.time - a.time)[0].name;
      
      res.json({ 
        success: true, 
        message: 'Chuyển đổi sang EPUB thành công!',
        outputFile: path.join('output', latestEpub)
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Không tìm thấy file EPUB nào được tạo.'
      });
    }
  } catch (error) {
    console.error('Lỗi khi chuyển đổi HTML sang EPUB:', error);
    res.status(500).json({ 
      success: false, 
      message: `Lỗi: ${error.message}`
    });
  }
});

// API để tải file
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'output', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File không tồn tại');
  }
});

// Bắt đầu server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 Ứng dụng chuyển đổi Markdown sang HTML/EPUB`);
  console.log(`🔍 Kiểm tra thư mục markdown/ để biết các file đầu vào`);
  console.log(`📁 Kết quả sẽ được lưu trong thư mục output/`);
});
