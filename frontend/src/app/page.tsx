"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  ArrowRight01Icon,
  CodeIcon,
  Globe02Icon,
  Copy01Icon,
  Tick01Icon,
  Logout01Icon,
  Layers01Icon,
  LaptopIcon,
  CpuIcon,
  BookOpen01Icon,
  SlidersHorizontalIcon,
  InformationCircleIcon
} from "hugeicons-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";
import { tokenStorage, api, User } from "../utils/api";

export default function Home() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Page Load Animations (Hero Section)
      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });
      tl.fromTo("header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });
      tl.fromTo("#hero-text > *", { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15 }, "-=0.3");
      tl.fromTo("#playground", { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, "-=0.6");
      tl.fromTo("#trust-banner", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.4");

      // 2. Scroll Trigger: Features Grid Section
      gsap.fromTo(
        "#features-grid > *",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#features",
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );

      // 3. Scroll Trigger: Workflow Guide Steps (Alternating left/right slide)
      const steps = gsap.utils.toArray(".workflow-step");
      steps.forEach((step: unknown) => {
        const stepEl = step as HTMLElement;
        const cols = stepEl.querySelectorAll(":scope > div");
        if (cols.length >= 2) {
          // Left column slides in from left
          gsap.fromTo(
            cols[0],
            { x: -50, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: {
                trigger: stepEl,
                start: "top 80%",
                toggleActions: "play none none none"
              }
            }
          );
          // Right column slides in from right
          gsap.fromTo(
            cols[1],
            { x: 50, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: {
                trigger: stepEl,
                start: "top 80%",
                toggleActions: "play none none none"
              }
            }
          );
        } else {
          gsap.fromTo(
            stepEl,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: stepEl,
                start: "top 85%",
                toggleActions: "play none none none"
              }
            }
          );
        }
      });

      // 4. Scroll Trigger: FAQ Section items
      gsap.fromTo(
        "#faq-accordion > *",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#faq-section",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );

      // 5. Scroll Trigger: Premium CTA Banner
      gsap.fromTo(
        "#cta-banner",
        { scale: 0.97, opacity: 0, y: 35 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#cta-banner",
            start: "top 90%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const [user, setUser] = useState<User | null>(null);

  // Authenticate on mount
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token) {
      api
        .getMe()
        .then(({ user }) => {
          setUser(user);
        })
        .catch(() => {
          tokenStorage.clearToken();
        });
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  // Demo visualizer state
  const [demoLabel, setDemoLabel] = useState("Launch Workspace");
  const [demoVariant, setDemoVariant] = useState<"solid" | "outline" | "soft">("solid");
  const [demoSize, setDemoSize] = useState<"sm" | "md" | "lg">("md");
  const [demoRoundness, setDemoRoundness] = useState<"none" | "md" | "full">("md");
  const [demoColor, setDemoColor] = useState<"clay" | "charcoal" | "green">("clay");
  const [copiedDemoCode, setCopiedDemoCode] = useState(false);

  // Dynamic Tailwind button class generator
  const demoButtonClass = useMemo(() => {
    let sizeClass = "px-4 py-2 text-sm";
    if (demoSize === "sm") sizeClass = "px-3 py-1.5 text-xs";
    if (demoSize === "lg") sizeClass = "px-6 py-3 text-base";

    let roundClass = "rounded-lg";
    if (demoRoundness === "none") roundClass = "rounded-none";
    if (demoRoundness === "full") roundClass = "rounded-full";

    let colorClass = "";
    if (demoColor === "clay") {
      if (demoVariant === "solid") colorClass = "bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white border-transparent";
      else if (demoVariant === "outline") colorClass = "bg-transparent border border-rosy-copper-400 text-rosy-copper-600 hover:bg-rosy-copper-50";
      else colorClass = "bg-rosy-copper-50 text-rosy-copper-700 hover:bg-rosy-copper-100 border-transparent";
    } else if (demoColor === "charcoal") {
      if (demoVariant === "solid") colorClass = "bg-graphite-900 hover:bg-graphite-950 text-white border-transparent";
      else if (demoVariant === "outline") colorClass = "bg-transparent border border-graphite-300 text-graphite-800 hover:bg-graphite-50";
      else colorClass = "bg-graphite-100 text-graphite-900 hover:bg-graphite-200 border-transparent";
    } else {
      if (demoVariant === "solid") colorClass = "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent";
      else if (demoVariant === "outline") colorClass = "bg-transparent border border-emerald-450 text-emerald-600 hover:bg-emerald-50";
      else colorClass = "bg-emerald-50 text-emerald-755 hover:bg-emerald-100 border-transparent";
    }

    return `${sizeClass} ${roundClass} ${colorClass} font-bold transition-all shadow-xs duration-150 cursor-pointer active:scale-95 border flex items-center gap-1.5`;
  }, [demoVariant, demoSize, demoRoundness, demoColor]);

  // Code preview tab state
  const [codeTab, setCodeTab] = useState<"tsx" | "jsx" | "html" | "css">("tsx");

  // Dynamic code previews for all tabs
  const tsxSnippet = useMemo(() => {
    return `import React from 'react';\nimport { Button } from './Button';\n\nexport default function App() {\n  return (\n    <Button\n      label="${demoLabel}"\n      variant="${demoVariant}"\n      size="${demoSize}"\n      roundness="${demoRoundness}"\n      color="${demoColor}"\n    />\n  );\n}`;
  }, [demoLabel, demoVariant, demoSize, demoRoundness, demoColor]);

  const jsxSnippet = useMemo(() => {
    return `import React from 'react';\nimport Button from './Button';\n\nexport default function App() {\n  return (\n    <Button\n      label="${demoLabel}"\n      variant="${demoVariant}"\n      size="${demoSize}"\n      roundness="${demoRoundness}"\n      color="${demoColor}"\n    />\n  );\n}`;
  }, [demoLabel, demoVariant, demoSize, demoRoundness, demoColor]);

  const htmlSnippet = useMemo(() => {
    let sizeClasses = "px-4 py-2 text-sm";
    if (demoSize === "sm") sizeClasses = "px-3 py-1.5 text-xs";
    if (demoSize === "lg") sizeClasses = "px-6 py-3 text-base";

    let roundClasses = "rounded-lg";
    if (demoRoundness === "none") roundClasses = "rounded-none";
    if (demoRoundness === "full") roundClasses = "rounded-full";

    let colorClasses = "";
    if (demoColor === "clay") {
      if (demoVariant === "solid") colorClasses = "bg-rosy-copper-600 text-white border-transparent hover:bg-rosy-copper-750";
      else if (demoVariant === "outline") colorClasses = "bg-transparent border border-rosy-copper-400 text-rosy-copper-600 hover:bg-rosy-copper-50";
      else colorClasses = "bg-rosy-copper-50 text-rosy-copper-700 hover:bg-rosy-copper-100 border-transparent";
    } else if (demoColor === "charcoal") {
      if (demoVariant === "solid") colorClasses = "bg-graphite-900 text-white border-transparent hover:bg-graphite-950";
      else if (demoVariant === "outline") colorClasses = "bg-transparent border border-graphite-300 text-graphite-800 hover:bg-graphite-50";
      else colorClasses = "bg-graphite-100 text-graphite-900 hover:bg-graphite-200 border-transparent";
    } else {
      if (demoVariant === "solid") colorClasses = "bg-emerald-600 text-white border-transparent hover:bg-emerald-700";
      else if (demoVariant === "outline") colorClasses = "bg-transparent border border-emerald-450 text-emerald-600 hover:bg-emerald-50";
      else colorClasses = "bg-emerald-50 text-emerald-755 hover:bg-emerald-100 border-transparent";
    }

    return `<button class="${sizeClasses} ${roundClasses} ${colorClasses} font-bold border transition-all duration-150 shadow-xs flex items-center gap-1.5">\n  <Sparkles class="w-3.5 h-3.5" />\n  ${demoLabel}\n</button>`;
  }, [demoLabel, demoVariant, demoSize, demoRoundness, demoColor]);

  const cssSnippet = useMemo(() => {
    let paddingVal = "0.5rem 1rem";
    let fontSz = "0.875rem";
    if (demoSize === "sm") { paddingVal = "0.375rem 0.75rem"; fontSz = "0.75rem"; }
    if (demoSize === "lg") { paddingVal = "0.75rem 1.5rem"; fontSz = "1rem"; }

    let borderRad = "0.5rem";
    if (demoRoundness === "none") borderRad = "0px";
    if (demoRoundness === "full") borderRad = "9999px";

    let bgVal = "";
    let txtColor = "";
    let borderVal = "1px solid transparent";

    if (demoColor === "clay") {
      if (demoVariant === "solid") { bgVal = "#c45d3b"; txtColor = "#ffffff"; }
      else if (demoVariant === "outline") { bgVal = "transparent"; txtColor = "#c45d3b"; borderVal = "1px solid #e09880"; }
      else { bgVal = "#fdf5f2"; txtColor = "#a34526"; }
    } else if (demoColor === "charcoal") {
      if (demoVariant === "solid") { bgVal = "#1f1815"; txtColor = "#ffffff"; }
      else if (demoVariant === "outline") { bgVal = "transparent"; txtColor = "#25180e"; borderVal = "1px solid #ded6d1"; }
      else { bgVal = "#f5f0ed"; txtColor = "#1f1815"; }
    } else {
      if (demoVariant === "solid") { bgVal = "#059669"; txtColor = "#ffffff"; }
      else if (demoVariant === "outline") { bgVal = "transparent"; txtColor = "#059669"; borderVal = "1px solid #34d399"; }
      else { bgVal = "#ecfdf5"; txtColor = "#047857"; }
    }

    return `.custom-btn {\n  display: flex;\n  align-items: center;\n  gap: 0.375rem;\n  font-weight: 700;\n  font-size: ${fontSz};\n  padding: ${paddingVal};\n  border-radius: ${borderRad};\n  background-color: ${bgVal};\n  color: ${txtColor};\n  border: ${borderVal};\n  transition: all 0.15s ease;\n}`;
  }, [demoVariant, demoSize, demoRoundness, demoColor]);

  const copyDemoCode = () => {
    const textToCopy =
      codeTab === "tsx"
        ? tsxSnippet
        : codeTab === "jsx"
        ? jsxSnippet
        : codeTab === "html"
        ? htmlSnippet
        : cssSnippet;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDemoCode(true);
    setTimeout(() => setCopiedDemoCode(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-golden-chestnut-50 text-golden-chestnut-900 selection:bg-golden-chestnut-200 selection:text-golden-chestnut-950 font-sans">
      {/* Sticky Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-golden-chestnut-100 bg-white/70 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto px-6 max-w-6xl h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-extrabold tracking-tight text-rosy-copper-600">
              Scaffold
            </span>
          </Link>

          {/* Center Links (Desktop only) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-graphite-550">
            <a href="#playground" className="hover:text-rosy-copper-600 transition">Live Playground</a>
            <a href="#features" className="hover:text-rosy-copper-600 transition">Features</a>
            <a href="#process" className="hover:text-rosy-copper-600 transition">How it Works</a>
          </nav>

          <nav className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-graphite-450 font-semibold">
                  Space: <span className="text-golden-chestnut-950 font-extrabold">{user.username}</span>
                </span>
                <Link
                  href="/dashboard"
                  className="px-4.5 py-2 rounded-xl text-xs font-bold border border-golden-chestnut-200 bg-white text-golden-chestnut-700 hover:bg-golden-chestnut-50 transition cursor-pointer shadow-xs active:scale-95"
                >
                  Console Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl border border-golden-chestnut-200 bg-white hover:bg-oxblood-50 hover:text-oxblood-700 text-graphite-455 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Logout"
                >
                  <Logout01Icon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-golden-chestnut-700 hover:text-golden-chestnut-900 cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white transition shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        
        {/* Modern Hero Showcase */}
        <section className="container mx-auto px-6 py-16 md:py-24 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
            {/* Left Content */}
            <div id="hero-text" className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-golden-chestnut-200 bg-golden-chestnut-100/60 text-golden-chestnut-800 text-[10px] font-extrabold uppercase tracking-wider">
                <SparklesIcon className="w-3.5 h-3.5 text-rosy-copper-500 animate-pulse" />
                Collaborative Component Spaces
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-golden-chestnut-950 leading-tight">
                Bridge the gap between <span className="bg-gradient-to-r from-rosy-copper-600 to-golden-chestnut-500 bg-clip-text text-transparent">design & engineering</span>.
              </h1>
              
              <p className="text-base sm:text-lg text-graphite-650 leading-relaxed max-w-xl">
                Scaffold hosts interactive preview repositories for custom React & Tailwind components. Let developers inspect responsive sizes, update live props, and copy generated JSX markup in a single click.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white text-center transition shadow-md hover:-translate-y-0.5"
                  >
                    Open Console Panel
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white text-center transition shadow-md hover:-translate-y-0.5 active:scale-98"
                    >
                      Start Free Workspace
                    </Link>
                    <Link
                      href="/login"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold border border-golden-chestnut-200 bg-white text-golden-chestnut-700 text-center hover:bg-golden-chestnut-100/50 transition cursor-pointer"
                    >
                      Explore Public Hub
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Content - Interactive Simulator */}
            <div id="playground" className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md lg:max-w-full rounded-3xl border border-golden-chestnut-200/80 bg-white p-5 shadow-lg relative">
                <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-lg bg-golden-chestnut-950 text-white text-[9px] font-bold uppercase tracking-wider">
                  Live Showcase Canvas
                </div>
                
                {/* Visualizer Panel Grid */}
                <div className="space-y-4">
                  {/* Preview box */}
                  <div className="h-36 rounded-2xl bg-golden-chestnut-50/50 border border-golden-chestnut-100 flex items-center justify-center relative p-4 overflow-hidden">
                    <div className="absolute top-2 left-2 text-[8px] font-bold uppercase text-graphite-400">
                      Sandbox Output
                    </div>
                    <button className={demoButtonClass}>
                      <SparklesIcon className="w-3.5 h-3.5" />
                      {demoLabel}
                    </button>
                  </div>

                  {/* Property Controls */}
                  <div className="bg-golden-chestnut-50/20 border border-golden-chestnut-150 rounded-2xl p-4 space-y-3.5 text-xs text-left">
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-graphite-450 mb-1.5">
                        Prop: label (string)
                      </span>
                      <input
                        type="text"
                        value={demoLabel}
                        onChange={(e) => setDemoLabel(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-golden-chestnut-200 bg-white text-golden-chestnut-900 text-xs focus:border-rosy-copper-600 outline-none transition font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-graphite-455 mb-1">
                          Prop: variant
                        </span>
                        <div className="grid grid-cols-3 gap-1 border border-golden-chestnut-200 p-0.5 rounded-lg bg-white font-bold text-[9px]">
                          {(["solid", "outline", "soft"] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => setDemoVariant(v)}
                              className={`py-1 rounded uppercase transition cursor-pointer ${
                                demoVariant === v
                                  ? "bg-golden-chestnut-100 text-rosy-copper-750"
                                  : "text-graphite-400 hover:text-graphite-700"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] font-bold uppercase text-graphite-455 mb-1">
                          Prop: size
                        </span>
                        <div className="grid grid-cols-3 gap-1 border border-golden-chestnut-200 p-0.5 rounded-lg bg-white font-bold text-[9px]">
                          {(["sm", "md", "lg"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => setDemoSize(s)}
                              className={`py-1 rounded uppercase transition cursor-pointer ${
                                demoSize === s
                                  ? "bg-golden-chestnut-100 text-rosy-copper-750"
                                  : "text-graphite-400 hover:text-graphite-700"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-graphite-455 mb-1">
                          Prop: roundness
                        </span>
                        <div className="grid grid-cols-3 gap-1 border border-golden-chestnut-200 p-0.5 rounded-lg bg-white font-bold text-[9px]">
                          {(["none", "md", "full"] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => setDemoRoundness(r)}
                              className={`py-1 rounded uppercase transition cursor-pointer ${
                                demoRoundness === r
                                  ? "bg-golden-chestnut-100 text-rosy-copper-750"
                                  : "text-graphite-400 hover:text-graphite-700"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] font-bold uppercase text-graphite-455 mb-1">
                          Prop: color
                        </span>
                        <div className="grid grid-cols-3 gap-1 border border-golden-chestnut-200 p-0.5 rounded-lg bg-white font-bold text-[9px]">
                          {(["clay", "charcoal", "green"] as const).map((c) => (
                            <button
                              key={c}
                              onClick={() => setDemoColor(c)}
                              className={`py-1 rounded uppercase transition cursor-pointer ${
                                demoColor === c
                                  ? "bg-golden-chestnut-100 text-rosy-copper-750"
                                  : "text-graphite-400 hover:text-graphite-700"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Output code block */}
                  <div className="bg-golden-chestnut-950 rounded-2xl p-4 text-left relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-1 border border-white/10 p-0.5 rounded-lg bg-white/5 text-[9px] font-bold">
                        {(["tsx", "jsx", "html", "css"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setCodeTab(t)}
                            className={`px-2 py-0.5 rounded uppercase transition cursor-pointer ${
                              codeTab === t
                                ? "bg-white/15 text-white"
                                : "text-white/60 hover:text-white"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={copyDemoCode}
                        className="text-[9px] font-bold text-white hover:text-golden-chestnut-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDemoCode ? (
                          <>
                            <Tick01Icon className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy01Icon className="w-3 h-3" /> Copy Code
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="font-mono text-[10px] text-white/90 whitespace-pre leading-normal overflow-x-auto">
                      {codeTab === "tsx"
                        ? tsxSnippet
                        : codeTab === "jsx"
                        ? jsxSnippet
                        : codeTab === "html"
                        ? htmlSnippet
                        : cssSnippet}
                    </pre>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Minimalist Logo Cloud / Trust Banner */}
        <section id="trust-banner" className="border-y border-golden-chestnut-100 bg-white py-10 overflow-hidden">
          <div className="container mx-auto px-6 max-w-6xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-graphite-400">
              Empowering Collaborative Development at Modern Organizations
            </span>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 mt-6 opacity-40 font-mono text-sm tracking-wider font-extrabold text-golden-chestnut-950">
              <span>STRIPE</span>
              <span>FIGMA</span>
              <span>SUPABASE</span>
              <span>LINEAR</span>
              <span>VERCEL</span>
            </div>
          </div>
        </section>

        {/* Core Features Grid Section */}
        <section id="features" className="container mx-auto px-6 py-20 max-w-6xl border-t border-golden-chestnut-150">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rosy-copper-100/60 text-rosy-copper-800 text-[10px] font-extrabold uppercase tracking-wider">
              <SparklesIcon className="w-3 h-3 text-rosy-copper-600" /> Platform Features
            </span>
            <h2 className="text-3xl font-extrabold text-golden-chestnut-950 tracking-tight">
              Designed for modern design systems.
            </h2>
            <p className="text-xs text-graphite-500 leading-relaxed font-medium">
              Everything you need to host, preview, and test custom UI components collaboratively.
            </p>
          </div>

          <div id="features-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-white border border-golden-chestnut-200/60 shadow-2xs hover:shadow-xs transition duration-300 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <CodeIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-golden-chestnut-950">AST Parsing Engine</h3>
              <p className="text-xs text-graphite-500 leading-relaxed">
                Automatically extracts properties, types, default values, and JSDoc comments from your React element TSX code files.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-white border border-golden-chestnut-200/60 shadow-2xs hover:shadow-xs transition duration-300 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <LaptopIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-golden-chestnut-950">Responsive Viewports</h3>
              <p className="text-xs text-graphite-500 leading-relaxed">
                Test responsive layouts and flexbox grids across mobile, tablet, and desktop bounds in an isolated, secure sandboxed iframe.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-white border border-golden-chestnut-200/60 shadow-2xs hover:shadow-xs transition duration-300 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <Globe02Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-golden-chestnut-950">Secure Share Links</h3>
              <p className="text-xs text-graphite-500 leading-relaxed">
                Share private workspaces securely or publish public templates for client review and team collaboration without keys.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-white border border-golden-chestnut-200/60 shadow-2xs hover:shadow-xs transition duration-300 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <CpuIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-golden-chestnut-950">Developer CLI & Keys</h3>
              <p className="text-xs text-graphite-500 leading-relaxed">
                Generate developer tokens from your settings console to push components directly from local terminals or CI/CD pipelines.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-white border border-golden-chestnut-200/60 shadow-2xs hover:shadow-xs transition duration-300 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <SlidersHorizontalIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-golden-chestnut-950">Dynamic Prop Tables</h3>
              <p className="text-xs text-graphite-500 leading-relaxed">
                Generates parameter tables with inputs, dropdowns, and switches linked directly to compile-time React prop models.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-white border border-golden-chestnut-200/60 shadow-2xs hover:shadow-xs transition duration-300 space-y-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-golden-chestnut-950">Custom Tailwind Theme</h3>
              <p className="text-xs text-graphite-500 leading-relaxed">
                Inject custom brand colors, spacing variables, and border properties dynamically to make component styling render accurately.
              </p>
            </div>
          </div>
        </section>

        {/* Step-by-step capabilities Showcase */}
        <section id="process" className="container mx-auto px-6 py-20 max-w-6xl border-t border-golden-chestnut-150">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rosy-copper-100/60 text-rosy-copper-800 text-[10px] font-extrabold uppercase tracking-wider">
              <BookOpen01Icon className="w-3 h-3 text-rosy-copper-600" /> Workflow Guide
            </span>
            <h2 className="text-3xl font-extrabold text-golden-chestnut-950 tracking-tight">
              How Scaffold Works
            </h2>
            <p className="text-xs text-graphite-500 leading-relaxed font-medium">
              Go from local code components to a public collaborative design workspace in three simple steps.
            </p>
          </div>

          <div className="space-y-16 max-w-6xl mx-auto">
            {/* Step 1: AST Parsing */}
            <div className="workflow-step grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
              <div className="md:col-span-6 text-left space-y-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-golden-chestnut-100 text-rosy-copper-600 text-xs font-bold border border-golden-chestnut-200">
                  01
                </span>
                <h3 className="text-2xl font-extrabold text-golden-chestnut-950 tracking-tight">
                  Auto-parse props using TypeScript AST
                </h3>
                <p className="text-sm text-graphite-550 leading-relaxed">
                  Simply drop in custom React TSX or standard HTML/Tailwind elements. Our backend parsing script compiler reads typescript type definitions and JSDoc comments to generate control parameters automatically.
                </p>
                <div className="flex gap-4 text-sm font-bold text-rosy-copper-600">
                  <span className="flex items-center gap-1.5"><Tick01Icon className="w-4 h-4" /> JSDoc parser</span>
                  <span className="flex items-center gap-1.5"><Tick01Icon className="w-4 h-4" /> TypeScript interfaces</span>
                </div>
              </div>
              <div className="md:col-span-6 flex justify-center">
                <div className="p-3 bg-white border border-golden-chestnut-200 rounded-2xl shadow-sm hover:border-rosy-copper-300 transition duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/feature_parsing.jpg"
                    alt="Automatic Prop Parsing"
                    className="rounded-xl border border-golden-chestnut-100 w-full h-auto object-cover max-h-56"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: responsive framing */}
            <div className="workflow-step grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
              {/* Image Left for alternating layout on desktop */}
              <div className="md:col-span-6 flex justify-center order-last md:order-first">
                <div className="p-3 bg-white border border-golden-chestnut-200 rounded-2xl shadow-sm hover:border-rosy-copper-300 transition duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/feature_responsive.jpg"
                    alt="Responsive Playground Viewports"
                    className="rounded-xl border border-golden-chestnut-100 w-full h-auto object-cover max-h-56"
                  />
                </div>
              </div>

              <div className="md:col-span-6 text-left space-y-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-golden-chestnut-100 text-rosy-copper-600 text-xs font-bold border border-golden-chestnut-200">
                  02
                </span>
                <h3 className="text-2xl font-extrabold text-golden-chestnut-950 tracking-tight">
                  Inspect responsiveness inside fluid sandboxes
                </h3>
                <p className="text-sm text-graphite-550 leading-relaxed">
                  Verify how your responsive layout flows across device breakpoints. Change sandbox iframe viewports instantly between mobile, tablet, and widescreen frames with an integrated fluid control.
                </p>
                <div className="flex gap-4 text-sm font-bold text-rosy-copper-600">
                  <span className="flex items-center gap-1.5"><Tick01Icon className="w-4 h-4" /> Fluid layouts</span>
                  <span className="flex items-center gap-1.5"><Tick01Icon className="w-4 h-4" /> Safe preview iframe</span>
                </div>
              </div>
            </div>

            {/* Step 3: sharing element */}
            <div className="workflow-step grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
              <div className="md:col-span-6 text-left space-y-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-golden-chestnut-100 text-rosy-copper-600 text-xs font-bold border border-golden-chestnut-200">
                  03
                </span>
                <h3 className="text-2xl font-extrabold text-golden-chestnut-950 tracking-tight">
                  Copy dynamic snippets & share links
                </h3>
                <p className="text-sm text-graphite-550 leading-relaxed">
                  Generate secure sharing links to collaborate with client stakeholders or design teams. Let members interact with the component controls and copy customized React code snippets incorporating current variable values.
                </p>
                <div className="flex gap-4 text-sm font-bold text-rosy-copper-600">
                  <span className="flex items-center gap-1.5"><Tick01Icon className="w-4 h-4" /> Direct copy snippet</span>
                  <span className="flex items-center gap-1.5"><Tick01Icon className="w-4 h-4" /> Secure sharing links</span>
                </div>
              </div>
              <div className="md:col-span-6 flex justify-center">
                <div className="p-3 bg-white border border-golden-chestnut-200 rounded-2xl shadow-sm hover:border-rosy-copper-300 transition duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/hero_collaboration.jpg"
                    alt="Collaborative Workspace Previews"
                    className="rounded-xl border border-golden-chestnut-100 w-full h-auto object-cover max-h-56"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Performance Stats Banner */}
        <section className="bg-golden-chestnut-950 text-white py-14 overflow-hidden relative">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold text-golden-chestnut-200 flex items-center justify-center gap-1.5">
                  <CpuIcon className="w-5 h-5 text-rosy-copper-400" /> 14.2ms
                </h3>
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                  Average AST compilation time
                </p>
              </div>
              <div className="space-y-1 border-y sm:border-y-0 sm:border-x border-white/10 py-6 sm:py-0">
                <h3 className="text-3xl font-extrabold text-golden-chestnut-200 flex items-center justify-center gap-1.5">
                  <Layers01Icon className="w-5 h-5 text-rosy-copper-400" /> 10,000+
                </h3>
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                  Playground elements compiled
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold text-golden-chestnut-200 flex items-center justify-center gap-1.5">
                  <Globe02Icon className="w-5 h-5 text-rosy-copper-400" /> 99.99%
                </h3>
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                  Sandbox preview environment uptime
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Call to Action */}
        <section className="container mx-auto px-6 py-20 max-w-6xl">
          <div id="cta-banner" className="rounded-3xl bg-gradient-to-r from-rosy-copper-600 via-rosy-copper-500 to-golden-chestnut-500 p-8 md:p-12 text-white shadow-lg relative overflow-hidden text-center w-full">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-golden-chestnut-300/20 blur-2xl pointer-events-none" />
            
            <div className="relative z-10 max-w-xl mx-auto space-y-6">
              <span className="inline-flex px-3 py-1 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider">
                Get Started
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Document your components today.
              </h2>
              <p className="text-xs md:text-sm text-white/80 leading-relaxed max-w-md mx-auto">
                Host isolated viewports, sync property control tables, and share dynamic JSX snippets with clients and engineers instantly.
              </p>
              <div className="pt-2">
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-golden-chestnut-50 text-rosy-copper-755 hover:text-rosy-copper-900 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer border border-transparent"
                >
                  {user ? "Open Console Dashboard" : "Create Free Workspace"}{" "}
                  <ArrowRight01Icon className="w-4 h-4 text-rosy-copper-650" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Platform FAQs (using shadcn accordion) */}
        <section id="faq-section" className="container mx-auto px-6 py-24 max-w-4xl border-t border-golden-chestnut-150">
          <div className="text-center mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rosy-copper-100/60 text-rosy-copper-800 text-[10px] font-extrabold uppercase tracking-wider">
              <InformationCircleIcon className="w-3.5 h-3.5 text-rosy-copper-650" /> FAQ
            </span>
            <h2 className="text-3xl font-extrabold text-golden-chestnut-950 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-graphite-500 leading-relaxed font-medium">
              Got questions about our workspaces, compilers, or styling tokens? We&apos;ve got answers.
            </p>
          </div>

          <Accordion id="faq-accordion" className="w-full space-y-3">
            <AccordionItem value="item-1" className="border border-golden-chestnut-200 bg-white rounded-2xl px-5 py-1.5 shadow-2xs hover:border-rosy-copper-300 transition duration-150">
              <AccordionTrigger className="text-base font-extrabold text-golden-chestnut-950 hover:no-underline">
                What file extensions does Scaffold support?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-graphite-550 leading-relaxed pt-1.5 pb-4">
                Scaffold supports React components authored in TSX, JSX, raw HTML template files, and CSS stylesheets. You can configure Monaco syntax highlighting and transpilers directly inside the workspace playground.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-golden-chestnut-200 bg-white rounded-2xl px-5 py-1.5 shadow-2xs hover:border-rosy-copper-300 transition duration-150">
              <AccordionTrigger className="text-base font-extrabold text-golden-chestnut-950 hover:no-underline">
                How does the AST property parser compile component models?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-graphite-550 leading-relaxed pt-1.5 pb-4">
                When you upload or push a TSX component file, our backend TypeScript compiler parses the file&apos;s Abstract Syntax Tree (AST). It extracts exported React interface parameters, default values, and JSDoc comments, converting them into interactive property tables automatically.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-golden-chestnut-200 bg-white rounded-2xl px-5 py-1.5 shadow-2xs hover:border-rosy-copper-300 transition duration-150">
              <AccordionTrigger className="text-base font-extrabold text-golden-chestnut-950 hover:no-underline">
                Can I synchronize my local repository with Scaffold?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-graphite-550 leading-relaxed pt-1.5 pb-4">
                Yes! You can generate a developer token in your Settings panel and use the Scaffold CLI (<code className="font-mono text-rosy-copper-650 bg-golden-chestnut-100/50 px-1.5 py-0.5 rounded">npx @scaffold/cli push</code>) to sync your local component workspace folders directly from your terminal or CI/CD pipelines.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-golden-chestnut-200 bg-white rounded-2xl px-5 py-1.5 shadow-2xs hover:border-rosy-copper-300 transition duration-150">
              <AccordionTrigger className="text-base font-extrabold text-golden-chestnut-950 hover:no-underline">
                Is Tailwind CSS styling supported?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-graphite-550 leading-relaxed pt-1.5 pb-4">
                Absolutely. Every component preview canvas resolves utility classes dynamically. You can also customize your Tailwind configuration file inside the workspace settings to apply your specific design token theme (colors, borders, fonts).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </main>

      {/* Structured Footer */}
      <footer className="border-t border-golden-chestnut-200 bg-white py-16">
        <div className="container mx-auto px-6 max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <span className="text-lg font-extrabold tracking-tight text-rosy-copper-600">
              Scaffold
            </span>
            <p className="text-sm text-graphite-500 max-w-sm leading-relaxed font-medium">
              Bridges the gap between engineering and design. An instant, hosted component documentation library workspace for product developers and design stakeholders.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-graphite-500 mb-3.5">
              Platform
            </h4>
            <ul className="space-y-2 text-sm font-medium text-graphite-550">
              <li><Link href="/signup" className="hover:text-rosy-copper-600 transition">Interactive Sandbox</Link></li>
              <li><Link href="/login" className="hover:text-rosy-copper-600 transition">Automatic Prop Tables</Link></li>
              <li><Link href="/signup" className="hover:text-rosy-copper-600 transition">Responsive Viewports</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-graphite-500 mb-3.5">
              Community
            </h4>
            <ul className="space-y-2 text-sm font-medium text-graphite-550">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-rosy-copper-600 transition">GitHub</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-rosy-copper-600 transition">Twitter / X</a></li>
              <li><a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-rosy-copper-600 transition">Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-6xl border-t border-golden-chestnut-150 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-semibold text-graphite-450">
          <span>&copy; {new Date().getFullYear()} Scaffold. Crafted for modern product teams.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-rosy-copper-600 transition">Privacy Policy</a>
            <a href="#" className="hover:text-rosy-copper-600 transition">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
