const fs = require('fs-extra');
const path = require('path');
const { JSDOM } = require('jsdom');
const mime = require('mime-types');
const EpubGen = require('epub-gen-memory').default || require('epub-gen-memory');

class HtmlToEpubConverter {
  constructor(options = {}) {
    this.inputHtmlPath = options.inputHtmlPath || './output/clean code.html';
    this.outputDir = options.outputDir || './output';
    this.epubTitle = options.title || 'Tập hợp tài liệu Markdown';
    this.author = options.author || 'Tác giả';
    this.publisher = options.publisher || 'Self Published';
    this.language = options.language || 'vi';
    this.images = new Map(); // Store images with their data
  }

  async readHtmlFile() {
    try {
      console.log(`📖 Đang đọc file HTML: ${this.inputHtmlPath}`);
      
      if (!await fs.pathExists(this.inputHtmlPath)) {
        throw new Error(`File HTML không tồn tại: ${this.inputHtmlPath}`);
      }
      
      const htmlContent = await fs.readFile(this.inputHtmlPath, 'utf8');
      console.log(`✅ Đã đọc file HTML (${htmlContent.length} ký tự)`);
      
      return htmlContent;
    } catch (error) {
      console.error(`❌ Lỗi khi đọc file HTML: ${error.message}`);
      throw error;
    }
  }

  async processImages(htmlContent) {
    console.log('🖼️  Đang xử lý hình ảnh...');
    
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const images = document.querySelectorAll('img');
    
    console.log(`🖼️  Tìm thấy ${images.length} hình ảnh`);
    
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
            path.resolve(path.dirname(this.inputHtmlPath), src),
            path.resolve('./markdown', src),
            path.resolve('./images', src),
            path.resolve('./image', src),
            path.resolve('.', src)
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
          const fileName = `image_${i + 1}${path.extname(imagePath)}`;
          
          this.images.set(fileName, {
            data: imageData,
            mimeType: mimeType
          });
          
          // Update src in HTML to reference the embedded image
          img.setAttribute('src', fileName);
          
          console.log(`✅ Đã xử lý hình ảnh: ${path.basename(imagePath)} -> ${fileName}`);
        } else {
          console.log(`⚠️  Không tìm thấy hình ảnh: ${src}`);
          // Remove broken image
          img.remove();
        }
      } catch (error) {
        console.error(`❌ Lỗi xử lý hình ảnh ${src}: ${error.message}`);
        img.remove();
      }
    }
    
    return dom.serialize();
  }

  parseHtmlToChapters(htmlContent) {
    console.log('📄 Đang phân tích HTML thành chapters...');
    
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Extract metadata
    const titleElement = document.querySelector('.title-page h1');
    if (titleElement) {
      this.epubTitle = titleElement.textContent.trim();
    }
    
    const authorElement = document.querySelector('.title-page .author');
    if (authorElement) {
      this.author = authorElement.textContent.replace('Tác giả:', '').trim();
    }
    
    // Extract chapters
    const chapters = [];
    const chapterSections = document.querySelectorAll('.chapter');
    
    console.log(`📚 Tìm thấy ${chapterSections.length} chapters`);
    
    chapterSections.forEach((section, index) => {
      const titleElement = section.querySelector('h1');
      const contentDiv = section.querySelector('.chapter-content');
      
      if (titleElement && contentDiv) {
        const title = titleElement.textContent.trim();
        const content = contentDiv.innerHTML;
        
        chapters.push({
          title: title,
          content: `<h1>${title}</h1>${content}`,
          filename: `chapter_${index + 1}.html`
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
      let htmlContent = await this.readHtmlFile();
      
      // Process images
      htmlContent = await this.processImages(htmlContent);
      
      // Parse HTML to chapters
      const chapters = this.parseHtmlToChapters(htmlContent);
      
      if (chapters.length === 0) {
        throw new Error('Không tìm thấy chapters nào trong file HTML');
      }
      
      console.log(`📊 Debug: chapters array có ${chapters.length} items`);
      console.log(`📊 Debug: chapters[0]:`, chapters[0] ? Object.keys(chapters[0]) : 'undefined');
      
      // Prepare EPUB options
      const epubOptions = {
        title: this.epubTitle,
        author: this.author,
        publisher: this.publisher,
        content: chapters,
        css: `
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            font-weight: 400;
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
            font-weight: 700;
            margin-top: 2em;
          }
          
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1.5em auto;
          }
          
          code {
            background-color: #f8f9fa;
            padding: 3px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          
          pre {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            border-left: 4px solid #007bff;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5em 0;
          }
          
          th, td {
            border: 1px solid #dee2e6;
            padding: 12px 16px;
            text-align: left;
          }
        `,
        verbose: false
      };
      
      // Add images to EPUB
      if (this.images.size > 0) {
        epubOptions.images = Array.from(this.images.entries()).map(([filename, imageData]) => ({
          filename: filename,
          data: imageData.data,
          mediaType: imageData.mimeType
        }));
        console.log(`🖼️  Đã thêm ${this.images.size} hình ảnh vào EPUB`);
      }
      
      // Generate EPUB
      const outputPath = path.join(this.outputDir, `${this.epubTitle.replace(/[^a-zA-Z0-9\s]/g, '_')}.epub`);
      
      console.log('📝 Đang tạo file EPUB...');
      console.log(`📁 Output path: ${outputPath}`);
      
      const epubBuffer = await EpubGen(epubOptions);
      await fs.writeFile(outputPath, epubBuffer);
      
      console.log(`\n✅ Đã tạo thành công file EPUB:`);
      console.log(`   📄 File: ${outputPath}`);
      console.log(`   📚 Số chapters: ${chapters.length}`);
      console.log(`   📖 Tên sách: ${this.epubTitle}`);
      console.log(`   👤 Tác giả: ${this.author}`);
      console.log(`   🖼️  Số hình ảnh: ${this.images.size}`);
      
      return outputPath;
      
    } catch (error) {
      console.error(`❌ Lỗi trong quá trình convert: ${error.message}`);
      console.error(`❌ Stack trace:`, error.stack);
      return false;
    }
  }
}

// Main function
async function main() {
  console.log('📚 HTML TO EPUB CONVERTER 📚\n');
  
  const converter = new HtmlToEpubConverter({
    inputHtmlPath: './output/clean code.html',
    outputDir: './output',
    title: 'Clean Code - Tập hợp tài liệu',
    author: 'Tác giả',
    publisher: 'Self Published'
  });
  
  const result = await converter.convertToEpub();
  
  if (result) {
    console.log('\n✅ Hoàn thành convert HTML thành EPUB!');
    console.log(`📄 File EPUB: ${result}`);
  } else {
    console.log('\n❌ Convert thất bại!');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = HtmlToEpubConverter; 