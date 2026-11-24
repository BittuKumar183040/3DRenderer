import UploadIcon from './asset/upload.png'
import toast, { Toaster } from 'react-hot-toast';

const FileUpload = ({vtkFileData}) => {
    const sendBack=(files)=>{
        let isValid=true
        for (const file of files) {
            if(file.name.split(".").pop()!=='vtk'){
                isValid=false;
            }
        }
        isValid?vtkFileData(files):toast.error("Not a valid file.")
    }

    const byChoose=(e)=>{
        e.preventDefault();
        sendBack(e.target.files)
    }
    const byDrop=(e)=>{
        e.preventDefault();
        sendBack(e.dataTransfer.files)
    }
  return (<div className='relative h-dvh w-full'>
    <Toaster/>
    <div
        className='absolute w-fit top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-200 rounded-lg shadow-2xl p-4 flex flex-col justify-center items-center overflow-hidden outline outline-8 outline-gray-300'
    >
        <img className="h-20 opacity-70" src={UploadIcon}/>
        <input type='file' 
            title="Choose VTK file"
            className='absolute left-0 top-0 bg-slate-700 w-full h-full opacity-0 cursor-pointer'
            accept='.vtk'
            onChange={byChoose}
            multiple 
            onDrop={byDrop}/>
        <h4 className='pt-4 text-md font-bold text-gray-700'>Select or Drop the VTK</h4>  
    </div>
    <div className='absolute left-4 bottom-4'>
      <a className='p-2 px-8 bg-gray-200 shadow-md rounded-md' href="https://github.com/BittuKumar183040/modelRenderer/tree/main/SampleFiles">Sample Files</a>
    </div>
  </div>
  )
}


export default FileUpload

