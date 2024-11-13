import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

export const twitter = new TwitterApi({
    username: process.env.TWITTER_USERNAME,
    password: process.env.TWITTER_PASSWORD,
    email: process.env.TWITTER_EMAIL,
});

export async function postTweet(content) {
    try {
        const tweet = await twitter.v2.tweet(content);
        return tweet.data.id;
    } catch (error) {
        console.error('Error posting tweet:', error);
        throw error;
    }
}

export async function postReply(content, replyToId) {
    try {
        const reply = await twitter.v2.reply(content, replyToId);
        return reply.data.id;
    } catch (error) {
        console.error('Error posting reply:', error);
        throw error;
    }
}

export async function getMentions(sinceId) {
    try {
        return await twitter.v2.mentions({ 
            since_id: sinceId,
            max_results: 10
        });
    } catch (error) {
        console.error('Error getting mentions:', error);
        throw error;
    }
}