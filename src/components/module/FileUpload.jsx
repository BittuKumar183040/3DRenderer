import { toast, ToastContainer } from 'react-toastify'
import { PiVectorThreeDuotone } from "react-icons/pi";

const FileUpload = ({ fileData }) => {
    const sendBack = (file) => {
        let isValid = true
        let extension = file.name.split(".").pop()
        isValid ? fileData({ file, name: file.name, extension }) : toast.error("Not a valid file.")
    }

    const byChoose = (e) => {
        e.preventDefault();
        sendBack(e.target.files[0])
    }
    const byDrop = (e) => {
        e.preventDefault();
        sendBack(e.dataTransfer.files[0])
    }
    return (<>
        <ToastContainer />
        <div
            className='absolute md:w-1/2 w-5/6 max-w-[600px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-800
                bg-white rounded-lg shadow-2xl p-4 flex flex-col gap-4 justify-center items-center overflow-hidden'
        >
            <PiVectorThreeDuotone size={80} className=' opacity-50 ' />
            <p className=' text-sm tracking-wide'>Please upload the 3d file to visulize.</p>
            <p className=' p-2 px-6 border-2 border-gray-400 rounded-md'>Browse computer</p>
            <input type='file'
                title="Choose file"
                className='absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer'
                // accept='.vtk'
                onChange={byChoose}
                onDrop={byDrop} />
            <h4 className='pt-4 text-sm font-semibold text-gray-700'>* You can upload GLB, GLTF, FBX</h4>
        </div>
    </>
    )
}

export default FileUpload