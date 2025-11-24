

const User = {
    Data: null,
    Register:
        async function (username, password) {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    "username": username,
                    "password": password
                })
            });

            const data = await res.json();
            if (data.success) {
                User.Data = data.data;
                return data;
            }
            return null;
        },
    Login:
        async function (username, password) {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    "username": username,
                    "password": password
                })
            });

            const data = await res.json();
            if (data.success) {
                User.Data = data.data;
                return data;
            }
            return null;
        },
    GetUser:
        async function () {
            const res = await fetch("/api/me");
            const data = await res.json();
            if (data.success) {
                User.Data = data.data;
                console.log(User.Data);
                return data;
            }
            return null;
        },
    Logout:
        async function () {
            const res = await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                User.Data = null;
                return data;
            }
            return null;
        }
};

export default User;