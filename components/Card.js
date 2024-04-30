import Link from 'next/link';
import styles from '../styles/Card.module.css'

const Card = ({ imageUrl, title, description, buttonText }) => {
    return (
        <div className={styles.card}>
            <div className={styles.cardImage}>
                <img src={imageUrl} alt="Imagem" />
            </div>
            <div className={styles.cardContent}>
                <div className={styles.cardTexts}>
                    <span className={styles.cardTitle}>{title}</span>
                    <span className={styles.cardDescription}>{description}</span>
                </div>
                <div className={styles.cardButton}>
                    <Link href="/about"><button>{buttonText}</button></Link>
                </div>
            </div>
        </div>
    );
};

export default Card;
