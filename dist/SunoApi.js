import axios from 'axios';
import UserAgent from 'user-agents';
import pino from 'pino';
import yn from 'yn';
import { isPage, sleep, waitForRequests } from '@/lib/utils';
import * as cookie from 'cookie';
import { randomUUID } from 'node:crypto';
import { Solver } from '@2captcha/captcha-solver';
import { chromium, firefox } from 'rebrowser-playwright-core';
import { createCursor } from 'ghost-cursor-playwright';
import { promises as fs } from 'fs';
import path from 'node:path';
// sunoApi instance caching
const globalForSunoApi = global;
const cache = globalForSunoApi.sunoApiCache || new Map();
globalForSunoApi.sunoApiCache = cache;
const logger = pino();
export const DEFAULT_MODEL = 'chirp-v3-5';
class SunoApi {
    constructor(cookies) {
        this.solver = new Solver(process.env.TWOCAPTCHA_KEY + '');
        this.ghostCursorEnabled = yn(process.env.BROWSER_GHOST_CURSOR, { default: false });
        this.userAgent = new UserAgent(/Macintosh/).random().toString(); // Usually Mac systems get less amount of CAPTCHAs
        this.cookies = cookie.parse(cookies);
        this.deviceId = this.cookies.ajs_anonymous_id || randomUUID();
        this.client = axios.create({
            withCredentials: true,
            headers: {
                'Affiliate-Id': 'undefined',
                'Device-Id': `"${this.deviceId}"`,
                'device-id': this.deviceId,
                'browser-token': JSON.stringify({ token: Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString('base64') }),
                'x-suno-client': 'Android prerelease-4nt180t 1.0.42',
                'X-Requested-With': 'com.suno.android',
                'sec-ch-ua': '"Chromium";v="130", "Android WebView";v="130", "Not?A_Brand";v="99"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'User-Agent': this.userAgent
            }
        });
        this.client.interceptors.request.use(config => {
            if (this.currentToken && !config.headers.Authorization)
                config.headers.Authorization = `Bearer ${this.currentToken}`;
            const cookiesArray = Object.entries(this.cookies).map(([key, value]) => cookie.serialize(key, value));
            config.headers.Cookie = cookiesArray.join('; ');
            return config;
        });
        this.client.interceptors.response.use(resp => {
            const setCookieHeader = resp.headers['set-cookie'];
            if (Array.isArray(setCookieHeader)) {
                const newCookies = cookie.parse(setCookieHeader.join('; '));
                for (const [key, value] of Object.entries(newCookies)) {
                    this.cookies[key] = value;
                }
            }
            return resp;
        });
    }
    async init() {
        //await this.getClerkLatestVersion();
        await this.getAuthToken();
        await this.keepAlive();
        return this;
    }
    /**
     * Get the clerk package latest version id.
     * This method is commented because we are now using a hard-coded Clerk version, hence this method is not needed.
     
    private async getClerkLatestVersion() {
      // URL to get clerk version ID
      const getClerkVersionUrl = `${SunoApi.JSDELIVR_BASE_URL}/v1/package/npm/@clerk/clerk-js`;
      // Get clerk version ID
      const versionListResponse = await this.client.get(getClerkVersionUrl);
      if (!versionListResponse?.data?.['tags']['latest']) {
        throw new Error(
          'Failed to get clerk version info, Please try again later'
        );
      }
      // Save clerk version ID for auth
      SunoApi.clerkVersion = versionListResponse?.data?.['tags']['latest'];
    }
    */
    /**
     * Get the session ID and save it for later use.
     */
    async getAuthToken() {
        var _a, _b;
        logger.info('Getting the session ID');
        // URL to get session ID
        const getSessionUrl = `${SunoApi.CLERK_BASE_URL}/v1/client?_is_native=true&_clerk_js_version=${SunoApi.CLERK_VERSION}`;
        // Get session ID
        const sessionResponse = await this.client.get(getSessionUrl, {
            headers: { Authorization: this.cookies.__client }
        });
        if (!((_b = (_a = sessionResponse === null || sessionResponse === void 0 ? void 0 : sessionResponse.data) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.last_active_session_id)) {
            throw new Error('Failed to get session id, you may need to update the SUNO_COOKIE');
        }
        // Save session ID for later use
        this.sid = sessionResponse.data.response.last_active_session_id;
    }
    /**
     * Keep the session alive.
     * @param isWait Indicates if the method should wait for the session to be fully renewed before returning.
     */
    async keepAlive(isWait) {
        if (!this.sid) {
            throw new Error('Session ID is not set. Cannot renew token.');
        }
        // URL to renew session token
        const renewUrl = `${SunoApi.CLERK_BASE_URL}/v1/client/sessions/${this.sid}/tokens?_is_native=true&_clerk_js_version=${SunoApi.CLERK_VERSION}`;
        // Renew session token
        logger.info('KeepAlive...\n');
        const renewResponse = await this.client.post(renewUrl, {}, {
            headers: { Authorization: this.cookies.__client }
        });
        if (isWait) {
            await sleep(1, 2);
        }
        const newToken = renewResponse.data.jwt;
        // Update Authorization field in request header with the new JWT token
        this.currentToken = newToken;
    }
    /**
     * Get the session token (not to be confused with session ID) and save it for later use.
     */
    async getSessionToken() {
        const tokenResponse = await this.client.post(`${SunoApi.BASE_URL}/api/user/create_session_id/`, {
            session_properties: JSON.stringify({ deviceId: this.deviceId }),
            session_type: 1
        });
        return tokenResponse.data.session_id;
    }
    async captchaRequired() {
        const resp = await this.client.post(`${SunoApi.BASE_URL}/api/c/check`, {
            ctype: 'generation'
        });
        logger.info(resp.data);
        return resp.data.required;
    }
    /**
     * Clicks on a locator or XY vector. This method is made because of the difference between ghost-cursor-playwright and Playwright methods
     */
    async click(target, position) {
        var _a, _b, _c;
        if (this.ghostCursorEnabled) {
            let pos = isPage(target) ? { x: 0, y: 0 } : await target.boundingBox();
            if (position)
                pos = Object.assign(Object.assign({}, pos), { x: pos.x + position.x, y: pos.y + position.y, width: null, height: null });
            return (_a = this.cursor) === null || _a === void 0 ? void 0 : _a.actions.click({
                target: pos
            });
        }
        else {
            if (isPage(target))
                return target.mouse.click((_b = position === null || position === void 0 ? void 0 : position.x) !== null && _b !== void 0 ? _b : 0, (_c = position === null || position === void 0 ? void 0 : position.y) !== null && _c !== void 0 ? _c : 0);
            else
                return target.click({ force: true, position });
        }
    }
    /**
     * Get the BrowserType from the `BROWSER` environment variable.
     * @returns {BrowserType} chromium, firefox or webkit. Default is chromium
     */
    getBrowserType() {
        var _a;
        const browser = (_a = process.env.BROWSER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        switch (browser) {
            case 'firefox':
                return firefox;
            /*case 'webkit': ** doesn't work with rebrowser-patches
            case 'safari':
              return webkit;*/
            default:
                return chromium;
        }
    }
    /**
     * Launches a browser with the necessary cookies
     * @returns {BrowserContext}
     */
    async launchBrowser() {
        const args = [
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-features=site-per-process',
            '--disable-features=IsolateOrigins',
            '--disable-extensions',
            '--disable-infobars'
        ];
        // Check for GPU acceleration, as it is recommended to turn it off for Docker
        if (yn(process.env.BROWSER_DISABLE_GPU, { default: false }))
            args.push('--enable-unsafe-swiftshader', '--disable-gpu', '--disable-setuid-sandbox');
        const browser = await this.getBrowserType().launch({
            args,
            headless: yn(process.env.BROWSER_HEADLESS, { default: true })
        });
        const context = await browser.newContext({ userAgent: this.userAgent, locale: process.env.BROWSER_LOCALE, viewport: null });
        const cookies = [];
        const lax = 'Lax';
        cookies.push({
            name: '__session',
            value: this.currentToken + '',
            domain: '.suno.com',
            path: '/',
            sameSite: lax
        });
        for (const key in this.cookies) {
            cookies.push({
                name: key,
                value: this.cookies[key] + '',
                domain: '.suno.com',
                path: '/',
                sameSite: lax
            });
        }
        await context.addCookies(cookies);
        return context;
    }
    /**
     * Checks for CAPTCHA verification and solves the CAPTCHA if needed
     * @returns {string|null} hCaptcha token. If no verification is required, returns null
     */
    async getCaptcha() {
        if (!await this.captchaRequired())
            return null;
        logger.info('CAPTCHA required. Launching browser...');
        const browser = await this.launchBrowser();
        const page = await browser.newPage();
        await page.goto('https://suno.com/create', { referer: 'https://www.google.com/', waitUntil: 'domcontentloaded', timeout: 0 });
        logger.info('Waiting for Suno interface to load');
        // await page.locator('.react-aria-GridList').waitFor({ timeout: 60000 });
        await page.waitForResponse('**/api/project/**\\?**', { timeout: 60000 }); // wait for song list API call
        if (this.ghostCursorEnabled)
            this.cursor = await createCursor(page);
        logger.info('Triggering the CAPTCHA');
        try {
            await page.getByLabel('Close').click({ timeout: 2000 }); // close all popups
            // await this.click(page, { x: 318, y: 13 });
        }
        catch (e) { }
        const textarea = page.locator('.custom-textarea');
        await this.click(textarea);
        await textarea.pressSequentially('Lorem ipsum', { delay: 80 });
        const button = page.locator('button[aria-label="Create"]').locator('div.flex');
        this.click(button);
        const controller = new AbortController();
        new Promise(async (resolve, reject) => {
            const frame = page.frameLocator('iframe[title*="hCaptcha"]');
            const challenge = frame.locator('.challenge-container');
            try {
                let wait = true;
                while (true) {
                    if (wait)
                        await waitForRequests(page, controller.signal);
                    const drag = (await challenge.locator('.prompt-text').first().innerText()).toLowerCase().includes('drag');
                    let captcha;
                    for (let j = 0; j < 3; j++) { // try several times because sometimes 2Captcha could return an error
                        try {
                            logger.info('Sending the CAPTCHA to 2Captcha');
                            const payload = {
                                body: (await challenge.screenshot({ timeout: 5000 })).toString('base64'),
                                lang: process.env.BROWSER_LOCALE
                            };
                            if (drag) {
                                // Say to the worker that he needs to click
                                payload.textinstructions = 'CLICK on the shapes at their edge or center as shown above—please be precise!';
                                payload.imginstructions = (await fs.readFile(path.join(process.cwd(), 'public', 'drag-instructions.jpg'))).toString('base64');
                            }
                            captcha = await this.solver.coordinates(payload);
                            break;
                        }
                        catch (err) {
                            logger.info(err.message);
                            if (j != 2)
                                logger.info('Retrying...');
                            else
                                throw err;
                        }
                    }
                    if (drag) {
                        const challengeBox = await challenge.boundingBox();
                        if (challengeBox == null)
                            throw new Error('.challenge-container boundingBox is null!');
                        if (captcha.data.length % 2) {
                            logger.info('Solution does not have even amount of points required for dragging. Requesting new solution...');
                            this.solver.badReport(captcha.id);
                            wait = false;
                            continue;
                        }
                        for (let i = 0; i < captcha.data.length; i += 2) {
                            const data1 = captcha.data[i];
                            const data2 = captcha.data[i + 1];
                            logger.info(JSON.stringify(data1) + JSON.stringify(data2));
                            await page.mouse.move(challengeBox.x + +data1.x, challengeBox.y + +data1.y);
                            await page.mouse.down();
                            await sleep(1.1); // wait for the piece to be 'unlocked'
                            await page.mouse.move(challengeBox.x + +data2.x, challengeBox.y + +data2.y, { steps: 30 });
                            await page.mouse.up();
                        }
                        wait = true;
                    }
                    else {
                        for (const data of captcha.data) {
                            logger.info(data);
                            await this.click(challenge, { x: +data.x, y: +data.y });
                        }
                        ;
                    }
                    this.click(frame.locator('.button-submit')).catch(e => {
                        if (e.message.includes('viewport')) // when hCaptcha window has been closed due to inactivity,
                            this.click(button); // click the Create button again to trigger the CAPTCHA
                        else
                            throw e;
                    });
                }
            }
            catch (e) {
                if (e.message.includes('been closed') // catch error when closing the browser
                    || e.message == 'AbortError') // catch error when waitForRequests is aborted
                    resolve();
                else
                    reject(e);
            }
        }).catch(e => {
            var _a;
            (_a = browser.browser()) === null || _a === void 0 ? void 0 : _a.close();
            throw e;
        });
        return (new Promise((resolve, reject) => {
            page.route('**/api/generate/v2/**', async (route) => {
                var _a;
                try {
                    logger.info('hCaptcha token received. Closing browser');
                    route.abort();
                    (_a = browser.browser()) === null || _a === void 0 ? void 0 : _a.close();
                    controller.abort();
                    const request = route.request();
                    this.currentToken = request.headers().authorization.split('Bearer ').pop();
                    resolve(request.postDataJSON().token);
                }
                catch (err) {
                    reject(err);
                }
            });
        }));
    }
    /**
     * Imitates Cloudflare Turnstile loading error. Unused right now, left for future
     */
    async getTurnstile() {
        return this.client.post(`https://clerk.suno.com/v1/client?__clerk_api_version=2021-02-05&_clerk_js_version=${SunoApi.CLERK_VERSION}&_method=PATCH`, { captcha_error: '300030,300030,300030' }, { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    }
    /**
     * Generate a song based on the prompt.
     * @param prompt The text prompt to generate audio from.
     * @param make_instrumental Indicates if the generated audio should be instrumental.
     * @param wait_audio Indicates if the method should wait for the audio file to be fully generated before returning.
     * @returns
     */
    async generate(prompt, make_instrumental = false, model, wait_audio = false) {
        await this.keepAlive(false);
        const startTime = Date.now();
        const audios = await this.generateSongs(prompt, false, undefined, undefined, make_instrumental, model, wait_audio);
        const costTime = Date.now() - startTime;
        logger.info('Generate Response:\n' + JSON.stringify(audios, null, 2));
        logger.info('Cost time: ' + costTime);
        return audios;
    }
    /**
     * Calls the concatenate endpoint for a clip to generate the whole song.
     * @param clip_id The ID of the audio clip to concatenate.
     * @returns A promise that resolves to an AudioInfo object representing the concatenated audio.
     * @throws Error if the response status is not 200.
     */
    async concatenate(clip_id) {
        await this.keepAlive(false);
        const payload = { clip_id: clip_id };
        const response = await this.client.post(`${SunoApi.BASE_URL}/api/generate/concat/v2/`, payload, {
            timeout: 10000 // 10 seconds timeout
        });
        if (response.status !== 200) {
            throw new Error('Error response:' + response.statusText);
        }
        return response.data;
    }
    /**
     * Generates custom audio based on provided parameters.
     *
     * @param prompt The text prompt to generate audio from.
     * @param tags Tags to categorize the generated audio.
     * @param title The title for the generated audio.
     * @param make_instrumental Indicates if the generated audio should be instrumental.
     * @param wait_audio Indicates if the method should wait for the audio file to be fully generated before returning.
     * @param negative_tags Negative tags that should not be included in the generated audio.
     * @returns A promise that resolves to an array of AudioInfo objects representing the generated audios.
     */
    async custom_generate(prompt, tags, title, make_instrumental = false, model, wait_audio = false, negative_tags) {
        const startTime = Date.now();
        const audios = await this.generateSongs(prompt, true, tags, title, make_instrumental, model, wait_audio, negative_tags);
        const costTime = Date.now() - startTime;
        logger.info('Custom Generate Response:\n' + JSON.stringify(audios, null, 2));
        logger.info('Cost time: ' + costTime);
        return audios;
    }
    /**
     * Generates songs based on the provided parameters.
     *
     * @param prompt The text prompt to generate songs from.
     * @param isCustom Indicates if the generation should consider custom parameters like tags and title.
     * @param tags Optional tags to categorize the song, used only if isCustom is true.
     * @param title Optional title for the song, used only if isCustom is true.
     * @param make_instrumental Indicates if the generated song should be instrumental.
     * @param wait_audio Indicates if the method should wait for the audio file to be fully generated before returning.
     * @param negative_tags Negative tags that should not be included in the generated audio.
     * @param task Optional indication of what to do. Enter 'extend' if extending an audio, otherwise specify null.
     * @param continue_clip_id
     * @returns A promise that resolves to an array of AudioInfo objects representing the generated songs.
     */
    async generateSongs(prompt, isCustom, tags, title, make_instrumental, model, wait_audio = false, negative_tags, task, continue_clip_id, continue_at) {
        await this.keepAlive();
        const payload = {
            make_instrumental: make_instrumental,
            mv: model || DEFAULT_MODEL,
            prompt: '',
            generation_type: 'TEXT',
            continue_at: continue_at,
            continue_clip_id: continue_clip_id,
            task: task,
            token: await this.getCaptcha()
        };
        if (isCustom) {
            payload.tags = tags;
            payload.title = title;
            payload.negative_tags = negative_tags;
            payload.prompt = prompt;
        }
        else {
            payload.gpt_description_prompt = prompt;
        }
        logger.info('generateSongs payload:\n' +
            JSON.stringify({
                prompt: prompt,
                isCustom: isCustom,
                tags: tags,
                title: title,
                make_instrumental: make_instrumental,
                wait_audio: wait_audio,
                negative_tags: negative_tags,
                payload: payload
            }, null, 2));
        const response = await this.client.post(`${SunoApi.BASE_URL}/api/generate/v2/`, payload, {
            timeout: 10000 // 10 seconds timeout
        });
        if (response.status !== 200) {
            throw new Error('Error response:' + response.statusText);
        }
        const songIds = response.data.clips.map((audio) => audio.id);
        //Want to wait for music file generation
        if (wait_audio) {
            const startTime = Date.now();
            let lastResponse = [];
            await sleep(5, 5);
            while (Date.now() - startTime < 100000) {
                const response = await this.get(songIds);
                const allCompleted = response.every((audio) => audio.status === 'streaming' || audio.status === 'complete');
                const allError = response.every((audio) => audio.status === 'error');
                if (allCompleted || allError) {
                    return response;
                }
                lastResponse = response;
                await sleep(3, 6);
                await this.keepAlive(true);
            }
            return lastResponse;
        }
        else {
            return response.data.clips.map((audio) => ({
                id: audio.id,
                title: audio.title,
                image_url: audio.image_url,
                lyric: audio.metadata.prompt,
                audio_url: audio.audio_url,
                video_url: audio.video_url,
                created_at: audio.created_at,
                model_name: audio.model_name,
                status: audio.status,
                gpt_description_prompt: audio.metadata.gpt_description_prompt,
                prompt: audio.metadata.prompt,
                type: audio.metadata.type,
                tags: audio.metadata.tags,
                negative_tags: audio.metadata.negative_tags,
                duration: audio.metadata.duration
            }));
        }
    }
    /**
     * Generates lyrics based on a given prompt.
     * @param prompt The prompt for generating lyrics.
     * @returns The generated lyrics text.
     */
    async generateLyrics(prompt) {
        var _a;
        await this.keepAlive(false);
        // Initiate lyrics generation
        const generateResponse = await this.client.post(`${SunoApi.BASE_URL}/api/generate/lyrics/`, { prompt });
        const generateId = generateResponse.data.id;
        // Poll for lyrics completion
        let lyricsResponse = await this.client.get(`${SunoApi.BASE_URL}/api/generate/lyrics/${generateId}`);
        while (((_a = lyricsResponse === null || lyricsResponse === void 0 ? void 0 : lyricsResponse.data) === null || _a === void 0 ? void 0 : _a.status) !== 'complete') {
            await sleep(2); // Wait for 2 seconds before polling again
            lyricsResponse = await this.client.get(`${SunoApi.BASE_URL}/api/generate/lyrics/${generateId}`);
        }
        // Return the generated lyrics text
        return lyricsResponse.data;
    }
    /**
     * Extends an existing audio clip by generating additional content based on the provided prompt.
     *
     * @param audioId The ID of the audio clip to extend.
     * @param prompt The prompt for generating additional content.
     * @param continueAt Extend a new clip from a song at mm:ss(e.g. 00:30). Default extends from the end of the song.
     * @param tags Style of Music.
     * @param title Title of the song.
     * @returns A promise that resolves to an AudioInfo object representing the extended audio clip.
     */
    async extendAudio(audioId, prompt = '', continueAt, tags = '', negative_tags = '', title = '', model, wait_audio) {
        return this.generateSongs(prompt, true, tags, title, false, model, wait_audio, negative_tags, 'extend', audioId, continueAt);
    }
    /**
     * Generate stems for a song.
     * @param song_id The ID of the song to generate stems for.
     * @returns A promise that resolves to an AudioInfo object representing the generated stems.
     */
    async generateStems(song_id) {
        await this.keepAlive(false);
        const response = await this.client.post(`${SunoApi.BASE_URL}/api/edit/stems/${song_id}`, {});
        console.log('generateStems response:\n', response === null || response === void 0 ? void 0 : response.data);
        return response.data.clips.map((clip) => ({
            id: clip.id,
            status: clip.status,
            created_at: clip.created_at,
            title: clip.title,
            stem_from_id: clip.metadata.stem_from_id,
            duration: clip.metadata.duration
        }));
    }
    /**
     * Get the lyric alignment for a song.
     * @param song_id The ID of the song to get the lyric alignment for.
     * @returns A promise that resolves to an object containing the lyric alignment.
     */
    async getLyricAlignment(song_id) {
        var _a;
        await this.keepAlive(false);
        const response = await this.client.get(`${SunoApi.BASE_URL}/api/gen/${song_id}/aligned_lyrics/v2/`);
        console.log(`getLyricAlignment ~ response:`, response.data);
        return (_a = response.data) === null || _a === void 0 ? void 0 : _a.aligned_words.map((transcribedWord) => ({
            word: transcribedWord.word,
            start_s: transcribedWord.start_s,
            end_s: transcribedWord.end_s,
            success: transcribedWord.success,
            p_align: transcribedWord.p_align
        }));
    }
    /**
     * Processes the lyrics (prompt) from the audio metadata into a more readable format.
     * @param prompt The original lyrics text.
     * @returns The processed lyrics text.
     */
    parseLyrics(prompt) {
        // Assuming the original lyrics are separated by a specific delimiter (e.g., newline), we can convert it into a more readable format.
        // The implementation here can be adjusted according to the actual lyrics format.
        // For example, if the lyrics exist as continuous text, it might be necessary to split them based on specific markers (such as periods, commas, etc.).
        // The following implementation assumes that the lyrics are already separated by newlines.
        // Split the lyrics using newline and ensure to remove empty lines.
        const lines = prompt.split('\n').filter((line) => line.trim() !== '');
        // Reassemble the processed lyrics lines into a single string, separated by newlines between each line.
        // Additional formatting logic can be added here, such as adding specific markers or handling special lines.
        return lines.join('\n');
    }
    /**
     * Retrieves audio information for the given song IDs.
     * @param songIds An optional array of song IDs to retrieve information for.
     * @param page An optional page number to retrieve audio information from.
     * @returns A promise that resolves to an array of AudioInfo objects.
     */
    async get(songIds, page) {
        await this.keepAlive(false);
        let url = new URL(`${SunoApi.BASE_URL}/api/feed/v2`);
        if (songIds) {
            url.searchParams.append('ids', songIds.join(','));
        }
        if (page) {
            url.searchParams.append('page', page);
        }
        logger.info('Get audio status: ' + url.href);
        const response = await this.client.get(url.href, {
            // 10 seconds timeout
            timeout: 10000
        });
        const audios = response.data.clips;
        return audios.map((audio) => ({
            id: audio.id,
            title: audio.title,
            image_url: audio.image_url,
            lyric: audio.metadata.prompt
                ? this.parseLyrics(audio.metadata.prompt)
                : '',
            audio_url: audio.audio_url,
            video_url: audio.video_url,
            created_at: audio.created_at,
            model_name: audio.model_name,
            status: audio.status,
            gpt_description_prompt: audio.metadata.gpt_description_prompt,
            prompt: audio.metadata.prompt,
            type: audio.metadata.type,
            tags: audio.metadata.tags,
            duration: audio.metadata.duration,
            error_message: audio.metadata.error_message
        }));
    }
    /**
     * Retrieves information for a specific audio clip.
     * @param clipId The ID of the audio clip to retrieve information for.
     * @returns A promise that resolves to an object containing the audio clip information.
     */
    async getClip(clipId) {
        await this.keepAlive(false);
        const response = await this.client.get(`${SunoApi.BASE_URL}/api/clip/${clipId}`);
        return response.data;
    }
    async get_credits() {
        await this.keepAlive(false);
        const response = await this.client.get(`${SunoApi.BASE_URL}/api/billing/info/`);
        return {
            credits_left: response.data.total_credits_left,
            period: response.data.period,
            monthly_limit: response.data.monthly_limit,
            monthly_usage: response.data.monthly_usage
        };
    }
    async getPersonaPaginated(personaId, page = 1) {
        await this.keepAlive(false);
        const url = `${SunoApi.BASE_URL}/api/persona/get-persona-paginated/${personaId}/?page=${page}`;
        logger.info(`Fetching persona data: ${url}`);
        const response = await this.client.get(url, {
            timeout: 10000 // 10 seconds timeout
        });
        if (response.status !== 200) {
            throw new Error('Error response: ' + response.statusText);
        }
        return response.data;
    }
    /**
     * Upload an audio file to Suno and get a clip ID back
     * @param audioUrl The URL of the audio file to upload
     * @param fileName Optional filename for the uploaded audio
     * @returns A promise that resolves to an object containing the clip ID
     */
    async uploadAudio(audioUrl, fileName) {
        var _a, _b, _c;
        await this.keepAlive(false);
        try {
            // Step 1: Initialize upload
            logger.info('Step 1: Initializing upload...');
            const extension = fileName ? fileName.split('.').pop() || 'mp3' : 'mp3';
            let uploadInitResponse;
            try {
                uploadInitResponse = await this.client.post(`${SunoApi.BASE_URL}/api/uploads/audio/`, { extension });
                logger.info(`✅ Step 1 SUCCESS - Init response status: ${uploadInitResponse.status}`);
                logger.info(`Init response data:`, JSON.stringify(uploadInitResponse.data, null, 2));
            }
            catch (initError) {
                logger.error('❌ Step 1 FAILED - Error in upload initialization:', initError.message);
                logger.error('Init error response:', (_a = initError.response) === null || _a === void 0 ? void 0 : _a.data);
                logger.error('Init error status:', (_b = initError.response) === null || _b === void 0 ? void 0 : _b.status);
                throw new Error('Failed to initialize upload: ' + initError.message + (((_c = initError.response) === null || _c === void 0 ? void 0 : _c.data) ? ' - ' + JSON.stringify(initError.response.data) : ''));
            }
            if (uploadInitResponse.status !== 200) {
                throw new Error('Failed to initialize upload: ' + uploadInitResponse.statusText);
            }
            const { id: audioId, url: uploadUrl, fields } = uploadInitResponse.data;
            logger.info(`Upload initialized with ID: ${audioId}`);
            logger.info(`Upload URL: ${uploadUrl}`);
            logger.info(`Response data structure:`, JSON.stringify(uploadInitResponse.data, null, 2));
            // Step 2: Download the audio file
            logger.info('Step 2: Downloading audio file...');
            const audioResponse = await this.client.get(audioUrl, {
                responseType: 'arraybuffer'
            });
            if (audioResponse.status !== 200) {
                logger.error('❌ Step 2 FAILED - Failed to download audio file');
                throw new Error('Failed to download audio file');
            }
            logger.info(`✅ Step 2 SUCCESS - Downloaded ${audioResponse.data.byteLength} bytes`);
            logger.info(`Downloaded file content-type: ${audioResponse.headers['content-type']}`);
            // Check if downloaded content type matches what S3 expects
            const downloadedType = audioResponse.headers['content-type'] || 'unknown';
            const expectedType = fields['Content-Type'] || 'unknown';
            logger.info(`Content-Type comparison - Downloaded: ${downloadedType}, S3 expects: ${expectedType}`);
            // Step 3: Upload file to S3-like storage
            logger.info('Step 3: Uploading file to storage...');
            // Create FormData in EXACT Chrome order: Content-Type, key, AWSAccessKeyId, policy, signature, file
            logger.info('🔧 Creating FormData in exact Chrome DevTools order...');
            logger.info('Upload URL:', uploadUrl);
            logger.info('Audio size:', audioResponse.data.byteLength);
            logger.info('Fields from Suno:', JSON.stringify(fields, null, 2));
            const form = new FormData();
            // EXACT Chrome order from DevTools capture
            form.append('Content-Type', fields['Content-Type']);
            form.append('key', fields['key']);
            form.append('AWSAccessKeyId', fields['AWSAccessKeyId']);
            form.append('policy', fields['policy']);
            form.append('signature', fields['signature']);
            // File field with filename and Content-Type (exactly like Chrome)
            const audioBlob = new Blob([audioResponse.data], { type: fields['Content-Type'] || 'audio/mpeg' });
            form.append('file', audioBlob, fileName || 'upload.mp3');
            logger.info('FormData created in Chrome DevTools order');
            logger.info('Making S3 upload request...');
            // Use fetch with exact Chrome headers
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: form,
                headers: {
                    'Origin': 'https://suno.com',
                    'Referer': 'https://suno.com/',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
                    // Don't set Content-Type - let fetch set it with proper boundary
                }
            });
            logger.info(`S3 Upload response status: ${uploadResponse.status}`);
            logger.info(`S3 Upload response statusText: ${uploadResponse.statusText}`);
            if (uploadResponse.status !== 204) {
                const responseText = await uploadResponse.text();
                logger.error(`❌ Step 3 FAILED - S3 Upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`);
                logger.error(`S3 Response body:`, responseText);
                throw new Error('Failed to upload audio file: ' + uploadResponse.statusText + ' - ' + responseText);
            }
            logger.info(`✅ Step 3 SUCCESS - S3 upload completed`);
            // Step 4: Finish upload
            logger.info('Step 4: Finishing upload...');
            const finishResponse = await this.client.post(`${SunoApi.BASE_URL}/api/uploads/audio/${audioId}/upload-finish/`, {
                upload_type: "file_upload",
                upload_filename: fileName || 'upload.mp3'
            });
            if (finishResponse.status !== 200) {
                throw new Error('Failed to finish upload: ' + finishResponse.statusText);
            }
            // Step 5: Wait for upload to complete
            logger.info('Step 5: Waiting for upload to complete...');
            let uploadStatus;
            let attempts = 0;
            const maxAttempts = 30;
            while (attempts < maxAttempts) {
                const statusResponse = await this.client.get(`${SunoApi.BASE_URL}/api/uploads/audio/${audioId}/`);
                uploadStatus = statusResponse.data;
                logger.info(`Upload status: ${uploadStatus.status}`);
                if (uploadStatus.status === 'complete') {
                    break;
                }
                else if (uploadStatus.status === 'error') {
                    throw new Error('Upload failed: ' + uploadStatus.error_message);
                }
                else if ('detail' in uploadStatus && uploadStatus.detail === 'Unauthorized') {
                    throw new Error('Unauthorized - check your cookies');
                }
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            }
            if (attempts >= maxAttempts) {
                throw new Error('Upload timed out waiting for completion');
            }
            // Step 6: Initialize clip to get clip_id
            logger.info('Step 6: Initializing clip...');
            const clipResponse = await this.client.post(`${SunoApi.BASE_URL}/api/uploads/audio/${audioId}/initialize-clip/`);
            if (clipResponse.status !== 200) {
                throw new Error('Failed to initialize clip: ' + clipResponse.statusText);
            }
            const { clip_id } = clipResponse.data;
            logger.info(`Clip created with ID: ${clip_id}`);
            return {
                clip_id,
                audio_id: audioId,
                upload_id: audioId,
                status: 'complete',
                filename: fileName || 'upload.mp3'
            };
        }
        catch (error) {
            logger.error('Upload error:', error);
            throw error;
        }
    }
    /**
     * Check the status of an uploaded audio file
     * @param uploadId The upload ID returned from uploadAudio
     * @returns A promise that resolves to the upload status
     */
    async getUploadStatus(uploadId) {
        await this.keepAlive(false);
        const response = await this.client.get(`${SunoApi.BASE_URL}/api/uploads/audio/${uploadId}/`);
        if (response.status !== 200) {
            throw new Error('Failed to get upload status: ' + response.statusText);
        }
        return response.data;
    }
    /**
     * Upload audio from a file buffer
     * @param audioBuffer The audio file buffer
     * @param fileName The filename with extension
     * @returns A promise that resolves to an object containing the clip ID
     */
    async uploadAudioBuffer(audioBuffer, fileName) {
        await this.keepAlive(false);
        try {
            // Step 1: Initialize upload
            const extension = fileName.split('.').pop() || 'mp3';
            const uploadInitResponse = await this.client.post(`${SunoApi.BASE_URL}/api/uploads/audio/`, { extension });
            if (uploadInitResponse.status !== 200) {
                throw new Error('Failed to initialize upload: ' + uploadInitResponse.statusText);
            }
            const { id: audioId, url: uploadUrl, fields } = uploadInitResponse.data;
            // Step 2: Upload buffer to S3-like storage using exact Chrome format
            const FormDataNode = require('form-data');
            const form = new FormDataNode();
            // Add fields in the EXACT order from Chrome DevTools working example:
            // Content-Type, key, AWSAccessKeyId, policy, signature, file
            if (!fields['Content-Type'] || !fields.key || !fields.AWSAccessKeyId || !fields.policy || !fields.signature) {
                throw new Error('Missing required S3 upload fields: ' + JSON.stringify(Object.keys(fields)));
            }
            form.append('Content-Type', fields['Content-Type']);
            form.append('key', fields.key);
            form.append('AWSAccessKeyId', fields.AWSAccessKeyId);
            form.append('policy', fields.policy);
            form.append('signature', fields.signature);
            // Add the file last with proper filename and content type
            form.append('file', audioBuffer, {
                filename: fileName,
                contentType: 'audio/mpeg'
            });
            // Use axios without authentication headers (S3 doesn't need Suno auth)
            const s3Client = axios.create();
            const uploadResponse = await s3Client.post(uploadUrl, form, {
                headers: Object.assign(Object.assign({}, form.getHeaders()), { 
                    // Add browser-like headers that match Chrome DevTools
                    'Origin': 'https://suno.com', 'Referer': 'https://suno.com/' }),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            logger.info(`S3 Upload response status: ${uploadResponse.status}`);
            if (uploadResponse.status !== 204) {
                logger.error(`S3 Upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`);
                logger.error(`S3 Response data:`, uploadResponse.data);
                throw new Error('Failed to upload audio file: ' + uploadResponse.statusText);
            }
            // Step 3: Finish upload
            const finishResponse = await this.client.post(`${SunoApi.BASE_URL}/api/uploads/audio/${audioId}/upload-finish/`, {
                upload_type: "file_upload",
                upload_filename: fileName
            });
            if (finishResponse.status !== 200) {
                throw new Error('Failed to finish upload: ' + finishResponse.statusText);
            }
            // Step 4: Wait for upload to complete
            let uploadStatus;
            let attempts = 0;
            const maxAttempts = 30;
            while (attempts < maxAttempts) {
                const statusResponse = await this.client.get(`${SunoApi.BASE_URL}/api/uploads/audio/${audioId}/`);
                uploadStatus = statusResponse.data;
                if (uploadStatus.status === 'complete') {
                    break;
                }
                else if (uploadStatus.status === 'error') {
                    throw new Error('Upload failed: ' + uploadStatus.error_message);
                }
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            if (attempts >= maxAttempts) {
                throw new Error('Upload timed out waiting for completion');
            }
            // Step 5: Initialize clip to get clip_id
            const clipResponse = await this.client.post(`${SunoApi.BASE_URL}/api/uploads/audio/${audioId}/initialize-clip/`);
            if (clipResponse.status !== 200) {
                throw new Error('Failed to initialize clip: ' + clipResponse.statusText);
            }
            const { clip_id } = clipResponse.data;
            return {
                clip_id,
                audio_id: audioId,
                upload_id: audioId,
                status: 'complete',
                filename: fileName
            };
        }
        catch (error) {
            logger.error('Upload buffer error:', error);
            throw error;
        }
    }
}
SunoApi.BASE_URL = 'https://studio-api.prod.suno.com';
SunoApi.CLERK_BASE_URL = 'https://clerk.suno.com';
SunoApi.CLERK_VERSION = '5.15.0';
export const sunoApi = async (cookie) => {
    const resolvedCookie = cookie && cookie.includes('__client') ? cookie : process.env.SUNO_COOKIE; // Check for bad `Cookie` header (It's too expensive to actually parse the cookies *here*)
    if (!resolvedCookie) {
        logger.info('No cookie provided! Aborting...\nPlease provide a cookie either in the .env file or in the Cookie header of your request.');
        throw new Error('Please provide a cookie either in the .env file or in the Cookie header of your request.');
    }
    // Check if the instance for this cookie already exists in the cache
    const cachedInstance = cache.get(resolvedCookie);
    if (cachedInstance)
        return cachedInstance;
    // If not, create a new instance and initialize it
    const instance = await new SunoApi(resolvedCookie).init();
    // Cache the initialized instance
    cache.set(resolvedCookie, instance);
    return instance;
};
