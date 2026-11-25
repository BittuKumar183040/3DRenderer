import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { toast, ToastContainer } from "react-toastify";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  ChevronRight,
  FileImage,
  FileUp,
  Grid2X2,
  Search,
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
      <div className="nav-center">
        <span className="nav-indicator" />
        <span className="nav-label">Workspace</span>
        <span className="nav-muted">/ Local session</span>
      </div>
      <div className="nav-right">
        <button className="nav-studio" type="button" onClick={onOpenStudio}>
          <Box size={13} /> <span>Studio</span>
        </button>
        <a className="nav-link" href="#library">Library <ArrowRight size={13} /></a>
        <span className="status-chip"><span /> Ready</span>
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
        <div className="hero-tags reveal" style={{ "--d": "270ms" }}>
          <span><i className="tag-dot purple" />Interactive by default</span>
          <span><i className="tag-dot green" />Runs in your browser</span>
        </div>
        <div className="hero-stats reveal" style={{ "--d": "330ms" }}>
          <span><b>05</b><small>Formats</small></span>
          <span><b>06</b><small>Demos</small></span>
          <span><b>100%</b><small>Local</small></span>
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

    <footer className="studio-footer">
      <span>© {new Date().getFullYear()} <a href="https://Bexyzo.betoo.co.in" target="_blank" rel="noreferrer">Bexyzo.betoo.co.in</a></span>
      <span>GLB · FBX · SVG · VTK · GLSL</span>
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
