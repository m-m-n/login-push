const json = require("body-parser/lib/types/json");
const { v4: uuidv4 } = require("uuid");
const Valkey = require("iovalkey");
const webpush = require("web-push");

const sendNotification = async (req, res) => {
    try {
        const userId = req.body.userId;
        const token = uuidv4();

        // KEY: token, VALUE: userId
        // 有効期限3分
        const valkey = new Valkey({
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST,
        });
        const redisValue = {
            userId: userId,
            status: "waiting",
        };
        await valkey.set(token, JSON.stringify(redisValue), "EX", 180);

        const userList = await req.db("users")
            .where("userId", userId)
            .where("errorCount", "<", 3);
        for (const user of userList) {
            const subscription = {
                endpoint: user.endpoint,
                keys: {
                    p256dh: user.p256dh,
                    auth: user.auth,
                },
            };
            const payload = JSON.stringify({
                title: "ログイン認証",
                message: `${userId} としてログインします`,
                callbackUrl: `/api/authentication/${token}`,
                userId: userId,
            });

            webpush.setVapidDetails(
                process.env.VAPID_SUBJECT,
                process.env.VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY,
            );
            try {
                const pushResult = await webpush.sendNotification(subscription, payload);
            } catch (error) {
                console.error(error);
                await req.db("users")
                    .where("id", user.id)
                    .update({ errorCount: user.errorCount + 1 });
            }
        }

        res.status(200).json({ token: token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "PUSH通知に失敗しました" });
    }
};

module.exports = {
    sendNotification,
};
