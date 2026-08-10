"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Eye,
  Sprout,
  Globe,
  Building2,
  Leaf,
  Zap,
  Sun,
  Wind,
  Handshake,
  Sparkles,
  Crown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { getPublicContent } from "@/app/actions/contentActions";
import ActivityCarousel from "@/app/ActivityCarouselClient";
import { getActivities } from "@/app/actions/activityActions";
import { useLanguage } from "@/i18n/LanguageProvider";

export const dynamic = "force-dynamic";

// Shared animation primitives
const fadeInUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
};

// Stagger parent — children stagger with a capped budget (~500ms for 3 items)
const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const ARTICLES = [
  {
    id: 1,
    title: "The Role of Biofuels in East Java's Transitioning Green Economy",
    category: "Academic Inquiry",
    date: "MAY 24, 2026",
    author: "R&D Division",
    readTime: "8 min read",
    desc: "An analytical deep-dive into agricultural waste biogas systems, local refinery integration, and the scalability of micro-scale biofuel converters in decentralized communities.",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1200&auto=format&fit=crop",
    featured: true,
  },
  {
    id: 2,
    title: "Smart Grid Systems: Decarbonizing Campus Power Infrastructures",
    category: "Engineering Analysis",
    date: "APRIL 12, 2026",
    author: "Operations Group",
    readTime: "5 min read",
    desc: "Evaluating real-time demand-response algorithms to optimize micro-generation across institutional campuses.",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop",
    featured: false,
  },
  {
    id: 3,
    title: "Evaluating Wind Potential on Jember's Southern Coastline",
    category: "Field Research",
    date: "MARCH 19, 2026",
    author: "Meteorology Team",
    readTime: "6 min read",
    desc: "Field-measured wind shear and velocity vectors analyzed to estimate micro-turbine generator efficiency.",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=400&auto=format&fit=crop",
    featured: false,
  },
];

const PARTNERS = ["SRE Indonesia", "UPN Veteran Jawa Timur", "SRE UPNVJT"];

function PartnerLogoImage({ partner, className }) {
  const [hasError, setHasError] = useState(false);
  const isStockPhoto = partner.logoUrl?.includes("unsplash.com");

  if (hasError || !partner.logoUrl || isStockPhoto) {
    return (
      <div className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 dark:bg-white/10 dark:hover:bg-white/15 text-white font-display font-black text-xs sm:text-sm tracking-wide uppercase whitespace-nowrap shadow-sm border border-white/25 dark:border-white/20 group-hover:scale-105 transition-all duration-300 backdrop-blur-md">
        <Handshake className="w-4 h-4 text-yellow-300 dark:text-emerald-400 shrink-0" />
        <span>{partner.name}</span>
      </div>
    );
  }

  return (
    <img
      src={partner.logoUrl}
      alt={partner.name}
      onError={() => setHasError(true)}
      className={className}
      title={partner.name}
    />
  );
}

const MOCK_ACTIVITIES = [
  {
    id: "mock-1",
    title: "RENEWABLE ENERGY CAMP",
    description: "A comprehensive training program on solar microgrids and local biogas system designs for youth leaders.",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "mock-2",
    title: "CAMPUS ENERGY AUDIT",
    description: "Conducting high-fidelity electrical consumption analysis and building-level energy efficiency audits across UPNVJT.",
    imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "mock-3",
    title: "ECO-INNOVATION COMPETITION",
    description: "Student innovation challenge focused on designing low-cost, decentralized green energy solutions for rural farming communities.",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop"
  }
];

const ACTIVITIES = [
  { id: 0, title: 'Campus Energy Audit', description: 'Conducting electrical consumption analysis and building-level energy efficiency studies.', image: '/images/about/PanelSurya.jpg' },
  { id: 1, title: 'Renewable Energy Project', description: 'Hands-on solar and wind energy installation projects for communities.', image: '/images/about/PanelSurya.jpg' },
  { id: 2, title: 'Study & Discussion', description: 'Weekly internal knowledge-sharing sessions on renewable energy topics.', image: '/images/about/PanelSurya.jpg' },
  { id: 3, title: 'Social Project', description: 'Community service initiatives focused on energy access for underserved areas.', image: '/images/about/PanelSurya.jpg' },
  { id: 4, title: 'External Events', description: 'Participating in national and international renewable energy competitions and conferences.', image: '/images/about/PanelSurya.jpg' },
];

export default function Home() {
  const { theme, resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [dbActivities, setDbActivities] = useState([]);

  useEffect(() => {
    setMounted(true);
    getActivities().then((res) => {
      if (res?.success && res?.data && res.data.length > 0) {
        setDbActivities(res.data);
      }
    });
  }, []);

  const isLight = mounted && (theme === "light" || resolvedTheme === "light");

  const [activeSection, setActiveSection] = useState("home");
  const [partnersList, setPartnersList] = useState([]);
  const [publicArticlesList, setPublicArticlesList] = useState([]);
  const [publicActivitiesList, setPublicActivitiesList] = useState([]);
  const [publicTestimonialsList, setPublicTestimonialsList] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

  const localActivities = ACTIVITIES.map((act) => {
    switch(act.id) {
      case 0: return { ...act, title: t("visitor.home.campus_audit_title"), description: t("visitor.home.campus_audit_desc") };
      case 1: return { ...act, title: t("visitor.home.re_project_title"), description: t("visitor.home.re_project_desc") };
      case 2: return { ...act, title: t("visitor.home.study_discussion_title"), description: t("visitor.home.study_discussion_desc") };
      case 3: return { ...act, title: t("visitor.home.social_project_title"), description: t("visitor.home.social_project_desc") };
      case 4: return { ...act, title: t("visitor.home.external_events_title"), description: t("visitor.home.external_events_desc") };
      default: return act;
    }
  });

  useEffect(() => {
    fetch('/api/partners')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setPartnersList(data); })
      .catch(console.error);
    
    fetch('/api/events/public')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map(ev => ({
            id: ev.id,
            title: ev.title,
            description: ev.description,
            imageUrl: ev.bannerUrl,
          }));
          setPublicActivitiesList(formatted.length > 0 ? formatted : MOCK_ACTIVITIES);
        } else {
          setPublicActivitiesList(MOCK_ACTIVITIES);
        }
      })
      .catch(() => { setPublicActivitiesList(MOCK_ACTIVITIES); });

    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setPublicTestimonialsList(data); })
      .catch(console.error);
    
    getPublicContent().then(res => {
      if (res.success && res.data) {
        const formatted = res.data.map((art, index) => ({
          id: art.id,
          title: art.title,
          category: "News",
          date: new Date(art.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase(),
          author: art.author?.name || "SRE UPNVJT",
          readTime: "5 min read",
          desc: art.body.substring(0, 150).replace(/<[^>]*>?/gm, '') + "...",
          image: art.imageUrl || "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1200&auto=format&fit=crop",
          featured: index === 0,
          slug: art.slug
        }));
        setPublicArticlesList(formatted.length > 0 ? formatted : ARTICLES);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const sections = ["home", "about", "activity", "article", "student", "merchandise"];
      const scrollPosition = window.scrollY + 120;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink antialiased">
      <main className="w-full flex flex-col overflow-hidden">

        {/* Hero Section */}
        <section
          id="home"
          className={`relative min-h-[90vh] sm:min-h-screen flex flex-col justify-center items-start py-16 sm:py-24 px-6 sm:px-12 md:px-20 lg:px-24 overflow-hidden ${
            isLight ? "bg-white" : "bg-[#0a1c15]"
          }`}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=1920&auto=format&fit=crop"
            className="absolute inset-0 w-full h-full object-cover z-0"
          >
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>
          
          {isLight ? (
            <div className="absolute inset-0 bg-black/45 z-0 pointer-events-none" style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }} />
          ) : (
            <>
              {/* Dark green multiply overlay for crisp dark mode contrast */}
              <div className="absolute inset-0 bg-[#0a2e24] opacity-80 mix-blend-multiply z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#08201a]/30 to-[#08201a]/80 z-0 pointer-events-none" />
            </>
          )}

          <div className="w-full max-w-7xl mx-auto z-10 flex flex-col justify-center items-start h-full mt-6 sm:mt-12 md:mt-20">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[48px] xs:text-[54px] sm:text-[76px] md:text-[105px] lg:text-[130px] xl:text-[145px] font-display font-black tracking-[-0.04em] leading-[0.85] uppercase flex flex-col items-start w-full drop-shadow-md"
            >
              <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
                <span className={isLight ? "text-white" : "text-white drop-shadow-md"}>SOCIETY</span>
                <span className={`text-[28px] xs:text-[32px] sm:text-[44px] md:text-[62px] lg:text-[76px] xl:text-[84px] font-serif italic font-normal normal-case tracking-normal transform -translate-y-1 sm:-translate-y-2 md:-translate-y-4 ${
                  isLight ? "text-white" : "text-[#e8ecc4]"
                }`}>of</span>
              </div>
              <div className="text-[#e8ecc4] drop-shadow-md">RENEWABLE</div>
              <div className={isLight ? "text-white" : "text-white drop-shadow-md"}>ENERGY</div>
            </motion.h1>
          </div>

          <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-12 md:right-16 lg:right-24 z-10 flex flex-col items-end pr-14 sm:pr-0">
            <span className={`text-[12px] sm:text-[13px] md:text-[14px] font-medium tracking-wide text-right ${
              isLight ? "text-white" : "text-white/90 drop-shadow-md"
            }`}>
              {t("visitor.home.student_org_at")} <strong className="text-white font-bold block sm:inline">UPN Veteran Jawa Timur</strong>
            </span>
          </div>

          <div className={`absolute bottom-0 left-0 w-full h-[2px] z-20 ${
            isLight ? "bg-yellow-300" : "bg-[#e8ecc4]"
          }`} />
        </section>


        {/* Marquee ticker */}
        <div className="bg-[#099c6d] dark:bg-[#050e09] border-y-2 border-white/25 dark:border-transparent py-4 sm:py-5 overflow-hidden flex select-none relative z-10" aria-hidden="true">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex whitespace-nowrap gap-12 sm:gap-16 px-6 sm:px-8 items-center shrink-0 min-w-full"
          >
            {Array(16).fill(PARTNERS).flat().map((p, idx) => (
              <div key={idx} className="flex items-center gap-4 sm:gap-6 shrink-0">
                <span className="text-xs sm:text-[13px] md:text-[14px] font-display font-semibold tracking-widest text-yellow-300 dark:text-white/50 uppercase">{p}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 dark:bg-white/30 shrink-0" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* About Section */}
        <section
          id="about"
          className="scroll-mt-20 relative bg-[#0bb37e] dark:bg-[#07130e] text-white py-14 sm:py-20 lg:py-24 px-6 sm:px-8 md:px-12 lg:px-20 flex items-center border-b-2 border-white/25 dark:border-transparent overflow-hidden"
        >
          {/* BACKGROUND ICONS — z-0 */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <Sun  style={{position:'absolute', top:'25%',  left:'40%',  width:20, height:20, opacity:0.04, color:'#10b981'}} />
            <Leaf style={{position:'absolute', top:'65%',  left:'55%',  width:18, height:18, opacity:0.04, color:'#10b981'}} />
            <Zap  style={{position:'absolute', top:'40%',  left:'70%',  width:16, height:16, opacity:0.04, color:'#10b981'}} />
            <Wind style={{position:'absolute', top:'55%',  left:'30%',  width:18, height:18, opacity:0.04, color:'#10b981'}} />
          </div>

          {/* MAIN GRID — z-10 */}
          <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-14 items-start">

            {/* LEFT COLUMN */}
            <div className="flex flex-col w-full">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black uppercase text-white leading-tight">
                  {t("visitor.home.about_sre")}
                </h2>
              </div>

              {/* 4:3 Landscape Image (Top-aligned with right paragraph on desktop) */}
              <div className="relative w-full max-w-[480px] lg:max-w-none mx-auto lg:mx-0 mt-4 sm:mt-5 lg:mt-2.5 aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-white/20 dark:border-white/10 group">
                <img
                  src="/images/about/PanelSurya.jpg"
                  alt="Panel Surya SRE UPN JATIM"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div style={{position:'absolute',top:10,right:10,width:20,height:20,borderTop:'2px solid #10b981',borderRight:'2px solid #10b981',zIndex:10}} />
                <div style={{position:'absolute',bottom:10,left:10,width:20,height:20,borderBottom:'2px solid #10b981',borderLeft:'2px solid #10b981',zIndex:10}} />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-5 sm:gap-6 w-full"
            >
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black uppercase text-white leading-tight">SRE INDONESIA</h3>
                <p className="mt-2 sm:mt-2.5 text-white/95 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
                  {t("visitor.home.about_desc_sre_id")}
                </p>
              </div>
              
              <hr className="border-white/15 dark:border-gray-800" />
              
              <div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-yellow-300 dark:text-emerald-400">SRE UPN JATIM</h3>
                <p className="mt-2 sm:mt-2.5 text-white/95 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
                  {t("visitor.home.about_desc_sre_upnvjt")}
                </p>
              </div>

              {/* Badge Row (Fully readable stat cards without truncation) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { text: t("visitor.home.founded"), value: "Est. 2021", Icon: Sprout },
                  { text: t("visitor.home.network"), value: "SRE Indonesia", Icon: Globe },
                  { text: t("visitor.home.campus"), value: "UPN Veteran Jatim", Icon: Building2 }
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-2.5 sm:p-3.5 border-2 bg-[#099c6d] border-yellow-300/60 dark:bg-[#093021] dark:border-emerald-500/60 flex flex-col items-start gap-1 shadow-md select-none hover:border-yellow-300 hover:bg-[#088c62] dark:hover:bg-[#0d422e] transition-all duration-300"
                  >
                    <stat.Icon className="text-yellow-300 dark:text-emerald-400 w-4 h-4 sm:w-5 sm:h-5 mb-0.5 shrink-0 drop-shadow-sm" aria-hidden="true" />
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-wider text-yellow-300 dark:text-emerald-300 leading-tight">
                      {stat.text}
                    </span>
                    <span className="text-[11px] sm:text-xs md:text-sm font-black text-white dark:text-gray-100 leading-tight break-words">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Link */}
              <div className="pt-1 sm:pt-2">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2.5 w-fit focus-visible:outline-emerald-600 focus-visible:outline-offset-4 rounded"
                >
                  <span className="relative text-xs sm:text-[13px] md:text-[14px] font-bold tracking-[0.15em] uppercase text-white dark:text-white after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1.5px] after:w-0 after:bg-yellow-300 dark:after:bg-emerald-400 after:transition-all after:duration-300 group-hover:after:w-full">
                    {t("visitor.home.learn_more")}
                  </span>
                  <motion.span
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="text-yellow-300 dark:text-emerald-400"
                  >
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  </motion.span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Activity Section */}
        <section
          id="activity"
          className="scroll-mt-20 bg-[#0cc48a] dark:bg-[#040e0a] py-10 sm:py-14 lg:py-12 xl:py-16 min-h-fit lg:min-h-screen px-4 sm:px-6 md:px-12 lg:px-20 border-b-2 border-white/25 dark:border-transparent relative overflow-hidden flex items-center justify-center"
        >
          <div className="w-full relative z-10 flex flex-col items-center">
            <div className="max-w-7xl mx-auto w-full flex flex-col justify-between items-center gap-3 sm:gap-4 lg:gap-5">
              
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-2xl mx-auto"
              >
                <div className="flex items-center justify-center gap-2 mb-1 lg:mb-1.5">
                  <span className="text-yellow-300 dark:text-emerald-400 text-base sm:text-lg leading-none select-none font-black">•</span>
                  <span className="text-[11px] sm:text-xs md:text-sm font-black tracking-[0.2em] text-yellow-300 dark:text-emerald-400 uppercase drop-shadow-md">
                    {t("visitor.home.what_we_do")}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-display font-black tracking-tight text-white dark:text-white uppercase leading-tight">
                  {t("visitor.home.our_activity_prefix")}<span className="text-yellow-300 dark:text-emerald-400">{t("visitor.home.our_activity_highlight")}</span>
                </h2>
                <div className="h-[3px] w-14 sm:w-16 bg-yellow-300 dark:bg-emerald-400 mx-auto mt-1.5 rounded-full" aria-hidden="true" />
                <p className="text-xs sm:text-sm text-white/95 dark:text-gray-300 max-w-lg mx-auto mt-1.5 sm:mt-2 font-normal leading-relaxed">
                  {t("visitor.home.activity_desc")}
                </p>
              </motion.div>

              {/* 3 Cards Carousel Row */}
              <ActivityCarousel activities={dbActivities.length > 0 ? dbActivities : localActivities} />

              {/* SEE ALL ACTIVITIES CTA Button */}
              <div className="w-full text-center mt-2.5 sm:mt-3.5">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Link
                    href="/activity"
                    className="group inline-flex items-center gap-2 border-2 border-yellow-300/60 hover:bg-yellow-300 hover:text-[#0cc48a] text-yellow-300 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-[#040e0a] font-bold tracking-wider text-xs uppercase px-6 sm:px-7 py-2 sm:py-2.5 rounded-full transition-all duration-300 focus-visible:outline-yellow-300 shadow-md"
                  >
                    {t("visitor.home.see_all")}
                    <ArrowUpRight className="w-3.5 h-3.5 text-yellow-300 group-hover:text-[#0cc48a] dark:text-emerald-400 dark:group-hover:text-[#040e0a] transition-colors" aria-hidden="true" />
                  </Link>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials */}
        {publicTestimonialsList.length > 0 && (
          <section className="bg-[#089668] dark:bg-[#07130e] border-t-2 border-white/25 dark:border-transparent py-16 sm:py-24 px-6 sm:px-8 md:px-12 lg:px-20 relative overflow-hidden">
            <div className="max-w-7xl mx-auto w-full flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="mb-10 sm:mb-12 text-center max-w-xl mx-auto"
              >
                <span className="text-xs sm:text-sm font-bold tracking-widest text-yellow-300 dark:text-emerald-400 uppercase mb-2 block">{t("visitor.home.testimonials")}</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-tight text-white dark:text-white uppercase leading-tight">{t("visitor.home.testimonials_title")}</h2>
                <p className="text-xs sm:text-sm md:text-base text-white/90 dark:text-white/60 mt-2.5 font-normal leading-relaxed">
                  {t("visitor.home.testimonials_desc")}
                </p>
              </motion.div>
              
              <motion.div
                variants={staggerParent}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-6xl"
              >
                {publicTestimonialsList.map((test) => (
                  <motion.div
                    key={test.id}
                    variants={staggerChild}
                    className="bg-white/10 dark:bg-white/5 border border-white/15 dark:border-white/8 p-5 sm:p-6 rounded-3xl flex flex-col justify-between shadow-sm relative group hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm"
                  >
                    <p className="text-xs sm:text-sm italic text-white/95 dark:text-white/70 mb-5 leading-relaxed font-normal">&ldquo;{test.content}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      {test.authorPhotoUrl ? (
                        <img src={test.authorPhotoUrl} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/20" />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 flex items-center justify-center text-yellow-300 dark:text-emerald-400 font-bold text-xs sm:text-sm" aria-hidden="true">
                          {test.authorName?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-white dark:text-white">{test.authorName}</div>
                        <div className="text-[10px] sm:text-[11px] text-white/70 dark:text-white/40">{test.authorPosition}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* Partners Showcase (100% Dynamic from Database) */}
        {(() => {
          const dbPartners = partnersList.filter(p => p.isActive !== false);
          if (!dbPartners || dbPartners.length === 0) return null;

          const platinumPartners = dbPartners.filter(p => {
            const t = (p.tier || "").toUpperCase();
            return t === "PLATINUM" || t === "LARGE" || t === "UTAMA";
          });

          const goldPartners = dbPartners.filter(p => {
            const t = (p.tier || "").toUpperCase();
            return t === "GOLD" || t === "MEDIUM";
          });

          const silverPartners = dbPartners.filter(p => {
            const t = (p.tier || "").toUpperCase();
            return t !== "PLATINUM" && t !== "LARGE" && t !== "UTAMA" && t !== "GOLD" && t !== "MEDIUM";
          });

          // If no specific tiers are set, show all in balanced grid
          const hasTiers = platinumPartners.length > 0 || goldPartners.length > 0;

          return (
            <section id="partners" className="scroll-mt-20 relative bg-[#099c6d] dark:bg-[#07130e] py-16 sm:py-24 md:py-32 px-6 sm:px-8 md:px-12 lg:px-20 overflow-hidden transition-colors duration-500">
              {/* Ambient Glow Effects */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-yellow-300/10 dark:bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center justify-center text-center">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center max-w-2xl"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 dark:bg-emerald-500/10 border border-white/25 dark:border-emerald-500/20 text-yellow-300 dark:text-emerald-400 text-[11px] sm:text-xs font-black tracking-widest uppercase shadow-md mb-3.5 backdrop-blur-md">
                    <Handshake className="w-3.5 h-3.5 text-yellow-300 dark:text-emerald-400" />
                    <span>{t("visitor.home.partners")}</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-white uppercase drop-shadow-md leading-tight">
                    {t("visitor.home.partners_prefix") || "MITRA "}<span className="text-yellow-300 dark:text-emerald-400">{t("visitor.home.partners_highlight") || "KAMI"}</span>
                  </h2>

                  <div className="h-[3px] sm:h-[4px] w-16 sm:w-20 bg-yellow-300 dark:bg-emerald-400 mx-auto mt-3 rounded-full" aria-hidden="true" />

                  <p className="text-xs sm:text-sm md:text-base text-white/90 dark:text-gray-300 mt-3 leading-relaxed font-normal max-w-lg">
                    {t("visitor.home.partners_desc")}
                  </p>
                </motion.div>

                {/* Unified Master Sponsor Board Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 24 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-5xl mx-auto rounded-3xl sm:rounded-[36px] md:rounded-[44px] p-4 sm:p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.35)] border-2 border-white/30 dark:border-emerald-500/30 relative overflow-hidden backdrop-blur-3xl mt-8 sm:mt-10 flex flex-col items-center gap-4 sm:gap-6 md:gap-8 bg-gradient-to-br from-white/20 via-white/10 to-white/15 dark:from-[#0b1c15]/95 dark:via-[#071510]/95 dark:to-[#040e0a]/95 group hover:border-yellow-300 dark:hover:border-emerald-400 transition-all duration-700"
                >
                  {/* Glowing Top Border Accent Sheen */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-yellow-300 dark:via-emerald-400 to-transparent opacity-90 z-20" />

                  {/* High-Tech Dot Matrix Pattern Overlay */}
                  <div className="absolute inset-0 opacity-[0.20] dark:opacity-[0.15] bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none" />

                  {/* Multi-Colored Ambient Glow Orbs inside the card */}
                  <div className="absolute -top-24 -right-24 w-80 h-80 bg-yellow-300/20 dark:bg-emerald-400/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400/20 dark:teal-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

                  {hasTiers ? (
                    <>
                      {/* Row 1: Large Logos (Platinum) */}
                      {platinumPartners.length > 0 && (
                        <div className="w-full flex flex-wrap justify-center items-center gap-3 sm:gap-6 md:gap-8 relative z-10">
                          {platinumPartners.map((partner) => (
                            <a
                              key={partner.id || partner.name}
                              href={partner.websiteUrl && partner.websiteUrl !== "#" ? partner.websiteUrl : undefined}
                              target={partner.websiteUrl && partner.websiteUrl !== "#" ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="group flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-5 bg-white dark:bg-[#f8fafc] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/20 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-yellow-400 dark:hover:border-emerald-400 transition-all duration-300"
                            >
                              <PartnerLogoImage
                                partner={partner}
                                className="h-9 sm:h-14 md:h-16 max-w-[180px] sm:max-w-[220px] md:max-w-[260px] object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Row 2: Medium Logos (Gold) */}
                      {goldPartners.length > 0 && (
                        <div className="w-full flex flex-wrap justify-center items-center gap-2.5 sm:gap-4 md:gap-6 relative z-10">
                          {goldPartners.map((partner) => (
                            <a
                              key={partner.id || partner.name}
                              href={partner.websiteUrl && partner.websiteUrl !== "#" ? partner.websiteUrl : undefined}
                              target={partner.websiteUrl && partner.websiteUrl !== "#" ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="group flex items-center justify-center px-5 py-3 sm:px-6 sm:py-4 bg-white dark:bg-[#f8fafc] rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/20 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-yellow-400 dark:hover:border-emerald-400 transition-all duration-300"
                            >
                              <PartnerLogoImage
                                partner={partner}
                                className="h-7 sm:h-10 md:h-12 max-w-[140px] sm:max-w-[170px] md:max-w-[200px] object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Row 3: Smaller Logos (Silver / Other) */}
                      {silverPartners.length > 0 && (
                        <div className="w-full flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4 relative z-10">
                          {silverPartners.map((partner) => (
                            <a
                              key={partner.id || partner.name}
                              href={partner.websiteUrl && partner.websiteUrl !== "#" ? partner.websiteUrl : undefined}
                              target={partner.websiteUrl && partner.websiteUrl !== "#" ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="group flex items-center justify-center px-4 py-2.5 sm:px-5 sm:py-3 bg-white dark:bg-[#f8fafc] rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-white/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-yellow-400 dark:hover:border-emerald-400 transition-all duration-300"
                            >
                              <PartnerLogoImage
                                partner={partner}
                                className="h-6 sm:h-8 md:h-9 max-w-[110px] sm:max-w-[130px] md:max-w-[150px] object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Default Flex Grid if no tiers */
                    <div className="w-full flex flex-wrap justify-center items-center gap-3 sm:gap-5 md:gap-6 relative z-10">
                      {dbPartners.map((partner) => (
                        <a
                          key={partner.id || partner.name}
                          href={partner.websiteUrl && partner.websiteUrl !== "#" ? partner.websiteUrl : undefined}
                          target={partner.websiteUrl && partner.websiteUrl !== "#" ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="group flex items-center justify-center px-6 py-4 sm:px-8 sm:py-5 bg-white dark:bg-[#f8fafc] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/20 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-yellow-400 dark:hover:border-emerald-400 transition-all duration-300"
                        >
                          <PartnerLogoImage
                            partner={partner}
                            className="h-8 sm:h-12 md:h-14 max-w-[160px] sm:max-w-[200px] md:max-w-[240px] object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </section>
          );
        })()}
      </main>
    </div>
  );
}
