'use client'

import Link from 'next/link';
import React, { useState } from 'react';
import styles from '../styles/ImageGallery.module.css'; // Importe o arquivo CSS para estilos

const ImageGallery = ({ images }) => { // Recebe as imagens como propriedade
    const [highlightedImage, setHighlightedImage] = useState(null); // Estado para imagem destacada

    return (
        <div className={styles.imageGallery}>
            {images.map((image) => (
                <Link href={image.link} key={image.id + image.link}>
                    <img
                        key={image.id}
                        src={image.src}
                        alt={`Imagem ${image.id}`}
                        className={highlightedImage === image.id ? styles.highlighted : styles.image}
                        onMouseEnter={() => setHighlightedImage(image.id)}
                        onMouseLeave={() => setHighlightedImage(null)}
                    />
                </Link>
            ))}
        </div>
    );
};

export default ImageGallery;
