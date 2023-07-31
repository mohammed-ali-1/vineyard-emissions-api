const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const SECRET_KEY = 'Your-Secret-Key'; // replace with your secret key

// Create a connection to the database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'emissions'
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database.');
});

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Body parser middleware
app.use(bodyParser.json());

// To handle URL encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for verifying JWT
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    jwt.verify(req.token, SECRET_KEY, (err) => {
      if (err) {
        res.sendStatus(403);
      } else {
        next();
      }
    });
  } else {
    res.sendStatus(403);
  }
}

app.post('/emissions', verifyToken, (req, res) => {
  const sql = 'INSERT INTO emissions SET ?';
  db.query(sql, req.body, (err, result) => {
    if (err) throw err;
    res.json({ message: 'Emissions data added successfully', data: req.body });
  });
});

app.get('/emissions', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM emissions';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/emissions/:id', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM emissions WHERE id = ?';
  db.query(sql, req.params.id, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

app.put('/emissions/:id', verifyToken, (req, res) => {
  const sql = 'UPDATE emissions SET ? WHERE id = ?';
  db.query(sql, [req.body, req.params.id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Emissions data updated successfully', data: req.body });
  });
});

app.delete('/emissions/:id', verifyToken, (req, res) => {
  const sql = 'DELETE FROM emissions WHERE id = ?';
  db.query(sql, req.params.id, (err, result) => {
    if (err) throw err;
    res.json({ message: 'Emissions data deleted successfully' });
  });
});

app.get('/emissionsReport', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM emissions';
  db.query(sql, (err, results) => {
    if (err) throw err;
    let totalEmissions = 0;
    results.forEach(emission => {
      // Convert emissions to CO2 equivalents and add them up
      const co2e = emission.co2Emission + (emission.ch4Emission * 25) + (emission.n2oEmission * 298);
      totalEmissions += co2e;
    });
    res.json({ totalEmissions });
  });
});

const PORT = 5000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
