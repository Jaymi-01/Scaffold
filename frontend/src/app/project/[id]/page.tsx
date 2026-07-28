"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Editor, { OnMount } from "@monaco-editor/react";
import { z } from "zod";
import {
  api,
  Project,
  ComponentItem,
  User,
} from "../../../utils/api";

import {
  ArrowLeft01Icon,
  Search01Icon,
  CodeIcon,
  Copy01Icon,
  Share01Icon,
  Settings01Icon,
  Logout01Icon,
  Cancel01Icon,
  PlusSignIcon,
  AiPhone01Icon,
  Tablet01Icon,
  AiLaptopIcon,
} from "hugeicons-react";

const componentSchema = z.object({
  name: z
    .string()
    .min(2, "Component name must be at least 2 characters")
    .max(30, "Component name cannot exceed 30 characters")
    .regex(/^[A-Z][a-zA-Z0-9]*$/, "Component name must be PascalCase (e.g., CustomButton)"),
  description: z.string().max(200, "Description cannot exceed 200 characters"),
  code: z.string().min(10, "Component code must be at least 10 characters"),
});

function detectLanguage(code: string): "typescript" | "javascript" | "html" | "css" {
  if (!code) return "typescript";
  const cleanCode = code.trim();
  if (cleanCode.startsWith("<!--") || cleanCode.toLowerCase().startsWith("<!doctype") || cleanCode.startsWith("<div") || cleanCode.startsWith("<button")) {
    return "html";
  }
  const firstLines = code.split("\n").slice(0, 3).join("\n");
  const match = firstLines.match(/@language:\s*(typescript|tsx|javascript|jsx|html|css)/i);
  if (match) {
    const lang = match[1].toLowerCase();
    if (lang === "tsx" || lang === "typescript") return "typescript";
    if (lang === "jsx" || lang === "javascript") return "javascript";
    if (lang === "html") return "html";
    if (lang === "css") return "css";
  }
  return "typescript";
}

const TEMPLATES = {
  typescript: `import React from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  content?: string;
}

export const CustomCard = ({
  title = 'Design Token Workspace',
  subtitle = 'Collaborative Sandbox',
  content = 'Scaffold renders components from source code in an isolated viewport playground. Edit types and HTML structure to see updates in real-time.'
}: CardProps) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-golden-chestnut-200/80 shadow-2xs max-w-sm text-left">
      <h3 className="text-sm font-bold text-golden-chestnut-950">{title}</h3>
      <span className="text-[10px] text-rosy-copper-650 font-semibold block mt-0.5">{subtitle}</span>
      <p className="text-xs text-graphite-500 leading-relaxed mt-2.5">{content}</p>
    </div>
  );
};`,

  javascript: `import React from 'react';

export const CustomCard = ({
  title = 'Design Token Workspace',
  subtitle = 'Collaborative Sandbox',
  content = 'Scaffold renders components from source code in an isolated playground.'
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-golden-chestnut-200/80 shadow-2xs max-w-sm text-left font-sans">
      <h3 className="text-sm font-bold text-golden-chestnut-950">{title}</h3>
      <span className="text-[10px] text-rosy-copper-650 font-semibold block mt-0.5">{subtitle}</span>
      <p className="text-xs text-graphite-500 leading-relaxed mt-2.5">{content}</p>
    </div>
  );
};`,

  html: `<!-- @language: html -->
<div class="p-6 rounded-2xl bg-white border border-golden-chestnut-200/80 shadow-2xs max-w-sm text-left font-sans">
  <h3 class="text-sm font-bold text-golden-chestnut-950">Design Token Workspace</h3>
  <span class="text-[10px] text-rosy-copper-600 font-semibold block mt-0.5">HTML / Tailwind Mockup</span>
  <p class="text-xs text-graphite-500 leading-relaxed mt-2.5">
    This component is authored directly in plain HTML using Tailwind utility classes.
  </p>
</div>`,

  css: `/* @language: css */
.custom-card {
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: white;
  border: 1px solid #e0d0c3;
  max-width: 24rem;
  text-align: left;
}
.custom-card h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #2b170c;
  margin: 0;
}`
};

const DEFAULT_COMPONENT_CODE = TEMPLATES.typescript;


interface PageProps {
  params: Promise<{ id: string }>;
}

type PropValue = string | number | boolean;

export default function ProjectWorkspacePage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const projectId = unwrappedParams.id;

  const [user, setUser] = useState<User | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [activeComponent, setActiveComponent] = useState<ComponentItem | null>(null);

  // UX States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Forms
    const [editorLanguage, setEditorLanguage] = useState<"typescript" | "javascript" | "html" | "css">("typescript");
  const [modalLanguage, setModalLanguage] = useState<"typescript" | "javascript" | "html" | "css">("typescript");
const [componentModalOpen, setComponentModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [componentForm, setComponentForm] = useState({ name: "", description: "", code: DEFAULT_COMPONENT_CODE });
  const [projectForm, setProjectForm] = useState({ name: "", description: "", isPublic: true, tailwindConfig: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Playground Options
  const [activeTab, setActiveTab] = useState<"playground" | "tailwind">("playground");
  const [editorCode, setEditorCode] = useState("");
  const [previewViewport, setPreviewViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [propValues, setPropValues] = useState<Record<string, PropValue>>({});
  const [iframeReady, setIframeReady] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copiedPropSnippet, setCopiedPropSnippet] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mainEditorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const modalEditorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMainEditorDidMount: OnMount = (editor) => {
    mainEditorRef.current = editor;
  };

  const handleModalEditorDidMount: OnMount = (editor) => {
    modalEditorRef.current = editor;
  };

  // Ref-based debounce to satisfy eslint immutability rules
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSetEditorCode = (val: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setEditorCode(val);
    }, 250);
  };

  // Authenticate on mount & load project files
  useEffect(() => {
    api
      .getMe()
      .then(({ user }) => {
        setUser(user);
        return api.getProject(projectId);
      })
      .then(({ project }) => {
        setActiveProject(project);
        setProjectForm({
          name: project.name,
          description: project.description,
          isPublic: project.isPublic,
          tailwindConfig: project.tailwindConfig || "",
        });
        return api.getComponents(projectId);
      })
      .then(({ components }) => {
        setComponents(components);
        if (components.length > 0) {
          setActiveComponent(components[0] || null);
        }
      })
      .catch((err) => {
        console.error(err);
        // Fallback for public viewing without login token
        api
          .getProject(projectId)
          .then(({ project }) => {
            setActiveProject(project);
            return api.getComponents(projectId);
          })
          .then(({ components }) => {
            setComponents(components);
            if (components.length > 0) {
              setActiveComponent(components[0] || null);
            }
          })
          .catch(() => {
            setGlobalError("Access Denied. Project is private or does not exist.");
          });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  // Sync component code and parameters controls
  useEffect(() => {
    if (activeComponent) {
      const code = activeComponent.code;
      const detected = detectLanguage(code);
      const initialProps: Record<string, PropValue> = {};
      activeComponent.props.forEach((p) => {
        if (p.defaultValue !== undefined) {
          let cleanVal: PropValue = p.defaultValue;
          if (cleanVal === "true") cleanVal = true;
          else if (cleanVal === "false") cleanVal = false;
          else if (!isNaN(Number(cleanVal)) && cleanVal.trim() !== "") cleanVal = Number(cleanVal);
          else if (cleanVal.startsWith("'") && cleanVal.endsWith("'")) cleanVal = cleanVal.slice(1, -1);
          else if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) cleanVal = cleanVal.slice(1, -1);
          initialProps[p.name] = cleanVal;
        } else {
          if (p.type.includes("boolean")) initialProps[p.name] = false;
          else if (p.type.includes("number")) initialProps[p.name] = 0;
          else initialProps[p.name] = "";
        }
      });

      Promise.resolve().then(() => {
        setEditorLanguage(detected);
        setEditorCode(code);
        setPropValues(initialProps);
        setIframeReady(false);
      });
    } else {
      Promise.resolve().then(() => {
        setEditorCode("");
        setPropValues({});
      });
    }
  }, [activeComponent]);

  // Transpile component source code inside sandbox Iframe
  useEffect(() => {
    if (activeComponent && iframeRef.current) {
      const sendLoadMessage = () => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "LOAD_COMPONENT",
            code: editorCode,
            name: activeComponent.name,
            tailwindConfig: activeProject?.tailwindConfig || "",
            language: editorLanguage,
          },
          "*"
        );
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "UPDATE_PROPS",
            props: propValues,
          },
          "*"
        );
      };

      const t = setTimeout(sendLoadMessage, 400);
      return () => clearTimeout(t);
    }
  }, [editorCode, activeComponent, iframeReady, activeProject?.tailwindConfig, editorLanguage, propValues]);

  // Send properties update to iframe sandbox
  useEffect(() => {
    if (iframeRef.current && activeComponent) {
      iframeRef.current.contentWindow?.postMessage(
        {
          type: "UPDATE_PROPS",
          props: propValues,
        },
        "*"
      );
    }
  }, [propValues, activeComponent]);

  // Establish sandbox message listener handshake
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "IFRAME_READY") {
        setIframeReady(true);
      }
    };
    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const currentCode = modalEditorRef.current ? modalEditorRef.current.getValue() : DEFAULT_COMPONENT_CODE;
    const validation = componentSchema.safeParse({
      ...componentForm,
      code: currentCode
    });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setActionLoading(true);
    // Prepend language metadata comment if not present
    let finalCode = currentCode;
    const hasMetadata = finalCode.includes("@language:");
    if (!hasMetadata) {
      if (modalLanguage === "typescript") {
        finalCode = `// @language: tsx\n` + finalCode;
      } else if (modalLanguage === "javascript") {
        finalCode = `// @language: jsx\n` + finalCode;
      } else if (modalLanguage === "html") {
        finalCode = `<!-- @language: html -->\n` + finalCode;
      } else if (modalLanguage === "css") {
        finalCode = `/* @language: css */\n` + finalCode;
      }
    }
    try {
      const { component } = await api.createComponent(
        projectId,
        componentForm.name,
        componentForm.description,
        finalCode
      );
      setComponents([component, ...components]);
      setActiveComponent(component);
      setComponentModalOpen(false);
      setComponentForm({ name: "", description: "", code: DEFAULT_COMPONENT_CODE });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({ form: error.message || "Failed to save component" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateComponentCode = async () => {
    if (!activeComponent) return;
    let currentCode = mainEditorRef.current ? mainEditorRef.current.getValue() : editorCode;
    
    // Synchronize language metadata
    // Remove existing language tags at the top
    currentCode = currentCode.replace(/^(?:\s*(?:\/\/\s*@language:\s*\w+\n*)|(?:\/\*\s*@language:\s*\w+\s*\*\/\n*)|(?:<!--\s*@language:\s*\w+\s*-->\n*))/, "");
    if (editorLanguage === "typescript") {
      currentCode = `// @language: tsx\n` + currentCode;
    } else if (editorLanguage === "javascript") {
      currentCode = `// @language: jsx\n` + currentCode;
    } else if (editorLanguage === "html") {
      currentCode = `<!-- @language: html -->\n` + currentCode;
    } else if (editorLanguage === "css") {
      currentCode = `/* @language: css */\n` + currentCode;
    }

    setActionLoading(true);
    try {
      const { component } = await api.updateComponent(activeComponent.id, {
        code: currentCode,
        autoParse: true,
      });
      setActiveComponent(component);
      setComponents(components.map((c) => (c.id === component.id ? { ...component, code: currentCode } : c)));
      setEditorCode(currentCode);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGlobalError(error.message || "Failed to save changes");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteComponent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this component?")) return;
    try {
      await api.deleteComponent(id);
      const remaining = components.filter((c) => c.id !== id);
      setComponents(remaining);
      setActiveComponent(remaining[0] || null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGlobalError(error.message || "Failed to delete component");
    }
  };

  const handleUpdateProjectTailwind = async () => {
    if (!activeProject) return;
    setActionLoading(true);
    try {
      const { project } = await api.updateProject(activeProject.id, {
        tailwindConfig: projectForm.tailwindConfig,
      });
      setActiveProject(project);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGlobalError(error.message || "Failed to update Tailwind Configuration");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePropChange = (name: string, value: PropValue) => {
    setPropValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const propRenderSnippet = useMemo(() => {
    if (!activeComponent) return "";
    const propPairs: string[] = [];
    activeComponent.props.forEach((p) => {
      const activeVal = propValues[p.name];
      if (activeVal === undefined || activeVal === "") return;

      if (typeof activeVal === "boolean") {
        if (activeVal === true) {
          propPairs.push(p.name);
        } else {
          propPairs.push(`${p.name}={false}`);
        }
      } else if (typeof activeVal === "number") {
        propPairs.push(`${p.name}={${activeVal}}`);
      } else if (typeof activeVal === "string") {
        propPairs.push(`${p.name}="${activeVal}"`);
      }
    });

    return `<${activeComponent.name} ${propPairs.join(" ")} />`;
  }, [activeComponent, propValues]);

  const copyToClipboard = (text: string, setCopiedState: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleShareProject = () => {
    const path = `${window.location.origin}/?project=${projectId}`;
    setShareLink(path);
    setShareModalOpen(true);
  };

  const filteredComponents = useMemo(() => {
    return components.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [components, searchQuery]);

  const iframeSrcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@19/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@19/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      background-color: #f8f1ec;
      color: #25180e;
    }
  </style>
</head>
<body class="p-8 min-h-screen flex items-center justify-center font-sans">
  <div id="root">
    <div class="text-graphite-400 text-center font-sans text-sm">Evaluating component...</div>
  </div>

  <script type="text/babel">
    class PreviewWrapper extends React.Component {
      state = {
        props: {}
      };

      componentDidMount() {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'UPDATE_PROPS') {
            this.setState({ props: event.data.props });
          }
        });
        window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
      }

      render() {
        if (!window.TargetComponent) {
          return (
            <div class="text-graphite-400 font-sans text-sm text-center">
              Loading preview canvas...
            </div>
          );
        }
        try {
          const Comp = window.TargetComponent;
          return <Comp {...this.state.props} />;
        } catch (err) {
          return (
            <div class="bg-oxblood-50 border border-oxblood-200 text-oxblood-700 p-4 rounded-lg font-mono text-xs max-w-md shadow-sm">
              <div class="font-bold mb-1 flex items-center gap-1.5 text-oxblood-800">
                <span>⚠️ Runtime Error:</span>
              </div>
              {error.message}
            </div>
          );
        }
      }
    }

    window.addEventListener('message', (event) => {
      if (event.data.type === 'LOAD_COMPONENT') {
        const { code, name, tailwindConfig, language } = event.data;
        try {
          if (tailwindConfig && tailwindConfig.trim()) {
            try {
              const parsed = new Function('return ' + tailwindConfig)();
              tailwind.config = parsed;
            } catch (e) {
              console.error('Tailwind Configuration Error:', e);
            }
          }

          if (language === 'html') {
            code = 'function ' + name + '() { return (<React.Fragment>' + code + '</React.Fragment>); }';
          } else if (language === 'css') {
            let styleEl = document.getElementById('custom-css-preview');
            if (!styleEl) {
              styleEl = document.createElement('style');
              styleEl.id = 'custom-css-preview';
              document.head.appendChild(styleEl);
            }
            styleEl.textContent = code;
            code = 'function ' + name + '() { return <div className="text-graphite-450 text-xs italic p-4 text-center">CSS Stylesheet Active</div>; }';
          } else {
            let styleEl = document.getElementById('custom-css-preview');
            if (styleEl) {
              styleEl.textContent = '';
            }
          }

          const transpiled = Babel.transform(code, {
            presets: ['react', 'typescript']
          }).code;

          const evalCode = transpiled + '\\n; window.TargetComponent = typeof ' + name + ' !== "undefined" ? ' + name + ' : Object.values(window).find(v => typeof v === "function" && v.name === "' + name + '");';
          
          window.TargetComponent = null;
          
          const script = document.createElement('script');
          script.text = evalCode;
          document.body.appendChild(script);
          document.body.removeChild(script);

          if (!window.TargetComponent) {
            const foundFunc = Object.values(window).find(v => typeof v === 'function' && v.name === name);
            if (foundFunc) {
              window.TargetComponent = foundFunc;
            } else {
              throw new Error("Could not find component function named: " + name);
            }
          }

          const rootElement = document.getElementById('root');
          if (rootElement) {
            if (window.ReactDOM.createRoot) {
              if (!window.reactRoot) {
                window.reactRoot = window.ReactDOM.createRoot(rootElement);
              }
              window.reactRoot.render(<PreviewWrapper />);
            } else {
              window.ReactDOM.render(<PreviewWrapper />, rootElement);
            }
          }
        } catch (err) {
          document.getElementById('root').innerHTML = \`
            <div class="bg-oxblood-50 border border-oxblood-200 text-oxblood-700 p-4 rounded-lg font-mono text-xs max-w-md shadow-sm">
              <div class="font-bold mb-1 flex items-center gap-1.5 text-oxblood-800">
                <span>❌ Compile Error:</span>
              </div>
              \\\${error.message}
            </div>
          \`;
        }
      }
    });
  </script>
</body>
</html>`;
  }, []);

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-golden-chestnut-50 text-golden-chestnut-900 items-center justify-center">
        <div className="w-8 h-8 border-2 border-golden-chestnut-200 border-t-rosy-copper-600 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-graphite-500">Loading dynamic project canvas...</p>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="min-h-screen flex flex-col bg-golden-chestnut-50 text-golden-chestnut-900 items-center justify-center p-6 text-center max-w-sm mx-auto">
        <Cancel01Icon className="w-10 h-10 text-oxblood-700 mb-4 animate-bounce" />
        <h2 className="text-lg font-bold text-golden-chestnut-950 mb-2">Workspace Blocked</h2>
        <p className="text-xs text-graphite-500 mb-6">{globalError}</p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rosy-copper-600 text-white hover:bg-rosy-copper-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-golden-chestnut-50 text-golden-chestnut-900 selection:bg-golden-chestnut-200 selection:text-golden-chestnut-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-golden-chestnut-200 bg-golden-chestnut-50">
        <div className="container mx-auto px-6 max-w-6xl h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-rosy-copper-600">
              Scaffold
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl border border-golden-chestnut-200 bg-white hover:bg-oxblood-50 hover:text-oxblood-700 text-graphite-500 transition cursor-pointer shadow-xs"
                  title="Logout"
                >
                  <Logout01Icon className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-golden-chestnut-200 bg-white text-golden-chestnut-700 hover:bg-golden-chestnut-100 transition cursor-pointer shadow-xs"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
        {/* Left Side: Components catalog */}
        <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-golden-chestnut-200 bg-golden-chestnut-100/30 flex flex-col shrink-0">
          <div className="p-4 border-b border-golden-chestnut-200">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-[10px] text-graphite-500 hover:text-graphite-800 font-bold uppercase tracking-wider cursor-pointer mb-4"
            >
              <ArrowLeft01Icon className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>

            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-golden-chestnut-950 text-base truncate">{activeProject?.name}</h2>
              {user && (
                <button
                  onClick={() => {
                    setModalLanguage("typescript");
                    setComponentForm({ name: "", description: "", code: TEMPLATES.typescript });
                    setComponentModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white transition cursor-pointer"
                  title="Add Component"
                >
                  <PlusSignIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-graphite-500 text-xs line-clamp-1 mb-3">{activeProject?.description}</p>

            <div className="relative">
              <Search01Icon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-rosy-copper-600/50" />
              <input
                type="text"
                placeholder="Filter component..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-golden-chestnut-200 bg-white text-golden-chestnut-900 placeholder-graphite-400 focus:border-rosy-copper-600 outline-none transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredComponents.length === 0 ? (
              <p className="text-center text-graphite-400 text-xs py-8">No elements found.</p>
            ) : (
              filteredComponents.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => setActiveComponent(comp)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeComponent?.id === comp.id
                      ? "bg-white border border-golden-chestnut-200 text-rosy-copper-650 shadow-xs"
                      : "text-graphite-500 hover:text-graphite-800 hover:bg-golden-chestnut-100/60"
                  }`}
                >
                  <span className="truncate">{comp.name}</span>
                  <span className="text-[10px] text-graphite-400 shrink-0 select-none">
                    {comp.props.length} params
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right Side: Editor and Sandbox Canvas */}
        <section className="flex-1 flex flex-col overflow-y-auto p-6 min-w-0 bg-golden-chestnut-50">
          {activeComponent ? (
            <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-golden-chestnut-200 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-golden-chestnut-950 tracking-tight">{activeComponent.name}</h1>
                    {user && (
                      <button
                        onClick={() => handleDeleteComponent(activeComponent.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-oxblood-50 text-oxblood-700 hover:bg-oxblood-100 transition cursor-pointer border border-oxblood-200"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-graphite-500 text-xs mt-1 max-w-xl leading-relaxed">{activeComponent.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareProject}
                    className="px-4.5 py-2.5 rounded-xl text-xs font-semibold border border-golden-chestnut-200 bg-white hover:bg-golden-chestnut-200 text-golden-chestnut-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Share01Icon className="w-3.5 h-3.5 text-rosy-copper-600" />
                    Share Link
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 border-b border-golden-chestnut-200 mb-6">
                <button
                  onClick={() => setActiveTab("playground")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                    activeTab === "playground"
                      ? "border-rosy-copper-600 text-rosy-copper-600"
                      : "border-transparent text-graphite-400 hover:text-graphite-700"
                  }`}
                >
                  Component Editor
                </button>
                {user && (
                  <button
                    onClick={() => setActiveTab("tailwind")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                      activeTab === "tailwind"
                        ? "border-rosy-copper-600 text-rosy-copper-600"
                        : "border-transparent text-graphite-400 hover:text-graphite-700"
                    }`}
                  >
                    Tailwind Settings
                  </button>
                )}
              </div>

              {activeTab === "playground" && (
                <div className="flex-1 flex flex-col gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Monaco Editor */}
                    <div className="flex flex-col rounded-2xl border border-golden-chestnut-200 bg-white overflow-hidden min-h-[440px] lg:min-h-0 shadow-xs">
                      <div className="px-4 py-2.5 border-b border-golden-chestnut-200 flex items-center justify-between bg-golden-chestnut-100/30">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-graphite-550 flex items-center gap-1">
                          <CodeIcon className="w-3.5 h-3.5 text-rosy-copper-600" />{' '}
                          {editorLanguage === 'typescript'
                            ? 'TSX Source Code'
                            : editorLanguage === 'javascript'
                            ? 'JSX Source Code'
                            : editorLanguage === 'html'
                            ? 'HTML Source Code'
                            : 'CSS Stylesheet'}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <select
                            value={editorLanguage}
                            onChange={(e) => setEditorLanguage(e.target.value as "typescript" | "javascript" | "html" | "css")}
                            disabled={!user}
                            className="px-2.5 py-1 rounded-lg border border-golden-chestnut-200 bg-white text-[10px] font-bold text-golden-chestnut-900 outline-none focus:border-rosy-copper-600 transition disabled:opacity-50 cursor-pointer"
                          >
                            <option value="typescript">TSX (React)</option>
                            <option value="javascript">JSX (React)</option>
                            <option value="html">HTML / Tailwind</option>
                            <option value="css">CSS stylesheet</option>
                          </select>
                          {user ? (
                            <button
                              onClick={handleUpdateComponentCode}
                              className="px-4.5 py-1.5 rounded-xl text-xs font-semibold bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white transition cursor-pointer shadow-xs active:scale-95"
                            >
                              Save Code
                            </button>
                          ) : (
                            <span className="text-xs text-graphite-400 italic">Read-only preview</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 relative">
                        <Editor
                          key={activeComponent.id + "-" + editorLanguage}
                          height="100%"
                          language={editorLanguage}
                          theme="vs"
                          defaultValue={activeComponent.code}
                          onMount={handleMainEditorDidMount}
                          onChange={(val) => debouncedSetEditorCode(val || "")}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 12,
                            lineHeight: 18,
                            padding: { top: 8 },
                            readOnly: !user,
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Preview Sandbox */}
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col rounded-2xl border border-golden-chestnut-200 bg-white overflow-hidden flex-1 min-h-[350px] shadow-xs">
                        <div className="px-4 py-2.5 border-b border-golden-chestnut-200 bg-golden-chestnut-100/30 flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-graphite-550">
                            Live Preview
                          </span>

                          <div className="flex items-center gap-0.5 border border-golden-chestnut-200 p-0.5 rounded-lg bg-white">
                            <button
                              onClick={() => setPreviewViewport("mobile")}
                              className={`p-1 rounded-md transition cursor-pointer ${
                                previewViewport === "mobile"
                                  ? "bg-golden-chestnut-100 text-rosy-copper-600"
                                  : "text-graphite-400 hover:text-graphite-700"
                              }`}
                            >
                              <AiPhone01Icon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPreviewViewport("tablet")}
                              className={`p-1 rounded-md transition cursor-pointer ${
                                previewViewport === "tablet"
                                  ? "bg-golden-chestnut-100 text-rosy-copper-600"
                                  : "text-graphite-400 hover:text-graphite-700"
                              }`}
                            >
                              <Tablet01Icon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPreviewViewport("desktop")}
                              className={`p-1 rounded-md transition cursor-pointer ${
                                previewViewport === "desktop"
                                  ? "bg-golden-chestnut-100 text-rosy-copper-600"
                                  : "text-graphite-400 hover:text-graphite-700"
                              }`}
                            >
                              <AiLaptopIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 bg-golden-chestnut-50 flex items-center justify-center p-4 min-h-[250px] border-b border-golden-chestnut-200/40">
                          <div
                            style={{
                              width:
                                previewViewport === "mobile"
                                  ? "375px"
                                  : previewViewport === "tablet"
                                  ? "768px"
                                  : "100%",
                            }}
                            className="h-full max-h-[300px] min-h-[260px] border border-golden-chestnut-200 rounded-xl overflow-hidden shadow-xs bg-white transition-all duration-200 relative flex flex-col"
                          >
                            <div className="px-2.5 py-0.5 bg-golden-chestnut-100/40 text-[9px] text-graphite-400 flex items-center justify-between border-b border-golden-chestnut-200/60">
                              <span>
                                Viewport:{" "}
                                {previewViewport === "mobile"
                                  ? "375px"
                                  : previewViewport === "tablet"
                                  ? "768px"
                                  : "Full Width"}
                              </span>
                            </div>
                            <iframe
                              ref={iframeRef}
                              srcDoc={iframeSrcDoc}
                              className="flex-1 w-full bg-transparent border-0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Props board */}
                      <div className="p-5 rounded-2xl border border-golden-chestnut-200 bg-white shadow-xs">
                        <h3 className="text-xs font-bold tracking-wider uppercase text-graphite-550 mb-3.5 flex items-center gap-1">
                          <Settings01Icon className="w-3.5 h-3.5 text-rosy-copper-600" /> Controls Panel
                        </h3>

                        {activeComponent.props.length === 0 ? (
                          <p className="text-graphite-400 text-xs py-3 text-center">
                            No parameters parsed from source.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {activeComponent.props.map((p) => {
                              const val = propValues[p.name];
                              const isBoolean = p.type.includes("boolean");
                              const isUnion = p.type.includes("|");

                              if (isBoolean) {
                                return (
                                  <div
                                    key={p.name}
                                    className="flex items-center justify-between p-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-100/30"
                                  >
                                    <div>
                                      <span className="text-xs font-bold text-golden-chestnut-700 block">{p.name}</span>
                                      <span className="text-[10px] text-graphite-400 font-mono">{p.type}</span>
                                    </div>
                                    <button
                                      onClick={() => handlePropChange(p.name, !val)}
                                      className={`w-9 h-5.5 rounded-full p-0.5 cursor-pointer transition ${
                                        val ? "bg-rosy-copper-600" : "bg-graphite-250"
                                      }`}
                                    >
                                      <div
                                        className={`w-4.5 h-4.5 rounded-full bg-white transition ${
                                          val ? "translate-x-3.5" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                );
                              }

                              if (isUnion) {
                                const options = p.type
                                  .split("|")
                                  .map((opt) => opt.trim().replace(/['"]/g, ""))
                                  .filter(Boolean);

                                return (
                                  <div key={p.name} className="flex flex-col gap-1 p-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-100/30">
                                    <div className="flex justify-between">
                                      <span className="text-xs font-bold text-golden-chestnut-700">{p.name}</span>
                                      <span className="text-[10px] text-graphite-400 font-mono">{p.type}</span>
                                    </div>
                                    <select
                                      value={val !== undefined ? String(val) : ""}
                                      onChange={(e) => handlePropChange(p.name, e.target.value)}
                                      className="w-full bg-golden-chestnut-50 border border-golden-chestnut-200 text-xs px-2 py-1.5 rounded-lg outline-none text-golden-chestnut-700 focus:border-rosy-copper-600"
                                    >
                                      {options.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }

                              return (
                                <div key={p.name} className="flex flex-col gap-1 p-2.5 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-100/30">
                                  <div className="flex justify-between">
                                    <span className="text-xs font-bold text-golden-chestnut-700">{p.name}</span>
                                    <span className="text-[10px] text-graphite-400 font-mono">{p.type}</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={val !== undefined ? String(val) : ""}
                                    onChange={(e) => handlePropChange(p.name, e.target.value)}
                                    className="w-full bg-golden-chestnut-50 border border-golden-chestnut-200 text-xs px-2.5 py-1.5 rounded-lg outline-none text-golden-chestnut-700 focus:border-rosy-copper-600"
                                    placeholder={p.defaultValue || "e.g. click"}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Snippet display */}
                  <div className="p-5 rounded-2xl border border-golden-chestnut-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <h3 className="text-[10px] font-bold tracking-wider uppercase text-graphite-550">
                        React JSX Snippet
                      </h3>
                      <button
                        onClick={() => copyToClipboard(propRenderSnippet, setCopiedPropSnippet)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-golden-chestnut-200 hover:border-rosy-copper-600 text-golden-chestnut-700 transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      >
                        {copiedPropSnippet ? (
                          "Copied!"
                        ) : (
                          <>
                            <Copy01Icon className="w-3.5 h-3.5 text-rosy-copper-600" /> Copy React snippet
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl bg-golden-chestnut-100/40 border border-golden-chestnut-200 font-mono text-xs text-golden-chestnut-800 overflow-x-auto whitespace-nowrap">
                      {propRenderSnippet}
                    </div>
                  </div>

                  {/* Auto generated prop table */}
                  <div className="p-5 rounded-2xl border border-golden-chestnut-200 bg-white overflow-hidden shadow-xs">
                    <h3 className="text-[10px] font-bold tracking-wider uppercase text-graphite-550 mb-3.5">
                      Props Definitions API
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-golden-chestnut-200 text-graphite-450 uppercase tracking-wider font-bold text-[9px]">
                            <th className="pb-2.5 font-semibold">Prop</th>
                            <th className="pb-2.5 font-semibold">Type</th>
                            <th className="pb-2.5 font-semibold text-center">Required</th>
                            <th className="pb-2.5 font-semibold">Default</th>
                            <th className="pb-2.5 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeComponent.props.map((p) => (
                            <tr key={p.name} className="border-b border-golden-chestnut-200/45 last:border-0">
                              <td className="py-2.5 font-mono text-golden-chestnut-950 font-bold">{p.name}</td>
                              <td className="py-2.5 font-mono text-rosy-copper-600 font-semibold">{p.type}</td>
                              <td className="py-2.5 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    p.required
                                      ? "bg-oxblood-50 text-oxblood-700 border-oxblood-200/50"
                                      : "bg-golden-chestnut-100 text-graphite-550 border-transparent"
                                  }`}
                                >
                                  {p.required ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="py-2.5 font-mono text-graphite-500">
                                {p.defaultValue || "-"}
                              </td>
                              <td className="py-2.5 text-graphite-550 max-w-xs truncate" title={p.description}>
                                {p.description || "No description provided."}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "tailwind" && (
                <div className="flex-1 flex flex-col gap-6">
                  <div className="p-5 rounded-2xl border border-golden-chestnut-200 bg-white shadow-xs">
                    <h2 className="text-base font-bold text-golden-chestnut-950 mb-1">Tailwind Configuration</h2>
                    <p className="text-xs text-graphite-500 leading-relaxed mb-5">
                      Input your brand&apos;s tailwind config object dynamically to enable rendering custom colors, borders, and spacings.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-2">
                          Config Code
                        </label>
                        <div className="h-56 rounded-xl border border-golden-chestnut-200 overflow-hidden bg-golden-chestnut-50">
                          <Editor
                            key={activeProject?.id}
                            height="100%"
                            defaultLanguage="javascript"
                            theme="vs"
                            defaultValue={activeProject?.tailwindConfig || ""}
                            onChange={(val) => setProjectForm({ ...projectForm, tailwindConfig: val || "" })}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 12,
                              lineHeight: 18,
                              padding: { top: 8 },
                            }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleUpdateProjectTailwind}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white transition cursor-pointer shadow-xs active:scale-95"
                      >
                        {actionLoading ? "Saving..." : "Save Config Options"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-golden-chestnut-100 flex items-center justify-center text-rosy-copper-600 mb-4 border border-golden-chestnut-200">
                <CodeIcon className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-golden-chestnut-950 mb-1">Empty Components Registry</h2>
              <p className="text-graphite-500 text-xs leading-relaxed mb-5">
                Register your first TSX or HTML/CSS component to initialize documentation.
              </p>
              {user ? (
                <button
                  onClick={() => {
                    setModalLanguage("typescript");
                    setComponentForm({ name: "", description: "", code: TEMPLATES.typescript });
                    setComponentModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white cursor-pointer flex items-center gap-1.5 mx-auto active:scale-95 shadow-xs"
                >
                  <PlusSignIcon className="w-3.5 h-3.5" /> Save First Component
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white cursor-pointer flex items-center gap-1.5 mx-auto active:scale-95 shadow-xs w-fit"
                >
                  Sign In to Create Components
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modal: Create Component */}
      {componentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-graphite-950/20 backdrop-blur-xs">
          <div className="w-full max-w-xl p-6 rounded-2xl border border-golden-chestnut-200 bg-white shadow-xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setComponentModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-graphite-400 hover:text-graphite-800 hover:bg-graphite-50 transition cursor-pointer"
            >
              <Cancel01Icon className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-base font-bold text-golden-chestnut-950 mb-0.5">New Component</h3>
            <p className="text-graphite-500 text-xs mb-4">Add a custom React or HTML/Tailwind component to this registry.</p>

            <form onSubmit={handleCreateComponent} className="space-y-4 flex-1 flex flex-col min-h-0">
              {formErrors.form && (
                <div className="p-2.5 bg-oxblood-50 border border-oxblood-100 rounded-xl text-oxblood-700 text-xs shrink-0 font-semibold">
                  {formErrors.form}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-1">
                    Name (PascalCase)
                  </label>
                  <input
                    type="text"
                    value={componentForm.name}
                    onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50 text-golden-chestnut-900 text-xs focus:border-rosy-copper-600 outline-none"
                    placeholder="e.g. HeaderWidget"
                  />
                  {formErrors.name && <p className="text-[10px] text-oxblood-500 mt-1 font-semibold">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={componentForm.description}
                    onChange={(e) => setComponentForm({ ...componentForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50 text-golden-chestnut-900 text-xs focus:border-rosy-copper-600 outline-none"
                    placeholder="e.g. Navigation brand widget"
                  />
                  {formErrors.description && <p className="text-[10px] text-oxblood-500 mt-1 font-semibold">{formErrors.description}</p>}
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-graphite-550">
                    Source Code
                  </label>
                  <select
                    value={modalLanguage}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const lang = e.target.value as keyof typeof TEMPLATES;
                      setModalLanguage(lang);
                      if (modalEditorRef.current) {
                        modalEditorRef.current.setValue(TEMPLATES[lang]);
                      }
                    }}
                    className="px-2 py-1 rounded-lg border border-golden-chestnut-200 bg-white text-[10px] font-bold text-golden-chestnut-900 outline-none focus:border-rosy-copper-600 transition cursor-pointer"
                  >
                    <option value="typescript">TSX (React)</option>
                    <option value="javascript">JSX (React)</option>
                    <option value="html">HTML / Tailwind</option>
                    <option value="css">CSS stylesheet</option>
                  </select>
                </div>
                <div className="flex-1 min-h-[220px] rounded-xl border border-golden-chestnut-200 overflow-hidden bg-golden-chestnut-50">
                  <Editor
                    key={(componentModalOpen ? "open" : "closed") + "-" + modalLanguage}
                    height="100%"
                    language={modalLanguage}
                    theme="vs"
                    defaultValue={TEMPLATES[modalLanguage]}
                    onMount={handleModalEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineHeight: 18,
                      padding: { top: 6 },
                    }}
                  />
                </div>
                {formErrors.code && <p className="text-[10px] text-oxblood-500 mt-1 shrink-0 font-semibold">{formErrors.code}</p>}
              </div>

              <div className="pt-2 flex justify-end gap-2 shrink-0 border-t border-golden-chestnut-100">
                <button
                  type="button"
                  onClick={() => setComponentModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-graphite-500 hover:text-graphite-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white cursor-pointer shadow-xs active:scale-95"
                >
                  {actionLoading ? "Saving..." : "Save Component"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Share System Link */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-graphite-950/20 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-2xl border border-golden-chestnut-200 bg-white shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-graphite-400 hover:text-graphite-800 hover:bg-graphite-50 transition cursor-pointer"
            >
              <Cancel01Icon className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-base font-bold text-golden-chestnut-950 mb-0.5">Share Design System</h3>
            <p className="text-graphite-500 text-xs mb-4">
              Reviewers with this link can view and test component library instances live.
            </p>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2 rounded-xl border border-golden-chestnut-200 bg-golden-chestnut-50 text-graphite-700 text-xs outline-none"
                />
                <button
                  onClick={() => copyToClipboard(shareLink, setCopiedShareLink)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white transition cursor-pointer shrink-0 shadow-xs active:scale-95"
                >
                  {copiedShareLink ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div className="p-3 bg-golden-chestnut-50 border border-golden-chestnut-200 rounded-xl text-[10px] text-graphite-500 leading-relaxed font-medium">
                📢 Shareable links let product managers and clients interact with styling layouts immediately without local setup.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-golden-chestnut-200 bg-white hover:bg-golden-chestnut-50 text-golden-chestnut-700 cursor-pointer shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
