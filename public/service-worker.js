self.addEventListener("install", function (event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
    const data = event.data.json();
    const options = {
        body: data.message,
        icon: "./images/icon-256x256.png",
        data: data,
        actions: [
            { action: "login", title: "ログイン", type: 'button' },
        ],
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    if (event.action === "login") {
        event.waitUntil(
            fetch(event.notification.data.callbackUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: event.notification.data.userId,
                }),
            }).then((response) => {
                return response.json();
            }).then((json) => {
                console.log(json);
            }).catch((error) => {
                console.error(error);
            })
        );
    }
});

self.addEventListener("notificationclose", function (event) {
    if (event.action === "login") {
        return;
    }

    event.waitUntil(
        fetch(event.notification.data.callbackUrl, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: event.notification.data.userId,
            }),
        }).then((response) => {
            return response.json();
        }).then((json) => {
            console.log(json);
        }).catch((error) => {
            console.error(error);
        })
    );
});
