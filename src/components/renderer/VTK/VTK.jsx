import { useEffect, useState } from 'react';
import PreFile from './components/major/PreFile';
import { useDispatch, useSelector } from 'react-redux';
import { setInitial } from './components/redux/vtksSlice';
import { current } from '@reduxjs/toolkit';

const VTK = ({ file }) => {
    const [data, setData] = useState([]);
    const dispatch = useDispatch()


    const vtkFileData = (file) => {
        if (file) {
            const fileContents = file.file;
            console.log(fileContents, file)
            if (file instanceof File) {
                const reader = new FileReader();

                reader.onload = (event) => {
                    const content = event.target.result;
                    console.log("File content:", content);
                    const disc = {
                        visible: true,
                        id: file.name,
                        Name: file.name,
                        Size: 10,
                        Type: "Unstructured Grid",
                        Cells: "",
                        Points: "",
                        Min: null,
                        Max: null,
                        Data: content
                    }
                    setData(disc);
                };
                reader.onerror = (err) => {
                    console.error("File read error", err);
                };
                reader.readAsText(file);
            } else {
                console.log(fileContents)

                const disc = {
                    visible: true,
                    id: file.name,
                    Name: `${file.name}${file.extension}`,
                    Size: 10,
                    Type: "Unstructured Grid",
                    Cells: "",
                    Points: "",
                    Min: null,
                    Max: null,
                    Data: fileContents
                }
                console.log(disc)
                setData([disc])
            }
        }
        else {
            console.log("No file found")
        }
    }

    useEffect(() => {
        console.log(file)
        file && vtkFileData(file)
    }, [])

    return (
        <>
            {data.length > 0 && <PreFile allData={data} />}
        </>
    )
}

export default VTK