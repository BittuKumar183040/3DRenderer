import { toast, ToastContainer } from 'react-toastify'
import { PiVectorThreeDuotone } from "react-icons/pi";

import frameModel from '../../assets/frame.glb'
import frame from './images/frame.png'

import chargerModel from '../../assets/charger.glb'
import charger from './images/charger.png'

import girlModel from '../../assets/girl.fbx'
import girl from './images/girl.png'

import dna from '../../assets/dna.svg'

const fileSupported = ["glb", "gltf", "fbx", "svg"]
const FileUpload = ({ fileData }) => {
    const sendBack = (file) => {
        const fileInfo = file.name
        const name = fileInfo.split(".").slice(0, -1).join(".")
        const extension = fileInfo.split(".").pop()
        fileSupported.includes(extension) ? fileData({ file, name, extension }) : toast.error("Not a valid file.")
    }

    const byChoose = (e) => {
        e.preventDefault();
        sendBack(e.target.files[0])
    }
    const byDrop = (e) => {
        e.preventDefault();
        sendBack(e.dataTransfer.files[0])
    }

    const simulateFileUpload = async () => {
        try {
            const response = await fetch(dna);
            const blob = await response.blob(); // Convert response to Blob
            const file = new File([blob], "sample.svg", { type: "image/svg+xml" });
            fileData({ file, name: "sample", extension: "svg" });
        } catch (error) {
            console.error("Error fetching SVG file:", error);
        }
    }

    const handleDefaultPick = (e) => {

        switch (e.target.getAttribute("name")) {
            case "frame":
                fileData({ file: frameModel, name: e.target.getAttribute("name"), extension: "glb" })
                break;
            case "charger":
                fileData({ file: chargerModel, name: e.target.getAttribute("name"), extension: "glb" })
                break;
            case "girl":
                fileData({ file: girlModel, name: e.target.getAttribute("name"), extension: "fbx" })
                break;
            case "dna":
                simulateFileUpload();
                break;
            default:
                toast.error("Having issue in this File, Choose Other...")
        }
    }

    return (<>
        <ToastContainer />
        <div
            className='absolute md:w-1/2 w-5/6 max-w-[600px] top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-800
                bg-white rounded-lg shadow-2xl p-4 flex flex-col gap-4 justify-center items-center'
        >
            <PiVectorThreeDuotone size={80} className=' opacity-50 ' />
            <p className=' text-sm tracking-wide'>Please upload the 3d file to visualize.</p>
            <p className=' p-2 px-6 border-2 border-gray-400 rounded-md'>Browse computer</p>
            <input type='file'
                title="Choose file"
                accept={`.${fileSupported.join(",.")}`}
                className='absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer'
                onChange={byChoose}
                onDrop={byDrop} />
            <h4 className='pt-4 text-sm font-semibold text-gray-700'>* You can upload GLB, GLTF, FBX and SVG</h4>

            <div className=' absolute -bottom-40 w-96 bg-white bg-opacity-70 rounded-lg select-none p-3'>
                <p className=' text-sm text-center mb-3'>Demo Models</p>
                <div className=' flex justify-between'>
                    <div onClick={handleDefaultPick} name="frame" className=' relative h-20 w-20 bg-slate-200 rounded-md cursor-pointer active:scale-90 transition-transform'>
                        <p className=' absolute -top-1 -left-1 bg-red-300 px-2 shadow-md rounded-md text-white text-sm tracking-wider pointer-events-none '>GLB</p>
                        <img src={frame} alt="frame" className=' pointer-events-none' />
                    </div>
                    <div onClick={handleDefaultPick} name="charger" className=' relative h-20 w-20 bg-slate-200 rounded-md cursor-pointer active:scale-90 transition-transform'>
                        <p className=' absolute -top-1 -left-1 bg-red-300 px-2 shadow-md rounded-md text-white text-sm tracking-wider pointer-events-none '>GLB</p>
                        <img src={charger} alt="charger" className=' pointer-events-none' />
                    </div>
                    <div onClick={handleDefaultPick} name="girl" className=' relative h-20 w-20 bg-slate-200 rounded-md cursor-pointer active:scale-90 transition-transform'>
                        <p className=' absolute -top-1 -left-1 bg-red-300 px-2 shadow-md rounded-md text-white text-sm tracking-wider pointer-events-none '>FBX</p>
                        <img src={girl} alt="girl" className=' pointer-events-none' />
                    </div>
                    <div onClick={handleDefaultPick} name="dna" className=' relative h-20 w-20 bg-slate-200 rounded-md cursor-pointer active:scale-90 transition-transform'>
                        <p className=' absolute -top-1 -left-1 bg-red-300 px-2 shadow-md rounded-md text-white text-sm tracking-wider pointer-events-none '>SVG</p>
                        <img src={dna} alt="girl" className=' pointer-events-none' />
                    </div>
                </div>
            </div>
        </div>
    </>
    )
}

export default FileUpload