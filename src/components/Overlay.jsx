import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

function Overlay(props) {
    return (
        <div class="overlay-loading">
            <ProgressSpinner />
        </div>
    );
}

export default Overlay;
