import React, { useState, useEffect } from 'react';
import User from './User'

let menus = [
    "Login", "Register"
]

function Topbar({user, onLogin, onLogout}) {

    const [inputsRegister, setInputsRegister] = useState({
        username: "",
        password: "",
        passwordConfirm: ""
    });

    const [inputsLogin, setInputsLogin] = useState({
        username: "",
        password: ""
    });

    useEffect(() => {
        for (let i = 0; i < menus.length; i++) {
            document.getElementById(menus[i]).style.display = "none";
        }
        
        console.log(User.Data);
    }, []);

    function handleChangeRegister(e) {
        const name = e.target.name;
        const value = e.target.value;
        setInputsRegister(values => ({...values, [name]: value}))
    }
    function handleChangeLogin(e) {
        const name = e.target.name;
        const value = e.target.value;
        setInputsLogin(values => ({...values, [name]: value}))
    }

    function handleClick(e) {

        let displayVal = document.getElementById(e.target.name).style.display;

        for (let i = 0; i < menus.length; i++) {
            document.getElementById(menus[i]).style.display = "none";
        }

        if (displayVal == "none") {
            document.getElementById(e.target.name).style.display = "block";
        }
        else {
            document.getElementById(e.target.name).style.display = "none";
        }
    }

    function handleRegister() {
        User.Register(inputsRegister.username, inputsRegister.password);
        onLogin(User.Data);
    }

    function handleLogin() {
        User.Login(inputsLogin.username, inputsLogin.password);
        console.log(User.Data);
        onLogin(User.Data);
    }

    function handleExit() {
        document.getElementById("Register").style.display = "none";
        document.getElementById("Login").style.display = "none";
    }

    return (<>

    <div id="Login" className="register-container">
        <div className="form-item">
            Login
            <button className="exit-button topbar-button" type="button" onClick={handleExit}>x</button>
        </div>
        <div className="form-item">
            <input className="text-field" name="username" placeholder="username" value={inputsLogin.username} onChange={handleChangeLogin}/>
        </div>
        <div className="form-item">
            <input type="password" className="text-field" name="password" placeholder="password" value={inputsLogin.password} onChange={handleChangeLogin}/>
        </div>

        <div className="form-item">
            <button className="topbar-button" type="button" onClick={handleLogin}>Login</button>
        </div>
    </div>

    <div id="Register" className="register-container">
        <div className="form-item">
            Register
            <button className="exit-button topbar-button" type="button" onClick={handleExit}>x</button>
        </div>
        <div className="form-item">
            <input className="text-field" name="username" placeholder="username" type="text" value={inputsRegister.username} onChange={handleChangeRegister}/>
        </div>
        <div className="form-item">
            <input type="password" className="text-field" name="password" placeholder="password" value={inputsRegister.password} onChange={handleChangeRegister}/>
        </div>
        <div className="form-item">
            <input type="password" className="text-field" name="passwordConfirm" placeholder="repeat password" value={inputsRegister.passwordConfirm} onChange={handleChangeRegister}/>
        </div>

        <div className="form-item">
            <button className="topbar-button" type="button" onClick={handleRegister}>Register</button>
        </div>
    </div>
    
    <div className="topbar" key={user}>
        <div className="topbar-item">
            <button className="topbar-button" name="Logo" type="button">radio360</button>
        </div>
        {!user ? (<>
        <div className="topbar-item">
            <button className="topbar-button" name="Register" type="button" onClick={(e) => handleClick(e)}>Register</button>
        </div>
        <div className="topbar-item">
            <button className="topbar-button" name="Login" type="button" onClick={(e) => handleClick(e)}>Login</button>
        </div>
        </>) : (
            <div className="topbar-item">
                <button className="topbar-button" name="Logout" type="button" onClick={onLogout}>Logout</button>
            </div>
        )}
    </div>
    
    </>
    );
}

export default Topbar;