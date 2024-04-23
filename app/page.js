import Image from "next/image";
import Link from "next/link"
import styles from "../styles/page.module.css";
import NavBar from "../components/NavBar";
import Carousel from "../components/Carousel";
import BlinkingTitle from "../components/BlinkingTitle";

export default function Home() {
  const slides = [
    { image: '/assets/aws-pract.png', title: 'AWS Certified Cloud Practitioner', text: 'O AWS Certified Cloud Practitioner valida a compreensão básica e de alto nível dos serviços, da terminologia e da Nuvem AWS.' },
    { image: '/assets/data-foundation.png', title: 'Practitioner - D&A Foundation', text: 'Concluir 100% da jornada Fundacional de Dados do Programa de Capacitação em Dados e Analytics, que inclui vídeos, artigos e assessments.' },
    { image: '/assets/data-engineer2.png', title: 'Professional - Data Engineering', text: 'A pessoa que detém esta badge tem conhecimentos aplicados e teóricos sobre Engenharia de Dados em um nível avançado, sendo capaz de aplicar, entender e avaliar as principais técnicas utilizadas na área para resolução de problemas.' },
    { image: '/assets/leadership.png', title: 'Practitioner - Leadership D&A', text: 'Concluir 100% da jornada Dados & Analytics para Gestão do Programa de Capacitação em Dados e Analytics, que inclui vídeos, artigos e assessments.' },
    // Add more slides as needed
  ];


  return (
    <main className={styles.main}>
      <NavBar />
      <div id="profileSection" className={styles.profile}>
        <div className={styles.profileImage}>
          <Link href="https://www.linkedin.com/in/vitor-arakaki/?locale=en_US" className={styles.profileImageLink}>
            <Image
              src="/assets/eu.png"
              width={0}
              height={0}
              sizes="100vw"
              quality={100}
              style={{ width: '20vw', height: '20vw', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "rgba(250, 121, 0, 1)", borderRadius: "50%", borderWidth: "1px" }} // optional
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
      <div className={styles.hrDivision} />
      <div id="badgeTitle" className={styles.badgeTitle}>
        <BlinkingTitle title="Badges" />
      </div>
      <div id="badgesSection" className={styles.badgeSlider}>
        <Carousel slides={slides} />
      </div>
    </main>
  );
}
