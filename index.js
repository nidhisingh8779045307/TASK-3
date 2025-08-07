const express = require('express');
const fs = require('fs');
const books = require('./MOCK_DATA.json'); 
const app = express();
const PORT = 8000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); 

// Logger middleware
app.use((req, res, next) => {
    fs.appendFile('log.txt', `${Date.now()}: ${req.method} ${req.path}\n`, (err) => {
        if (err) console.error('Logging error:', err);
        next();
    });
});

// Render book titles in HTML
app.get('/books', (req, res) => {
    const html = `
    <ul>
      ${books.map(book => `<li>${book.title} by ${book.author}</li>`).join('')}
    </ul>
    `;
    res.send(html);
});

// REST API: Get all books
app.get('/api/books', (req, res) => {
    return res.json(books);
});

// REST API: Get, update, delete a book by ID
app.route('/api/books/:id')
    .get((req, res) => {
        const id = Number(req.params.id);
        const book = books.find(book => book.id === id);
        if (!book) return res.status(404).json({ error: 'Book not found' });
        return res.json(book);
    })
    .put((req, res) => {
        const id = Number(req.params.id);
        const index = books.findIndex(book => book.id === id);
        if (index === -1) return res.status(404).json({ error: 'Book not found' });

        books[index] = { ...books[index], ...req.body };
        fs.writeFile('./MOCK_DATA.json', JSON.stringify(books, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Failed to update book' });
            return res.json({ status: 'Book updated', book: books[index] });
        });
    })
    .delete((req, res) => {
        const id = Number(req.params.id);
        const index = books.findIndex(book => book.id === id);
        if (index === -1) return res.status(404).json({ error: 'Book not found' });

        books.splice(index, 1);
        fs.writeFile('./MOCK_DATA.json', JSON.stringify(books, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Failed to delete book' });
            return res.json({ status: 'Book deleted' });
        });
    });

// REST API: Create a new book
app.post('/api/books', (req, res) => {
    const body = req.body;

    if (!body.title || !body.author || !body.year) {
        return res.status(400).json({ error: 'Missing book title, author or year' });
    }

    const newBook = {
        id: books.length ? books[books.length - 1].id + 1 : 1,
        ...body
    };

    books.push(newBook);

    fs.writeFile('./MOCK_DATA.json', JSON.stringify(books, null, 2), err => {
        if (err) return res.status(500).json({ error: 'Failed to save book' });
        return res.status(201).json({ status: 'Book created', book: newBook });
    });
});

// Start the server
app.listen(PORT, () => console.log(`📚 Book API running at http://localhost:${PORT}`));
