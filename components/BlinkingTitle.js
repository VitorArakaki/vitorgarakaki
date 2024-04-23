'use client'

import { useEffect } from 'react';
import styles from '../styles/BlinkingTitle.module.css'

const BlinkingTitle = ({ title }) => {
    useEffect(() => {
        const interval = setInterval(() => {
            const underscore = document.getElementById('underscore');
            underscore.style.visibility = (underscore.style.visibility === 'hidden') ? 'visible' : 'hidden';
        }, 500); // Adjust the blinking speed as needed (500 milliseconds in this example)

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <span id="static-text" className={styles.title}>{title}</span>
            <span id="underscore" className={styles.blink}>_</span>
        </div>
    );
};

export default BlinkingTitle;
