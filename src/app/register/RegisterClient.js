"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

// Custom Select Component
const CustomSelect = ({ options, value, onChange, disabled, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative group w-full">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`block w-full px-0 py-3 text-left bg-transparent border-0 border-b-2 border-white/20 cursor-pointer transition-colors flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#e8ecc4]'}`}
      >
        <span className={value ? "text-white" : "text-transparent"}>
          {selectedOption ? selectedOption.label : "Select"}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </div>
      
      <label className={`absolute text-[15px] pointer-events-none duration-300 transform -z-10 origin-[0] ${value || isOpen ? '-translate-y-6 scale-75 top-3 left-0 text-[#e8ecc4]' : 'translate-y-0 scale-100 top-3 left-0 text-white/50'}`}>
        {label}
      </label>

      <AnimatePresence>
        {isOpen && !disabled && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full mt-2 bg-[#0a2e24] border border-[#e8ecc4]/20 rounded-xl overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto"
            >
              {options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-3 cursor-pointer text-sm transition-colors ${value === opt.value ? 'bg-[#e8ecc4] text-[#0a1c15] font-bold' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                >
                  {opt.label}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function RegisterClient({ roles, departments, divisions }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    npm: "",
    password: "",
    confirmPassword: "",
    roleId: "",
    departmentId: "",
    divisionId: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredDivisions = useMemo(() => {
    if (!formData.departmentId) return [];
    return divisions.filter((div) => div.departmentId.toString() === formData.departmentId.toString());
  }, [formData.departmentId, divisions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "departmentId" ? { divisionId: "" } : {})
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "departmentId" ? { divisionId: "" } : {})
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0a1c15] text-white overflow-hidden">
      
      {/* Left side: Video Background */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 lg:p-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video 
            src="/video/hero.mp4" 
            autoPlay 
            loop 
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0a2e24] opacity-80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1c15] via-transparent to-[#0a1c15]/50" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center cursor-pointer"
            >
              <img src="/images/logo.png" alt="SRE Logo" className="h-10 w-auto object-contain" />
            </motion.div>
          </Link>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h2 className="text-[48px] xl:text-[64px] font-display font-black uppercase tracking-tighter leading-[0.9] mb-6">
                Join <br />
                <span className="text-[#e8ecc4] font-serif italic font-normal text-[36px] xl:text-[48px] lowercase tracking-normal">the</span> <br />
                Movement
              </h2>
              <p className="text-white/70 max-w-sm text-[15px] leading-relaxed font-light">
                Create an account to participate in our projects, access resources, and accelerate the sustainable energy transition.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-20 relative z-10 overflow-y-auto">
        
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/">
            <div className="inline-flex items-center cursor-pointer">
              <img src="/images/logo.png" alt="SRE Logo" className="h-8 w-auto object-contain" />
            </div>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[480px] my-auto py-12"
        >
          <div className="mb-10">
            <h1 className="text-[32px] md:text-[40px] font-display font-bold tracking-tight mb-2">
              Create Account
            </h1>
            <p className="text-white/50 text-[14px]">
              Fill out the details below to request access.
            </p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleRegister}>
            
            {/* Name */}
            <div className="relative group">
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder=" "
                className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[#e8ecc4] peer transition-colors"
                required
              />
              <label 
                className="absolute text-[15px] text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Full Name
              </label>
            </div>

            {/* Email & NPM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[#e8ecc4] peer transition-colors"
                  required
                />
                <label 
                  className="absolute text-[15px] text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Email address
                </label>
              </div>

              <div className="relative group">
                <input 
                  type="text" 
                  name="npm"
                  value={formData.npm}
                  onChange={handleChange}
                  placeholder=" "
                  className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[#e8ecc4] peer transition-colors"
                />
                <label 
                  className="absolute text-[15px] text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  NPM (Optional)
                </label>
              </div>
            </div>

            {/* Role */}
            <CustomSelect 
              label="Desired Role"
              value={formData.roleId}
              onChange={(v) => handleSelectChange('roleId', v)}
              options={roles.map(r => ({ value: r.id.toString(), label: r.name }))}
            />

            {/* Department & Division */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <CustomSelect 
                label="Department"
                value={formData.departmentId}
                onChange={(v) => handleSelectChange('departmentId', v)}
                options={[
                  { value: "", label: "None / External" },
                  ...departments.map(d => ({ value: d.id.toString(), label: d.name }))
                ]}
              />

              <CustomSelect 
                label="Division"
                value={formData.divisionId}
                onChange={(v) => handleSelectChange('divisionId', v)}
                disabled={!formData.departmentId || filteredDivisions.length === 0}
                options={[
                  { value: "", label: "None" },
                  ...filteredDivisions.map(d => ({ value: d.id.toString(), label: d.name }))
                ]}
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=" "
                  minLength={6}
                  className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[#e8ecc4] peer transition-colors pr-10"
                  required
                />
                <label 
                  className="absolute text-[15px] text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Password
                </label>
              </div>

              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder=" "
                  minLength={6}
                  className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[#e8ecc4] peer transition-colors pr-10"
                  required
                />
                <label 
                  className="absolute text-[15px] text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Confirm Password
                </label>
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-3 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-4 py-3 rounded-lg text-center mt-2">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm px-4 py-3 rounded-lg text-center mt-2">
                {success}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading || success !== ""}
              className="group relative w-full flex items-center justify-center gap-3 bg-[#e8ecc4] text-[#0a1c15] text-[15px] font-bold tracking-widest uppercase rounded-full px-8 py-4 mt-6 overflow-hidden transition-transform active:scale-95 hover:bg-white disabled:opacity-70 disabled:active:scale-100"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>

          </form>

          <div className="mt-10 text-center text-[13px] text-white/50">
            Already have an account?{' '}
            <Link href="/login" className="text-[#e8ecc4] hover:text-white transition-colors font-bold tracking-wide">
              Sign In
            </Link>
          </div>

        </motion.div>
      </div>

    </div>
  );
}
