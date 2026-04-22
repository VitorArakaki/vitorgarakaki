'use client'

import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Carousel.module.css';

const Carousel = ({ slides }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    const SWIPE_THRESHOLD = 50;

    const goToNextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1));
    };

    const goToPrevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1));
    };

    const handleSlideClick = () => {
        setPaused((prevPaused) => !prevPaused);
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = null;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        const delta = touchStartX.current - touchEndX.current;
        if (Math.abs(delta) >= SWIPE_THRESHOLD) {
            if (delta > 0) {
                goToNextSlide();
            } else {
                goToPrevSlide();
            }
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    useEffect(() => {
        if (!paused) {
            const interval = setInterval(goToNextSlide, 5000);
            return () => clearInterval(interval);
        }
    }, [currentIndex, paused]);

    if (!slides || slides.length === 0) {
        return <div>No slides to display</div>;
    }

    return (
        <div className={styles.carousel}>
            <div
                className={styles.slide}
                onClick={handleSlideClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className={styles.slideContent}>
                    <img src={slides[currentIndex].image} alt={`Slide ${currentIndex + 1}`} />
                    <div className={styles.texts}>
                        <span className={styles.title}>{slides[currentIndex].title}</span>
                        <span className={styles.description}>{slides[currentIndex].text}</span>
                    </div>
                </div>
            </div>
            <button className={styles.prevButton} onClick={goToPrevSlide}>
                &lt;
            </button>
            <button className={styles.nextButton} onClick={goToNextSlide}>
                &gt;
            </button>
        </div>
    );
};

export default Carousel;