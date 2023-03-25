import { Dataset, createPlaywrightRouter, GlobInput } from 'crawlee';
import { Actor } from 'apify';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    const input = await Actor.getInput<{ articleGlobs: GlobInput[] }>();
    const articleGlobs = input?.articleGlobs || ['https://zenn.dev/*/articles/*'];
    await enqueueLinks({
        globs: articleGlobs,
        label: 'article',
    });
});

router.addHandler('article', async ({ enqueueLinks, request, page, log }) => {
    const title = await page.title();
    log.info(`article ${title}`, { url: request.loadedUrl });
    const input = await Actor.getInput<{ ignoreLinks: string[] }>();
    const ignoreLinks = input?.ignoreLinks || [
        'https://zenn.dev/',
        'https://zenn.dev/search',
        'https://zenn.dev/faq#what-is-publication',
        'https://zenn.dev/faq#badges',
        'https://zenn.dev/about',
        'https://classmethod.jp/',
        'https://info.zenn.dev/',
        'https://zenn.dev/zenn',
        'https://zenn.dev/publications',
        'https://zenn.dev/faq',
        'https://twitter.com/zenn_dev',
        'https://github.com/zenn-dev',
        'https://zenn.dev/mediakit',
        'https://zenn.dev/terms',
        'https://zenn.dev/privacy',
        'https://zenn.dev/terms/transaction-law',
        'https://classmethod.connpass.com/event/276869/',
        'https://zenn.dev/tech-or-idea',
    ];
    await enqueueLinks({
        label: 'link',
        strategy: 'all',
        userData: {
            referer: request.loadedUrl,
        },
        transformRequestFunction: (req) => {
            if (req.url.endsWith('.pdf')) return false;
            if (ignoreLinks.indexOf(req.url) !== -1) return false;
            return req;
        },
    });
});

router.addHandler('link', async ({ request, page, log, response }) => {
    const title = await page.title();
    const status = response && response.status();
    const info = { url: request.loadedUrl, status, userData: request.userData };
    if (status && status >= 400 && status < 500) {
        log.error(`4xx link ${title}`, info);
        await Dataset.pushData(info);
    } else {
        log.info(`link ${title}`, info);
    }
});

export const failedRouter = createPlaywrightRouter();
failedRouter.addHandler('link', async ({ request, log }) => {
    const info = { url: request.url, status: 500, userData: request.userData };
    log.error(`failed link`, info);
    await Dataset.pushData(info);
});
