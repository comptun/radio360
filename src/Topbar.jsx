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

        for (let i = 0; i < menus.length; i++) {
            document.getElementById(menus[i]).style.display = "none";
        }

        let displayVal = document.getElementById(e.target.name).style.display;
        if (displayVal == "none") {
            document.getElementById(e.target.name).style.display = "block";
        }
        else {
            document.getElementById(e.target.name).style.display = "none";
        }
    }

    return <div className="topbar">
        <div className="topbar-item">
            <button className="topbar-button" name="Register" type="button" onClick={(e) => handleClick(e)}>Register</button>
        </div>
        <div className="topbar-item">
            <button className="topbar-button" name="Login" type="button" onClick={(e) => handleClick(e)}>Login</button>
        </div>
    </div>;
}

export default Topbar;