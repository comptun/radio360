// Handles requests sent by the user
const User = {
    // Stores user related data if logged in
    Data: null,
    // Sends a request to create an account
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
    // Sends a request to login to an existing account
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
    // Gets the user info for the logged in user
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
    // Logs the user out
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