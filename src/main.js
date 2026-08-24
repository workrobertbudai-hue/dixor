import './styles/main.css';
import './styles/interface.css';
import './styles/welcome.css';
import { App } from './core/app.js';

const app = new App(document.getElementById('app'));
app.init();

window.__DIXOR__ = app; // debug handle