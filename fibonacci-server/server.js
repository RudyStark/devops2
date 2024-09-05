require('dotenv').config();
const express = require('express');
const redis = require('redis');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialisation de Redis
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Initialisation de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Fonction pour initialiser la base de données
async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS fibonacci (
                                                     index INTEGER PRIMARY KEY,
                                                     result BIGINT
            )
        `);
        console.log('Table fibonacci créée ou déjà existante');
    } catch (error) {
        console.error('Erreur lors de la création de la table:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Routes
app.get('/api/fibonacci/history', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const pgResult = await client.query('SELECT index, result FROM fibonacci ORDER BY index DESC LIMIT 10');
            res.json(pgResult.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

app.get('/api/fibonacci/:index', async (req, res) => {
    const index = req.params.index;
    console.log(`Requête reçue pour l'index: ${index}`);

    try {
        // Vérifier dans Redis
        let result = await redisClient.hGet('fibonacci', index);
        console.log('Résultat de Redis:', result);

        if (result) {
            return res.json({ result });
        }

        // Vérifier dans PostgreSQL
        const pgResult = await pool.query('SELECT result FROM fibonacci WHERE index = $1', [index]);
        console.log('Résultat de PostgreSQL:', pgResult.rows);

        if (pgResult.rows.length > 0) {
            result = pgResult.rows[0].result;
            await redisClient.hSet('fibonacci', index, result);
            return res.json({ result });
        }

        // Si pas de résultat, demander au worker de calculer
        console.log('Demande de calcul au worker pour index:', index);
        await redisClient.publish('fibonacci', index);

        // Informer le client que le calcul est en cours
        return res.status(202).json({ message: "Calcul en cours" });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

app.listen(port, async () => {
    try {
        await redisClient.connect();
        console.log('Connecté à Redis');

        await initDatabase();
        console.log('Base de données initialisée');

        // Tester la connexion à PostgreSQL
        const client = await pool.connect();
        try {
            await client.query('SELECT NOW()');
            console.log('Connecté à PostgreSQL');
        } finally {
            client.release();
        }

        console.log(`Serveur démarré sur le port ${port}`);
    } catch (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    await redisClient.quit();
    await pool.end();
    process.exit(0);
});
