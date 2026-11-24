import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LoaderCircle } from 'lucide-react';
import PreFile from './components/major/PreFile';
import ViewerBrand from '../shell/ViewerBrand';

const VTK = ({ file, onExit }) => {
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

    if (data.length > 0) return <PreFile allData={data} onExit={onExit} />;

    return (
        <div className="studio-shell vtk-workspace vtk-empty">
            <div className="studio-topbar">
                <div className="studio-topbar-left">
                    <ViewerBrand title={file?.name || 'VTK dataset'} extension="vtk" onExit={onExit} />
                </div>
            </div>
            <div className="vtk-empty-note">
                <LoaderCircle className="loading-spin" size={17} /> Reading dataset…
            </div>
        </div>
    );
};

VTK.propTypes = {
    file: PropTypes.shape({
        file: PropTypes.oneOfType([PropTypes.instanceOf(File), PropTypes.string]),
        name: PropTypes.string,
    }),
    onExit: PropTypes.func.isRequired,
};

export default VTK;
