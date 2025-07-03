import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {PrimeReactProvider} from 'primereact/api';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'primereact/resources/primereact.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <PrimeReactProvider>
        <App/>
    </PrimeReactProvider>
);

