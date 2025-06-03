// Khởi tạo các biến
let markdownFiles = [];
let htmlFiles = [];
let epubFiles = [];
let metadata = {
    title: '',
    author: '',
    publisher: ''
};

// DOM Elements
const markdownFilesContainer = document.getElementById('markdown-files-container');
const htmlFilesContainer = document.getElementById('html-files-container');
const epubFilesContainer = document.getElementById('epub-files-container');
const convertToHtmlBtn = document.getElementById('convert-to-html-btn');
const convertToEpubBtn = document.getElementById('convert-to-epub-btn');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const publisherInput = document.getElementById('publisher');
const notificationToast = document.getElementById('notification-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');

// Khởi tạo toast Bootstrap
const toast = new bootstrap.Toast(notificationToast);

// Hàm hiển thị thông báo
function showNotification(title, message, type = 'info') {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Xóa tất cả các class cũ
    notificationToast.classList.remove('bg-success', 'bg-danger', 'bg-info');
    
    // Thêm class dựa trên loại thông báo
    if (type === 'success') {
        notificationToast.classList.add('bg-success', 'text-white');
    } else if (type === 'error') {
        notificationToast.classList.add('bg-danger', 'text-white');
    } else {
        notificationToast.classList.add('bg-info', 'text-white');
    }
    
    toast.show();
}

// Hàm tải danh sách file
async function fetchFiles() {
    try {
        markdownFilesContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></div>';
        htmlFilesContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Đang tải...</span></div></div>';
        epubFilesContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-info" role="status"><span class="visually-hidden">Đang tải...</span></div></div>';
        
        const response = await fetch('/api/files');
        const data = await response.json();
        
        markdownFiles = data.markdownFiles;
        htmlFiles = data.htmlFiles;
        epubFiles = data.epubFiles;
        metadata = data.metadata;
        
        // Điền dữ liệu vào form
        titleInput.value = metadata.title;
        authorInput.value = metadata.author;
        publisherInput.value = metadata.publisher;
        
        // Hiển thị danh sách file
        renderFileList();
        
    } catch (error) {
        console.error('Lỗi khi tải danh sách file:', error);
        showNotification('Lỗi', 'Không thể tải danh sách file. Vui lòng thử lại sau.', 'error');
    }
}

// Hàm hiển thị danh sách file
function renderFileList() {
    // Hiển thị file Markdown
    if (markdownFiles.length > 0) {
        markdownFilesContainer.innerHTML = `
            <div class="file-list">
                ${markdownFiles.map(file => `
                    <div class="file-item">
                        <span><i class="bi bi-markdown-fill"></i> ${file}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        markdownFilesContainer.innerHTML = `
            <div class="empty-message">
                <i class="bi bi-exclamation-circle"></i>
                <p>Không có file Markdown nào.</p>
                <p>Hãy thêm file .md vào thư mục "markdown/"</p>
            </div>
        `;
    }
    
    // Hiển thị file HTML
    if (htmlFiles.length > 0) {
        htmlFilesContainer.innerHTML = `
            <div class="file-list">
                ${htmlFiles.map(file => `
                    <div class="file-item">
                        <span><i class="bi bi-filetype-html"></i> ${file}</span>
                        <div class="actions">
                            <button class="btn-download" onclick="downloadFile('${file}')">
                                <i class="bi bi-download"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        htmlFilesContainer.innerHTML = `
            <div class="empty-message">
                <i class="bi bi-exclamation-circle"></i>
                <p>Chưa có file HTML nào được tạo.</p>
                <p>Hãy nhấn nút "Chuyển đổi sang HTML"</p>
            </div>
        `;
    }
    
    // Hiển thị file EPUB
    if (epubFiles.length > 0) {
        epubFilesContainer.innerHTML = `
            <div class="file-list">
                ${epubFiles.map(file => `
                    <div class="file-item">
                        <span><i class="bi bi-book-fill"></i> ${file}</span>
                        <div class="actions">
                            <button class="btn-download" onclick="downloadFile('${file}')">
                                <i class="bi bi-download"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        epubFilesContainer.innerHTML = `
            <div class="empty-message">
                <i class="bi bi-exclamation-circle"></i>
                <p>Chưa có file EPUB nào được tạo.</p>
                <p>Hãy nhấn nút "Chuyển đổi sang EPUB"</p>
            </div>
        `;
    }
}

// Hàm tải file
function downloadFile(filename) {
    window.location.href = `/download/${filename}`;
}

// Hàm chuyển đổi sang HTML
async function convertToHtml() {
    try {
        // Hiển thị loading
        convertToHtmlBtn.classList.add('loading');
        convertToHtmlBtn.disabled = true;
        
        const formData = {
            title: titleInput.value || metadata.title,
            author: authorInput.value || metadata.author,
            publisher: publisherInput.value || metadata.publisher
        };
        
        const response = await fetch('/convert-to-html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Thành công', result.message, 'success');
            // Tải lại danh sách file
            fetchFiles();
        } else {
            showNotification('Lỗi', result.message, 'error');
        }
        
    } catch (error) {
        console.error('Lỗi khi chuyển đổi sang HTML:', error);
        showNotification('Lỗi', 'Không thể chuyển đổi sang HTML. Vui lòng thử lại sau.', 'error');
    } finally {
        // Bỏ loading
        convertToHtmlBtn.classList.remove('loading');
        convertToHtmlBtn.disabled = false;
    }
}

// Hàm chuyển đổi sang EPUB
async function convertToEpub() {
    try {
        // Hiển thị loading
        convertToEpubBtn.classList.add('loading');
        convertToEpubBtn.disabled = true;
        
        const response = await fetch('/convert-to-epub', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Thành công', result.message, 'success');
            // Tải lại danh sách file
            fetchFiles();
        } else {
            showNotification('Lỗi', result.message, 'error');
        }
        
    } catch (error) {
        console.error('Lỗi khi chuyển đổi sang EPUB:', error);
        showNotification('Lỗi', 'Không thể chuyển đổi sang EPUB. Vui lòng thử lại sau.', 'error');
    } finally {
        // Bỏ loading
        convertToEpubBtn.classList.remove('loading');
        convertToEpubBtn.disabled = false;
    }
}

// Sự kiện
convertToHtmlBtn.addEventListener('click', convertToHtml);
convertToEpubBtn.addEventListener('click', convertToEpub);

// Đưa hàm downloadFile vào global scope để có thể gọi từ HTML
window.downloadFile = downloadFile;

// Tải danh sách file khi trang được tải
document.addEventListener('DOMContentLoaded', fetchFiles);
