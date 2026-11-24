import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { BiDownArrow, BiUpArrow } from 'react-icons/bi'

const GUI = ({ changesMade, metaData }) => {
    const [active, setActive] = useState('surface')
    const [pointSize, setPointSize] = useState(0)
    const [showInfo, setShowInfo] = useState(false)
    const [showProp, setShowProp] = useState(true)
    const info = {
        Name: metaData.Name,
        Size: metaData.Size,
        Type: metaData.Type,
        Cells: metaData.Cells,
        Points: metaData.Points,
        Min: metaData.Min,
        Max: metaData.Max,
    }

    const guiChanges = (e) => changesMade(e)

    const viewOptions = (e) => {
        setActive(e.target.value)
        guiChanges([e.target.value])
    }

    const pointSizeChange = (e) => {
        setPointSize(e.target.value)
        guiChanges(['points', e.target.value])
    }

    return (
        <div className="vtk-gui">
            <section className="vtk-group">
                <button
                    type="button"
                    className="vtk-group-head"
                    onClick={() => setShowProp(!showProp)}
                    aria-expanded={showProp}
                >
                    <span>Properties</span>
                    {showProp ? <BiUpArrow aria-hidden="true" /> : <BiDownArrow aria-hidden="true" />}
                </button>
                {showProp && (
                    <div className="vtk-group-body">
                        <label className="vtk-field">
                            <span>Coloring</span>
                            <select defaultValue="displacement" onChange={(e) => guiChanges([e.target.value])}>
                                <option value="displacement">{metaData.scalerType || 'Displacement'}</option>
                                <option value="solid_color">Solid Color</option>
                            </select>
                        </label>
                        <label className="vtk-field">
                            <span>Representation</span>
                            <select defaultValue="surface" onChange={viewOptions}>
                                <option value="surface">Surface</option>
                                <option value="points">Points</option>
                                <option value="wireframe">Wireframe</option>
                                <option value="surface_with_edges">Surface With Edges</option>
                            </select>
                        </label>
                        {active === 'points' && (
                            <label className="vtk-field vtk-field-inline">
                                <span>Point size</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={pointSize}
                                    onChange={pointSizeChange}
                                />
                            </label>
                        )}
                    </div>
                )}
            </section>

            <section className="vtk-group">
                <button
                    type="button"
                    className="vtk-group-head"
                    onClick={() => setShowInfo(!showInfo)}
                    aria-expanded={showInfo}
                >
                    <span>Information</span>
                    {showInfo ? <BiUpArrow aria-hidden="true" /> : <BiDownArrow aria-hidden="true" />}
                </button>
                {showInfo && (
                    <dl className="vtk-info-list">
                        {Object.keys(info).map((key) => (
                            <div key={key}>
                                <dt>{key}</dt>
                                <dd>{info[key] ?? '—'}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </section>
        </div>
    )
}

GUI.propTypes = {
    changesMade: PropTypes.func.isRequired,
    metaData: PropTypes.object.isRequired,
}

export default React.memo(GUI)
