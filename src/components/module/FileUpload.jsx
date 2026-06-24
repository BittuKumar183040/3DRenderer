import { toast, ToastContainer } from "react-toastify";
import { PiVectorThreeDuotone } from "react-icons/pi";
import { TbUpload } from "react-icons/tb";

import frameModel from "../../assets/frame.glb";
import frame from "./images/frame.png";
import chargerModel from "../../assets/charger.glb";
import charger from "./images/charger.png";
import girlModel from "../../assets/girl.fbx";
import girl from "./images/girl.png";
import dna from "../../assets/dna.svg";
import cell from "../../assets/vtkSampleFiles/breakPaddle.vtk?raw";
import breakPaddle from "./images/breakpaddlevtk.png";

const fileSupported = ["glb", "gltf", "fbx", "svg", "vtk"];

const DEMO_MODELS = [
  { key: "frame", label: "Frame", ext: "GLB", img: frame, alt: "Frame model" },
  { key: "charger", label: "Charger", ext: "GLB", img: charger, alt: "Charger model" },
  { key: "girl", label: "Girl", ext: "FBX", img: girl, alt: "Girl model" },
  { key: "dna", label: "DNA", ext: "SVG", img: dna, alt: "DNA molecule" },
  { key: "break", label: "Break paddle", ext: "VTK", img: breakPaddle, alt: "Break paddle" },
];

const FileUpload = ({ fileData }) => {
  const sendBack = (file) => {
    const name = file.name.split(".").slice(0, -1).join(".");
    const extension = file.name.split(".").pop();
    fileSupported.includes(extension)
      ? fileData({ file, name, extension })
      : toast.error("Not a valid file.");
  };

  const byChoose = (e) => {
    e.preventDefault();
    sendBack(e.target.files[0]);
  };
  const byDrop = (e) => {
    e.preventDefault();
    sendBack(e.dataTransfer.files[0]);
  };

  const simulateFileUpload = async () => {
    try {
      const response = await fetch(dna);
      const blob = await response.blob();
      const file = new File([blob], "sample.svg", { type: "image/svg+xml" });
      fileData({ file, name: "sample", extension: "svg" });
    } catch {
      toast.error("Error loading DNA file.");
    }
  };

  const handleDefaultPick = (key) => {
    const map = {
      frame: () =>
        fileData({ file: frameModel, name: "frame", extension: "glb" }),
      charger: () =>
        fileData({ file: chargerModel, name: "charger", extension: "glb" }),
      girl: () => fileData({ file: girlModel, name: "girl", extension: "fbx" }),
      break: () => fileData({ file: cell, name: "break", extension: "vtk" }),
      dna: simulateFileUpload,
    };
    (
      map[key] ??
      (() => toast.error("Having an issue with this file, choose another."))
    )();
  };

  return (
    <>
      <ToastContainer />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl animate-fade-slide-up">
          <div
            className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 flex flex-col items-center gap-3 text-center transition-colors hover:border-gray-400 overflow-hidden group"
            onDrop={byDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <PiVectorThreeDuotone size={64} className="text-gray-400 animate-pulse opacity-60" />

            <p className="text-base text-gray-700 font-medium">
              Drop your 3D file here
            </p>
            <p className="text-sm text-gray-400">
              GLB · GLTF · FBX · SVG · VTK
            </p>

            <button className="mt-1 flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
              <TbUpload size={16} />
              Browse computer
            </button>

            <input
              type="file"
              accept={`.${fileSupported.join(",.")}`}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={byChoose}
            />
          </div>

          <div className="mt-6">
            <p className="text-xs text-gray-400 text-center mb-3 tracking-wide uppercase">
              Demo models
            </p>

            <div className="flex gap-3 justify-center flex-wrap">
              {DEMO_MODELS.map(({ key, label, ext, img, alt }, i) => (
                <button
                  key={key}
                  onClick={() => handleDefaultPick(key)}
                  className="relative w-32 shrink-0 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-200 bg-white group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="absolute -top-1.5 -left-1.5 z-10 text-xs font-medium bg-red-300 text-red-900 px-1.5 py-0.5 rounded">
                    {ext}
                  </span>
                  <img
                    src={img}
                    alt={alt}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="py-1.5 text-center text-xs text-gray-500 bg-white rounded-lg">
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FileUpload;
