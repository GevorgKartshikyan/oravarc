import React from 'react';
import logo from '../assets/logo.jpg'
function Overlay(props) {
    return (
        <div className="overlay-loading">
            <img className="loading-logo" src={logo} alt=""/>
        </div>
    );
}

export default Overlay;
