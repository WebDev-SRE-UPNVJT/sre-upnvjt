"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, BookOpen, Cpu, Leaf, Users, Mail, MapPin
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "next-themes";
import { DepartmentCard } from "@/components/organization/OrgComponents";

// Animation variants
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
});

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// Hero word-by-word reveal
const wordReveal = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const wordChild = {
  hidden: { opacity: 0, y: 20, rotateX: -15 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// Static data
const PILLARS = [
  { 
    icon: BookOpen, 
    num: "01",
    title: "Education", 
    desc: "Providing high-fidelity training, seminars, and workshops to elevate renewable energy literacy among students." 
  },
  { 
    icon: Cpu, 
    num: "02",
    title: "Technology", 
    desc: "Developing practical, scalable microgrid, solar power, and bioenergy prototypes for real-world application." 
  },
  { 
    icon: Leaf, 
    num: "03",
    title: "Environment", 
    desc: "Promoting sustainability, decarbonization models, and eco-friendly community waste management." 
  },
  { 
    icon: Users, 
    num: "04",
    title: "Empowerment", 
    desc: "Collaborating with local villages to implement renewable energy grids directly elevating their socioeconomic level." 
  }
];

const MISSION_ITEMS = [
  { desc: "Meningkatkan kesadaran & literasi transisi energi di kalangan mahasiswa dan masyarakat luas." },
  { desc: "Menyelenggarakan riset dan proyek energi baru terbarukan yang berdampak dan tepat guna." },
  { desc: "Membangun kolaborasi sinergis lintas sektor: akademisi, industri, dan komunitas." },
];

export default function AboutClient({ departmentsData = [] }) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const localPillars = PILLARS.map((p) => {
    switch (p.num) {
      case "01": return { ...p, title: t("visitor.about.pillar_edu"), desc: t("visitor.about.pillar_edu_desc") };
      case "02": return { ...p, title: t("visitor.about.pillar_tech"), desc: t("visitor.about.pillar_tech_desc") };
      case "03": return { ...p, title: t("visitor.about.pillar_env"), desc: t("visitor.about.pillar_env_desc") };
      case "04": return { ...p, title: t("visitor.about.pillar_emp"), desc: t("visitor.about.pillar_emp_desc") };
      default: return p;
    }
  });

  const localMissionItems = [
    { desc: t("visitor.about.mission_1") },
    { desc: t("visitor.about.mission_2") },
    { desc: t("visitor.about.mission_3") }
  ];

  return (
    <div className="min-h-screen bg-[#0bb37e] dark:bg-[#07130e] text-white dark:text-white selection:bg-yellow-300 selection:text-[#07130e] antialiased overflow-hidden">

      {/* Hero Section */}
      <section id="hero" className="scroll-mt-20 relative pt-44 pb-24 px-6 overflow-hidden border-b-2 border-white/25 dark:border-transparent bg-[#0bb37e] dark:bg-[#07130e]">
        {/* Background Image of SRE Meeting */}
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 md:scale-120 pointer-events-none z-0"
          style={{ backgroundImage: 'url("/images/about/sre%20first%20meet.jpg")' }}
        />
        {/* Tint overlay with transition to ensure high readability */}
        <div 
          className="absolute inset-0 pointer-events-none transition-colors duration-300 z-10" 
          style={{ backgroundColor: isDark ? 'rgba(6, 15, 11, 0.84)' : 'rgba(8, 140, 97, 0.90)' }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" aria-hidden="true" />
        
        <div className="max-w-7xl mx-auto relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-4 mb-6"
          >
            <span className="inline-block py-2 px-5 rounded-full bg-[#099c6d] dark:bg-white/5 border-2 border-yellow-300/60 dark:border-white/20 text-[11px] font-black tracking-widest uppercase text-yellow-300 dark:text-[#e8ecc4] shadow-md">
              {t("visitor.about.title_badge")}
            </span>
          </motion.div>

          <motion.div variants={wordReveal} initial="hidden" animate="show" className="max-w-4xl">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-white dark:text-white uppercase leading-[0.95] drop-shadow-md">
              {t("visitor.about.hero_title").split(" ").map((word, i) => {
                const isHighlight = i === 2 || i === 4 || i === 5;
                return (
                  <motion.span 
                    key={i} 
                    variants={wordChild} 
                    className={`inline-block mr-[0.25em] last:mr-0 ${isHighlight ? "text-yellow-300 dark:text-emerald-400" : "text-white dark:text-white"}`}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </h1>
          </motion.div>

          <motion.p
            {...fadeUp(0.3)}
            className="mt-8 text-lg sm:text-xl font-bold text-white dark:text-gray-200 max-w-2xl leading-relaxed drop-shadow-sm"
          >
            {t("visitor.about.hero_desc")}
          </motion.p>
        </div>
      </section>

      <section id="vision" className="scroll-mt-20 py-24 px-6 md:px-12 lg:px-20 bg-[#0aa373] dark:bg-[#040e0a] border-b-2 border-white/25 dark:border-transparent transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <motion.div {...fadeUp(0)} className="lg:col-span-5 space-y-6">
            <span className="text-sm md:text-base font-black text-yellow-300 dark:text-emerald-400 tracking-[0.3em] uppercase block drop-shadow-sm">{t("visitor.about.vision")}</span>
            <h2 className="text-3xl sm:text-5xl font-display font-black text-white dark:text-white uppercase tracking-tight leading-tight drop-shadow-md">
              Center of Renewable Excellence
            </h2>
            <p className="text-base sm:text-lg font-bold text-white dark:text-gray-200 leading-relaxed drop-shadow-sm">
              {t("visitor.about.vision_desc")}
            </p>
          </motion.div>
 
          <motion.div {...fadeUp(0.15)} className="lg:col-span-7 space-y-6">
            <span className="text-sm md:text-base font-black text-yellow-300 dark:text-emerald-400 tracking-[0.3em] uppercase block drop-shadow-sm">{t("visitor.about.mission")}</span>
            <div className="space-y-4">
              {localMissionItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-4 p-5 rounded-2xl bg-white/15 dark:bg-[#07130e]/85 border border-white/30 dark:border-white/10 hover:border-yellow-300/50 dark:hover:border-emerald-500/40 transition-all duration-300 shadow-md"
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-300 dark:bg-emerald-500/20 text-slate-950 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                    0{idx + 1}
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white dark:text-gray-200 leading-relaxed drop-shadow-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="pillars" className="scroll-mt-20 py-24 px-6 md:px-12 lg:px-20 bg-[#099c6d] dark:bg-[#07130e] border-b-2 border-white/25 dark:border-transparent transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-sm md:text-base font-black text-yellow-300 dark:text-emerald-400 tracking-[0.3em] uppercase block mb-3 drop-shadow-sm">{t("visitor.about.four_pillars")}</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white dark:text-white uppercase tracking-tight drop-shadow-md">{t("visitor.about.focus_areas")}</h2>
            <p className="text-base md:text-lg font-bold text-white dark:text-gray-200 mt-4 leading-relaxed drop-shadow-sm">
              {t("visitor.about.pillars_desc")}
            </p>
          </motion.div>
 
          <motion.div 
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {localPillars.map((pillar) => {
              const IconComp = pillar.icon;
              return (
                <motion.div
                  key={pillar.num}
                  variants={staggerChild}
                  className="group p-6 sm:p-8 rounded-3xl bg-white/15 dark:bg-[#050e0a] border border-white/30 dark:border-white/10 hover:border-yellow-300/50 dark:hover:border-emerald-500/55 transition-all duration-500 hover:shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 dark:bg-emerald-500/10 border border-white/30 dark:border-emerald-500/20 flex items-center justify-center text-yellow-300 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                        <IconComp className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-white/50 dark:text-white/20 group-hover:text-yellow-300/80 dark:group-hover:text-emerald-400/80 transition-colors">
                        {pillar.num}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white dark:text-white mb-2.5 sm:mb-3 group-hover:text-yellow-300 dark:group-hover:text-emerald-400 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-sm sm:text-base font-normal text-white/95 dark:text-gray-200 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Structure Section */}
       <section id="structure" className="scroll-mt-20 py-24 px-6 md:px-12 lg:px-20 bg-[#0bb37e] dark:bg-[#040e0a] border-b-2 border-white/25 dark:border-transparent transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <motion.div 
            {...fadeUp(0)}
            className="text-center mb-16 max-w-3xl"
          >
            <span className="text-sm md:text-base font-black text-yellow-300 dark:text-emerald-400 tracking-[0.3em] uppercase block mb-3 drop-shadow-sm">{t("visitor.about.internal_depts")}</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white dark:text-white uppercase tracking-tight drop-shadow-md">{t("visitor.about.org_structure")}</h2>
            <p className="text-base md:text-lg font-bold text-white dark:text-gray-200 mt-4 max-w-xl mx-auto leading-relaxed drop-shadow-sm">
              {t("visitor.about.structure_desc")}
            </p>
          </motion.div>

          {/* Executive Card pinned at the top */}
          {(() => {
            const execDept = departmentsData.find(dept => dept.code?.toUpperCase() === "EXE");
            const otherDepts = departmentsData.filter(dept => dept.code?.toUpperCase() !== "SYS" && dept.code?.toUpperCase() !== "EXE");
            
            return (
              <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
                {execDept && (
                  <div className="w-full max-w-2xl mx-auto z-10">
                    <DepartmentCard dept={execDept} index={0} isExecutive={true} />
                  </div>
                )}

                {/* Spacing between Executive and departments grid */}
                <div className="w-full h-12" />

                {/* Remaining 5 departments stay in the grid below */}
                <div className="flex flex-wrap justify-center gap-6 w-full mt-2 lg:mt-0">
                  {otherDepts.map((dept, idx) => (
                    <div key={dept.slug || dept.id} className="w-full sm:w-[48%] lg:w-[31.5%] flex">
                      <DepartmentCard key={dept.slug || dept.id} dept={dept} index={idx} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Connect Section */}
      <section id="connect" className="scroll-mt-20 py-24 px-6 md:px-12 lg:px-20 bg-[#0aa373] dark:bg-[#030a07] text-white dark:text-white text-center relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/8 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
        
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center gap-10">
          <motion.div {...fadeUp(0)} className="flex flex-col items-center gap-5">
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black tracking-widest uppercase text-yellow-300 dark:text-emerald-400">
              {t("visitor.about.get_connected")}
            </span>
            <h2 className="text-4xl sm:text-6xl font-display font-black uppercase leading-tight tracking-tighter text-white dark:text-white">
              {t("visitor.about.lets_connect_prefix")}
              <span className="text-yellow-300 dark:text-emerald-400">
                {t("visitor.about.lets_connect_highlight")}
              </span>
            </h2>
            <p className="text-emerald-50/90 dark:text-white/55 text-[15px] max-w-md leading-relaxed">
              {t("visitor.about.connect_desc")}
            </p>
          </motion.div>

          {/* Social icons */}
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4"
          >
            {[
              {
                href: "https://www.instagram.com/sre.upnjatim/",
                label: "Instagram",
                aria: "Follow SRE UPNVJT on Instagram",
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                )
              },
              {
                href: "https://www.linkedin.com/company/sreupnjatim/",
                label: "LinkedIn",
                aria: "SRE UPNVJT on LinkedIn",
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                )
              },
              {
                href: "https://youtube.com/@sreupnvjt",
                label: "YouTube",
                aria: "SRE UPNVJT on YouTube",
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.387.51a3.003 3.003 0 00-2.11 2.108C0 8.025 0 12 0 12s0 3.975.503 5.837a3.003 3.003 0 002.11 2.108c1.862.51 9.387.51 9.387.51s7.525 0 9.387-.51a3.003 3.003 0 002.11-2.108C24 15.975 24 12 24 12s0-3.975-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                )
              },
              {
                href: "mailto:sre@upnjatim.ac.id",
                label: "Email",
                aria: "Email SRE UPNVJT",
                icon: <Mail className="w-5 h-5" aria-hidden="true" />
              },
            ].map(({ href, label, aria: ariaLabel, icon }) => (
              <motion.a
                key={label}
                variants={staggerChild}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
                aria-label={ariaLabel}
                className="w-12 h-12 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-yellow-300 hover:text-slate-900 hover:border-yellow-300 dark:hover:bg-emerald-400 dark:hover:text-[#07130e] dark:hover:border-emerald-400 flex items-center justify-center text-white dark:text-white transition-all duration-300 hover:scale-110 focus-visible:outline-yellow-300 dark:focus-visible:outline-emerald-400"
              >
                {icon}
              </motion.a>
            ))}
          </motion.div>

          {/* Location */}
          <motion.div {...fadeUp(0.1)} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white dark:text-white/50">
            <MapPin className="w-3.5 h-3.5 text-yellow-300 dark:text-primary" aria-hidden="true" />
            Surabaya, Jawa Timur, Indonesia
          </motion.div>

          {/* Google Maps Embed */}
          <motion.div
            {...fadeUp(0.15)}
            className="w-full max-w-3xl"
          >
            <div className="rounded-[24px] overflow-hidden border border-[#07130e]/15 dark:border-white/10 shadow-2xl dark:shadow-black/50">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7914.428799763908!2d112.78460684130685!3d-7.329800820714099!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7fab87edcad15%3A0xb26589947991eea1!2sUniversitas%20Pembangunan%20Nasional%20%22Veteran%22%20Jawa%20Timur!5e0!3m2!1sid!2sid!4v1784814004159!5m2!1sid!2sid"
                width="100%"
                height="340"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                title="Lokasi UPN Veteran Jawa Timur, Surabaya"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
            {/* Fallback link for direct navigation */}
            <div className="mt-4 text-center">
              <a
                href="https://maps.app.goo.gl/t8684b8ntLqntkLh7"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-[12px] font-bold tracking-widest uppercase text-[#07130e]/45 dark:text-white/30 hover:text-primary transition-colors duration-200 focus-visible:outline-primary"
                aria-label="Open UPN Veteran Jawa Timur location in Google Maps"
              >
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                {t("visitor.about.open_gmaps")}
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
