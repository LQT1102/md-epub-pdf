import fs from 'fs-extra';
import path from 'path';
import { EPub } from '@lesjoursfr/html-to-epub';
import { JSDOM } from 'jsdom';
import metadata from './metadata.js';

/**
 * Làm sạch nội dung HTML để tránh lỗi XML trong EPUB
 * @param {string} html - Nội dung HTML cần làm sạch
 * @returns {string} - Nội dung HTML đã được làm sạch
 */
function sanitizeHtml(html) {
  // Chỉ xử lý ký tự & không nằm trong entity refs
  let sanitized = html.replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;');
  
  return sanitized;
}

/**
 * Chuyển đổi file HTML thành EPUB sử dụng thư viện @lesjoursfr/html-to-epub
 */
async function convertHtmlToEpub() {
  try {
    console.log('🚀 Bắt đầu chuyển đổi HTML sang EPUB...');
    
    // Thư mục đầu ra
    const outputDir = './output';
    await fs.ensureDir(outputDir);
    
    // Tìm file HTML trong thư mục output
    const files = await fs.readdir(outputDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      console.log('❌ Không tìm thấy file HTML nào trong thư mục output!');
      console.log('🔍 Hãy chạy "npm run html" trước để tạo file HTML.');
      return;
    }
    
    // Lấy file HTML đầu tiên
    const htmlFilePath = path.join(outputDir, htmlFiles[0]);
    console.log(`📄 Tìm thấy file HTML: ${htmlFilePath}`);
    
    // Đọc nội dung file HTML
    const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
    
    // Tạo tên file EPUB dựa trên tên file HTML
    const epubFileName = path.basename(htmlFilePath, '.html') + '.epub';
    const epubFilePath = path.join(outputDir, epubFileName);
    
    // Phân tích HTML để lấy thông tin
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Lấy tiêu đề từ thẻ title hoặc từ metadata
    const title = document.querySelector('title')?.textContent || metadata.title || 'Ebook';
    
    // Lấy các chương từ các phần trong HTML
    const chapters = [];
    const sections = document.querySelectorAll('section.chapter');
    
    console.log(`📚 Đang xử lý ${sections.length} chương...`);
    
    if (sections.length === 0) {
      // Nếu không tìm thấy thẻ section, sử dụng toàn bộ body làm một chương
      console.log('⚠️ Không tìm thấy cấu trúc chương trong HTML, sử dụng toàn bộ nội dung làm một chương.');
      
      // Lấy nội dung của body
      const bodyContent = document.querySelector('body')?.innerHTML || htmlContent;
      const styleContent = document.querySelector('style')?.innerHTML || '';
      
      // Tạo XHTML hợp lệ cho EPUB
      const xhtml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
        <head>
          <meta charset="UTF-8" />
          <title>${title}</title>
          <style>
            ${sanitizeHtml(styleContent)}
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${sanitizeHtml(bodyContent)}
        </body>
        </html>
      `;
      
      chapters.push({
        title: title,
        data: xhtml
      });
    } else {
        // Xử lý từng chương
      sections.forEach((section, index) => {
        const chapterTitle = section.querySelector('h1')?.textContent || `Chương ${index + 1}`;
        // Đọc và xử lý nội dung của chương
        const chapterContent = section.innerHTML;
        // Lấy style nếu có
        const styleContent = document.querySelector('style')?.innerHTML || '';
        
        // Tạo XHTML hợp lệ cho EPUB
        const xhtml = `
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE html>
          <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
          <head>
            <meta charset="UTF-8" />
            <title>${chapterTitle}</title>
            <style>
              ${sanitizeHtml(styleContent)}
            </style>
          </head>
          <body>
            <h1>${chapterTitle}</h1>
            ${sanitizeHtml(chapterContent)}
          </body>
          </html>
        `;
        
        chapters.push({
          title: chapterTitle,
          data: xhtml
        });
        
        console.log(`  ✅ Đã xử lý chương: ${chapterTitle}`);
      });
    }
    
    // Tạo instance của EPub với thông tin cơ bản
    const options = {
      title: title,
      author: metadata.author || 'Anonymous',
      publisher: metadata.publisher || 'Self Published',
      cover: metadata.cover || null,
      lang: 'vi',
      tocTitle: 'Mục lục',
      appendChapterTitles: true, // Thêm tiêu đề chương vào mục lục
      hideToC: false           // Đảm bảo hiển thị mục lục
    };
    
    // Tạo mảng chương để thêm vào content
    const content = [];
    for (const [index, chapter] of chapters.entries()) {
      content.push({
        title: chapter.title,
        data: chapter.data,
        filename: `chapter-${index+1}.xhtml`,
        excludeFromToc: false,  // đảm bảo chương xuất hiện trong mục lục
        beforeToc: false       // đặt sau mục lục
      });
    }
    
    // Thêm content vào options
    options.content = content;
    
    console.log('📦 Đang đóng gói EPUB...');
    
    // Log thông tin trước khi tạo EPUB để debug
    console.log(`Tổng số chương được thêm: ${options.content.length}`);
    
    // Tạo instance của EPub và render
    try {
      const epub = new EPub(options, epubFilePath);
      await epub.render();
    } catch (error) {
      console.error(`Lỗi khi tạo EPUB: ${error.message}`);
      // Hiển thị thông tin chi tiết về options để debug
      console.log('Options:', JSON.stringify(options, null, 2));
      throw error;
    }
    
    const stats = await fs.stat(epubFilePath);
    console.log(`✅ Đã tạo file EPUB: ${epubFilePath}`);
    console.log(`📊 Kích thước: ${(stats.size / 1024).toFixed(1)} KB`);
    
    console.log('\n🎉 Chuyển đổi HTML sang EPUB thành công!');
    
  } catch (error) {
    console.error(`❌ Lỗi trong quá trình chuyển đổi: ${error.message}`);
    console.error(error.stack);
  }
}

// Chạy chương trình
convertHtmlToEpub().catch(console.error);

// Export function để có thể import từ file khác
export default convertHtmlToEpub;
