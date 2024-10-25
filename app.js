const express = require('express');
const multer = require('multer');
const clamd = require('clamdjs');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
const clamdScanner = clamd.createScanner('localhost', 3310);

app.use(express.static('public'));

const allowedFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const maxFileSize = 16 * 1024 * 1024; // 16 MB

app.post('/upload', upload.single('file'), async(req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    if (!allowedFileTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        return res.status(400).send('Invalid file type.');
    }

    if (file.size > maxFileSize) {
        fs.unlinkSync(file.path);
        return res.status(400).send('File size exceeds limit.');
    }

    try {
        const result = await clamdScanner.scanFile(file.path);
        if (result.includes('FOUND')) {
            fs.unlinkSync(file.path);
            return res.status(400).send('Virus detected.');
        }

        const securePath = path.join(__dirname, 'secure_uploads', file.filename);
        fs.renameSync(file.path, securePath);
        res.send('File successfully uploaded and scanned.');
    } catch (error) {
        fs.unlinkSync(file.path);
        res.status(500).send('Error scanning file.');
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});