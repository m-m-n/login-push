const createUser = (req, res) => {
    // userIdとsubscriptionがリクエストボディに含まれている
    const userId = req.body.userId;
    const endpoint = req.body.subscription.endpoint;
    const p256dh = req.body.subscription.keys.p256dh;
    const auth = req.body.subscription.keys.auth;
    const expirationTime = req.body.subscription.expirationTime;

    // データベースに保存する
    req.db("users")
        .insert({
            userId: userId,
            endpoint: endpoint,
            p256dh: p256dh,
            auth: auth,
            expirationTime: expirationTime,
        })
        .then(() => {
            res.status(200).json({ message: "success" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "failed" });
        });
};

module.exports = {
    createUser,
};
