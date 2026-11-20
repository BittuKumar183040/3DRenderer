import { useEffect, useState } from 'react';
import PreFile from './components/major/PreFile';

const VTK = ({ file }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!file) { setData([]); return; }
        // Bundled samples wrap their text in file.file; browser uploads are File objects.
        const source = file.file ?? file;
        const makeRecord = (text, sourceName) => {
            if (typeof text !== 'string') {
                console.error('VTK data must be text.', source);
                setData([]);
                return;
            }
            setData([{
                visible: true,
                id: sourceName,
                Name: sourceName,
                Size: 10,
                Type: 'Unstructured Grid',
                Cells: '',
                Points: '',
                Min: null,
                Max: null,
                Data: text,
            }]);
        };

        if (source instanceof File) {
            const reader = new FileReader();
            reader.onload = (event) => makeRecord(String(event.target.result ?? ''), source.name);
            reader.onerror = () => setData([]);
            reader.readAsText(source);
        } else {
            const text = typeof source === 'string' ? source : source?.file;
            const name = source?.name ?? `${file.name ?? 'vtk-model'}.vtk`;
            makeRecord(text, name);
        }
    }, [file]);

    return data.length > 0 ? <PreFile allData={data} /> : null;
};

export default VTK;
