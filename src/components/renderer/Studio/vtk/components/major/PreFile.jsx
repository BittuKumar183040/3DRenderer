import PropTypes from 'prop-types'
import VtkRendering from '../../VtkRendering'


const PreFile = ({allData, onExit}) => {
    return <VtkRendering vtkData={allData[0]} onExit={onExit} />
}

PreFile.propTypes = {
    allData: PropTypes.array.isRequired,
    onExit: PropTypes.func.isRequired,
}

export default PreFile
