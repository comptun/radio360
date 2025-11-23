import React, { useState, useEffect } from 'react';

function Register() {
    const [inputs, setInputs] = useState({
        username: "",
        password: ""
    });

    function handleChange(e) {
        const name = e.target.name;
        const value = e.target.value;
        setInputs(values => ({...values, [name]: value}))
    }

    async function handleSubmit() {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inputs)
        });

        const data = await res.json();
        console.log("Response:", data);
    }

    return <div className="register-container">
        <div className="form-item">Register</div>
        <div className="form-item">
            <input name="username" placeholder="username" type="text" value={inputs.username} onChange={handleChange}/>
        </div>
        <div className="form-item">
            <input name="password" placeholder="password" type="text" value={inputs.password} onChange={handleChange}/>
        </div>

        <div className="form-item">
            <button type="button" onClick={handleSubmit}>Register</button>
        </div>
    </div>;
}

export default Register;