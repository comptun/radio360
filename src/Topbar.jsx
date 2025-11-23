import React, { useState, useEffect } from 'react';

let menus = [
    "Login", "Register"
]

function Topbar() {

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

    return <div className="topbar">
        <div className="topbar-item">
            <button className="topbar-button" name="Logo" type="button" onClick={(e) => handleClick(e)}>radio360</button>
        </div>
        <div className="topbar-item">
            <button className="topbar-button" name="Register" type="button" onClick={(e) => handleClick(e)}>Register</button>
        </div>
        <div className="topbar-item">
            <button className="topbar-button" name="Login" type="button" onClick={(e) => handleClick(e)}>Login</button>
        </div>
    </div>;
}

export default Topbar;