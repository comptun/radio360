const User = {
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
            console.log("Response:", data);
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
            console.log("Response:", data);
        }
};

export default User;