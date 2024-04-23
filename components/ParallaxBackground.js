'use client'
import { useEffect, useState } from 'react';
import styles from '../styles/ParallaxBackground.module.css';

const ParallaxBackground = ({ imageUrl }) => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div
            className={styles.parallaxBackground}
            style={{ backgroundImage: `url(${imageUrl})`, transform: `translateY(-${scrollY * 0.5}px)` }}
        />
    );
};

export default ParallaxBackground;
