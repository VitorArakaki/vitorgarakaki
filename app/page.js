import Image from "next/image";
import Link from "next/link"
import styles from "../styles/page.module.css";
import NavBar from "../components/NavBar";
import Carousel from "../components/Carousel";
import BlinkingTitle from "../components/BlinkingTitle";
import Card from "../components/Card";
import ImageGallery from "../components/ImageGallery";

export default function Home() {
  // Os slides futuramente deverão estar em um banco de dados
  const slides = [
    { image: '/assets/badges/aws-pract.png', title: 'AWS Certified Cloud Practitioner', text: 'O AWS Certified Cloud Practitioner valida a compreensão básica e de alto nível dos serviços, da terminologia e da Nuvem AWS.' },
    { image: '/assets/badges/data-foundation.png', title: 'Practitioner - D&A Foundation', text: 'Concluir 100% da jornada Fundacional de Dados do Programa de Capacitação em Dados e Analytics, que inclui vídeos, artigos e assessments.' },
    { image: '/assets/badges/data-engineer2.png', title: 'Professional - Data Engineering', text: 'A pessoa que detém esta badge tem conhecimentos aplicados e teóricos sobre Engenharia de Dados em um nível avançado, sendo capaz de aplicar, entender e avaliar as principais técnicas utilizadas na área para resolução de problemas.' },
    { image: '/assets/badges/leadership.png', title: 'Practitioner - Leadership D&A', text: 'Concluir 100% da jornada Dados & Analytics para Gestão do Programa de Capacitação em Dados e Analytics, que inclui vídeos, artigos e assessments.' },
    // Add more slides as needed
  ];

  // As formas de contato futuramente deverão estar em um banco de dados
  const contactsImages = [
    { id: 1, src: '/assets/contact/linkedin.png', alt: "Linkedin logo image", description: "Imagem da logo da rede social linkedin", link: "https://www.linkedin.com/in/vitor-arakaki" },
    { id: 2, src: 'assets/contact/github_light.png', alt: "Github logo image", description: "Imagem da logo da rede de projetos github", link: "https://github.com/VitorArakaki" },
    { id: 3, src: 'assets/contact/mail_light.png', alt: "Mail logo image", description: "Imagem da logo que reoresenta um email", link: "mailto:vi.arakaki@hotmail.com" },
    // Adicione mais imagens conforme necessário
  ];

  // As linguagens de programação futuramente deverão estar em um banco de dados
  const codes = [
    { id: 1, src: '/assets/codes/python-logo.png', alt: 'Python language code logo', description: 'Linguagem de programação Python', link: 'https://www.python.org' },
    { id: 2, src: '/assets/codes/dart-logo.png', alt: 'Dart language code logo', description: 'Linguagem de programação Dart', link: 'https://dart.dev' },
    { id: 3, src: '/assets/codes/js-logo.png', alt: 'JavaScript language code logo', description: 'Linguagem de programação JavaScript', link: 'https://www.javascript.com' },
    { id: 4, src: '/assets/codes/flutter-logo.png', alt: 'Flutter framework logo', description: 'Framework de programação Flutter', link: 'https://flutter.dev/' },
    { id: 5, src: '/assets/codes/nextjs-logo.png', alt: 'NextJS framework logo', description: 'Framework de programação NextJS', link: 'https://nextjs.org' },
    { id: 6, src: '/assets/codes/react-logo.png', alt: 'React framework logo', description: 'Framework de programação ReactJS', link: 'https://react.dev' },
  ]


  return (
    <main className={styles.main}>
      <NavBar />
      <div id="profileSection" className={styles.profile}>
        <div className={styles.profileImage}>
          <Link href="https://www.linkedin.com/in/vitor-arakaki/?locale=en_US" className={styles.profileImageLink}>
            <Image
              priority
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

            {codes.map((code) => (
              <div key={code.id + code.description}>
                <Link key={code.id + code.link} href={code.link} className={styles.profileImageLink}>
                  <Image
                    key={code.id + code.src}
                    src={code.src}
                    width={0}
                    height={0}
                    sizes="100vw"
                    quality={100}
                    style={{ width: '30px', height: '30px', maxHeight: '300px', maxWidth: '300px', objectFit: "contain", backgroundColor: "white", borderStyle: "solid", borderColor: "transparent", borderRadius: "5%", borderWidth: "1px", backgroundColor: 'transparent', marginLeft: '0.5vw' }} // optional
                    alt={code.alt}
                    title={code.description}
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.hrDivision} />
      <div id="badgeTitle" className={styles.badgeTitle}>
        <BlinkingTitle title="Badges" idVar="badges" blinkingItem="_" />
      </div>
      <div id="badgesSection" className={styles.badgeSlider}>
        <Carousel slides={slides} />
      </div>
      <div id="aboutSection" className={styles.about}>
        <div className={styles.aboutTitle}>
          <BlinkingTitle title="Sobre" idVar="about" blinkingItem="|" />
        </div>
        <Card imageUrl="/assets/eu-sobre.jpeg" title="Sobre mim" description="Nascido e criado em São Bernardo do Campo - SP, desde pequeno..." buttonText="Saber mais" />
      </div>
      <div id="contactSection" className={styles.contact}>
        <div className={styles.aboutTitle}>
          <BlinkingTitle title="Contato " idVar="contact" blinkingItem="" />
        </div>
        <div className={styles.imageGallery}>
          <ImageGallery images={contactsImages} />
        </div>
      </div>
      <div className={styles.hrDivision} />
      <div id="footerSection" className={styles.footer}>
        <span className={styles.developer}>Developed by Vitor Guirardeli Arakaki</span>
      </div>
    </main>
  );
}
