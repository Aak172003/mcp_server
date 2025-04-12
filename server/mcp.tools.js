
import { TwitterApi } from "twitter-api-v2"
import 'dotenv/config'


console.log("process.env.TWITTER_API_KEY ::::::::::: ", process.env.TWITTER_API_KEY)
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

export async function createPost(status) {
    console.log("status ::::::::::::: ", status)
    const newPost = await twitterClient.v2.tweet(status)
    console.log("newPost ::::::::::::: ", newPost)

    return {
        content: [
            {
                type: "text",
                text: `Tweeted: ${status}`
            }
        ]
    }
}