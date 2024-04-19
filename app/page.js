import Image from "next/image";
import Link from "next/link"
import styles from "../styles/page.module.css";
import NavBar from "../components/NavBar";

export default function Home() {
  return (
    <main className={styles.main}>
      <NavBar />
      <div className={styles.profile}>
        <div className={styles.profileImage}>
          <Link href="https://www.linkedin.com/in/vitor-arakaki/?locale=en_US" className={styles.profileImageLink}>
            <Image
              src="/assets/eu.png"
              width={0}
              height={0}
              sizes="100vw"
              quality={100}
              style={{ width: '100vw', height: '100vh', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "rgba(250, 121, 0, 1)", borderRadius: "50%", borderWidth: "1px" }} // optional
              alt="Picture of the author"
            />
          </Link>
        </div>
        <div className={styles.profileBio}>
          <span className={styles.profileName}>
            Vitor Guirardeli Arakaki 🇧🇷
          </span>
          <span className={styles.profileJob}>
            Engenheiro de Dados Sênior
          </span>
          <div className={styles.profileCodeLanguages}>
            <span>Linguagens de programação:</span>

            <Link href="https://www.python.org" className={styles.profileImageLink}>
              <Image
                src="/assets/python-logo.png"
                width={0}
                height={0}
                sizes="100vw"
                quality={100}
                style={{ width: '30px', height: '30px', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "transparent", borderRadius: "5%", borderWidth: "1px", backgroundColor: 'transparent', marginLeft: '0.5vw' }} // optional
                alt="Python language code logo"
                title="Linguagem de programação Python"
              />
            </Link>

            <Link href="https://dart.dev" className={styles.profileImageLink}>
              <Image
                src="/assets/dart-logo.png"
                width={0}
                height={0}
                sizes="100vw"
                quality={100}
                style={{ width: '30px', height: '30px', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "transparent", borderRadius: "5%", borderWidth: "1px", backgroundColor: 'transparent', marginLeft: '0.5vw' }} // optional
                alt="Dart language code logo"
                title="Linguagem de programação Dart"
              />
            </Link>

            <Link href="https://www.javascript.com" className={styles.profileImageLink}>
              <Image
                src="/assets/js-logo.png"
                width={0}
                height={0}
                sizes="100vw"
                quality={100}
                style={{ width: '30px', height: '30px', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "transparent", borderRadius: "5%", borderWidth: "1px", backgroundColor: 'transparent', marginLeft: '0.5vw' }} // optional
                alt="JavaScript language code logo"
                title="Linguagem de programação JavaScript"
              />
            </Link>
            <Link href="https://flutter.dev/" className={styles.profileImageLink}>
              <Image
                src="/assets/flutter-logo.png"
                width={0}
                height={0}
                sizes="100vw"
                quality={100}
                style={{ width: '30px', height: '30px', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "transparent", borderRadius: "5%", borderWidth: "1px", backgroundColor: 'transparent', marginLeft: '0.5vw' }} // optional
                alt="Flutter framework logo"
                title="Framework de programação Flutter"
              />
            </Link>
            <Link href="https://nextjs.org" className={styles.profileImageLink}>
              <Image
                src="/assets/nextjs-logo.png"
                width={0}
                height={0}
                sizes="100vw"
                quality={100}
                style={{ width: '30px', height: '30px', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "transparent", borderRadius: "5%", borderWidth: "1px", backgroundColor: 'transparent', marginLeft: '0.5vw' }} // optional
                alt="NextJS framework logo"
                title="Framework de programação NextJS"
              />
            </Link>
            <Link href="https://react.devS" className={styles.profileImageLink}>
              <Image
                src="/assets/react-logo.png"
                width={0}
                height={0}
                sizes="100vw"
                quality={100}
                style={{ width: '30px', height: '30px', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "transparent", borderRadius: "5%", borderWidth: "1px", backgroundColor: 'transparent', marginLeft: '0.5vw' }} // optional
                alt="React framework logo"
                title="Framework de programação ReactJS"
              />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
