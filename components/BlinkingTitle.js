'use client'

import { useEffect } from 'react';
import styles from '../styles/BlinkingTitle.module.css'

const BlinkingTitle = ({ title, idVar, blinkingItem = "_", blinkInterval = 500, fontSize = "2.5vw" }) => {
    useEffect(() => {
        const interval = setInterval(() => {
            const underscore = document.getElementById(idVar);
            underscore.style.visibility = (underscore.style.visibility === 'hidden') ? 'visible' : 'hidden';
        }, blinkInterval); // Adjust the blinking speed as needed (500 milliseconds in this example)

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <span id="static-text" className={styles.title} style={{ fontSize }}>{title}</span>
            <span id={idVar} className={styles.blink} style={{ fontSize }}>{blinkingItem}</span>
        </div>
    );
};

export default BlinkingTitle;
