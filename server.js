const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// DDoS Protection Configuration
const requestCounts = new Map();
const RATE_LIMIT = 100; // максимум запитів
const TIME_WINDOW = 60000; // за 60 секунд
const BLOCK_DURATION = 300000; // блокування на 5 хвилин
const blockedIPs = new Map();

// MIME Types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Rate Limiting Middleware
function rateLimiter(ip) {
    const now = Date.now();
    
    // Перевірка чи IP заблоковано
    if (blockedIPs.has(ip)) {
        const blockTime = blockedIPs.get(ip);
        if (now - blockTime < BLOCK_DURATION) {
            return false;
        } else {
            blockedIPs.delete(ip);
        }
    }
    
    // Отримання або створення запису для IP
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, {
            count: 1,
            startTime: now
        });
        return true;
    }
    
    const record = requestCounts.get(ip);
    
    // Перевірка часового вікна
    if (now - record.startTime > TIME_WINDOW) {
        record.count = 1;
        record.startTime = now;
        return true;
    }
    
    // Інкремент лічильника
    record.count++;
    
    // Перевірка ліміту
    if (record.count > RATE_LIMIT) {
        console.log(`\x1b[31m⚠️  DDoS спроба з IP: ${ip}. Заблоковано на 5 хвилин.\x1b[0m`);
        blockedIPs.set(ip, now);
        return false;
    }
    
    return true;
}

// Очищення старих записів кожні 10 хвилин
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts.entries()) {
        if (now - record.startTime > TIME_WINDOW) {
            requestCounts.delete(ip);
        }
    }
    
    for (const [ip, blockTime] of blockedIPs.entries()) {
        if (now - blockTime > BLOCK_DURATION) {
            blockedIPs.delete(ip);
        }
    }
}, 600000);

// Security Headers
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:;");
}

const server = http.createServer((req, res) => {
    // Отримання IP клієнта
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress;
    
    // Перевірка rate limit
    if (!rateLimiter(ip)) {
        res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>429 - Занадто багато запитів</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        color: white;
                    }
                    .error-container {
                        text-align: center;
                        padding: 40px;
                        background: rgba(0, 0, 0, 0.5);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                    }
                    h1 { font-size: 72px; margin: 0; }
                    p { font-size: 20px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>429</h1>
                    <p>⚠️ Занадто багато запитів</p>
                    <p style="font-size: 16px; opacity: 0.8;">Спробуйте пізніше через 5 хвилин</p>
                </div>
            </body>
            </html>
        `);
        return;
    }
    
    // Додавання security headers
    setSecurityHeaders(res);
    
    // Strip query string / hash so "style.css?v=2" resolves correctly
    const urlPath = req.url.split('?')[0].split('#')[0];

    let filePath = '.' + urlPath;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Захист від directory traversal
    const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    const extname = String(path.extname(safePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(safePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>404 - Сторінку не знайдено</title>
                        <style>
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                margin: 0;
                                color: white;
                            }
                            .error-container {
                                text-align: center;
                                padding: 40px;
                                background: rgba(0, 0, 0, 0.5);
                                border-radius: 20px;
                                backdrop-filter: blur(10px);
                            }
                            h1 { font-size: 72px; margin: 0; }
                            p { font-size: 20px; margin-top: 20px; }
                            a {
                                display: inline-block;
                                margin-top: 20px;
                                padding: 12px 30px;
                                background: white;
                                color: #667eea;
                                text-decoration: none;
                                border-radius: 50px;
                                font-weight: 600;
                                transition: transform 0.3s;
                            }
                            a:hover { transform: translateY(-2px); }
                        </style>
                    </head>
                    <body>
                        <div class="error-container">
                            <h1>404</h1>
                            <p>😕 Сторінку не знайдено</p>
                            <a href="/">Повернутися на головну</a>
                        </div>
                    </body>
                    </html>
                `, 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Помилка сервера: ' + error.code, 'utf-8');
            }
        } else {
            // HTML must always be revalidated so site updates aren't hidden
            // from returning visitors for a year; static assets can be cached hard.
            const isHTML = extname === '.html';
            const cacheControl = isHTML
                ? 'no-cache, must-revalidate'
                : 'public, max-age=31536000, immutable';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': cacheControl
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', '╔═══════════════════════════════════════════════════╗');
    console.log('\x1b[36m%s\x1b[0m', '║                                                   ║');
    console.log('\x1b[35m%s\x1b[0m', '║        🚀 VibeWeb Studio Server Running          ║');
    console.log('\x1b[36m%s\x1b[0m', '║                                                   ║');
    console.log('\x1b[36m%s\x1b[0m', '╚═══════════════════════════════════════════════════╝');
    console.log('');
    console.log('\x1b[32m%s\x1b[0m', `✓ Сервер запущено на http://localhost:${PORT}`);
    console.log('\x1b[33m%s\x1b[0m', '✓ Відкрийте браузер і перейдіть за адресою:');
    console.log('\x1b[1m%s\x1b[0m', `  http://localhost:${PORT}`);
    console.log('');
    console.log('\x1b[32m%s\x1b[0m', '🛡️  DDoS захист активовано');
    console.log('\x1b[32m%s\x1b[0m', `   └─ Ліміт: ${RATE_LIMIT} запитів за ${TIME_WINDOW / 1000} секунд`);
    console.log('\x1b[32m%s\x1b[0m', `   └─ Блокування: ${BLOCK_DURATION / 60000} хвилин`);
    console.log('');
    console.log('\x1b[90m%s\x1b[0m', '  Натисніть Ctrl+C щоб зупинити сервер');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n\x1b[33m%s\x1b[0m', '⚠️  Отримано SIGTERM. Закриваємо сервер...');
    server.close(() => {
        console.log('\x1b[32m%s\x1b[0m', '✓ Сервер успішно зупинено');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n\x1b[33m%s\x1b[0m', '⚠️  Отримано SIGINT. Закриваємо сервер...');
    server.close(() => {
        console.log('\x1b[32m%s\x1b[0m', '✓ Сервер успішно зупинено');
        process.exit(0);
    });
});
