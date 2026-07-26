import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Mail, Users, User, Shield, ArrowRight, Network } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

const translateRole = (role, t) => {
  if (!role) return "";
  const rLower = role.toLowerCase();
  if (rLower === "president") return t("visitor.org.president");
  if (rLower.includes("vice president")) return t("visitor.org.vp");
  if (rLower.includes("secretary") || rLower.includes("sekretaris")) return t("visitor.org.secretary");
  if (rLower.includes("director")) return t("visitor.org.director");
  if (rLower === "division manager" || rLower.includes("manager")) return t("visitor.org.managers");
  if (rLower.startsWith("staff of")) {
    const div = role.substring(9);
    return t("visitor.org.staff_of").replace("{division}", div);
  }
  return role;
};

// Inline LinkedIn SVG to avoid import package versions mismatch
function LinkedinIcon({ className }) {
  return (
    <svg className={`fill-current ${className}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );
}

// ─── 1. Avatar Fallback component ──────────────────────────────────────────────
export function AvatarFallback({ className }) {
  return (
    <div className={`bg-white/15 dark:bg-emerald-950/40 flex items-center justify-center text-white/40 dark:text-emerald-500/40 relative overflow-hidden ${className}`}>
      <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

// ─── 2. Department Card component ──────────────────────────────────────────────
export function DepartmentCard({ dept, index, isExecutive = false }) {
  const { t } = useLanguage();
  const numberStr = String(index + 1).padStart(2, "0");
  
  let presidentName = "";
  let vpNames = "";
  let secretaryNames = "";

  if (isExecutive && dept.users) {
    const presidentUser = dept.users.find(u => u.positionName && u.positionName.toLowerCase() === "president");
    presidentName = presidentUser ? presidentUser.name : "";

    const vpUsers = dept.users.filter(u => u.positionName && u.positionName.toLowerCase().includes("vice president"));
    vpNames = vpUsers.map(u => u.name).join(", ");

    const secUsers = dept.users.filter(u => u.positionName && u.positionName.toLowerCase().includes("secretary"));
    secretaryNames = secUsers.map(u => u.name).join(", ");
  }

  return (
    <Link href={`/about/organization/${dept.slug}`} className="block w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
        className={`bg-gradient-to-br from-[#09a071] to-[#078c62] border-2 border-[#e8ecc4] dark:border-emerald-500/30 dark:from-[#0a1f15] dark:to-[#05140e] rounded-3xl p-8 relative overflow-hidden group hover:border-yellow-300 dark:hover:border-emerald-400 hover:shadow-2xl transition-all duration-500 flex flex-col justify-between shadow-md cursor-pointer hover:brightness-[1.03] active:scale-[0.99] hover:-translate-y-1 h-full ${
          isExecutive ? "md:p-10" : ""
        }`}
      >
        {/* Decorative Watermark Icon (Combination of org structure and energy grid) */}
        <div className="absolute top-4 right-6 text-6xl text-[#e8ecc4]/10 group-hover:text-[#e8ecc4]/25 dark:text-emerald-400/10 dark:group-hover:text-emerald-400/25 transition-colors pointer-events-none">
          <Network className="w-14 h-14 stroke-[1.2]" />
        </div>

        <div className="flex-1 flex flex-col justify-between gap-6">
          <div>
            <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white dark:text-white mb-2 pr-12 leading-tight group-hover:text-yellow-300 transition-colors">
              {dept.name}
            </h4>
            <p className="text-xs md:text-sm text-emerald-50/90 dark:text-gray-300 leading-relaxed font-bold mb-4 line-clamp-3">
              {dept.description}
            </p>
          </div>

          {/* Stats & Director Summary */}
          <div className="space-y-4 pt-4 border-t border-white/10 dark:border-white/5">
            {isExecutive ? (
              <div className="space-y-2.5 text-xs text-white">
                {/* President */}
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-[#e8ecc4] dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#e8ecc4] dark:text-emerald-400 font-extrabold uppercase tracking-wide">{t("visitor.org.president")}:</strong>{" "}
                    {presidentName || t("visitor.org.not_assigned")}
                  </span>
                </div>
                {/* Vice Presidents */}
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-[#e8ecc4] dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#e8ecc4] dark:text-emerald-400 font-extrabold uppercase tracking-wide">{t("visitor.org.vp")}:</strong>{" "}
                    {vpNames || t("visitor.org.not_assigned")}
                  </span>
                </div>
                {/* Secretary */}
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-[#e8ecc4] dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#e8ecc4] dark:text-emerald-400 font-extrabold uppercase tracking-wide">{t("visitor.org.secretary")}:</strong>{" "}
                    {secretaryNames || t("visitor.org.not_assigned")}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-xs font-bold text-white/90">
                  <User className="w-4 h-4 text-[#e8ecc4] dark:text-emerald-400" />
                  <span className="truncate text-white">
                    {t("visitor.org.director")}: <strong className="text-[#e8ecc4] dark:text-emerald-400 font-extrabold">{dept.directorName || t("visitor.org.not_assigned")}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-6 text-xs text-white/80 dark:text-gray-400 font-semibold font-bold">
                  <span className="flex items-center gap-1.5 text-white">
                    <Shield className="w-3.5 h-3.5 text-[#e8ecc4]/85 dark:text-emerald-400/70" />
                    {dept.managerCount} {t("visitor.org.managers")}
                  </span>
                  <span className="flex items-center gap-1.5 text-white">
                    <Users className="w-3.5 h-3.5 text-[#e8ecc4]/85 dark:text-emerald-400/70" />
                    {dept.staffCount} {t("visitor.org.staff")}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* View Team CTA Button */}
          <div className="pt-3 flex items-center justify-between border-t border-white/5">
            <span
              className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase text-[#e8ecc4] group-hover:text-yellow-300 dark:text-emerald-400 dark:group-hover:text-yellow-400 transition-all duration-300"
            >
              {t("visitor.org.view_team")}
            </span>
            <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-white group-hover:bg-yellow-300 group-hover:text-slate-900 group-hover:border-yellow-300 transition-all duration-300">
              <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Helper to resolve a student's major from their NPM
function getJurusanByNpm(npm) {
  if (!npm) return "SRE Member";
  const code = npm.substring(2, 5);
  switch (code) {
    case "031": return "Teknik Kimia";
    case "032": return "Teknik Industri";
    case "033": return "Teknik Sipil";
    case "034": return "Teknik Lingkungan";
    case "036": return "Teknik Mesin";
    case "081": return "Teknik Informatika";
    case "082": return "Sistem Informasi";
    case "083": return "Sains Data";
    case "011": return "Ekonomi Pembangunan";
    case "012": return "Akuntansi";
    case "013": return "Manajemen";
    case "024": return "Ilmu Komunikasi";
    case "025": return "Hubungan Internasional";
    case "041": return "Agroteknologi";
    case "042": return "Agribisnis";
    case "043": return "Teknologi Pangan";
    default: return "Teknik";
  }
}

// Helper to resolve a student's entry year / batch from their NPM
function getAngkatanByNpm(npm) {
  if (!npm || npm.length < 2) return "2024";
  const yearCode = npm.substring(0, 2);
  return `20${yearCode}`;
}

// Helper to resolve avatar dynamically based on user's name
function getAvatarByName(name) {
  const lower = (name || "").toLowerCase().trim();
  
  // Exception list (Okvivi, Nindita Tanaya)
  if (
    lower.includes("okvivi") || 
    lower.includes("nindita") || 
    lower.includes("tanaya")
  ) {
    return "/images/about/organization/RobloxGirl.png";
  }

  // Exact names or keyword patterns of girls in the seed:
  const femaleKeywords = [
    "mirza jovita", "evi lailiyatul", "zalva zahiya", "hanifah manzilatu", 
    "dalilah baharmus", "dygta azzahwa", "karina indirasari", "binti maratus", 
    "elbra aliyyah", "iftitah nurazizah", "aufa", "yanis nabila", 
    "ninit agus", "ninit adila", "hilwa aufa", "nayla dwi", "jacinda adya", "nindya aliyah", 
    "anggun syafitri", "silvia oktaviani", "dewi astuti", "myrna syafrida", 
    "nadia tsabitah", "athalia helen", "nailah dinda", "faza", 
    "azifahtul nurul", "melisa fitria", "shinta dwi", "naila maharani"
  ];

  if (femaleKeywords.some(keyword => lower.includes(keyword))) {
    return "/images/about/organization/RobloxHijab.png";
  }
  
  return "/images/about/organization/RobloxMan.png";
}

// ─── 3. Member Card component (Used for Manager and Staff) ─────────────────────
export function MemberCard({ member, fallbackRole }) {
  const { t } = useLanguage();
  if (!member) return null;
  const name = member.name || "Unnamed Member";
  const rawRole = member.role || fallbackRole || "Team Member";
  const role = translateRole(rawRole, t);
  const photo = member.photo;
  const npm = member.npm;

  const major = getJurusanByNpm(npm);
  const batch = getAngkatanByNpm(npm);

  return (
    <div className="group relative bg-white/10 dark:bg-gradient-to-br dark:from-[#0a1f15] dark:to-[#05140e] border border-[#e8ecc4] dark:border-emerald-500/30 rounded-3xl overflow-hidden hover:border-yellow-300 dark:hover:border-emerald-400 hover:brightness-[1.03] transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)] dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] flex flex-col h-full w-full">
      <div className="aspect-[3/4] bg-black/40 overflow-hidden relative w-full">
        <Image
          src={photo || getAvatarByName(name)}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 15vw"
          className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07130e]/90 via-[#07130e]/10 to-transparent pointer-events-none" />
      </div>
      <div className="p-4 h-[148px] flex flex-col justify-between">
        <div>
          <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-yellow-300 dark:text-emerald-400 block mb-1">
            {role}
          </span>
          <h4 className="text-sm sm:text-base font-black text-white dark:text-white group-hover:text-yellow-300 dark:group-hover:text-emerald-400 transition-colors leading-tight break-words mb-1 line-clamp-3">
            {name}
          </h4>
        </div>
        <div className="text-[11px] text-[#e8ecc4]/80 dark:text-emerald-300/60 font-medium shrink-0">
          <div>{major}</div>
          <div>{t("visitor.org.angkatan").replace("{batch}", batch)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Director Card component ───────────────────────────────────────────────
export function DirectorCard({ director, fallbackRole }) {
  const { t } = useLanguage();
  if (!director) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-white/5 border border-white/10 rounded-3xl">
        <User className="w-12 h-12 mx-auto text-white/20 mb-3" />
        <h3 className="text-lg font-black text-white/50">{t("visitor.org.no_members")}</h3>
        <p className="text-xs text-white/40 mt-1">{t("visitor.org.not_assigned")}</p>
      </div>
    );
  }

  const name = director.name || "Director Profile";
  const rawRole = director.role || fallbackRole || "Director";
  const role = translateRole(rawRole, t);
  const photo = director.photo;
  const socials = director.socials || {};
  const npm = director.npm;

  const major = getJurusanByNpm(npm);
  const batch = getAngkatanByNpm(npm);

  return (
    <div className="max-w-xl mx-auto bg-white/10 dark:bg-gradient-to-br dark:from-[#0a1f15] dark:to-[#05140e] border border-[#e8ecc4] dark:border-emerald-500/30 hover:border-yellow-300 dark:hover:border-emerald-400 hover:brightness-[1.03] transition-all duration-300 rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-xl">
      <div className="w-36 h-48 sm:w-42 sm:h-56 rounded-2xl overflow-hidden relative shrink-0 bg-black/40 border border-white/10">
        <Image
          src={photo || getAvatarByName(name)}
          alt={name}
          fill
          sizes="(max-width: 640px) 150px, 200px"
          className="object-cover"
          priority
        />
      </div>

      <div className="flex-1 text-center md:text-left flex flex-col justify-center h-full">
        <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-yellow-300 dark:text-emerald-400 block mb-1">
          {role}
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white dark:text-white leading-tight break-words mb-2">
          {name}
        </h3>
        <div className="text-xs sm:text-sm text-[#e8ecc4]/80 dark:text-emerald-300/60 font-medium mb-3">
          <div>{major}</div>
          <div>{t("visitor.org.angkatan").replace("{batch}", batch)}</div>
        </div>
        
        {/* Social Links */}
        <div className="flex justify-center md:justify-start items-center gap-3 mt-4">
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${name}'s LinkedIn`}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 hover:bg-yellow-300 hover:text-slate-950 dark:hover:bg-emerald-400 flex items-center justify-center text-white transition-all duration-300"
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
          )}
          {socials.email && (
            <a
              href={socials.email}
              aria-label={`Email ${name}`}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 hover:bg-yellow-300 hover:text-slate-950 dark:hover:bg-emerald-400 flex items-center justify-center text-white transition-all duration-300"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 5. Manager Section component ──────────────────────────────────────────────
export function ManagerSection({ divisions }) {
  const { t } = useLanguage();
  const divisionsWithManagers = divisions ? divisions.filter(div => div.manager) : [];
  
  if (divisionsWithManagers.length === 0) return null;

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h3 className="text-sm font-black text-yellow-300 dark:text-emerald-400 tracking-[0.25em] uppercase mb-1">
          {t("visitor.org.div_managers")}
        </h3>
        <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">
          {t("visitor.org.div_leadership")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center max-w-5xl mx-auto w-full">
        {divisionsWithManagers.map((div, idx) => (
          <div key={idx} className="flex flex-col gap-3">
            <div className="text-xs font-black tracking-widest text-white/40 uppercase text-center border-b border-white/10 pb-2">
              {div.name}
            </div>
            <MemberCard member={div.manager} fallbackRole="Division Manager" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 6. Staff Grid component ──────────────────────────────────────────────────
export function StaffGrid({ divisions }) {
  const { t } = useLanguage();
  // Aggregate all staff across all divisions
  const allStaff = [];
  if (divisions) {
    divisions.forEach(div => {
      if (div.staff && Array.isArray(div.staff)) {
        div.staff.forEach(s => {
          allStaff.push({
            ...s,
            divisionName: div.name
          });
        });
      }
    });
  }

  if (allStaff.length === 0) return null;

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h3 className="text-sm font-black text-yellow-300 dark:text-emerald-400 tracking-[0.25em] uppercase mb-1">
          {t("visitor.org.staff_title")}
        </h3>
        <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">
          {t("visitor.org.all_staff")}
        </h2>
      </div>

      {/* Adaptive responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 max-w-7xl mx-auto w-full">
        {allStaff.map((staffMember, idx) => (
          <MemberCard
            key={idx}
            member={staffMember}
            fallbackRole={`Staff of ${staffMember.divisionName || "Division"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 7. Org Tree Section component (Hierarchical Layout) ────────────────────────
export function OrgTreeSection({ dept }) {
  const { t } = useLanguage();
  if (!dept) return null;

  const isExecutive = dept.code?.toUpperCase() === "EXE";

  if (isExecutive) {
    const president = dept.users?.find(u => u.positionName?.toLowerCase() === "president");
    const vps = dept.users?.filter(u => u.positionName?.toLowerCase().includes("vice president")) || [];
    const secretaries = dept.users?.filter(u => u.positionName?.toLowerCase().includes("secretary") || u.positionName?.toLowerCase().includes("sekretaris")) || [];

    const formatUser = (user, fallbackRole) => {
      if (!user) return null;
      return {
        name: user.name,
        role: user.positionName || fallbackRole,
        photo: user.profilePictureUrl || user.image || null,
        npm: user.npm || null,
        socials: {}
      };
    };

    const presidentData = formatUser(president, "President");

    return (
      <div className="w-full flex flex-col items-center animate-fade-in pb-20">
        {/* PRESIDENT */}
        {presidentData && (
          <div className="flex flex-col items-center w-full mt-10">
            <div className="text-center mb-6">
              <h3 className="text-xs sm:text-sm font-black text-yellow-300 dark:text-emerald-400 tracking-[0.25em] uppercase mb-1">
                {t("visitor.org.exec_leader")}
              </h3>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-tight drop-shadow-md">
                {t("visitor.org.president")}
              </h2>
            </div>
            
            <div className="relative z-10 w-full max-w-[550px] hover:-translate-y-2 transition-transform duration-500">
              <DirectorCard director={presidentData} fallbackRole="President" />
            </div>

            {((vps.length > 0) || (secretaries.length > 0)) && (
              <div className="w-px h-12 bg-gradient-to-b from-yellow-300 to-yellow-300/30 dark:from-emerald-500/80 dark:to-emerald-500/20 mt-6 relative">
                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-yellow-300 dark:bg-emerald-400 shadow-[0_0_10px_rgba(253,224,71,0.6)]"></div>
              </div>
            )}
          </div>
        )}

        {/* VICE PRESIDENTS */}
        {vps.length > 0 && (
          <div className="w-full flex flex-col items-center mt-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight drop-shadow-md">
                {t("visitor.org.vp")}s
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-8 w-full max-w-4xl px-4 z-10">
              {vps.map((vp, idx) => (
                <div key={idx} className="w-full max-w-[280px] hover:-translate-y-1.5 transition-transform duration-300">
                  <MemberCard member={formatUser(vp, "Vice President")} fallbackRole="Vice President" />
                </div>
              ))}
            </div>

            {secretaries.length > 0 && (
              <div className="w-px h-12 bg-gradient-to-b from-yellow-300 to-yellow-300/30 dark:from-emerald-500/80 dark:to-emerald-500/20 mt-6 relative">
                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-yellow-300 dark:bg-emerald-400 shadow-[0_0_10px_rgba(253,224,71,0.6)]"></div>
              </div>
            )}
          </div>
        )}

        {/* SECRETARIES */}
        {secretaries.length > 0 && (
          <div className="w-full flex flex-col items-center mt-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight drop-shadow-md">
                {t("visitor.org.secretary")}s
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-8 w-full max-w-4xl px-4 z-10">
              {secretaries.map((sec, idx) => (
                <div key={idx} className="w-full max-w-[280px] hover:-translate-y-1.5 transition-transform duration-300">
                  <MemberCard member={formatUser(sec, "Secretary")} fallbackRole="Secretary" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasDivisions = dept.divisions && dept.divisions.length > 0;

  return (
    <div className="w-full flex flex-col items-center pb-20">
      
      {/* DIRECTOR LEVEL */}
      {dept.director && (
        <div className="flex flex-col items-center w-full mt-10">
          <div className="text-center mb-6">
            <h3 className="text-xs sm:text-sm font-black text-yellow-300 dark:text-emerald-400 tracking-[0.25em] uppercase mb-1">
              {t("visitor.org.dept_leader")}
            </h3>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-tight drop-shadow-md">
              {t("visitor.org.director")}
            </h2>
          </div>
          
          <div className="relative z-10 w-full max-w-[550px] hover:-translate-y-2 transition-transform duration-500">
            <DirectorCard director={dept.director} fallbackRole={`Director of ${dept.name}`} />
          </div>
          
          {/* Connector Line down from Director to Divisions */}
          {hasDivisions && (
            <div className="w-px h-16 bg-gradient-to-b from-yellow-300 to-yellow-300/30 dark:from-emerald-500/80 dark:to-emerald-500/20 mt-6 relative">
               {/* Decorative Dot at connection point */}
               <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-yellow-300 dark:bg-emerald-400 shadow-[0_0_10px_rgba(253,224,71,0.6)]"></div>
            </div>
          )}
        </div>
      )}

      {/* DIVISIONS LEVEL */}
      {hasDivisions && (
        <div className="w-full relative mt-1.5">
          {/* Top Horizontal Connecting Line */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-yellow-300/80 dark:bg-emerald-500/40 hidden md:block"></div>
          
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-16 items-start w-full pt-8">
            {dept.divisions.map((div, idx) => (
              <div key={idx} className="flex flex-col items-center w-full sm:w-[300px] shrink-0 relative group/division">
                
                {/* Vertical line connecting horizontal bar to Division title (Desktop) */}
                <div className="hidden md:block absolute -top-10 left-1/2 w-px h-10 bg-yellow-300/80 dark:bg-emerald-500/40 -translate-x-1/2 group-hover/division:bg-yellow-300 transition-colors"></div>
                
                {/* Division Header */}
                <div className="bg-[#099c6d] dark:bg-[#07130e] border border-yellow-300/40 dark:border-emerald-500/40 px-6 py-2.5 rounded-full mb-8 z-10 text-center shadow-lg hover:border-yellow-300 transition-colors">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white dark:text-emerald-400">{div.name}</span>
                </div>

                {/* Manager */}
                {div.manager ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full max-w-[190px] z-10 hover:-translate-y-1.5 transition-transform duration-300">
                      <MemberCard member={div.manager} fallbackRole="Division Manager" />
                    </div>
                    {/* Connector to staff */}
                    {div.staff && div.staff.length > 0 && (
                      <div className="w-px h-10 bg-yellow-300/80 dark:bg-emerald-500/30 my-4"></div>
                    )}
                  </div>
                ) : (
                  // If no manager but has staff, still need a line
                  div.staff && div.staff.length > 0 && (
                     <div className="w-px h-10 bg-yellow-300/80 dark:bg-emerald-500/30 mb-4 -mt-4"></div>
                  )
                )}

                {/* Staff Grid */}
                {div.staff && div.staff.length > 0 && (
                  <div className="w-full grid grid-cols-2 gap-3 mt-2 px-1">
                    {div.staff.map((staffMember, sIdx) => (
                      <div key={sIdx} className="w-full h-auto flex hover:-translate-y-1 transition-transform duration-300">
                        <MemberCard member={staffMember} fallbackRole="Staff" />
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
