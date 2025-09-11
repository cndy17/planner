import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/AppLayout';
import './App.css';

function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;