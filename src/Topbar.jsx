import React, { useState, useEffect } from 'react';
import User from './User'

let menus = [
    "Login", "Register"
]

function Topbar() {

    let buttons;

    useEffect(() => {
        for (let i = 0; i < menus.length; i++) {
            document.getElementById(menus[i]).style.display = "none";
        }

    });

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

    console.log(User.Data);
    if (User.Data == null) {
        buttons = <>
            <div className="topbar-item">
                <button className="topbar-button" name="Register" type="button" onClick={(e) => handleClick(e)}>Register</button>
            </div>
            <div className="topbar-item">
                <button className="topbar-button" name="Login" type="button" onClick={(e) => handleClick(e)}>Login</button>
            </div>
        </>;
    }
    else {
        buttons = <>
            <div className="topbar-item">
                <button className="topbar-button" name="Register" type="button" onClick={(e) => handleClick(e)}>{User.Data.username}</button>
            </div>
            <div className="topbar-item">
                <button className="topbar-button" name="Login" type="button" onClick={(e) => handleClick(e)}>Logout</button>
            </div>
        </>;
    }

    return <div className="topbar">
        <div className="topbar-item">
            <button className="topbar-button" name="Logo" type="button">radio360</button>
        </div>
        {buttons}
    </div>;
}

export default Topbar;