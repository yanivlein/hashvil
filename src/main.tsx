import { render } from 'preact';
import './fonts/assistant.css';
import './styles/tokens.css';
import './styles/trail-tokens.css';
import './styles/app.css';
import './styles/ambient.css';
import { App } from './app';

render(<App />, document.getElementById('app')!);
