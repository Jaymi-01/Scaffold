"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api, Project, User, tokenStorage } from "../../utils/api";
import {
  CodeIcon,
  PlusSignIcon,
  Globe02Icon,
  LockIcon,
  Logout01Icon,
  Delete01Icon,
  Cancel01Icon,
} from "hugeicons-react";

const projectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(30, "Project name cannot exceed 30 characters"),
  description: z.string().max(200, "Description cannot exceed 200 characters"),
  isPublic: z.boolean(),
  tailwindConfig: z.string().optional(),
});

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals & Creation States
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", isPublic: true, tailwindConfig: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Authenticate user & load projects
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    api
      .getMe()
      .then(({ user }) => {
        setUser(user);
        return api.getProjects();
      })
      .then(({ projects }) => {
        setProjects(projects);
      })
      .catch((err) => {
        console.error(err);
        tokenStorage.clearToken();
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const validation = projectSchema.safeParse(projectForm);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setActionLoading(true);
    try {
      const { project } = await api.createProject(
        projectForm.name,
        projectForm.description,
        projectForm.isPublic,
        projectForm.tailwindConfig
      );
      setProjects([project, ...projects]);
      setProjectModalOpen(false);
      setProjectForm({ name: "", description: "", isPublic: true, tailwindConfig: "" });
      router.push(`/project/${project.id}`);
    } catch (err: any) {
      setFormErrors({ form: err.message || "Failed to create project" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this component library? This will delete all component definitions inside it."))
      return;
    try {
      await api.deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err: any) {
      setGlobalError(err.message || "Failed to delete project");
    }
  };

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-golden-chestnut-50 text-golden-chestnut-900 items-center justify-center">
        <div className="w-8 h-8 border-2 border-golden-chestnut-200 border-t-rosy-copper-600 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-500">Syncing design workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-golden-chestnut-50 text-golden-chestnut-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-golden-chestnut-200 bg-golden-chestnut-50">
        <div className="container mx-auto px-6 max-w-4xl h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-rosy-copper-600 font-serif">
              Scaffold
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-base text-graphite-500">
                Workspace: <span className="text-rosy-copper-600 font-bold">{user?.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl border border-golden-chestnut-200 bg-white hover:bg-oxblood-50 hover:text-oxblood-700 text-graphite-500 transition cursor-pointer"
                title="Logout"
              >
                <Logout01Icon className="w-5 h-5" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-oxblood-50 border-b border-oxblood-200 px-6 py-2.5 flex items-center justify-between text-oxblood-700 text-xs">
          <span>{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="text-oxblood-900 hover:text-oxblood-800">
            <Cancel01Icon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dashboard Content */}
      <main className="flex-1 bg-golden-chestnut-100/40 px-6 py-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-golden-chestnut-950 tracking-tight font-serif">
                Component Design Systems
              </h2>
              <p className="text-graphite-500 text-sm mt-0.5">
                Select a style library or spin up a new design system.
              </p>
            </div>

            <button
              onClick={() => setProjectModalOpen(true)}
              className="px-5 py-3 rounded-xl text-sm font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <PlusSignIcon className="w-3.5 h-3.5" />
              Create Library
            </button>
          </div>

          {/* Grid list of projects */}
          {projects.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-golden-chestnut-200 bg-white max-w-md mx-auto shadow-sm shadow-rosy-copper-600/5">
              <div className="w-12 h-12 rounded-xl bg-rosy-copper-50 flex items-center justify-center text-rosy-copper-600 mb-4 mx-auto border border-rosy-copper-100">
                <CodeIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-golden-chestnut-950 mb-2">No Component Libraries</h3>
              <p className="text-graphite-500 text-base max-w-xs mx-auto mb-6">
                Get started by setting up your first design library.
              </p>
              <button
                onClick={() => setProjectModalOpen(true)}
                className="px-6 py-3.5 rounded-xl text-base font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white cursor-pointer"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-6 rounded-2xl border border-golden-chestnut-200 bg-white hover:border-golden-chestnut-300 transition duration-150 flex flex-col justify-between shadow-sm shadow-rosy-copper-600/5 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <Link
                        href={`/project/${proj.id}`}
                        className="text-lg font-bold text-golden-chestnut-950 hover:text-rosy-copper-600 transition cursor-pointer"
                      >
                        {proj.name}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${
                          proj.isPublic
                            ? "bg-oxblood-50 text-oxblood-700 border-oxblood-200/50"
                            : "bg-golden-chestnut-50 text-golden-chestnut-800 border-golden-chestnut-200/50"
                        }`}
                      >
                        {proj.isPublic ? (
                          <>
                            <Globe02Icon className="w-3 h-3" /> Public
                          </>
                        ) : (
                          <>
                            <LockIcon className="w-3 h-3" /> Private
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-base text-graphite-500 line-clamp-2 leading-relaxed mb-5">
                      {proj.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-golden-chestnut-200 pt-4 mt-auto">
                    <span className="text-sm text-graphite-450">
                      Created {new Date(proj.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/project/${proj.id}`}
                        className="px-4.5 py-2.5 rounded-lg text-sm font-bold bg-golden-chestnut-100 text-golden-chestnut-700 hover:bg-golden-chestnut-200 transition cursor-pointer border border-golden-chestnut-200/40"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 rounded-lg text-graphite-400 hover:text-oxblood-700 hover:bg-oxblood-50 transition cursor-pointer"
                        title="Delete Library"
                      >
                        <Delete01Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create Project */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-graphite-950/20 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl border border-golden-chestnut-200 bg-white shadow-xl relative">
            <button
              onClick={() => setProjectModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-graphite-400 hover:text-graphite-800 hover:bg-graphite-50 transition cursor-pointer"
            >
              <Cancel01Icon className="w-4.5 h-4.5" />
            </button>

             <h3 className="text-xl font-bold text-golden-chestnut-950 mb-1 font-serif">New Component Library</h3>
            <p className="text-graphite-400 text-base mb-5">Setup your design token repository name.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {formErrors.form && (
                <div className="p-3 bg-oxblood-50 border border-oxblood-100 rounded-lg text-oxblood-700 text-base">
                  {formErrors.form}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-graphite-550 mb-1">
                  Library Title
                </label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:border-rosy-copper-600 outline-none"
                  placeholder="e.g. Athena UI Elements"
                />
                {formErrors.name && <p className="text-xs text-oxblood-500 mt-1 font-semibold">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-graphite-550 mb-1">
                  Description
                </label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:border-rosy-copper-600 outline-none h-20 resize-none"
                  placeholder="Summarize the core elements included..."
                />
                {formErrors.description && <p className="text-xs text-oxblood-500 mt-1 font-semibold">{formErrors.description}</p>}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-100/30">
                <div>
                  <span className="text-base font-bold text-golden-chestnut-700 block">Make Library Public</span>
                  <span className="text-sm text-graphite-400">Enables viewing from shared URL links.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProjectForm({ ...projectForm, isPublic: !projectForm.isPublic })}
                  className={`w-9 h-5.5 rounded-full p-0.5 cursor-pointer transition ${
                    projectForm.isPublic ? "bg-rosy-copper-600" : "bg-graphite-200"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition ${
                      projectForm.isPublic ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="px-3.5 py-1.5 text-base font-bold text-graphite-400 hover:text-graphite-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-3 rounded-xl text-base font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white cursor-pointer shadow-sm"
                >
                  {actionLoading ? "Saving..." : "Create Library"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <div className="container mx-auto max-w-4xl border-t border-golden-chestnut-200/50 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
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
