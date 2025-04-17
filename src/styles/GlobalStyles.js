import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --background-dark: #121212;
    --background-light: #1e1e1e;
    --accent-green: #00ff00;
    --accent-yellow: #ffcc00;
    --text-light: #ffffff;
    --text-dark: #121212;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Arial', sans-serif;
    background-color: var(--background-dark);
    color: var(--text-light);
  }

  button {
    cursor: pointer;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background-color: var(--accent-green);
    color: var(--text-dark);
  }

  .btn-secondary {
    background-color: var(--accent-yellow);
    color: var(--text-dark);
  }

  input, select {
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #333;
    background-color: var(--background-light);
    color: var(--text-light);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
`;

export default GlobalStyles;