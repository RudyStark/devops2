require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

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
    } finally {
        client.release();
        await pool.end();
    }
}

initDatabase();
