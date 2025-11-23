async function loadUsers() {
  const res = await fetch("/api/me");
  const data = await res.json();
  console.log(data);
}

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
            }
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
            }
        },
    GetUser:
        async function () {
            const res = await fetch("/api/me");
            const data = await res.json();
            if (data.success) {
                User.Data = data.data;
            }
        }
};

export default User;