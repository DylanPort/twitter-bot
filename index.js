import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import fs from 'fs';

dotenv.config();

// Configuration
const TWITTER_URL = 'https://twitter.com/i/flow/login';
const EMAIL = process.env.TWITTER_EMAIL || 'gofokek187@inikale.com';
const PASSWORD = process.env.TWITTER_PASSWORD || 'aranciata1234';
const USERNAME = process.env.TWITTER_USERNAME || 'trenchwizardai';
const MODEL_NAME = 'tinyllama';
const POST_INTERVAL = 3 * 60 * 1000; // 3 minutes
const POST_VARIANCE = 1 * 60 * 1000; // +/- 1 minute
const CHECK_INTERVAL = 60 * 1000; // 1 minute
const CHECK_VARIANCE = 30 * 1000; // +/- 30 seconds
const STATE_FILE = 'state.json';

// Logger setup
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' })
    ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.simple()
    }));
}

// Cyrus State Management
function readState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (error) {
        return {
            mood: { current: 'neutral', lastChange: Date.now(), delusions: false, intensity: 0.5 },
            memory: { recentTopics: [], recentPosts: [], processedTweets: new Set(), lastPostTime: Date.now() }
        };
    }
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

let cyrusState = readState();

// Utility function for random delays with variance
function getRandomDelay(baseDelay, variance) {
    return baseDelay + (Math.random() * variance * 2 - variance);
}

// Sleep utility
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Update mood
function updateCyrusMood(content = null) {
    const now = Date.now();
    const hoursSinceLastChange = (now - cyrusState.mood.lastChange) / (1000 * 60 * 60);
    
    const shouldChange = Math.random() < (hoursSinceLastChange / 4) || content !== null;
    
    if (shouldChange) {
        const random = Math.random();
        cyrusState.mood.current = random < 0.33 ? 'manic' : 
                                 random < 0.66 ? 'depressive' : 
                                 'neutral';
        
        cyrusState.mood.delusions = Math.random() < (cyrusState.mood.current !== 'neutral' ? 0.4 : 0.2);
        
        if (cyrusState.mood.current !== 'neutral') {
            cyrusState.mood.intensity = Math.min(1, 0.7 + Math.random() * 0.3);
        } else {
            cyrusState.mood.intensity = 0.3 + Math.random() * 0.4;
        }
        
        cyrusState.mood.lastChange = now;
        
        if (content) {
            const lowerContent = content.toLowerCase();
            if (lowerContent.includes('conspiracy') || lowerContent.includes('hidden') || lowerContent.includes('truth')) {
                cyrusState.mood.delusions = true;
                cyrusState.mood.intensity = Math.min(1, cyrusState.mood.intensity + 0.2);
            }
            if (lowerContent.includes('ai') || lowerContent.includes('technology') || lowerContent.includes('future')) {
                cyrusState.mood.current = Math.random() < 0.7 ? 'manic' : 'depressive';
            }
        }
        
        logger.info(`Mood updated to ${cyrusState.mood.current} (intensity: ${cyrusState.mood.intensity}) ${cyrusState.mood.delusions ? 'with delusions' : ''}`);
        saveState(cyrusState);
    }
}

// Generate tweet
async function generateTweet() {
    updateCyrusMood();
    
    try {
        let prompt = `As a tech-savvy individual with psychological disturbances, share a tweet about your dark mind, thoughts, memories, or imaginations. Keep it between 200-230 characters. Be introspective, dark, and nuanced.`;

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: prompt,
                stream: false,
                options: { 
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 150
                }
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        let tweet = data.response?.trim();
        
        if (tweet) {
            tweet = tweet.replace(/["']|^RT |#/g, '').trim();
            if (tweet.length > 230) {
                tweet = tweet.substring(0, 227) + '...';
            } else if (tweet.length < 200) {
                while (tweet.length < 200) {
                    const additionalContent = await generateAdditionalContent(tweet);
                    tweet += ' ' + additionalContent;
                    if (tweet.length > 230) break;
                }
                if (tweet.length > 230) tweet = tweet.substring(0, 227) + '...';
            }
            
            if (cyrusState.memory.recentPosts.includes(tweet)) {
                return null;
            }
            
            cyrusState.memory.recentPosts.push(tweet);
            if (cyrusState.memory.recentPosts.length > 50) {
                cyrusState.memory.recentPosts.shift();
            }
            saveState(cyrusState);
        }
        return tweet;
    } catch (error) {
        logger.error(`Error generating tweet: ${error.message}`, { error });
        return null;
    }
}

// Helper function to generate additional content if needed
async function generateAdditionalContent(context) {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL_NAME,
            prompt: `Add to the following thought to make it more insightful or expressive: "${context}"`,
            stream: false,
            options: { 
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 50
            }
        })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.response?.trim() || '';
}

// Login to Twitter with retries
async function login(page) {
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            logger.info(`Login attempt ${attempt}...`);
            await page.goto(TWITTER_URL, { waitUntil: 'networkidle2' });
            await sleep(5000);

            logger.info('Waiting for email input...');
            await page.waitForSelector('input[autocomplete="username"]', { visible: true });
            await page.type('input[autocomplete="username"]', EMAIL, { delay: 100 });
            logger.info('Email entered');

            await page.keyboard.press('Enter');
            await sleep(2000);

            // Handle username/phone verification if needed
            try {
                const verificationInput = await page.waitForSelector('input', { visible: true, timeout: 5000 });
                await verificationInput.type(USERNAME, { delay: 100 });
                await page.keyboard.press('Enter');
                logger.info('Username entered for verification');
            } catch (e) {
                logger.info('No username/phone verification needed');
            }

            logger.info('Waiting for password input...');
            const passwordInput = await page.waitForSelector('input[type="password"]', { visible: true });
            await passwordInput.type(PASSWORD, { delay: 100 });
            logger.info('Password entered');

            await page.keyboard.press('Enter');
            await sleep(8000);

            logger.info('Checking for login success...');
            const success = await Promise.race([
                page.waitForSelector('[data-testid="primaryColumn"]', { visible: true }).then(() => true),
                page.waitForSelector('a[href="/home"]', { visible: true }).then(() => true),
                sleep(10000).then(() => false)
            ]);

            logger.info(`Login attempt ${attempt} success: ${success}`);
            if (success) return true;

        } catch (error) {
            logger.error(`Login attempt ${attempt} error: ${error.message}`, { error });
        }

        // Wait before retrying
        if (attempt < MAX_ATTEMPTS) {
            await sleep(10000);
        }
    }

    logger.error('All login attempts failed');
    return false;
}

// Post tweet
async function postTweet(page, content) {
    try {
        logger.info('Starting tweet posting process...');
        
        const composeSelector = '[data-testid="SideNav_NewTweet_Button"]';
        await page.waitForSelector(composeSelector, { visible: true, timeout: 5000 });
        await page.click(composeSelector);
        await sleep(2000);

        const textboxSelector = '[data-testid="tweetTextarea_0"]';
        await page.waitForSelector(textboxSelector, { visible: true, timeout: 5000 });
        await page.click(textboxSelector);
        await page.keyboard.type(content, { delay: 50 });
        logger.info('Tweet content entered');
        await sleep(1000);

        const postButtonSelector = '[data-testid="tweetButton"]';
        await page.waitForSelector(postButtonSelector, { visible: true, timeout: 5000 });
        await page.click(postButtonSelector);

        await sleep(3000);
        logger.info('Tweet posted successfully');
        cyrusState.memory.lastPostTime = Date.now();
        saveState(cyrusState);
        return true;
    } catch (error) {
        logger.error(`Error posting tweet: ${error.message}`, { error });
        return false;
    }
}

// Main function
async function main() {
    logger.info('Starting Cyrus Wraith AI Twitter bot...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1280,800',
            '--disable-notifications'
        ]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    try {
        const loginSuccess = await login(page);
        if (!loginSuccess) {
            throw new Error('Login failed after multiple attempts');
        }

        while (true) {
            let tweet = await generateTweet();
            if (tweet) {
                const postSuccess = await postTweet(page, tweet);
                if (!postSuccess) {
                    logger.warn('Failed to post tweet, retrying on next iteration...');
                }
            }

            await sleep(getRandomDelay(POST_INTERVAL, POST_VARIANCE));
            
            // Periodic state save to ensure data integrity
            if (Date.now() - cyrusState.memory.lastPostTime > 60 * 60 * 1000) {
                saveState(cyrusState);
            }
        }

    } catch (error) {
        logger.error(`Main loop error: ${error.message}`, { error });
    } finally {
        await browser.close();
    }
}

// Run main function
main().catch(error => {
    logger.error(`Fatal error starting bot: ${error.message}`, { error });
});