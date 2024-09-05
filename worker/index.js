const redis = require('redis');

// Client pour la souscription
const redisSubscriber = redis.createClient({
    url: process.env.REDIS_URL
});

// Client pour les opérations classiques (SET, GET, HSET, etc.)
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

function calculateFibonacci(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        let c = a + b;
        a = b;
        b = c;
    }
    return b;
}

async function startWorker() {
    // Connexion des deux clients Redis
    await redisSubscriber.connect();
    await redisClient.connect();
    console.log('Worker connected to Redis');

    // Souscription au canal 'fibonacci'
    await redisSubscriber.subscribe('fibonacci', async (message) => {
        const index = parseInt(message);
        console.log('Calculating fibonacci for index:', index);
        const result = calculateFibonacci(index);

        // Utilisation du second client pour les opérations classiques
        await redisClient.hSet('fibonacci', index.toString(), result.toString());
        console.log(`Fibonacci result for ${index}: ${result}`);
    });
}

startWorker().catch(console.error);

process.on('SIGINT', async () => {
    await redisSubscriber.quit();
    await redisClient.quit();
    process.exit(0);
});
