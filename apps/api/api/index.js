const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

let cachedApp = null;

async function bootstrap() {
    if (cachedApp) {
        return cachedApp;
    }

    // Import the compiled AppModule from dist/src
    const { AppModule } = require('../dist/src/app.module');

    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter, {
        logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
    });

    // CORS configuration
    const allowedOrigins = [
        'https://easyfactu-web.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
    ];

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        maxAge: 86400,
    });

    app.setGlobalPrefix('api/v1');

    await app.init();

    cachedApp = expressApp;
    return expressApp;
}

module.exports = async (req, res) => {
    const app = await bootstrap();
    app(req, res);
};
