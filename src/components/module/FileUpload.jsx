import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { toast, ToastContainer } from "react-toastify";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Boxes,
  ChevronRight,
  Download,
  FileImage,
  FileUp,
  Grid2X2,
  Layers3,
  Lightbulb,
  Play,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import frameModel from "../../assets/frame.glb";
import frame from "./images/frame.png";
import chargerModel from "../../assets/charger.glb";
import charger from "./images/charger.png";
import girlModel from "../../assets/girl.fbx";
import girl from "./images/girl.png";
import dna from "../../assets/dna.svg?raw";
import dnaPreview from "../../assets/dna.svg";
import breakPaddle from "./images/breakpaddlevtk.png";
import customShaderImg from "./images/customShader.jpg";
import vtkSample from "../../assets/vtkSampleFiles/breakPaddle.vtk?raw";

const SUPPORTED = ["glb", "gltf", "fbx", "svg", "vtk"];
const DEMOS = [
  { key: "frame", label: "Studio frame", ext: "GLB", kind: "3D model", img: frame, color: "lavender" },
  { key: "charger", label: "Power charger", ext: "GLB", kind: "3D model", img: charger, color: "peach" },
  { key: "girl", label: "Character study", ext: "FBX", kind: "3D model", img: girl, color: "blue" },
  { key: "dna", label: "DNA molecule", ext: "SVG", kind: "Vector", img: dnaPreview, color: "mint" },
  { key: "break", label: "Paddle analysis", ext: "VTK", kind: "Scientific", img: breakPaddle, color: "rose" },
  { key: "custom", label: "Shader playground", ext: "SHADER", kind: "Live shader", img: customShaderImg, color: "dark" },
];

const STUDIO_FEATURES = [
  {
    key: "scene",
    Icon: Boxes,
    title: "Scene building",
    copy: "Start on a blank grid, then drop a model or add meshes, lamps, curves and 3D text wherever the cursor sits.",
  },
  {
    key: "edit",
    Icon: RotateCw,
    title: "Direct manipulation",
    copy: "Move, rotate and scale with viewport gizmos, then duplicate, group, boolean, extrude, subdivide or mirror.",
  },
  {
    key: "look",
    Icon: Lightbulb,
    title: "Materials and light",
    copy: "Stack material slots, apply presets, drop in textures and place point, spot, sun or ambient lamps.",
  },
  {
    key: "animation",
    Icon: Play,
    title: "Animation playback",
    copy: "GLB, GLTF and FBX files that carry clips get a timeline with clip switching, scrubbing and speed control.",
  },
  {
    key: "selection",
    Icon: Layers3,
    title: "Multi-selection",
    copy: "Shift-click to build a selection, then align, drop to the ground or edit every object from one panel.",
  },
  {
    key: "export",
    Icon: Download,
    title: "Export and capture",
    copy: "Send the scene out as GLB, GLTF, OBJ, STL or PLY, or save a clean PNG of exactly what the camera sees.",
  },
  {
    key: "view",
    Icon: Grid2X2,
    title: "Camera and grid",
    copy: "Frame any selection, jump to ISO, front, top or right views and toggle grid, wireframe and isolate.",
  },
  {
    key: "privacy",
    Icon: ShieldCheck,
    title: "Stays on device",
    copy: "Files open locally in the browser. Nothing is uploaded, nothing is stored and no account is needed.",
  },
];

const STUDIO_FLOW = ["Import a file", "Compose and light", "Refine the mesh", "Export or capture"];

const FileUpload = ({ fileData, onOpenStudio = () => {} }) => {
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const dragDepth = useRef(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All assets");
  const [dragging, setDragging] = useState(false);
  const [pageDragging, setPageDragging] = useState(false);
  const categories = ["All assets", "3D model", "Vector", "Scientific", "Live shader"];
  const filtered = useMemo(
    () =>
      DEMOS.filter(
        (item) =>
          (filter === "All assets" || item.kind === filter) &&
          `${item.label} ${item.ext} ${item.kind}`.toLowerCase().includes(query.toLowerCase())
      ),
    [filter, query]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const sendBack = (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    if (!SUPPORTED.includes(extension)) return toast.error("Choose a GLB, GLTF, FBX, SVG, or VTK file.");
    fileData({ file, name: file.name.replace(/\.[^.]+$/, ""), extension: extension === "gltf" ? "glb" : extension });
  };

  const pickDemo = async (key) => {
    const pick = {
      frame: () => fileData({ file: frameModel, name: "frame", extension: "glb" }),
      charger: () => fileData({ file: chargerModel, name: "charger", extension: "glb" }),
      girl: () => fileData({ file: girlModel, name: "girl", extension: "fbx" }),
      break: () => fileData({ file: { name: "break", extension: "vtk", file: vtkSample }, name: "break", extension: "vtk" }),
      dna: () => fileData({ file: new File([dna], "dna.svg", { type: "image/svg+xml" }), name: "dna", extension: "svg" }),
      custom: () => fileData({ file: null, name: "custom", extension: "custom" }),
    };
    pick[key]?.();
  };

  const openPicker = () => inputRef.current?.click();

  const acceptsFiles = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");

  const onPageDragEnter = (event) => {
    if (!acceptsFiles(event)) return;
    dragDepth.current += 1;
    setPageDragging(true);
  };

  const onPageDragOver = (event) => {
    if (!acceptsFiles(event)) return;
    event.preventDefault();
    setPageDragging(true);
  };

  const onPageDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setPageDragging(false);
  };

  const onPageDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setPageDragging(false);
    setDragging(false);
    sendBack(event.dataTransfer.files?.[0]);
  };

  return <main
    className="studio-home"
    onDragEnter={onPageDragEnter}
    onDragOver={onPageDragOver}
    onDragLeave={onPageDragLeave}
    onDrop={onPageDrop}
  >
    <ToastContainer position="bottom-right" theme="light" />
    <div className="studio-aurora" aria-hidden="true">
      <span className="aurora-blob blob-a" />
      <span className="aurora-blob blob-b" />
      <span className="aurora-blob blob-c" />
    </div>

    <header className="studio-nav">
      <a className="brand" href="#home" aria-label="Bexyzo home">
        <span className="brand-mark"><Box size={18} /></span>
        <span className="brand-name">Bexyzo<span className="brand-dot">.</span></span>
      </a>
      <div className="nav-right">
        <button className="nav-studio" type="button" onClick={onOpenStudio}>
          <Box size={13} /> <span>Studio</span>
        </button>
        <a className="nav-link" href="#studio">Studio guide <ArrowRight size={13} /></a>
        <a className="nav-link" href="#library">Library <ArrowRight size={13} /></a>
        <button className="nav-cta" type="button" onClick={openPicker}>
          <UploadCloud size={14} /> Open file
        </button>
      </div>
    </header>

    <section className="hero-area" id="home">
      <div className="hero-copy">
        <div className="eyebrow reveal"><Sparkles size={13} /> THE 3D WORKSPACE <span className="eyebrow-badge">V1.0</span></div>
        <h1 className="reveal" style={{ "--d": "70ms" }}>Bring your ideas<br /><span className="hero-highlight">into focus.</span></h1>
        <p className="reveal" style={{ "--d": "140ms" }}>A considered space for 3D assets, scientific data, vector shapes, and shader experiments.</p>
        <div className="hero-actions reveal" style={{ "--d": "210ms" }}>
          <button className="primary-button" type="button" onClick={openPicker}>
            <FileUp size={16} /> Start with a file
            <span className="button-shine" aria-hidden="true" />
          </button>
          <a className="ghost-button" href="#library"><Grid2X2 size={15} /> Explore demos <ArrowRight size={14} /></a>
        </div>
      </div>

      <div
        className={`drop-card reveal ${dragging ? "is-dragging" : ""}`}
        style={{ "--d": "180ms" }}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setDragging(false); dragDepth.current = 0; setPageDragging(false); sendBack(event.dataTransfer.files[0]); }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
      >
        <div className="drop-card-head">
          <span className="drop-chip">IMPORT</span>
          <span className="drop-local"><span className="live-dot" /> Stays on device</span>
        </div>
        <div className="drop-visual">
          <div className="drop-orbit orbit-one" />
          <div className="drop-orbit orbit-two" />
          <div className="upload-icon"><UploadCloud size={24} /></div>
        </div>
        <h2>Drop an asset anywhere</h2>
        <p>or browse your computer — GLB, FBX, SVG, VTK</p>
        <button className="browse-button" type="button" onClick={openPicker}>
          <FileUp size={16} /> Browse files <ArrowUpRight size={15} />
          <span className="button-shine" aria-hidden="true" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED.map((x) => `.${x}`).join(",")}
          onChange={(event) => { sendBack(event.target.files?.[0]); event.target.value = ""; }}
          hidden
        />
        <div className="format-row">
          <span>SUPPORTED FORMATS</span>
          {SUPPORTED.map((x) => <b key={x}>{x.toUpperCase()}</b>)}
        </div>
      </div>

      <div className="hero-decoration" aria-hidden="true">
        <div className="decor-ring ring-a" />
        <div className="decor-ring ring-b" />
        <div className="decor-cross">✳</div>
      </div>
    </section>

    <section className="asset-section" id="library">
      <div className="section-heading">
        <div>
          <div className="eyebrow small"><Grid2X2 size={13} /> YOUR STARTING POINT</div>
          <h2>Explore the library</h2>
          <p>Jump into a sample scene or build something of your own.</p>
        </div>
        <div className="library-tools">
          <label className="search-box">
            <Search size={15} />
            <input
              ref={searchRef}
              placeholder="Search assets"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search assets"
              aria-keyshortcuts="/"
            />
            <kbd>/</kbd>
          </label>
          <span className="asset-count"><b>{filtered.length}</b> assets</span>
        </div>
      </div>
      <div className="filter-row">
        {categories.map((cat) => (
          <button key={cat} type="button" className={`filter-pill ${filter === cat ? "active" : ""}`} onClick={() => setFilter(cat)}>
            {cat}
          </button>
        ))}
      </div>
      <div className="asset-grid">
        {filtered.map((item, index) => (
          <button key={item.key} type="button" className="asset-card" style={{ "--i": index }} onClick={() => pickDemo(item.key)}>
            <div className={`asset-preview ${item.color}`}>
              <img src={item.img} alt="" />
              <span className="asset-ext">{item.ext}</span>
              <span className="asset-open"><ArrowUpRight size={16} /></span>
            </div>
            <div className="asset-meta">
              <div><strong>{item.label}</strong><span>{item.kind}</span></div>
              <ChevronRight size={16} />
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-library"><FileImage size={22} /><span>No assets match “{query}”</span></div>
      )}
    </section>

    <section className="studio-showcase" id="studio">
      <div className="showcase-head">
        <div className="showcase-copy">
          <div className="eyebrow small"><Sparkles size={13} /> THE BEXYZO STUDIO</div>
          <h2>A full 3D workspace, right in the browser.</h2>
          <p>
            The studio is a blank canvas for assembling a scene without a desktop
            install. Bring in a GLB, GLTF, FBX, OBJ, STL, PLY or SVG file, or start
            from primitives, then place, light, edit and export it — all in one
            viewport that never uploads your work.
          </p>
          <div className="showcase-actions">
            <button className="primary-button" type="button" onClick={onOpenStudio}>
              <Box size={16} /> Open the studio
              <span className="button-shine" aria-hidden="true" />
            </button>
            <button className="ghost-button" type="button" onClick={openPicker}>
              <FileUp size={15} /> Bring a model
            </button>
          </div>
        </div>
        <div className="showcase-stats">
          <div><b>7</b><span>file formats in one canvas</span></div>
          <div><b>5</b><span>object families to add</span></div>
          <div><b>0</b><span>files uploaded, ever</span></div>
        </div>
      </div>

      <div className="showcase-grid">
        {STUDIO_FEATURES.map(({ key, Icon, title, copy }) => (
          <article className="showcase-card" key={key}>
            <span className="showcase-icon"><Icon size={16} /></span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>

      <div className="showcase-flow" aria-label="Studio workflow">
        {STUDIO_FLOW.map((step, index) => (
          <div className="showcase-step" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{step}</b>
            {index < STUDIO_FLOW.length - 1 && <ArrowRight size={14} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </section>

    <footer className="studio-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <a className="brand" href="#home" aria-label="Bexyzo home">
            <span className="brand-mark"><Box size={18} /></span>
            <span className="brand-name">Bexyzo<span className="brand-dot">.</span></span>
          </a>
          <p>
            A browser-native 3D workspace for models, vector art, scientific data
            and shader experiments. No installs, no uploads, no waiting.
          </p>
          <div className="footer-badges">
            <span>Runs locally</span>
            <span>No account needed</span>
            <span>Free to use</span>
          </div>
        </div>

        <div className="footer-col">
          <h4>Workspace</h4>
          <button type="button" onClick={onOpenStudio}>Studio canvas</button>
          <a href="#studio">What the studio does</a>
          <a href="#library">Asset library</a>
          <button type="button" onClick={openPicker}>Open a file</button>
        </div>

        <div className="footer-col">
          <h4>Formats</h4>
          <span>GLB · GLTF</span>
          <span>FBX · OBJ · STL · PLY</span>
          <span>SVG vectors</span>
          <span>VTK scientific data</span>
          <span>GLSL shaders</span>
        </div>

        <div className="footer-col">
          <h4>Under the hood</h4>
          <span>Three.js + React</span>
          <span>WebGL rendering</span>
          <span>Opentype 3D text</span>
          <span>CSG booleans</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()}{" "}
          <a href="https://Bexyzo.betoo.co.in" target="_blank" rel="noreferrer">
            Bexyzo.betoo.co.in
          </a>
          · Built for the browser
        </span>
        <span>Your files stay on your device · GLB · FBX · SVG · VTK · GLSL</span>
      </div>
    </footer>

    {pageDragging && (
      <div className="drop-overlay" aria-hidden="true">
        <div className="drop-overlay-inner">
          <UploadCloud size={30} />
          <strong>Drop to open your asset</strong>
          <small>GLB · GLTF · FBX · SVG · VTK</small>
        </div>
      </div>
    )}
  </main>;
};

FileUpload.propTypes = {
  fileData: PropTypes.func.isRequired,
  onOpenStudio: PropTypes.func,
};


export default FileUpload;
