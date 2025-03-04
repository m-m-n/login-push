const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

const knexConfig = require("./knexfile");
const environment = process.env.ENVIRONMENT || "development";
const knex = require("knex")(knexConfig[environment]);

const app = express();
const port = process.env.WEB_PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.db = knex;
    next();
});

/**
 * 1. index.htmlよりJavaScriptからユーザー登録が行われる
 *   - `/api/users`
 *   - POST
 * 2. システムのログイン時に指定されたユーザーIDに対しプッシュ通知を送信する
 *   - `/api/notifications`
 *   - POST
 *   - { userId: "ユーザーID" }
 *   - プッシュ通知のダイアログにログインボタンが表示される
 *   - Redisに認証情報を保存する
 *     - KEY: token, VALUE: { userId: "ユーザーID", status: "waiting" }
 *     - 有効期限は3分
 *   - Redisに保存された情報をレスポンスとして返す
 *   - システムのログイン画面に正しい2桁の数字を表示する
 * 3. プッシュ通知を受けとったら画面に表示されている2桁の数字と同じボタンを押す
 *   - `/api/authentication/${token}`
 *   - POST
 *   - { userId: "ユーザーID" }
 *   - Redisに保存された認証情報と照合する
 *   - 認証情報が正しい場合はRedisのステータスを"authenticated"に変更する
 *     - KEY: token, VALUE: { userId: "ユーザーID", status: "authenticated" }
 *     - 有効期限は30秒
 * 4. システム側から認証確認APIにトークンを送信する
 *   - `/api/authentication/${token}`
 *   - GET
 *   - Redisに保存された情報と照合する
 *   - Redisにデータが存在し、かつステータスが"authenticated"の場合は認証成功
 *   - ユーザーIDを返却する
 *   - システム側でユーザーIDの照合を行い、一致したらログインする
 */
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/authentication", authRoutes);

// VAPID公開鍵をクライアントから取得するためのエンドポイント
app.get("/public-key", (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.listen(port, () => {
    console.log("Server Started");
});
