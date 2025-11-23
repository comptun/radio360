import React, { useState, useEffect } from 'react';
import User from './User'

function Register() {
    const [inputs, setInputs] = useState({
        username: "",
        password: "",
        passwordConfirm: ""
    });

    function handleChange(e) {
        const name = e.target.name;
        const value = e.target.value;
        setInputs(values => ({...values, [name]: value}))
    }

    async function handleSubmit() {
        await User.Register(inputs.username, inputs.password);
    }

    function handleExit() {
        document.getElementById("Register").style.display = "none";
    }

    return <div id="Register" className="register-container">
        <div className="form-item">
            Register
            <button className="exit-button topbar-button" type="button" onClick={handleExit}>x</button>
        </div>
        <div className="form-item">
            <input className="text-field" name="username" placeholder="username" type="text" value={inputs.username} onChange={handleChange}/>
        </div>
        <div className="form-item">
            <input type="password" className="text-field" name="password" placeholder="password" value={inputs.password} onChange={handleChange}/>
        </div>
        <div className="form-item">
            <input type="password" className="text-field" name="passwordConfirm" placeholder="repeat password" value={inputs.passwordConfirm} onChange={handleChange}/>
        </div>

        <div className="form-item">
            <button className="topbar-button" type="button" onClick={handleSubmit}>Register</button>
        </div>
    </div>;
}

export default Register;