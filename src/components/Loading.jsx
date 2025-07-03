import React from 'react';
import logo from '../assets/icons/MachLogoLight.png';

function Loading(props) {
    return (
        <div className="flex justify-content-center h-30rem align-items-center">
            <img className="flip-horizontal" style={{
                width: 100,
                height: 100,
                objectFit: 'contain'
            }} src={logo} alt="MachTech Logo"/>
        </div>
    );
}

export default Loading;
