import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { marked } from 'marked';
import mime from 'mime-types';
import { JSDOM } from 'jsdom';
import metadata from './metadata.js';

class MarkdownToEpubConverter {
  constructor(options = {}) {
    this.inputDir = options.inputDir || './markdown';
    this.outputDir = options.outputDir || './output';
    this.epubTitle = metadata.title;
    this.author = metadata.author;
    this.publisher = metadata.publisher;
    this.cover = options.cover || null;
    this.css = options.css || this.getDefaultCSS();
  }

  getDefaultCSS() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 20px;
        color: #333;
        max-width: 800px;
        font-weight: 400;
      }
      
      .title-page {
        text-align: center;
        padding: 40px 0;
        margin-bottom: 40px;
        border-bottom: 2px solid #e9ecef;
      }
      
      .title-page h1 {
        font-size: 2.5em;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 20px;
        border: none;
      }
      
      .title-page .author,
      .title-page .publisher {
        font-size: 1.1em;
        color: #6c757d;
        margin: 10px 0;
        font-weight: 300;
      }
      
      .table-of-contents {
        background: #f8f9fa;
        padding: 30px;
        border-radius: 8px;
        margin-bottom: 40px;
      }
      
      .table-of-contents h2 {
        color: #2c3e50;
        font-weight: 600;
        margin-top: 0;
        font-size: 1.8em;
      }
      
      .table-of-contents ul {
        list-style: none;
        padding: 0;
      }
      
      .table-of-contents li {
        margin: 8px 0;
        padding: 8px 0;
        border-bottom: 1px solid #dee2e6;
      }
      
      .table-of-contents a {
        color: #495057;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s ease;
      }
      
      .table-of-contents a:hover {
        color: #007bff;
      }
      
      h1, h2, h3, h4, h5, h6 {
        color: #2c3e50;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }
      
      h1 { 
        font-size: 2.2em; 
        border-bottom: 3px solid #007bff; 
        padding-bottom: 15px;
        page-break-before: always;
        font-weight: 700;
        margin-top: 2em;
      }
      
      h2 { 
        font-size: 1.8em;
        color: #495057;
        border-left: 4px solid #007bff;
        padding-left: 15px;
      }
      
      h3 { 
        font-size: 1.4em;
        color: #6c757d;
      }
      
      p { 
        margin-bottom: 1em; 
        line-height: 1.7;
        font-weight: 400;
      }
      
      code {
        background-color: #f8f9fa;
        padding: 3px 6px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 0.9em;
        color: #e83e8c;
        border: 1px solid #e9ecef;
      }
      
      pre {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        overflow-x: auto;
        border-left: 4px solid #007bff;
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 0.9em;
        line-height: 1.5;
        margin: 1.5em 0;
      }
      
      pre code {
        background: none;
        padding: 0;
        border: none;
        color: #495057;
      }
      
      blockquote {
        border-left: 4px solid #007bff;
        margin: 1.5em 0;
        padding: 15px 20px;
        color: #6c757d;
        background-color: #f8f9fa;
        border-radius: 0 4px 4px 0;
        font-style: italic;
      }
      
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1.5em 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      
      th, td {
        border: 1px solid #dee2e6;
        padding: 12px 16px;
        text-align: left;
      }
      
      th {
        background-color: #007bff;
        color: white;
        font-weight: 600;
        font-size: 0.95em;
      }
      
      tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      
      tr:hover {
        background-color: #e9ecef;
      }
      
      .chapter {
        page-break-before: always;
        margin-bottom: 40px;
      }
      
      .chapter-content {
        padding: 20px 0;
      }
      
      ul, ol {
        padding-left: 25px;
        line-height: 1.7;
      }
      
      li {
        margin: 8px 0;
      }
      
      a {
        color: #007bff;
        text-decoration: none;
        transition: color 0.2s ease;
      }
      
      a:hover {
        color: #0056b3;
        text-decoration: underline;
      }
      
      strong {
        font-weight: 600;
        color: #2c3e50;
      }
      
      em {
        font-style: italic;
        color: #495057;
      }
      
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1.5em auto;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        border: 1px solid #e9ecef;
      }
      
      figure {
        margin: 1.5em 0;
        text-align: center;
      }
      
      figcaption {
        font-size: 0.9em;
        color: #6c757d;
        font-style: italic;
        margin-top: 8px;
        padding: 0 20px;
      }
      
      /* Responsive cho mobile */
      @media (max-width: 768px) {
        body {
          padding: 15px;
          max-width: 100%;
        }
        
        .title-page h1 {
          font-size: 2em;
        }
        
        .table-of-contents {
          padding: 20px;
        }
        
        h1 {
          font-size: 1.8em;
        }
        
        h2 {
          font-size: 1.5em;
        }
        
        pre {
          padding: 15px;
          font-size: 0.8em;
        }
        
        table {
          font-size: 0.9em;
        }
        
        th, td {
          padding: 8px 12px;
        }
      }
    `;
  }

  async findMarkdownFiles() {
    try {
      console.log(`🔍 Đang tìm file markdown trong: ${this.inputDir}`);
      
      // Thử nhiều pattern khác nhau để tương thích với Windows
      const patterns = [
        path.join(this.inputDir, '**/*.md'),
        path.join(this.inputDir, '*.md'),
        `${this.inputDir}/**/*.md`,
        `${this.inputDir}/*.md`
      ];
      
      let files = [];
      
      for (const pattern of patterns) {
        console.log(`🔍 Thử pattern: ${pattern}`);
        try {
          const result = globSync(pattern);
          console.log(`🔍 Kết quả:`, result);
          if (result.length > 0) {
            files = result;
            break;
          }
        } catch (err) {
          console.log(`⚠️ Pattern failed: ${pattern} - ${err.message}`);
        }
      }
      
      // Nếu vẫn không tìm thấy, thử đọc thư mục trực tiếp
      if (files.length === 0) {
        console.log(`🔍 Thử đọc thư mục trực tiếp...`);
        try {
          const dirFiles = await fs.readdir(this.inputDir);
          files = dirFiles
            .filter(file => file.endsWith('.md'))
            .map(file => path.join(this.inputDir, file));
          console.log(`🔍 Files từ readdir:`, files);
        } catch (err) {
          console.error(`❌ Lỗi đọc thư mục: ${err.message}`);
        }
      }
      
      if (files.length === 0) {
        console.log(`⚠️  Không tìm thấy file markdown nào trong thư mục: ${this.inputDir}`);
        return [];
      }

      console.log(`📚 Tìm thấy ${files.length} file markdown:`);
      files.forEach(file => console.log(`   - ${file}`));
      
      return files.sort(); // Sắp xếp theo tên file
    } catch (error) {
      console.error(`❌ Lỗi khi tìm file markdown: ${error.message}`);
      console.error(`❌ Stack trace:`, error.stack);
      return [];
    }
  }

  async readMarkdownFile(filePath) {
    try {
      // Đọc toàn bộ nội dung file
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath, '.md');
      
      // Kiểm tra nội dung file
      if (!content || content.trim().length === 0) {
        console.warn(`⚠️  File ${filePath} trống hoặc chỉ chứa khoảng trắng`);
      } else {
        console.log(`✅ Đã đọc file ${fileName} (${content.length} ký tự)`);
      }
      
      return {
        fileName,
        filePath,
        content: content || '' // Đảm bảo content không bao giờ là null
      };
    } catch (error) {
      console.error(`❌ Lỗi khi đọc file ${filePath}: ${error.message}`);
      return null;
    }
  }

  async processImagesInHtml(htmlContent) {
    console.log('🖼️  Đang xử lý hình ảnh trong HTML...');
    
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const images = document.querySelectorAll('img');
    let processedImageCount = 0;
    
    if (images.length > 0) {
      console.log(`🖼️  Tìm thấy ${images.length} hình ảnh`);
    }
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = img.getAttribute('src');
      
      if (!src) continue;
      
      try {
        // Convert relative paths to absolute paths
        let imagePath = src;
        if (!path.isAbsolute(src) && !src.startsWith('http')) {
          // Assume images are relative to the markdown directory or a common images directory
          const possiblePaths = [
            path.resolve('./image', src),
            path.resolve('./images', src),
            path.resolve('./markdown', src),
            path.resolve('.', src),
            path.resolve('./assets', src)
          ];
          
          for (const possiblePath of possiblePaths) {
            if (await fs.pathExists(possiblePath)) {
              imagePath = possiblePath;
              break;
            }
          }
        }
        
        if (src.startsWith('http')) {
          console.log(`⚠️  Bỏ qua hình ảnh online: ${src}`);
          continue;
        }
        
        if (await fs.pathExists(imagePath)) {
          const imageData = await fs.readFile(imagePath);
          const mimeType = mime.lookup(imagePath) || 'image/jpeg';
          
          // Convert to base64 and embed directly in HTML
          const base64Data = imageData.toString('base64');
          // Không log dữ liệu base64 ra console
          const dataUrl = `data:${mimeType};base64,[BASE64_DATA_HIDDEN]`;
          
          // Update src in HTML to use base64 data URL
          img.setAttribute('src', `data:${mimeType};base64,${base64Data}`);
          processedImageCount++;
          
          console.log(`   ✅ Đã embed hình ảnh: ${path.basename(imagePath)} (${(imageData.length/1024).toFixed(1)} KB)`);
        } else {
          console.log(`   ⚠️  Không tìm thấy hình ảnh: ${src}`);
          
          // Tạo thẻ div thông báo lỗi thay thế thẻ img
          const errorDiv = dom.window.document.createElement('div');
          errorDiv.className = 'image-error';
          errorDiv.style.border = '1px solid #ff6b6b';
          errorDiv.style.backgroundColor = '#ffe8e8';
          errorDiv.style.padding = '10px';
          errorDiv.style.textAlign = 'center';
          errorDiv.style.margin = '10px 0';
          errorDiv.style.borderRadius = '4px';
          errorDiv.style.fontFamily = 'Arial, sans-serif';
          
          // Thêm biểu tượng "X" và thông báo
          errorDiv.innerHTML = `
            <div style="font-size: 24px; color: #ff6b6b; font-weight: bold;">X</div>
            <div style="margin-top: 5px; font-size: 14px; color: #555;">
              Hình ảnh không tìm thấy: ${src}
            </div>
          `;
          
          // Thay thế thẻ img bằng thẻ div
          img.parentNode.replaceChild(errorDiv, img);
        }
      } catch (error) {
        console.error(`   ❌ Lỗi xử lý hình ảnh ${src}: ${error.message}`);
        
        // Tạo thẻ div thông báo lỗi thay thế thẻ img
        const errorDiv = dom.window.document.createElement('div');
        errorDiv.className = 'image-error';
        errorDiv.style.border = '1px solid #ff6b6b';
        errorDiv.style.backgroundColor = '#ffe8e8';
        errorDiv.style.padding = '10px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.margin = '10px 0';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.fontFamily = 'Arial, sans-serif';
        
        // Thêm biểu tượng "X" và thông báo lỗi
        errorDiv.innerHTML = `
          <div style="font-size: 24px; color: #ff6b6b; font-weight: bold;">X</div>
          <div style="margin-top: 5px; font-size: 14px; color: #555;">
            Lỗi xử lý hình ảnh: ${error.message}
          </div>
        `;
        
        // Thay thế thẻ img bằng thẻ div
        img.parentNode.replaceChild(errorDiv, img);
      }
    }
    
    if (processedImageCount > 0) {
      console.log(`🖼️  Đã xử lý thành công ${processedImageCount} hình ảnh`);
    }
    
    return dom.serialize();
  }

  markdownToHtml(markdown) {
    // Cấu hình marked để xử lý markdown đầy đủ hơn
    marked.setOptions({
      breaks: true,           // Chuyển đổi line breaks thành <br>
      gfm: true,             // GitHub Flavored Markdown
      headerIds: true,       // Tạo id cho các tiêu đề
      mangle: false,         // Không mã hóa các ký tự đặc biệt trong header ids
      sanitize: false,       // Không loại bỏ HTML
      smartLists: true,      // Danh sách thông minh
      smartypants: true,     // Chuyển đổi dấu ngoặc kép, dấu ba chấm, etc.
      xhtml: true,           // Tự đóng các thẻ rỗng theo chuẩn XHTML
      pedantic: false        // Không tuân theo nghiêm ngặt spec gốc của markdown
    });

    console.log(`📝 Xử lý nội dung markdown (${markdown.length} ký tự)`);
    const result = marked(markdown);
    console.log(`📝 Đã chuyển đổi thành HTML (${result.length} ký tự)`);
    
    return result;
  }

  async createChapterFromMarkdown(markdownData) {
    if (!markdownData) return null;

    console.log(`🔄 Đang xử lý chapter: ${markdownData.fileName}`);
    
    // Convert markdown to HTML first
    let html = this.markdownToHtml(markdownData.content);
    
    // Process images in HTML to convert to base64
    html = await this.processImagesInHtml(html);
    
    console.log(`✅ Hoàn thành chapter: ${markdownData.fileName}`);
    
    return {
      title: markdownData.fileName,
      content: html,
      filename: `${markdownData.fileName}.html`
    };
  }

  async convertToEpub() {
    try {
      console.log('🚀 Bắt đầu quá trình convert markdown sang EPUB...\n');

      // Tạo thư mục output nếu chưa tồn tại
      await fs.ensureDir(this.outputDir);

      // Tìm tất cả file markdown
      const markdownFiles = await this.findMarkdownFiles();
      
      if (markdownFiles.length === 0) {
        console.log('❌ Không có file markdown để convert!');
        return false;
      }

      // Đọc nội dung tất cả file markdown
      console.log('\n📖 Đang đọc nội dung các file markdown...');
      const markdownContents = await Promise.all(
        markdownFiles.map(file => this.readMarkdownFile(file))
      );

      // Chuyển đổi markdown thành HTML chapters
      console.log('🔄 Đang chuyển đổi markdown sang HTML...');
      const chapters = await Promise.all(
        markdownContents
          .filter(content => content !== null)
          .map(async (content, index) => {
            console.log(`🔄 Processing ${content.fileName}...`);  
            try {
              const chapter = await this.createChapterFromMarkdown(content);
              console.log(`✅ Created chapter: ${chapter ? chapter.title : 'null'}`);
              return chapter;
            } catch (err) {
              console.error(`❌ Error creating chapter from ${content.fileName}: ${err.message}`);
              return null;
            }
          })
      );

      const validChapters = chapters.filter(chapter => chapter !== null);

      console.log(`📊 Tạo được ${validChapters.length} chapters từ ${markdownContents.length} files`);

      if (validChapters.length === 0) {
        console.log('❌ Không thể tạo chapter nào từ file markdown!');
        return false;
      }

      // Tạo file HTML tổng hợp thay vì EPUB
      console.log('📝 Đang tạo file HTML tổng hợp...');
      console.log(`📝 Tạo file HTML: ${this.epubTitle}`);
      const htmlOutputPath = path.join(this.outputDir, `${this.epubTitle.replace(/[^a-zA-Z0-9]/g, '_')}.html`);
      
      const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.epubTitle}</title>
    <style>
      ${this.css}
    </style>
</head>
<body>
    <div class="book">
      <div class="title-page">
        <h1>${this.epubTitle}</h1>
        <p class="author">Tác giả: ${this.author}</p>
        <p class="publisher">Nhà xuất bản: ${this.publisher}</p>
      </div>
      
      <div class="table-of-contents">
        <h2>Mục lục</h2>
        <ul>
          ${validChapters.map((chapter, index) => `
            <li><a href="#chapter-${index + 1}">${chapter.title}</a></li>
          `).join('')}
        </ul>
      </div>
      
      <div class="content">
        ${validChapters.map((chapter, index) => `
          <section id="chapter-${index + 1}" class="chapter">
            <h1>${chapter.title}</h1>
            <div class="chapter-content">
              ${chapter.content}
            </div>
          </section>
        `).join('')}
      </div>
    </div>
</body>
</html>
      `;
      
      await fs.writeFile(htmlOutputPath, htmlContent, 'utf8');
      
      const stats = await fs.stat(htmlOutputPath);
      console.log(`✅ Đã tạo file HTML: ${htmlOutputPath}`);
      console.log(`📊 Kích thước: ${(stats.size / 1024).toFixed(1)} KB`);
      
      // Ghi chú cho người dùng
      console.log(`\n📝 Lưu ý: File HTML đã được tạo thành công!`);
      console.log(`   📄 Bạn có thể mở file HTML này bằng trình duyệt để xem nội dung`);
      console.log(`   🖼️  Tất cả hình ảnh đã được embed dưới dạng base64`);
      console.log(`   📚 Để convert thành EPUB, chạy: npm run to-epub`);
      
      return htmlOutputPath;
    } catch (error) {
      console.error(`❌ Lỗi trong quá trình convert: ${error.message}`);
      return false;
    }
  }
}

// Hàm main để chạy converter
async function main() {
  console.log('📚 MARKDOWN TO EPUB CONVERTER 📚\n');

  // Cấu hình converter
  const converter = new MarkdownToEpubConverter({
    inputDir: './markdown',           // Thư mục chứa file markdown
    outputDir: './output',            // Thư mục output
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Self Published'
  });

  // Thực hiện convert
  const result = await converter.convertToEpub();
  
  if (result) {
    console.log('\n🎉 Hoàn thành quá trình convert!');
    console.log(`📄 File đã được tạo: ${result}`);
  } else {
    console.log('\n❌ Quá trình convert thất bại!');
    process.exit(1);
  }
}

// Chạy nếu file này được execute trực tiếp
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}

export default MarkdownToEpubConverter;