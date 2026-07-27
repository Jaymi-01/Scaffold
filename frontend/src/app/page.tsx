"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { tokenStorage, api, User } from "../utils/api";
import {
  CodeIcon,
  Logout01Icon,
} from "hugeicons-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-golden-chestnut-50 text-golden-chestnut-900 selection:bg-golden-chestnut-200 selection:text-golden-chestnut-950">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-golden-chestnut-200 bg-golden-chestnut-50">
        <div className="container mx-auto px-6 max-w-4xl h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-rosy-copper-600 font-serif">
              Scaffold
            </span>
          </Link>

          <nav className="flex items-center gap-5">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-base text-graphite-500">
                  Space: <span className="text-rosy-copper-600 font-bold">{user.username}</span>
                </span>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-xl text-base font-bold border border-golden-chestnut-200 bg-white text-golden-chestnut-700 hover:bg-golden-chestnut-100 transition cursor-pointer"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl border border-golden-chestnut-200 bg-white hover:bg-oxblood-50 hover:text-oxblood-700 text-graphite-500 transition cursor-pointer"
                  title="Logout"
                >
                  <Logout01Icon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-base font-bold text-golden-chestnut-700 hover:text-rosy-copper-600 cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3 rounded-xl text-base font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white transition shadow-sm cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
            {/* Left Column: Text */}
            <div className="lg:col-span-7 text-left">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-golden-chestnut-200 bg-golden-chestnut-100 text-rosy-copper-600 text-base font-bold mb-6">
                <span>⚡ Collaborative UI Design Space</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-golden-chestnut-950 mb-6 font-serif leading-tight">
                Easily document and share UI components with your team.
              </h1>
              <p className="text-xl text-golden-chestnut-700 mb-8 leading-relaxed max-w-lg">
                Scaffold is a hosted collaborative library workspace for custom UI components. 
                Tweak properties, auto-generate options controls, and share live previews instantly with team members, designers, and clients.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-7 py-4.5 rounded-xl text-base font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white text-center transition shadow-md shadow-rosy-copper-600/10 hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="w-full sm:w-auto px-7 py-4.5 rounded-xl text-base font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white text-center transition shadow-md shadow-rosy-copper-600/10 hover:-translate-y-0.5"
                    >
                      Start Free Workspace
                    </Link>
                    <Link
                      href="/login"
                      className="w-full sm:w-auto px-7 py-4.5 rounded-xl text-base font-bold border border-golden-chestnut-200 bg-white text-golden-chestnut-700 text-center hover:bg-golden-chestnut-100 transition cursor-pointer"
                    >
                      Explore Demo Hub
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Hero Story Image */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="p-3 rounded-3xl border border-golden-chestnut-200 bg-white shadow-md shadow-rosy-copper-600/5">
                <img
                  src="/hero_collaboration.jpg"
                  alt="UI Component Collaboration Illustration"
                  className="rounded-2xl max-w-full h-auto object-cover border border-golden-chestnut-200/50"
                />
              </div>
            </div>
          </div>

          {/* Story Section: How Scaffold Works */}
          <div className="border-t border-golden-chestnut-200 pt-20">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-golden-chestnut-950 font-serif mb-4">
                The Story of Scaffold: From Local Dev to Public Share
              </h2>
              <p className="text-lg text-graphite-500 leading-relaxed">
                Setting up component libraries local-first requires heavy configuration overhead and local tunnels. 
                Here is how Scaffold solves that pain point in three simple steps.
              </p>
            </div>

            <div className="space-y-12 max-w-4xl mx-auto">
              {/* Step 1: Parse code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 flex justify-center">
                  <div className="p-2.5 rounded-2xl border border-golden-chestnut-200 bg-white shadow-sm">
                    <img
                      src="/feature_parsing.jpg"
                      alt="Auto Parsing React TSX"
                      className="rounded-xl max-w-full h-auto object-cover border border-golden-chestnut-200/40"
                    />
                  </div>
                </div>
                <div className="order-1 md:order-2 text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rosy-copper-50 text-rosy-copper-700 text-base font-bold mb-3.5 border border-rosy-copper-100">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-golden-chestnut-950 mb-2 font-serif">Drop in component code, auto-parse props</h3>
                  <p className="text-lg text-graphite-500 leading-relaxed">
                    Paste your custom React components (TSX/JSX) or HTML/CSS files. 
                    Our backend parser immediately reads your code structure to extract typescript interfaces, JSDoc descriptions, and default values.
                  </p>
                </div>
              </div>

              {/* Step 2: Live Responsive Viewports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-golden-chestnut-100 text-golden-chestnut-700 text-base font-bold mb-3.5 border border-golden-chestnut-200">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-golden-chestnut-950 mb-2 font-serif">Inspect layout styles inside responsive viewports</h3>
                  <p className="text-lg text-graphite-500 leading-relaxed">
                    Ensure flexbox and grids hold up across devices. Toggle the preview sandbox frame instantly between mobile, tablet, and desktop viewport sizes.
                    Inject custom brand `tailwind.config.js` settings to render styles correctly.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="p-2.5 rounded-2xl border border-golden-chestnut-200 bg-white shadow-sm">
                    <img
                      src="/feature_responsive.jpg"
                      alt="Multi-device viewport preview"
                      className="rounded-xl max-w-full h-auto object-cover border border-golden-chestnut-200/40"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Interactive controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 flex justify-center">
                  <div className="p-6 rounded-2xl border border-golden-chestnut-200 bg-white shadow-sm text-left max-w-md w-full">
                    <h4 className="text-base font-bold text-golden-chestnut-950 mb-3.5 uppercase tracking-wide">Interactive Demo Control</h4>
                    <div className="space-y-2.5">
                      <div className="p-2.5 rounded-lg border border-golden-chestnut-200 bg-golden-chestnut-50/50 flex justify-between items-center text-base">
                        <div>
                          <span className="font-bold block text-golden-chestnut-900">label</span>
                          <span className="text-sm text-graphite-400 font-mono">string</span>
                        </div>
                        <span className="text-golden-chestnut-700 font-medium">"Submit Form"</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-golden-chestnut-200 bg-golden-chestnut-50/50 flex justify-between items-center text-base">
                        <div>
                          <span className="font-bold block text-golden-chestnut-900">disabled</span>
                          <span className="text-sm text-graphite-400 font-mono">boolean</span>
                        </div>
                        <div className="w-8 h-5.5 rounded-full p-0.5 bg-rosy-copper-600 flex items-center justify-end">
                          <div className="w-4.5 h-4.5 rounded-full bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2 text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-oxblood-50 text-oxblood-700 text-base font-bold mb-3.5 border border-oxblood-100">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-golden-chestnut-950 mb-2 font-serif">Tweak variables, copy snippets & share</h3>
                  <p className="text-lg text-graphite-500 leading-relaxed">
                    Interact with form toggles and inputs mapped directly to the component’s variables. 
                    Copy dynamic JSX snippets reflecting active values, and generate secure public links to collaborate with stakeholders.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-golden-chestnut-200 bg-white py-12 px-6">
        <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <span className="text-xl font-bold tracking-tight text-rosy-copper-600 font-serif">
              Scaffold
            </span>
            <p className="text-base text-graphite-500 max-w-sm leading-relaxed">
              Bridges the gap between engineering and design. An instant, hosted component documentation library workspace for product developers and design stakeholders.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3.5">Product</h4>
            <ul className="space-y-2.5 text-base">
              <li><Link href="/signup" className="text-graphite-500 hover:text-rosy-copper-600 transition">Interactive Sandbox</Link></li>
              <li><Link href="/login" className="text-graphite-500 hover:text-rosy-copper-600 transition">Automatic Prop Tables</Link></li>
              <li><Link href="/signup" className="text-graphite-500 hover:text-rosy-copper-600 transition">Responsive Viewports</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3.5">Community</h4>
            <ul className="space-y-2.5 text-base">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-graphite-500 hover:text-rosy-copper-600 transition">GitHub</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-graphite-500 hover:text-rosy-copper-600 transition">Twitter / X</a></li>
              <li><a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-graphite-500 hover:text-rosy-copper-600 transition">Discord Community</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto max-w-4xl border-t border-golden-chestnut-200/50 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-base text-slate-400">
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
