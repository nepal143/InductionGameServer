const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Ensure this line is present to load environment variables

const app = express(); 
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const MongoUri = process.env.MONGODB_URI;

if (!MongoUri) {
    console.error('MongoDB URI is not set');
    process.exit(1); // Exit the process if MongoDB URI is not set
}

mongoose.connect(MongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const scoreSchema = new mongoose.Schema({
    name: String,
    regno: String,
    score: Number,  // Ensure score is a Number for sorting
});

const Score = mongoose.model('Score', scoreSchema);

app.post('/submit-score', async (req, res) => {
    const { name, regno, score } = req.body;

    if (!name || !regno || score === undefined) {
        return res.status(400).send('All fields are required');
    }

    try {
        const existingScore = await Score.findOne({ regno });

        if (existingScore) {
            if (existingScore.score < score) {
                existingScore.name = name;
                existingScore.score = score;
                await existingScore.save();
                return res.status(200).send('Score updated successfully');
            } else {
                return res.status(200).send('Existing score is higher or equal');
            }
        }

        const newScore = new Score({ name, regno, score });
        await newScore.save();
        res.status(201).send('Score saved successfully');
    } catch (err) {
        res.status(500).send('Error saving score');
    }
});

app.get('/scores', async (req, res) => {
    try {
        const scores = await Score.find()
            .sort({ score: -1 })  // Sort by score in descending order
            .limit(10);  // Get top 10 scores
        res.status(200).json(scores);
    } catch (err) {
        res.status(500).send('Error retrieving scores');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
 