import React, { useState, useEffect } from 'react';
import User from './User'

function Login() {
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
        await User.Login(inputs.username, inputs.password);
    }

    function handleExit() {
        document.getElementById("Login").style.display = "none";
    }

    return <div id="Login" className="register-container">
        <div className="form-item">
            Login
            <button className="exit-button topbar-button" type="button" onClick={handleExit}>x</button>
        </div>
        <div className="form-item">
            <input type="password" className="text-field" name="username" placeholder="username" value={inputs.username} onChange={handleChange}/>
        </div>
        <div className="form-item">
            <input type="password" className="text-field" name="password" placeholder="password" value={inputs.password} onChange={handleChange}/>
        </div>

        <div className="form-item">
            <button className="topbar-button" type="button" onClick={handleSubmit}>Login</button>
        </div>
    </div>;
}

export default Login;