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

    return <div id="Login" className="register-container">
        <div className="form-item">Login</div>
        <div className="form-item">
            <input name="username" placeholder="username" type="text" value={inputs.username} onChange={handleChange}/>
        </div>
        <div className="form-item">
            <input name="password" placeholder="password" type="text" value={inputs.password} onChange={handleChange}/>
        </div>

        <div className="form-item">
            <button type="button" onClick={handleSubmit}>Login</button>
        </div>
    </div>;
}

export default Login;