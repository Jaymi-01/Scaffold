"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusSignIcon,
  Search01Icon,
  Folder01Icon,
  CodeIcon,
  Globe02Icon,
  LockIcon,
  Settings01Icon,
  Delete01Icon,
  Copy01Icon,
  Tick01Icon,
  Logout01Icon,
  ArrowRight01Icon,
  InformationCircleIcon,
  SlidersHorizontalIcon
} from "hugeicons-react";
import { api, tokenStorage, User, Project } from "../../utils/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [exploreProjects, setExploreProjects] = useState<Project[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [componentCounts, setComponentCounts] = useState<Record<string, number>>({});

  // Navigation / Search / Filtering
  const [activeTab, setActiveTab] = useState<"my-projects" | "explore" | "settings">("my-projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all");

  // Create Project Form State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [newTailwindConfig, setNewTailwindConfig] = useState(
    `{\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n          50: '#f0f9ff',\n          500: '#0284c7',\n          900: '#0c4a6e'\n        }\n      }\n    }\n  }\n}`
  );

  // Edit Project Form State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editTailwindConfig, setEditTailwindConfig] = useState("");

  // Toast / Copy Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealApiKey, setRevealApiKey] = useState(false);

  const apiKeyVal = useMemo(() => {
    if (!user) return "sc_live_pk_demoapikey12345";
    return `sc_live_pk_${user.id.replace(/-/g, "").slice(0, 24)}`;
  }, [user]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch component counts for all projects
  const fetchComponentCounts = async (projectsList: Project[]) => {
    setLoadingCounts(true);
    const counts: Record<string, number> = {};
    try {
      await Promise.all(
        projectsList.map(async (p) => {
          try {
            const { components } = await api.getComponents(p.id);
            counts[p.id] = components.length;
          } catch {
            counts[p.id] = 0;
          }
        })
      );
      setComponentCounts(counts);
    } catch (e) {
      console.error("Error fetching component counts:", e);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    api
      .getMe()
      .then(({ user }) => {
        setUser(user);
        return Promise.all([api.getMyProjects(), api.getProjects()]);
      })
      .then(([myRes, allRes]) => {
        setMyProjects(myRes.projects);
        
        // Explore: public projects NOT owned by this user
        const myProjIds = new Set(myRes.projects.map((p) => p.id));
        const explore = allRes.projects.filter((p) => !myProjIds.has(p.id));
        setExploreProjects(explore);

        const allProj = [...myRes.projects, ...explore];
        fetchComponentCounts(allProj);
      })
      .catch((err) => {
        console.error("Dashboard page initialization error:", err);
        tokenStorage.clearToken();
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast("Workspace name is required", "error");
      return;
    }

    setActionLoading(true);
    try {
      const { project } = await api.createProject(
        newName,
        newDescription,
        newIsPublic,
        newTailwindConfig
      );
      setMyProjects((prev) => [project, ...prev]);
      setComponentCounts((prev) => ({ ...prev, [project.id]: 0 }));
      setCreateModalOpen(false);
      
      // Reset form
      setNewName("");
      setNewDescription("");
      setNewIsPublic(true);
      setNewTailwindConfig(
        `{\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n          50: '#f0f9ff',\n          500: '#0284c7',\n          900: '#0c4a6e'\n        }\n      }\n    }\n  }\n}`
      );
      showToast("Workspace created successfully!", "success");
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || "Failed to create workspace", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!editName.trim()) {
      showToast("Workspace name is required", "error");
      return;
    }

    setActionLoading(true);
    try {
      const { project } = await api.updateProject(selectedProject.id, {
        name: editName,
        description: editDescription,
        isPublic: editIsPublic,
        tailwindConfig: editTailwindConfig,
      });

      setMyProjects((prev) =>
        prev.map((p) => (p.id === project.id ? project : p))
      );
      setEditModalOpen(false);
      setSelectedProject(null);
      showToast("Workspace updated successfully!", "success");
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || "Failed to update workspace", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the workspace "${name}"?\nThis will permanently delete all its component files.`
      )
    ) {
      return;
    }

    try {
      await api.deleteProject(id);
      setMyProjects((prev) => prev.filter((p) => p.id !== id));
      setComponentCounts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast("Workspace deleted successfully!", "success");
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || "Failed to delete workspace", "error");
    }
  };

  const handleCopyLink = (projectId: string) => {
    const path = `${window.location.origin}/project/${projectId}`;
    navigator.clipboard.writeText(path);
    setCopiedId(projectId);
    showToast("Workspace share link copied!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter projects client-side
  const filteredProjects = useMemo(() => {
    if (activeTab === "settings") return [];
    const list = activeTab === "my-projects" ? myProjects : exploreProjects;
    return list.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "public" && p.isPublic) ||
        (visibilityFilter === "private" && !p.isPublic);

      return matchesSearch && matchesVisibility;
    });
  }, [activeTab, myProjects, exploreProjects, searchQuery, visibilityFilter]);

  // Statistics sums
  const totalComponentsCount = useMemo(() => {
    return myProjects.reduce((sum, p) => sum + (componentCounts[p.id] || 0), 0);
  }, [myProjects, componentCounts]);

  // formatDate helper removed to resolve unused variable warning

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-golden-chestnut-50 text-golden-chestnut-900 items-center justify-center font-sans">
        <div className="w-8 h-8 border-2 border-golden-chestnut-200 border-t-rosy-copper-600 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-graphite-500">Loading console manager...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-golden-chestnut-50 text-golden-chestnut-950 font-sans flex flex-col md:flex-row">
      {/* Sidebar Navigation - Fixed on desktop, hidden on mobile */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-golden-chestnut-250 bg-white">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo brand */}
          <div className="flex items-center h-16 px-6 border-b border-golden-chestnut-100 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-extrabold tracking-tight text-rosy-copper-600 transition-colors duration-300">
                Scaffold
              </span>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            <button
              onClick={() => {
                setActiveTab("my-projects");
                setSearchQuery("");
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "my-projects"
                  ? "bg-golden-chestnut-100 text-rosy-copper-750"
                  : "text-graphite-500 hover:bg-golden-chestnut-50/50 hover:text-graphite-800"
              }`}
            >
              <Folder01Icon className="w-4.5 h-4.5 text-rosy-copper-500" />
              My Workspaces
            </button>

            <button
              onClick={() => {
                setActiveTab("explore");
                setSearchQuery("");
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "explore"
                  ? "bg-golden-chestnut-100 text-rosy-copper-750"
                  : "text-graphite-500 hover:bg-golden-chestnut-50/50 hover:text-graphite-800"
              }`}
            >
              <Globe02Icon className="w-4.5 h-4.5 text-rosy-copper-500" />
              Explore Hub
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setSearchQuery("");
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-golden-chestnut-100 text-rosy-copper-750"
                  : "text-graphite-500 hover:bg-golden-chestnut-50/50 hover:text-graphite-800"
              }`}
            >
              <Settings01Icon className="w-4.5 h-4.5 text-rosy-copper-500" />
              Settings
            </button>
          </nav>

          {/* User profile segment */}
          <div className="p-4 border-t border-golden-chestnut-100 bg-golden-chestnut-50/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-rosy-copper-100 border border-rosy-copper-200 text-rosy-copper-700 flex items-center justify-center font-bold text-sm uppercase">
                {user?.username?.slice(0, 2) || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-golden-chestnut-950 truncate">
                  {user?.username}
                </p>
                <p className="text-[10px] text-graphite-450 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-golden-chestnut-200 bg-white hover:bg-oxblood-50 hover:border-oxblood-100 hover:text-oxblood-700 text-graphite-600 transition text-xs font-semibold cursor-pointer active:scale-95"
            >
              <Logout01Icon className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Header */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-golden-chestnut-200 bg-white px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-rosy-copper-600">
            Scaffold
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("my-projects")}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              activeTab === "my-projects"
                ? "bg-golden-chestnut-100 border-golden-chestnut-250 text-rosy-copper-750"
                : "border-golden-chestnut-200 bg-white text-graphite-500"
            }`}
            title="My Workspaces"
          >
            <Folder01Icon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              activeTab === "explore"
                ? "bg-golden-chestnut-100 border-golden-chestnut-250 text-rosy-copper-750"
                : "border-golden-chestnut-200 bg-white text-graphite-500"
            }`}
            title="Explore Hub"
          >
            <Globe02Icon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              activeTab === "settings"
                ? "bg-golden-chestnut-100 border-golden-chestnut-250 text-rosy-copper-750"
                : "border-golden-chestnut-200 bg-white text-graphite-500"
            }`}
            title="Settings"
          >
            <Settings01Icon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-golden-chestnut-250 bg-white hover:bg-oxblood-50 hover:text-oxblood-750 text-graphite-500 transition cursor-pointer"
            title="Sign Out"
          >
            <Logout01Icon className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 md:pl-64 flex flex-col min-w-0">
        <div className="max-w-6xl w-full mx-auto p-6 md:p-8 flex-1 flex flex-col">
          {activeTab === "settings" ? (
            <div className="flex-1 flex flex-col animate-fade-in">
              {/* Settings Header */}
              <div className="border-b border-golden-chestnut-200 pb-5 mb-8">
                <h1 className="text-2xl font-extrabold text-golden-chestnut-950 tracking-tight flex items-center gap-2">
                  <Settings01Icon className="w-6 h-6 text-rosy-copper-600" /> Console Settings
                </h1>
                <p className="text-graphite-550 text-xs mt-1">
                  Manage your Scaffold developer account settings, themes, and secret API authentication keys.
                </p>
              </div>

              {/* Grid Layout for Settings Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Account Details Card */}
                <div className="bg-white border border-golden-chestnut-200/80 rounded-3xl p-6 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-550 mb-5 flex items-center gap-2">
                    Profile Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-graphite-450 mb-1.5">
                        Console User
                      </span>
                      <div className="px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/30 text-golden-chestnut-900 text-xs font-semibold">
                        {user?.username}
                      </div>
                    </div>
                    
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-graphite-450 mb-1.5">
                        Registered Email
                      </span>
                      <div className="px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/30 text-golden-chestnut-900 text-xs font-semibold">
                        {user?.email}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-graphite-450 mb-1.5">
                        Unique Space ID
                      </span>
                      <div className="px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/30 text-graphite-550 font-mono text-[10px]">
                        {user?.id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer Credentials Card */}
                <div className="bg-white border border-golden-chestnut-200/80 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-550 mb-3 flex items-center gap-2">
                      Developer Tools
                    </h3>
                    <p className="text-[11px] text-graphite-500 mb-5 leading-relaxed">
                      Use your developer keys to integrate the Scaffold CLI tool or push custom elements directly from your local terminal.
                    </p>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-graphite-450 mb-1.5">
                        Secret API Key
                      </span>
                      <div className="flex gap-2">
                        <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/30 text-xs font-mono text-golden-chestnut-950 truncate">
                          {revealApiKey ? apiKeyVal : "••••••••••••••••••••••••••••••••"}
                        </div>
                        <button
                          type="button"
                          onClick={() => setRevealApiKey(!revealApiKey)}
                          className="px-3 rounded-xl border border-golden-chestnut-200 bg-white hover:bg-golden-chestnut-50 text-graphite-600 text-xs font-semibold transition cursor-pointer"
                        >
                          {revealApiKey ? "Hide" : "Reveal"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(apiKeyVal);
                      showToast("API Key copied to clipboard!", "success");
                    }}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-golden-chestnut-200 bg-white hover:bg-golden-chestnut-100/50 text-golden-chestnut-800 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-98"
                  >
                    <Copy01Icon className="w-3.5 h-3.5 text-rosy-copper-600" /> Copy Secret Key
                  </button>
                </div>

                {/* Preferences Card */}
                <div className="bg-white border border-golden-chestnut-200/80 rounded-3xl p-6 shadow-2xs lg:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-550 mb-3">
                    Console Themes & Presets
                  </h3>
                  <p className="text-[11px] text-graphite-500 mb-5 max-w-xl leading-relaxed">
                    Personalize your local dashboard layout and color token configurations. Choose your active UI theme palette.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button type="button" className="flex flex-col items-start p-4 rounded-2xl border-2 border-rosy-copper-500 bg-rosy-copper-50/30 text-left cursor-pointer">
                      <span className="w-4 h-4 rounded-full bg-rosy-copper-500 mb-3" />
                      <span className="text-xs font-bold text-golden-chestnut-950 block">Terracotta Clay</span>
                      <span className="text-[10px] text-graphite-450 mt-0.5">Active Theme Preset</span>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => showToast("Forest Moss preset is premium tier only", "info")}
                      className="flex flex-col items-start p-4 rounded-2xl border border-golden-chestnut-250 bg-white hover:border-golden-chestnut-300 text-left cursor-pointer transition w-full"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-600 mb-3" />
                      <span className="text-xs font-bold text-golden-chestnut-950 block">Forest Moss</span>
                      <span className="text-[10px] text-graphite-450 mt-0.5">Upgrade for custom colors</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => showToast("Steel Charcoal preset is premium tier only", "info")}
                      className="flex flex-col items-start p-4 rounded-2xl border border-golden-chestnut-250 bg-white hover:border-golden-chestnut-300 text-left cursor-pointer transition w-full"
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-800 mb-3" />
                      <span className="text-xs font-bold text-golden-chestnut-950 block">Steel Charcoal</span>
                      <span className="text-[10px] text-graphite-450 mt-0.5">Upgrade for custom colors</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Welcome Banner Card */}
              <div className="rounded-3xl bg-gradient-to-r from-rosy-copper-600 via-rosy-copper-500 to-golden-chestnut-500 p-6 md:p-8 text-white shadow-sm relative overflow-hidden mb-8">
            <div className="absolute right-0 top-0 -mr-12 -mt-12 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 -ml-12 -mb-12 w-40 h-40 rounded-full bg-golden-chestnut-300/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-flex px-3 py-1 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider mb-3">
                  Workspace Panel
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Welcome back, {user?.username || "Developer"}
                </h1>
                <p className="text-white/85 text-xs md:text-sm mt-1 max-w-xl">
                  Easily build and test custom components, inspect dynamic viewports, and auto-parse props libraries for simple team review.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="self-start md:self-auto px-5 py-3 rounded-2xl bg-white text-rosy-copper-900 text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer border border-transparent"
              >
                <PlusSignIcon className="w-4 h-4 text-rosy-copper-900" />
                New Workspace
              </button>
            </div>
          </div>

          {/* Quick Metrics Statistics grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 shrink-0">
            <div className="bg-white border border-golden-chestnut-200/80 rounded-2xl p-5 shadow-2xs flex items-center gap-4 hover:border-golden-chestnut-300 transition duration-300">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <Folder01Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-450 block">My Workspaces</span>
                <h3 className="text-xl font-extrabold text-golden-chestnut-950 mt-0.5">{myProjects.length}</h3>
              </div>
            </div>

            <div className="bg-white border border-golden-chestnut-200/80 rounded-2xl p-5 shadow-2xs flex items-center gap-4 hover:border-golden-chestnut-300 transition duration-300">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <CodeIcon className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-450 block">Hosted Components</span>
                <h3 className="text-xl font-extrabold text-golden-chestnut-950 mt-0.5">
                  {loadingCounts ? (
                    <span className="inline-block w-4 h-4 border-2 border-golden-chestnut-200 border-t-rosy-copper-600 rounded-full animate-spin"></span>
                  ) : (
                    totalComponentsCount
                  )}
                </h3>
              </div>
            </div>

            <div className="bg-white border border-golden-chestnut-200/80 rounded-2xl p-5 shadow-2xs flex items-center gap-4 hover:border-golden-chestnut-300 transition duration-300">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 border border-golden-chestnut-200/50">
                <Globe02Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-450 block">Visibility Types</span>
                <h3 className="text-xl font-extrabold text-golden-chestnut-950 mt-0.5">
                  {myProjects.filter((p) => p.isPublic).length} public / {myProjects.filter((p) => !p.isPublic).length} private
                </h3>
              </div>
            </div>
          </div>

          {/* Filtering and search console */}
          <div className="bg-white border border-golden-chestnut-200/70 rounded-2xl p-4 mb-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search01Icon className="absolute left-3 top-3 w-4 h-4 text-rosy-copper-600/50" />
              <input
                type="text"
                placeholder={
                  activeTab === "my-projects" ? "Search my workspaces..." : "Search explore hub templates..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border border-golden-chestnut-200 bg-golden-chestnut-50/30 text-golden-chestnut-900 placeholder-graphite-400 focus:border-rosy-copper-600 focus:bg-white outline-none transition"
              />
            </div>

            {/* Filters toggle */}
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <SlidersHorizontalIcon className="w-3.5 h-3.5 text-graphite-400 hidden sm:inline" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-450 hidden md:inline">
                  Visibility:
                </span>
                <div className="flex border border-golden-chestnut-200 p-0.5 rounded-lg bg-golden-chestnut-50/50 text-[10px] font-bold">
                  {(["all", "public", "private"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setVisibilityFilter(filter)}
                      className={`px-3 py-1.5 rounded-md uppercase tracking-wider transition cursor-pointer ${
                        visibilityFilter === filter
                          ? "bg-white border border-golden-chestnut-250 text-rosy-copper-750 shadow-2xs"
                          : "text-graphite-500 hover:text-graphite-800"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Projects Grid */}
          <div className="flex-1">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white border border-dashed border-golden-chestnut-200 rounded-3xl bg-golden-chestnut-50/10">
                <div className="w-12 h-12 rounded-2xl bg-golden-chestnut-100/50 flex items-center justify-center text-rosy-copper-600 mx-auto mb-4 border border-golden-chestnut-250/55">
                  <Folder01Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-golden-chestnut-950 mb-1">
                  No workspaces found
                </h3>
                <p className="text-xs text-graphite-500 max-w-xs mx-auto mb-6 leading-relaxed">
                  {searchQuery
                    ? "We couldn't find any projects matching your search criteria. Try a different query."
                    : activeTab === "my-projects"
                    ? "Get started by creating your first component library workspace."
                    : "No public workspaces hosted by other developers yet."}
                </p>
                {activeTab === "my-projects" && (
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="px-4.5 py-2.5 rounded-xl text-xs font-bold bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white transition shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    Create Workspace
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Link
                    href={`/project/${project.id}`}
                    key={project.id}
                    className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-golden-chestnut-200/80 hover:border-rosy-copper-300 hover:shadow-md transition-all duration-300 text-left"
                  >
                    <div>
                      {/* Name & Visibility indicator */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-bold text-golden-chestnut-950 text-sm group-hover:text-rosy-copper-650 transition-colors truncate" title={project.name}>
                          {project.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                            project.isPublic
                              ? "bg-golden-chestnut-100 text-golden-chestnut-800 border-golden-chestnut-200/40"
                              : "bg-silver-100 text-silver-700 border-transparent"
                          }`}
                        >
                          {project.isPublic ? (
                            <>
                              <Globe02Icon className="w-2.5 h-2.5 text-rosy-copper-500" /> Public
                            </>
                          ) : (
                            <>
                              <LockIcon className="w-2.5 h-2.5 text-graphite-450" /> Private
                            </>
                          )}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-graphite-500 text-xs line-clamp-2 min-h-[2.5rem] leading-relaxed mb-4">
                        {project.description || "No description provided."}
                      </p>
                    </div>

                    {/* Footer values & action bar */}
                    <div className="flex items-center justify-between border-t border-golden-chestnut-100/50 pt-4 mt-2 shrink-0">
                      {/* Component count */}
                      <div className="flex items-center gap-1.5 text-xs text-graphite-550 font-medium">
                        <CodeIcon className="w-3.5 h-3.5 text-rosy-copper-500" />
                        <span>
                          {loadingCounts ? (
                            <span className="inline-block w-3 h-3 border border-golden-chestnut-200 border-t-rosy-copper-600 rounded-full animate-spin"></span>
                          ) : (
                            `${componentCounts[project.id] || 0} components`
                          )}
                        </span>
                      </div>

                      {activeTab === "my-projects" ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedProject(project);
                              setEditName(project.name);
                              setEditDescription(project.description || "");
                              setEditIsPublic(project.isPublic);
                              setEditTailwindConfig(project.tailwindConfig || "");
                              setEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-golden-chestnut-200 bg-white hover:bg-golden-chestnut-100/50 text-graphite-600 hover:text-golden-chestnut-900 transition shadow-2xs cursor-pointer"
                            title="Edit Details"
                          >
                            <Settings01Icon className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCopyLink(project.id);
                            }}
                            className="p-1.5 rounded-lg border border-golden-chestnut-200 bg-white hover:bg-golden-chestnut-100/50 text-graphite-600 hover:text-golden-chestnut-900 transition shadow-2xs cursor-pointer"
                            title="Copy share link"
                          >
                            {copiedId === project.id ? (
                              <Tick01Icon className="w-3.5 h-3.5 text-rosy-copper-600" />
                            ) : (
                              <Copy01Icon className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteProject(project.id, project.name);
                            }}
                            className="p-1.5 rounded-lg border border-oxblood-100 bg-white hover:bg-oxblood-50 text-oxblood-650 hover:text-oxblood-800 hover:border-oxblood-200 transition shadow-2xs cursor-pointer"
                            title="Delete Workspace"
                          >
                            <Delete01Icon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCopyLink(project.id);
                            }}
                            className="p-1.5 rounded-lg border border-golden-chestnut-200 bg-white hover:bg-golden-chestnut-100/50 text-graphite-600 hover:text-golden-chestnut-900 transition shadow-2xs cursor-pointer"
                            title="Copy share link"
                          >
                            {copiedId === project.id ? (
                              <Tick01Icon className="w-3.5 h-3.5 text-rosy-copper-600" />
                            ) : (
                              <Copy01Icon className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="p-1 rounded-lg bg-golden-chestnut-100 text-rosy-copper-600 group-hover:bg-rosy-copper-600 group-hover:text-white transition duration-300">
                            <ArrowRight01Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </main>

      {/* Floating toast notification alerts */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`px-4.5 py-3 rounded-2xl shadow-md border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === "success"
                ? "bg-golden-chestnut-950 text-white border-transparent"
                : toast.type === "error"
                ? "bg-oxblood-50 border-oxblood-200/60 text-oxblood-800"
                : "bg-white border-golden-chestnut-200 text-golden-chestnut-950"
            }`}
          >
            {toast.type === "success" && <Tick01Icon className="w-4 h-4 text-golden-chestnut-300" />}
            {toast.type === "error" && <InformationCircleIcon className="w-4 h-4 text-oxblood-500" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Modal: Create Project */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/20 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-golden-chestnut-200/80 rounded-3xl p-6 shadow-xl relative flex flex-col max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-golden-chestnut-950 mb-0.5">
              New Project Workspace
            </h3>
            <p className="text-graphite-500 text-xs mb-5">
              Configure details for your collaborative element playground registry.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-1">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/50 text-golden-chestnut-900 text-xs focus:border-rosy-copper-600 focus:bg-white outline-none transition"
                  placeholder="e.g. Zinc Components"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/50 text-golden-chestnut-900 text-xs focus:border-rosy-copper-600 focus:bg-white outline-none resize-none transition"
                  placeholder="Summarize components or elements in this library..."
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/30">
                <div>
                  <span className="text-xs font-bold text-golden-chestnut-950 block">Public Workspace</span>
                  <span className="text-[10px] text-graphite-500">
                    Anyone with the workspace URL link can read components
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewIsPublic(!newIsPublic)}
                  className={`w-9 h-5.5 rounded-full p-0.5 cursor-pointer transition ${
                    newIsPublic ? "bg-rosy-copper-600" : "bg-graphite-300"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition ${
                      newIsPublic ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-1">
                  Tailwind CSS Configuration (Theme Preset JSON)
                </label>
                <textarea
                  rows={6}
                  value={newTailwindConfig}
                  onChange={(e) => setNewTailwindConfig(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/50 text-golden-chestnut-900 font-mono text-xs focus:border-rosy-copper-600 focus:bg-white outline-none resize-none transition"
                  placeholder={`{\n  theme: {\n    extend: {}\n  }\n}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-golden-chestnut-200 hover:bg-golden-chestnut-50 text-graphite-650 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4.5 py-2.5 rounded-xl text-xs font-bold bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white transition shadow-xs cursor-pointer active:scale-95"
                >
                  {actionLoading ? "Creating..." : "Save Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Project */}
      {editModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/20 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-golden-chestnut-200/80 rounded-3xl p-6 shadow-xl relative flex flex-col max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-golden-chestnut-950 mb-0.5">
              Edit Workspace Settings
            </h3>
            <p className="text-graphite-500 text-xs mb-5">
              Update name, visibility settings, or Tailwind playground parameters.
            </p>

            <form onSubmit={handleEditProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-1">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/50 text-golden-chestnut-900 text-xs focus:border-rosy-copper-600 focus:bg-white outline-none transition"
                  placeholder="Workspace Name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/50 text-golden-chestnut-900 text-xs focus:border-rosy-copper-600 focus:bg-white outline-none resize-none transition"
                  placeholder="Brief library summary..."
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/30">
                <div>
                  <span className="text-xs font-bold text-golden-chestnut-950 block">Public Workspace</span>
                  <span className="text-[10px] text-graphite-500">
                    Allows reading elements without authentication tokens
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsPublic(!editIsPublic)}
                  className={`w-9 h-5.5 rounded-full p-0.5 cursor-pointer transition ${
                    editIsPublic ? "bg-rosy-copper-600" : "bg-graphite-300"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition ${
                      editIsPublic ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-1">
                  Tailwind CSS Configuration (Theme Preset JSON)
                </label>
                <textarea
                  rows={6}
                  value={editTailwindConfig}
                  onChange={(e) => setEditTailwindConfig(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50/50 text-golden-chestnut-900 font-mono text-xs focus:border-rosy-copper-600 focus:bg-white outline-none resize-none transition"
                  placeholder={`{\n  theme: {\n    extend: {}\n  }\n}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-golden-chestnut-200 hover:bg-golden-chestnut-50 text-graphite-650 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4.5 py-2.5 rounded-xl text-xs font-bold bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white transition shadow-xs cursor-pointer active:scale-95"
                >
                  {actionLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
