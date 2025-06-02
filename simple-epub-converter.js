const fs = require('fs-extra');
const path = require('path');
const { JSDOM } = require('jsdom');
const mime = require('mime-types');
const Epub = require('epub-gen');

class SimpleEpubConverter {
  constructor(options = {}) {
    this.inputHtmlPath = options.inputHtmlPath || './output/Clean_Code.html';
    this.outputDir = options.outputDir || './output';
    this.epubTitle = options.title || 'Clean Code - Tập hợp tài liệu';
    this.author = options.author || 'Robert C. Martin';
    this.publisher = options.publisher || 'Self Published';
    this.images = new Map(); // Store images with their data
  }

  async readHtmlFile() {
    try {
      console.log(`📖 Đang đọc file HTML: ${this.inputHtmlPath}`);
      
      if (!await fs.pathExists(this.inputHtmlPath)) {
        throw new Error(`File HTML không tồn tại: ${this.inputHtmlPath}`);
      }
      
      const htmlContent = await fs.readFile(this.inputHtmlPath, 'utf8');
      console.log(`✅ Đã đọc file HTML (${(htmlContent.length/1024).toFixed(1)} KB)`);
      
      return htmlContent;
    } catch (error) {
      console.error(`❌ Lỗi khi đọc file HTML: ${error.message}`);
      throw error;
    }
  }

  parseHtmlToChapters(htmlContent) {
    console.log('📄 Đang phân tích HTML thành chapters...');
    
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Extract chapters
    const chapters = [];
    const chapterSections = document.querySelectorAll('.chapter');
    
    console.log(`📚 Tìm thấy ${chapterSections.length} chapters`);
    
    chapterSections.forEach((section, index) => {
      const titleElement = section.querySelector('h1');
      const contentDiv = section.querySelector('.chapter-content');
      
      if (titleElement && contentDiv) {
        const title = titleElement.textContent.trim();
        let content = contentDiv.innerHTML;
        
        // Hình ảnh đã được convert thành base64 từ bước trước, giữ nguyên
        chapters.push({
          title: title,
          data: content
        });
        
        console.log(`✅ Chapter ${index + 1}: ${title}`);
      }
    });
    
    return chapters;
  }

  async convertToEpub() {
    try {
      console.log('🚀 Bắt đầu convert HTML thành EPUB...\n');
      
      // Read HTML file
      const htmlContent = await this.readHtmlFile();
      
      // Parse HTML to chapters (hình ảnh đã được xử lý thành base64 từ bước trước)
      console.log('📚 HTML đã có hình ảnh dạng base64, đang parse thành chapters...');
      const chapters = this.parseHtmlToChapters(htmlContent);
      
      if (chapters.length === 0) {
        throw new Error('Không tìm thấy chapters nào trong file HTML');
      }
      
      // Prepare output path
      const outputFileName = `${this.epubTitle.replace(/[^a-zA-Z0-9\s]/g, '_')}.epub`;
      const outputPath = path.join(this.outputDir, outputFileName);
      
      // Prepare EPUB options
      const epubOptions = {
        title: this.epubTitle,
        author: this.author,
        publisher: this.publisher,
        cover: null,
        content: chapters,
        css: `
          body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: bold;
          }
          
          h1 { 
            font-size: 2em; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 10px;
            page-break-before: always;
          }
          
          h2 { 
            font-size: 1.5em;
            color: #495057;
          }
          
          p { 
            margin-bottom: 1em; 
            line-height: 1.7;
          }
          
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1.5em auto;
            border-radius: 4px;
          }
          
          code {
            background-color: #f8f9fa;
            padding: 3px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          
          pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            margin: 1em 0;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          
          blockquote {
            border-left: 4px solid #bdc3c7;
            margin: 1em 0;
            padding-left: 15px;
            color: #7f8c8d;
            font-style: italic;
          }
        `,
        verbose: false
      };
      
      console.log('📝 Đang tạo file EPUB...');
      console.log(`📁 Output path: ${outputPath}`);
      
      // Generate EPUB using callback approach
      await new Promise((resolve, reject) => {
        new Epub(epubOptions, outputPath).promise.then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
      });
      
      // Check if file was created
      if (await fs.pathExists(outputPath)) {
        const stats = await fs.stat(outputPath);
        console.log(`\n✅ Đã tạo thành công file EPUB:`);
        console.log(`   📄 File: ${outputPath}`);
        console.log(`   📊 Kích thước: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   📚 Số chapters: ${chapters.length}`);
        console.log(`   🖼️  Hình ảnh: đã embed base64 từ HTML`);
        console.log(`   📖 Tên sách: ${this.epubTitle}`);
        console.log(`   👤 Tác giả: ${this.author}`);
        
        return outputPath;
      } else {
        throw new Error('File EPUB không được tạo ra');
      }
      
    } catch (error) {
      console.error(`❌ Lỗi trong quá trình convert: ${error.message}`);
      console.error(`❌ Stack trace:`, error.stack);
      return false;
    }
  }
}

// Main function
async function main() {
  console.log('📚 SIMPLE HTML TO EPUB CONVERTER 📚\n');
  
  const converter = new SimpleEpubConverter({
    inputHtmlPath: "./output/Clean_Code.html",
    outputDir: "./output",
    title: "Clean Code - Tập hợp tài liệu",
    author: "Robert C. Martin",
    publisher: "Self Published",
  });
  
  const result = await converter.convertToEpub();
  
  if (result) {
    console.log('\n🎉 Hoàn thành convert HTML thành EPUB!');
    console.log(`📄 File EPUB: ${result}`);
    console.log('\n📝 Lưu ý:');
    console.log('   📱 Bạn có thể đọc file EPUB bằng các ứng dụng như:');
    console.log('   - Calibre (miễn phí, đa nền tảng)');
    console.log('   - Adobe Digital Editions');
    console.log('   - Apple Books (macOS/iOS)');
    console.log('   - Google Play Books');
    console.log('   - FBReader');
  } else {
    console.log('\n❌ Convert thất bại!');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleEpubConverter; 