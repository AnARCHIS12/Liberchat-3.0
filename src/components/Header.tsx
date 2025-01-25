import React from 'react';
import logo from '../assets/liberchat-logo.svg';
import '../styles/Header.css';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="logo-container">
        <img src={logo} alt="Liberchat Logo" className="app-logo" />
        <h1>LiberChat</h1>
      </div>
    </header>
  );
};

export default Header;
