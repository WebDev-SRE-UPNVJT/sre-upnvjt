"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Rocket,
  CheckCircle2,
  Clock,
  CalendarClock,
  MapPin,
  X,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { getPublicContent } from "@/app/actions/contentActions";
import ActivityCarousel from "@/app/ActivityCarouselClient";

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

function resolveLogoUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://cdn.webly.biz.id/";
  return `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://cdn.webly.biz.id/";
  return `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

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
      src={resolveLogoUrl(partner.logoUrl)}
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



const HERO_IMAGES = [
  "/images/hero/gambar1.jpg",
  "/images/hero/gambar2.jpg",
  "/images/hero/gambar3.jpg"
];

const PROJECT_STATUS_CONFIG = {
  ONGOING:   { label: "status_ongoing",   icon: Clock,         cls: "bg-yellow-300/20 text-yellow-300 dark:bg-yellow-400/15 dark:text-yellow-300" },
  COMPLETED: { label: "status_completed", icon: CheckCircle2,   cls: "bg-emerald-300/20 text-white dark:bg-emerald-400/15 dark:text-emerald-300" },
  PLANNED:   { label: "status_planned",   icon: CalendarClock,  cls: "bg-white/15 text-white dark:bg-white/10 dark:text-gray-300" },
};

export default function Home() {
  const { theme, resolvedTheme } = useTheme();
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [dbActivities, setDbActivities] = useState([]);
  const [pastActivities, setPastActivities] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [featuredProjectsList, setFeaturedProjectsList] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [modalActivity, setModalActivity] = useState(null);
  const [modalImageLoaded, setModalImageLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch activities from public REST API (same pattern as 'Our Activity' section)
    fetch("/api/activities/public")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbActivities(data);

          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const past = data.filter((a) => a.date && new Date(a.date) < now);
          const upcoming = data.filter((a) => a.date && new Date(a.date) >= now);

          // Priority sorting for upcoming activities (isAnnouncementModal -> isPriority -> date)
          upcoming.sort((a, b) => {
            if (a.isAnnouncementModal !== b.isAnnouncementModal) {
              return a.isAnnouncementModal ? -1 : 1;
            }
            if (a.isPriority !== b.isPriority) {
              return a.isPriority ? -1 : 1;
            }
            return new Date(a.date) - new Date(b.date);
          });

          setPastActivities(past);
          setUpcomingActivities(upcoming);

          // Find priority/announcement activity for Modal popup
          const priorityEvent = upcoming.find((a) => a.isAnnouncementModal || a.isPriority) ||
                                data.find((a) => a.isAnnouncementModal || a.isPriority);

          if (priorityEvent) {
            const triggerModalOpen = () => {
              setModalActivity(priorityEvent);
              const hasShown = sessionStorage.getItem("sre_priority_modal_shown");
              if (!hasShown) {
                setPriorityModalOpen(true);
                sessionStorage.setItem("sre_priority_modal_shown", "true");
              }
            };

            if (priorityEvent.imageUrl) {
              const fullUrl = resolveImageUrl(priorityEvent.imageUrl);
              if (typeof window !== "undefined" && window.Image) {
                const img = new window.Image();
                img.src = fullUrl;
                if (img.complete) {
                  triggerModalOpen();
                } else {
                  img.onload = () => triggerModalOpen();
                  img.onerror = () => triggerModalOpen();
                }
              } else {
                triggerModalOpen();
              }
            } else {
              triggerModalOpen();
            }
          }
        }
      })
      .catch((err) => console.error("Failed to fetch activities:", err));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const isLight = mounted && (theme === "light" || resolvedTheme === "light");

  const formatEventDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getEventDateParts = (dateStr) => {
    if (!dateStr) return { day: "", month: "", year: "" };
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.toLocaleDateString(language === "id" ? "id-ID" : "en-US", { month: 'short' }).toUpperCase();
      const year = d.getFullYear();
      return { day, month, year };
    } catch {
      return { day: "", month: "", year: "" };
    }
  };

  const [activeSection, setActiveSection] = useState("home");
  const [partnersList, setPartnersList] = useState([]);
  const [publicArticlesList, setPublicArticlesList] = useState([]);
  const [publicActivitiesList, setPublicActivitiesList] = useState([]);
  const [publicTestimonialsList, setPublicTestimonialsList] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);



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

    fetch('/api/featured-projects/public')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setFeaturedProjectsList(data); })
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
          className={`relative min-h-[100dvh] sm:min-h-screen flex flex-col justify-center items-start py-16 sm:py-24 px-6 sm:px-12 md:px-20 lg:px-24 overflow-hidden ${
            isLight ? "bg-white" : "bg-[#0a1c15]"
          }`}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={currentHeroIndex}
              src={HERO_IMAGES[currentHeroIndex]}
              alt="SRE Hero background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          </AnimatePresence>
          
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

          {/* Slide Indicators — Custom indicators mirroring user attachment */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 md:left-20 lg:left-24 z-10 flex gap-2 items-center">
            {HERO_IMAGES.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  idx === currentHeroIndex 
                    ? "w-6 bg-yellow-300 dark:bg-emerald-400 shadow-[0_0_10px_rgba(253,224,71,0.5)]" 
                    : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>

          <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-12 md:right-16 lg:right-24 z-10 flex flex-col items-end">
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

        {/* ─── ABOUT SECTION (Emerald Theme) ─── */}
        <section
          id="about"
          className="scroll-mt-20 relative bg-[#099c6d] dark:bg-[#07130e] py-10 sm:py-16 md:py-24 px-6 sm:px-8 md:px-12 lg:px-20 overflow-hidden border-b-2 border-white/25 dark:border-transparent transition-colors duration-500"
        >
          {/* BACKGROUND ICONS — z-0 */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <Sun  style={{position:'absolute', top:'25%',  left:'40%',  width:20, height:20, opacity:0.04, color:'#10b981'}} />
            <Leaf style={{position:'absolute', top:'65%',  left:'55%',  width:18, height:18, opacity:0.04, color:'#10b981'}} />
            <Zap  style={{position:'absolute', top:'40%',  left:'70%',  width:16, height:16, opacity:0.04, color:'#10b981'}} />
            <Wind style={{position:'absolute', top:'55%',  left:'30%',  width:18, height:18, opacity:0.04, color:'#10b981'}} />
          </div>

          {/* MAIN GRID — z-10 */}
          <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">

            {/* LEFT COLUMN */}
            <div className="flex flex-col w-full">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black uppercase text-white tracking-tight leading-tight">
                  {t("visitor.home.about_sre")}
                </h2>
              </div>

              {/* Image — stretches to match right column height */}
              <div className="relative w-full max-w-[520px] flex-1 mt-6 min-h-[320px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-white/20 dark:border-white/10 group">
                <img
                  src="/images/about/sre indonesia 2025.png"
                  alt="SRE Indonesia 2025"
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
                <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-black uppercase text-white tracking-tight">SRE INDONESIA</h3>
                <p className="mt-2.5 sm:mt-3 text-white/95 dark:text-gray-200 text-sm sm:text-base leading-relaxed font-normal">
                  {t("visitor.home.about_desc_sre_id")}
                </p>
              </div>
              
              <hr className="border-white/15 dark:border-gray-800" />
              
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-black uppercase text-yellow-300 dark:text-emerald-400 tracking-tight">SRE UPN JATIM</h3>
                <p className="mt-2.5 sm:mt-3 text-white/95 dark:text-gray-200 text-sm sm:text-base leading-relaxed font-normal">
                  {t("visitor.home.about_desc_sre_upnvjt")}
                </p>
              </div>

              {/* Stat Row */}
              <motion.div
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="flex items-stretch rounded-xl overflow-hidden border sm:border-2 border-yellow-300/60 dark:border-emerald-500/50"
              >
                {[
                  { label: t("visitor.home.founded"), value: "Est. 2021", Icon: Sprout },
                  { label: t("visitor.home.network"), value: "SRE Indonesia", Icon: Globe },
                  { label: t("visitor.home.campus"), value: "UPN Veteran Jatim", Icon: Building2 }
                ].map((stat, idx, arr) => (
                  <motion.div
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.12)" }}
                    transition={{ duration: 0.2 }}
                    className={[
                      "flex-1 flex flex-col gap-1.5 px-3 sm:px-4 py-3 sm:py-3.5 cursor-default select-none",
                      idx < arr.length - 1
                        ? "border-r border-yellow-300/40 dark:border-emerald-500/40"
                        : ""
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-1.5">
                      <motion.span
                        whileHover={{ scale: 1.2, rotate: 8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="inline-flex shrink-0"
                      >
                        <stat.Icon
                          className="w-3.5 h-3.5 text-yellow-300 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                      </motion.span>
                      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 dark:text-white/40 leading-none">
                        {stat.label}
                      </span>
                    </div>
                    <span className="text-[13px] sm:text-sm font-bold text-white dark:text-gray-100 leading-snug">
                      {stat.value}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Link */}
              <div className="pt-1 sm:pt-2">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2.5 w-fit focus-visible:outline-emerald-600 focus-visible:outline-offset-4 rounded"
                >
                  <span className="relative text-xs sm:text-sm font-black tracking-[0.15em] uppercase text-white dark:text-white after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-yellow-300 dark:after:bg-emerald-400 after:transition-all after:duration-300 group-hover:after:w-full">
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

        {/* ─── Events & Programs Section ──────────────────────────────── */}
        {pastActivities.length > 0 && (
          <section
            id="activity"
            className="scroll-mt-20 bg-[#0bb882] dark:bg-[#031f16] py-14 sm:py-20 lg:py-24 px-6 sm:px-8 md:px-12 lg:px-20 border-t-2 border-white/20 dark:border-white/5 relative overflow-hidden flex items-center justify-center"
          >
            {/* faint dot-matrix texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
            {/* ambient glow */}
            <div className="absolute -top-32 right-0 w-[420px] h-[420px] bg-yellow-300/8 dark:bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full relative z-10 flex flex-col items-center">
              <div className="max-w-7xl mx-auto w-full flex flex-col justify-between items-center gap-3 sm:gap-4">

                {/* Header — centered, exactly like original Our Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center max-w-2xl mx-auto"
                >
                  {/* Eyebrow */}
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-xs sm:text-sm md:text-base font-black tracking-[0.28em] text-yellow-300 dark:text-emerald-400 uppercase">
                      {t("visitor.home.events_programs_eyebrow")}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black tracking-tight text-white dark:text-white uppercase leading-tight">
                    {t("visitor.home.our_activity_prefix")}
                    <span className="text-yellow-300 dark:text-emerald-400">
                      {t("visitor.home.our_activity_highlight")}
                    </span>
                  </h2>

                  <div className="h-[3.5px] w-16 sm:w-20 bg-yellow-300 dark:bg-emerald-400 mx-auto mt-2 rounded-full" aria-hidden="true" />

                  <p className="text-sm sm:text-base text-white/90 dark:text-gray-200 max-w-xl mx-auto mt-2.5 font-normal leading-relaxed">
                    {t("visitor.home.events_programs_desc")}
                  </p>
                </motion.div>

                {/* Full-width Carousel — exactly like original */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 28 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-45px" }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  <ActivityCarousel activities={pastActivities} />
                </motion.div>

                {/* CTA button — centered */}
                <div className="w-full text-center mt-3 sm:mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <Link
                      href="/activity"
                      className="group inline-flex items-center gap-2 border-2 border-yellow-300/60 hover:bg-yellow-300 hover:text-[#0bb882] text-yellow-300 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-[#031f16] font-bold tracking-wider text-xs uppercase px-7 py-3 rounded-full transition-all duration-300 focus-visible:outline-yellow-300"
                    >
                      {t("visitor.home.events_programs_cta")}
                      <ArrowUpRight className="w-3.5 h-3.5 text-yellow-300 group-hover:text-[#0bb882] dark:text-emerald-400 dark:group-hover:text-[#031f16] transition-colors" aria-hidden="true" />
                    </Link>
                  </motion.div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* ─── Featured Projects Section ──────────────────────────────── */}
        <section
          id="projects"
          className="scroll-mt-20 bg-[#08a677] dark:bg-[#04241a] py-14 sm:py-20 lg:py-24 px-6 sm:px-8 md:px-12 lg:px-20 border-t-2 border-black/10 dark:border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-300/5 dark:bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-300/8 dark:bg-emerald-700/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto w-full relative z-10">

            {/* Section Header */}
            <motion.div
               initial={{ opacity: 0, y: 15 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, amount: 0.1 }}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto"
             >
              <div className="flex items-center justify-center mb-3">
                <span className="text-xs sm:text-sm md:text-base font-black tracking-[0.28em] text-yellow-300 dark:text-emerald-400 uppercase">
                  {t("visitor.home.featured_projects_eyebrow")}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black tracking-tight text-white dark:text-white uppercase leading-tight">
                {t("visitor.home.featured_projects_title_prefix")}
                <span className="text-yellow-300 dark:text-emerald-400">
                  {t("visitor.home.featured_projects_title_highlight")}
                </span>
              </h2>

              <div className="h-[3.5px] w-16 sm:w-20 bg-yellow-300 dark:bg-emerald-400 mx-auto mt-2 rounded-full" aria-hidden="true" />

              <p className="text-sm sm:text-base text-white/75 dark:text-gray-400 mt-3 leading-relaxed">
                {t("visitor.home.featured_projects_desc")}
              </p>
            </motion.div>

            {upcomingActivities.length === 0 ? (
              /* Coming Soon Placeholder */
              <div className="w-full max-w-xl mx-auto rounded-3xl p-8 sm:p-10 border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/[0.03] backdrop-blur-md text-center flex flex-col items-center gap-5 relative overflow-hidden shadow-2xl">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-300/10 dark:bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="p-4 sm:p-5 rounded-full bg-yellow-300/20 text-yellow-300 dark:bg-[#0bb882]/20 dark:text-emerald-300 animate-pulse">
                  <Rocket className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white dark:text-gray-100 tracking-tight">
                    {t("visitor.home.projects_coming_soon_title")}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 dark:text-gray-400 leading-relaxed max-w-md">
                    {t("visitor.home.projects_coming_soon_desc")}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-full bg-black/25 text-yellow-300 dark:text-emerald-400 text-xs font-semibold select-none border border-white/5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 dark:bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300 dark:bg-emerald-400"></span>
                  </span>
                  {t("visitor.home.coming_soon")}
                </div>
              </div>
            ) : (
              /* Upcoming Events Flex Layout - Professional Instagram-like 4:5 Poster Layout */
              <div className="flex overflow-x-auto pb-6 gap-5 scrollbar-none snap-x snap-mandatory flex-nowrap justify-start max-w-full px-4 sm:px-0 sm:flex-wrap sm:justify-center sm:gap-6 md:gap-8 sm:overflow-visible sm:pb-0 sm:snap-none w-full">
                {upcomingActivities.map((activity) => {
                  const { day, month } = getEventDateParts(activity.date);
                  const isExternal = !!activity.link;
                  const href = activity.link || "/activity";
                  const isRegister = activity.linkType === "register";
                  const isPriorityOrAnnouncement = activity.isAnnouncementModal || activity.isPriority;
                  
                  const buttonText = isRegister 
                    ? (language === "id" ? "Daftar Acara" : "Register Event")
                    : (language === "id" ? "Lihat Detail" : "View Details");

                  return (
                    <div
                      key={activity.id}
                      className={`group relative flex flex-col bg-[#058562] border dark:bg-black/35 rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-500 w-[260px] sm:w-full sm:max-w-[280px] shrink-0 sm:shrink snap-center ${
                        isPriorityOrAnnouncement
                          ? "border-yellow-300 dark:border-emerald-400/80 shadow-[0_0_25px_rgba(253,224,71,0.25)] dark:shadow-[0_0_25px_rgba(52,211,153,0.25)] ring-2 ring-yellow-300/40 dark:ring-emerald-400/40"
                          : "border-white/20 dark:border-white/5"
                      }`}
                    >
                      {/* Portrait Poster Image (Aspect Ratio 4:4 on Mobile, 4:5 on Desktop) */}
                      <div className="relative w-full aspect-[4/4] sm:aspect-[4/5] overflow-hidden flex-shrink-0 bg-slate-900/40">
                        {activity.imageUrl ? (
                          <img
                            src={activity.imageUrl}
                            alt={activity.name}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-800/40 to-teal-950/60 flex flex-col items-center justify-center gap-3">
                            <Rocket className="w-10 h-10 text-white/20" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Belum Ada Poster</span>
                          </div>
                        )}
                        {/* Dark Vignette Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        
                        {/* Priority Badge */}
                        {isPriorityOrAnnouncement && (
                          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-300 dark:bg-emerald-400 text-slate-950 dark:text-[#0b120f] shadow-lg text-[9px] font-black uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-slate-950 dark:text-[#0b120f]" />
                            <span>{t("visitor.home.priority_activity_badge") || "SEDANG DIBUKA"}</span>
                          </div>
                        )}

                        {/* Calendar Date Badge */}
                        <div className="absolute top-3 right-3 z-20 flex flex-col items-center justify-center w-12 h-14 bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-100 dark:border-white/10 select-none">
                          <div className="w-full bg-red-500 dark:bg-emerald-500 text-[9px] font-black uppercase text-center py-0.5 text-white dark:text-slate-950 tracking-wider">
                            {month}
                          </div>
                          <div className="flex-1 flex items-center justify-center text-base font-extrabold text-slate-900 dark:text-white leading-none">
                            {day}
                          </div>
                        </div>

                        {/* Event Tags */}
                        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-1.5 items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-black/50 text-yellow-300 dark:text-emerald-400 border border-white/10 backdrop-blur-md">
                            {activity.type || "EVENT"}
                          </span>
                          {activity.location && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-white/15 text-white border border-white/5 backdrop-blur-md">
                              <MapPin className="w-3 h-3 text-yellow-300 dark:text-emerald-400" />
                              <span className="truncate max-w-[110px]">{activity.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Section - Adjusted Padding and height to avoid cramped margins */}
                      <div className="p-5 flex flex-col bg-transparent dark:bg-black/20 rounded-b-[2rem]">
                        <div className="h-[90px] sm:h-[96px] flex flex-col justify-start mb-3">
                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-yellow-300 dark:group-hover:text-emerald-400 transition-colors duration-300 line-clamp-2 mb-1.5">
                            {activity.name}
                          </h3>
                          <p className="text-xs text-white/80 dark:text-gray-400 leading-relaxed line-clamp-2">
                            {activity.description}
                          </p>
                        </div>

                        {isExternal ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 bg-transparent text-yellow-300 border border-yellow-300 hover:bg-yellow-300 hover:text-[#058562] dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-[#0b120f] rounded-xl text-[11px] font-black text-center block transition-all duration-300 tracking-wider uppercase shadow-md"
                          >
                            {buttonText}
                          </a>
                        ) : (
                          <Link
                            href={href}
                            className="w-full py-2.5 bg-transparent text-yellow-300 border border-yellow-300 hover:bg-yellow-300 hover:text-[#058562] dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-[#0b120f] rounded-xl text-[11px] font-black text-center block transition-all duration-300 tracking-wider uppercase shadow-md"
                          >
                            {buttonText}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Render Companion Card if there are less than 4 upcoming events */}
                {upcomingActivities.length < 4 && (
                  <div className="group relative flex flex-col bg-[#058562] border border-white/20 dark:bg-black/35 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-500 w-[260px] sm:w-full sm:max-w-[280px] shrink-0 sm:shrink snap-center">
                    {/* 4:4 Aspect Ratio on Mobile, 4:5 on Desktop */}
                    <div className="relative w-full aspect-[4/4] sm:aspect-[4/5] flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-yellow-300/10 to-transparent dark:from-emerald-500/10 dark:to-transparent">
                      {/* Floating Glowing Orbs */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-300/20 dark:bg-emerald-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
                      
                      {/* Decorative Icon */}
                      <div className="relative z-10 p-4 rounded-2xl bg-white/10 dark:bg-white/[0.05] border border-white/20 dark:border-white/10 mb-4 text-yellow-300 dark:text-emerald-400">
                        <Sparkles className="w-8 h-8 animate-bounce" style={{ animationDuration: '3s' }} />
                      </div>

                      {/* Title & Desc */}
                      <div className="relative z-10 flex flex-col gap-3.5 px-3">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-yellow-300 dark:text-emerald-400">
                          {language === "id" ? "KOLABORASI & AKSI" : "COLLABORATION & ACTION"}
                        </span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                          {language === "id" ? "Lebih Banyak Event Segera Hadir!" : "More Events Coming Soon!"}
                        </h3>
                        <p className="text-[13px] sm:text-sm text-white/90 dark:text-gray-200 font-medium leading-relaxed max-w-[240px] mx-auto">
                          {language === "id" 
                            ? "Ikuti media sosial kami untuk mendapatkan pembaruan langsung tentang pendaftaran webinar, proyek riset, dan kegiatan sosial kami."
                            : "Follow our social media to get instant updates on webinar registrations, research projects, and community activities."}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer - styled with local color theme matching SRE standard */}
                    <div className="p-5 pt-0 mt-auto bg-transparent">
                      <a
                        href="https://www.instagram.com/sre.upnjatim/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-yellow-300 hover:bg-yellow-400 text-[#058562] hover:text-black dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 font-black rounded-xl text-[11px] text-center block transition-all duration-300 tracking-wider uppercase shadow-md hover:shadow-xl hover:-translate-y-0.5"
                      >
                        {language === "id" ? "Ikuti Instagram Kami" : "Follow Our Instagram"}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                <span className="text-xs sm:text-sm font-black tracking-widest text-yellow-300 dark:text-emerald-400 uppercase mb-2 block">{t("visitor.home.testimonials")}</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black tracking-tight text-white dark:text-white uppercase leading-tight">{t("visitor.home.testimonials_title")}</h2>
                <p className="text-sm sm:text-base text-white/90 dark:text-white/70 mt-2.5 font-normal leading-relaxed">
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
                        <div className="text-[11px] sm:text-xs text-white/75 dark:text-white/50">{test.authorPosition}</div>
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

          const allPartners = dbPartners;
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
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 dark:bg-emerald-500/10 border border-white/25 dark:border-emerald-500/20 text-yellow-300 dark:text-emerald-400 text-xs sm:text-sm font-black tracking-widest uppercase shadow-md mb-3 backdrop-blur-md">
                    <Handshake className="w-3.5 h-3.5 text-yellow-300 dark:text-emerald-400" />
                    <span>{t("visitor.home.partners")}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black tracking-tight text-white uppercase drop-shadow-md leading-tight">
                    {t("visitor.home.partners_prefix") || "MITRA "}<span className="text-yellow-300 dark:text-emerald-400">{t("visitor.home.partners_highlight") || "KAMI"}</span>
                  </h2>

                  <div className="h-[3px] sm:h-[4px] w-16 sm:w-20 bg-yellow-300 dark:bg-emerald-400 mx-auto mt-3 rounded-full" aria-hidden="true" />

                  <p className="text-sm sm:text-base text-white/90 dark:text-gray-200 mt-2.5 sm:mt-3 leading-relaxed font-normal max-w-lg">
                    {t("visitor.home.partners_desc")}
                  </p>
                </motion.div>

                {/* Unified Master Sponsor Board Card with Crisp Dual-Direction Lightsaber Border */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 24 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-5xl mx-auto rounded-3xl sm:rounded-[36px] md:rounded-[44px] p-[3px] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)] mt-8 sm:mt-10 group"
                >
                  {/* Dual-Direction Lightsaber Glowing Border Beams (Simultaneous Left & Right from top-center) */}
                  <div
                    className="absolute -inset-[100%] animate-border-beam-cw pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0 270deg, var(--beam-dim-color) 320deg, var(--beam-active-color) 360deg)',
                      filter: 'var(--beam-glow)'
                    }}
                  />
                  <div
                    className="absolute -inset-[100%] animate-border-beam-ccw pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0 270deg, var(--beam-dim-color) 320deg, var(--beam-active-color) 360deg)',
                      filter: 'var(--beam-glow)'
                    }}
                  />

                  {/* Inner Card Container */}
                  <div className="w-full h-full rounded-[calc(1.5rem-2.5px)] sm:rounded-[calc(2.25rem-2.5px)] md:rounded-[calc(2.75rem-2.5px)] p-4 sm:p-8 md:p-12 relative z-10 overflow-hidden backdrop-blur-3xl flex flex-col items-center gap-4 sm:gap-6 md:gap-8 bg-gradient-to-br from-white/20 via-white/10 to-white/15 dark:from-[#0b1c15]/98 dark:via-[#071510]/98 dark:to-[#040e0a]/98 border border-white/20 dark:border-white/10">
                    
                    {/* High-Tech Dot Matrix Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.20] dark:opacity-[0.15] bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none" />

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
                      {allPartners.map((partner) => (
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
                  </div>
                </motion.div>
              </div>
            </section>
          );
        })()}
      </main>

      {/* ─── VISITOR POPUP ANNOUNCEMENT MODAL (Poster Only - Rendered into document.body via Portal) ─── */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {priorityModalOpen && modalActivity && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md select-none">
              {/* Backdrop Click */}
              <div
                onClick={() => setPriorityModalOpen(false)}
                className="fixed inset-0 z-0 cursor-pointer"
              />

              {/* Poster Popup Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative z-10 max-w-[90vw] max-h-[85vh] w-auto h-auto rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] border-2 border-yellow-300/80 dark:border-emerald-400/80 group flex flex-col items-center bg-[#071d15]"
              >
                {/* Close Button X Floating Outside Top-Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPriorityModalOpen(false);
                  }}
                  className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 z-40 p-2.5 rounded-full bg-[#071d15] text-white hover:text-yellow-300 hover:scale-110 transition-all border-2 border-yellow-300/80 dark:border-emerald-400/80 shadow-2xl cursor-pointer flex items-center justify-center"
                  aria-label="Close Announcement"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Inner Poster Wrapper with Rounded Corners */}
                <div className="relative w-full h-full rounded-[22px] overflow-hidden flex flex-col items-center">
                  {/* Clickable Full Poster Image */}
                  {modalActivity.link ? (
                    <a
                      href={modalActivity.link}
                      target={modalActivity.link.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="relative block w-full h-full cursor-pointer overflow-hidden group"
                    >
                      {modalActivity.imageUrl ? (
                        <img
                          src={resolveImageUrl(modalActivity.imageUrl)}
                          alt={modalActivity.name}
                          className="max-h-[80vh] w-auto max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-300 block"
                        />
                      ) : (
                        <div className="p-10 sm:p-14 flex flex-col items-center justify-center gap-4 text-center bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 min-w-[280px]">
                          <Crown className="w-14 h-14 text-yellow-300 animate-bounce" />
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">{modalActivity.name}</h3>
                          <span className="px-4 py-2 rounded-full bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                            <span>Daftar / Lihat Detail</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                      )}
                    </a>
                  ) : (
                    <Link
                      href="/activity"
                      onClick={() => setPriorityModalOpen(false)}
                      className="relative block w-full h-full cursor-pointer overflow-hidden group"
                    >
                      {modalActivity.imageUrl ? (
                        <img
                          src={resolveImageUrl(modalActivity.imageUrl)}
                          alt={modalActivity.name}
                          className="max-h-[80vh] w-auto max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-300 block"
                        />
                      ) : (
                        <div className="p-10 sm:p-14 flex flex-col items-center justify-center gap-4 text-center bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 min-w-[280px]">
                          <Crown className="w-14 h-14 text-yellow-300 animate-bounce" />
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">{modalActivity.name}</h3>
                          <span className="px-4 py-2 rounded-full bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                            <span>Lihat Detail Kegiatan</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                      )}
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
