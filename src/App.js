import React from 'react';

import SpaceDolphin from '../assets/space_dolphin.png';
import ReactWheel from '../assets/react_wheel.png';

export function App() {
  return (
    <div className="main_container">
      <div className="space_dolphin_container">
        <img className="space_dolphin" src={SpaceDolphin} />
      </div>
      <div className="react_wheel">
        <img src={ReactWheel} />
      </div>
      <div className="happy_hacking">Happy Hacking.</div>
    </div>
  );
}
