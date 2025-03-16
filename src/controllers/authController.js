const json = require("body-parser/lib/types/json");

const Valkey = require("iovalkey");

const authenticateUser = async (req, res) => {
    const token = req.params.token;
    const userId = req.body.userId;

    try {
        const valkey = new Valkey({
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST,
        });

        const redisResult = await valkey.get(token);
        const redisValue = JSON.parse(redisResult);
        if (redisValue.userId !== userId) {
            res.status(400).json({ message: "認証に失敗しました" });
        }

        redisValue.status = "authenticated";
        await valkey.set(token, JSON.stringify(redisValue), "EX", 30);

        res.status(200).json({ message: "" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "処理に失敗しました" });
    }
};

const checkAuthentication = async (req, res) => {
    const token = req.params.token;

    try {
        const valkey = new Valkey({
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST,
        });

        const userId = await (async () => {
            const interval = 1000;
            // トークンを保存してからの3分間以内にプッシュ通知のログインボタンを押す
            // ログインボタンを押してからの30秒間Redisに認証情報が保存される
            // 合計で3分30秒でデータが消える
            // プッシュ通知直後にcheckAuthenticationを呼ぶ想定なので3分30秒ループする
            const lastTime = Date.now() + 210000;
            while (Date.now() < lastTime) {
                const redisResult = await valkey.get(token);
                const redisValue = JSON.parse(redisResult);
                if (!redisValue) {
                    await new Promise((resolve) => setTimeout(resolve, interval));
                    continue;
                }

                if (redisValue.status === "unauthenticated") {
                    await valkey.del(token);
                    res.status(401).json({ message: "認証に失敗しました", userId: "" });
                }

                if (redisValue.status !== "authenticated") {
                    await new Promise((resolve) => setTimeout(resolve, interval));
                    continue;
                }

                return redisValue.userId;
            }

            res.status(408).json({ message: "認証処理がタイムアウトしました", userId: "" });
        })();

        await valkey.del(token);

        res.status(200).json({ message: "認証処理完了", userId: userId });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message, userId: "" });
    }
};

const unauthenticateUser = async (req, res) => {
    const token = req.params.token;
    const userId = req.body.userId;

    try {
        const valkey = new Valkey({
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST,
        });

        const redisResult = await valkey.get(token);
        const redisValue = JSON.parse(redisResult);
        if (redisValue.userId !== userId) {
            res.status(400).json({ message: "認証に失敗しました" });
        }

        redisValue.status = "unauthenticated";
        await valkey.set(token, JSON.stringify(redisValue), "EX", 30);

        res.status(200).json({ message: "" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "処理に失敗しました" });
    }
}

module.exports = {
    authenticateUser,
    checkAuthentication,
    unauthenticateUser,
};
