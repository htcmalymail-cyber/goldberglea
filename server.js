const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Создаём папку uploads, если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Настройка хранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 МБ максимум
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname)); // Для HTML и CSS
app.use('/uploads', express.static(uploadsDir)); // Доступ к файлам

// Файл для хранения данных
const dataFile = path.join(__dirname, 'data.json');

// Загрузка данных
function loadData() {
    if (fs.existsSync(dataFile)) {
        try {
            return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        } catch(e) { return getDefaultData(); }
    }
    return getDefaultData();
}

function getDefaultData() {
    return {
        payments: [
            { id: 'p1', payer: 'רונית כהן (דירה 4)', month: '2025-04', amount: 4300 },
            { id: 'p2', payer: 'דוד לוי (דירה 9)', month: '2025-04', amount: 3900 },
            { id: 'p3', payer: 'רונית כהן (דירה 4)', month: '2025-03', amount: 4200 },
            { id: 'p4', payer: 'דוד לוי (דירה 9)', month: '2025-03', amount: 3800 }
        ],
        expenses: [
            { id: 'e1', desc: 'תיקון מעלית', amount: 8200, month: '2025-04', fileName: '', filePath: '' },
            { id: 'e2', desc: 'חשמל חדר מדרגות', amount: 1900, month: '2025-04', fileName: '', filePath: '' }
        ],
        forum: [
            { id: 'f1', author: 'מיכל (דירה 12)', text: 'השקיפות פה מדהימה! תודה על הניהול 🙏', timestamp: new Date().toISOString() }
        ],
        suggestions: [
            { id: 's1', author: 'דירה 3', title: 'גינה קהילתית עם נדנדות', up: 9, down: 2 }
        ],
        monthlyDueSettings: { "2025-03": 50, "2025-04": 50, "2025-05": 50 }
    };
}

function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

// API endpoints
app.get('/api/data', (req, res) => {
    res.json(loadData());
});

app.post('/api/data', (req, res) => {
    saveData(req.body);
    res.json({ success: true });
});

// Загрузка файла
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
        success: true, 
        fileName: req.file.filename,
        filePath: `/uploads/${req.file.filename}`
    });
});

// Удаление файла
app.post('/api/delete-file', (req, res) => {
    const { filePath } = req.body;
    if (filePath) {
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Uploads folder: ${uploadsDir}`);
});