import { useI18n } from '../i18n/index.jsx';
import { Link } from '../lib/router.jsx';
import Section from '../design/Section.jsx';
import Hero from '../components/home/Hero.jsx';
import BodyMap from '../components/bodymap/BodyMap.jsx';
import Concierge from '../components/home/Concierge.jsx';
import ConsultStory from '../components/home/ConsultStory.jsx';
import Conditions from '../components/home/Conditions.jsx';
import HomeTrust from '../components/home/HomeTrust.jsx';
import PrepareChecklist from '../components/home/PrepareChecklist.jsx';
import Testimonials from '../components/home/Testimonials.jsx';
import FaqAccordion from '../components/home/FaqAccordion.jsx';
import CtaBand from '../components/home/CtaBand.jsx';
import { ArrowRightIcon } from '../components/Icons.jsx';
import Seo from '../components/seo/Seo.jsx';

/**
 * The home page tells one story in order: who and what (hero), where it hurts
 * (body map), which booking (concierge), how it works (story), what is
 * treated, who you will speak to, how to prepare, questions, and the way in.
 */
export default function Home() {
  const { t, tList } = useI18n();

  return (
    <>
      <Seo description={t('hero.lede')} />
      <Hero />

      <Section id="body-map" tone="paper" eyebrow={t('bodyMap.eyebrow')} title={t('bodyMap.title')} lede={t('bodyMap.lede')}>
        <BodyMap />
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-slate-500">{t('bodyMap.footnote')}</p>
      </Section>

      <Concierge />
      <ConsultStory />
      <Conditions />
      <HomeTrust />

      <section id="prepare" aria-labelledby="prepare-heading" className="bg-cream pb-20 sm:pb-24">
        <div className="container-page">
          <PrepareChecklist />
        </div>
      </section>

      <Testimonials />

      <Section
        id="faq"
        tone="paper"
        eyebrow={t('faq.eyebrow')}
        title={t('faq.title')}
        lede={t('faq.lede')}
        aside={
          <Link to="/faq" className="btn-secondary shrink-0 self-start lg:self-end">
            {t('footer.faqLink')}
            <ArrowRightIcon />
          </Link>
        }
      >
        <FaqAccordion items={tList('faq.items')} limit={4} />
      </Section>

      <CtaBand />
    </>
  );
}
