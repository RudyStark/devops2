require('dotenv').config();
const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

async function processJob(index) {
    const result = fibonacci(parseInt(index));
    await redisClient.hset('fibonacci', index, result.toString());
    console.log(`Calcul terminé pour l'index ${index}: ${result}`);
}

async function main() {
    await redisClient.connect();

    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.subscribe('fibonacci-channel', (message) => {
        const index = message;
        processJob(index);
    });

    console.log('Worker en attente de tâches...');
}

main().catch(console.error);
