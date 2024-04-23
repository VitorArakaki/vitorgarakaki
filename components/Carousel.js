'use client'

import { useState, useEffect } from 'react';
import styles from '../styles/Carousel.module.css';

const Carousel = ({ slides }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    const goToNextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1));
    };

    const goToPrevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1));
    };

    const handleSlideClick = () => {
        setPaused((prevPaused) => !prevPaused);
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
            <div className={styles.slide} onClick={handleSlideClick}>
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