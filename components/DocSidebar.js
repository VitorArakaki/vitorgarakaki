"use client";

import styles from "../styles/DocSidebar.module.css";

const DocSidebar = ({ sections }) => {
    const handleClick = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <nav className={styles.sidebar}>
            <span className={styles.sidebarTitle}>Conteúdo</span>
            <ul className={styles.sidebarList}>
                {sections.map((section) => (
                    <li key={section.id}>
                        <a
                            href={`#section-${section.id}`}
                            className={styles.sidebarLink}
                            onClick={(e) => handleClick(e, `section-${section.id}`)}
                        >
                            {section.title}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default DocSidebar;
