import { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { toast, ToastContainer } from "react-toastify";
import { ArrowUpRight, Box, Braces, ChevronRight, FileImage, FileUp, Grid2X2, Search, Sparkles, UploadCloud } from "lucide-react";
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

const FileUpload = ({ fileData }) => {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All assets");
  const [dragging, setDragging] = useState(false);
  const categories = ["All assets", "3D model", "Vector", "Scientific", "Live shader"];
  const filtered = useMemo(() => DEMOS.filter((item) =>
    (filter === "All assets" || item.kind === filter) && `${item.label} ${item.ext} ${item.kind}`.toLowerCase().includes(query.toLowerCase())
  ), [filter, query]);

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

  return <main className="studio-home">
    <ToastContainer position="bottom-right" theme="dark" />
    <header className="studio-nav">
      <a className="brand" href="#home" aria-label="Bexyzo home"><span className="brand-mark"><Box size={18} /></span><span className="brand-name">Bexyzo<span className="brand-dot">.</span></span></a>
    </header>

    <section className="hero-area" id="home">
      <div className="hero-copy"><div className="eyebrow"><Sparkles size={13} /> THE 3D WORKSPACE</div>
        <h1>Bring your ideas<br /><span>into focus.</span></h1>
        <p>A considered space for 3D assets, scientific data, vector shapes, and shader experiments.</p>
        <div className="hero-tags"><span><i className="tag-dot purple" />Interactive by default</span><span><i className="tag-dot green" />Runs in your browser</span></div>
      </div>
      <div className={`drop-card ${dragging ? "is-dragging" : ""}`} onDrop={(e) => { e.preventDefault(); setDragging(false); sendBack(e.dataTransfer.files[0]); }} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}>
        <div className="drop-visual"><div className="drop-orbit orbit-one" /><div className="drop-orbit orbit-two" /><div className="upload-icon"><UploadCloud size={24} /></div></div>
        <h2>Start with a file</h2><p>Drop an asset here, or browse your computer</p>
        <button className="browse-button" onClick={() => inputRef.current?.click()}><FileUp size={16} /> Browse files <ArrowUpRight size={15} /></button>
        <input ref={inputRef} type="file" accept={SUPPORTED.map((x) => `.${x}`).join(",")} onChange={(e) => { sendBack(e.target.files?.[0]); e.target.value = ""; }} hidden />
        <div className="format-row"><span>SUPPORTED FORMATS</span>{SUPPORTED.map((x) => <b key={x}>{x.toUpperCase()}</b>)}</div>
      </div>
      <div className="hero-decoration"><div className="decor-ring ring-a" /><div className="decor-ring ring-b" /><div className="decor-cross">✳</div></div>
    </section>

    <section className="asset-section">
      <div className="section-heading"><div><div className="eyebrow small"><Grid2X2 size={13} /> YOUR STARTING POINT</div><h2>Explore the library</h2><p>Jump into a sample scene or build something of your own.</p></div><div className="library-tools"><label className="search-box"><Search size={15} /><input placeholder="Search assets" value={query} onChange={(e) => setQuery(e.target.value)} /><kbd>/</kbd></label><span className="asset-count">{filtered.length} assets</span></div></div>
      <div className="filter-row">{categories.map((cat) => <button key={cat} className={`filter-pill ${filter === cat ? "active" : ""}`} onClick={() => setFilter(cat)}>{cat}</button>)}</div>
      <div className="asset-grid">{filtered.map((item) => <button key={item.key} className="asset-card" onClick={() => pickDemo(item.key)}>
        <div className={`asset-preview ${item.color}`}><img src={item.img} alt="" /><span className="asset-ext">{item.ext}</span><span className="asset-open"><ArrowUpRight size={16} /></span></div>
        <div className="asset-meta"><div><strong>{item.label}</strong><span>{item.kind}</span></div><ChevronRight size={16} /></div>
      </button>)}</div>
      {filtered.length === 0 && <div className="empty-library"><FileImage size={22} /><span>No assets match “{query}”</span></div>}
    </section>
    <footer className="studio-footer"><span>© {new Date().getFullYear()} <a href="https://Bexyzo.betoo.co.in" target="_blank" rel="noreferrer">Bexyzo.betoo.co.in</a></span><span>GLB · FBX · SVG · VTK · GLSL</span></footer>
  </main>;
};

FileUpload.propTypes = {
  fileData: PropTypes.func.isRequired,
};

export default FileUpload;
