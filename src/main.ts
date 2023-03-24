import {Actor} from 'apify';
import {PlaywrightCrawler} from 'crawlee';
import {router, failedRouter} from './routes.js';

await Actor.init();

const startUrls = ['https://zenn.dev/silverbirder'];

const proxyConfiguration = await Actor.createProxyConfiguration({useApifyProxy: false});

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    requestHandler: router,
    failedRequestHandler: failedRouter,
});

await crawler.run(startUrls);

await Actor.exit();
