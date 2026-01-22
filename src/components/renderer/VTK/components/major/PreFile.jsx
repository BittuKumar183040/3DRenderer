import React, {useEffect, useState} from 'react'
import VtkRendering from '../../VtkRendering'
import Timeline from '../Timeline/Timeline'


const PreFile = ({allData}) => {
    console.log(allData)
    return (
        <>
            <VtkRendering vtkData={allData[0]}/>
        </>

    )
}

export default PreFile