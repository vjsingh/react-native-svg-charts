import React from 'react'
import { Svg } from 'expo'

const Extra = ({ children, ...props }) => {
    return (
        <Svg.G>
            {
                React.Children.map(children, child => {
                    return React.cloneElement(child, props)
                })
            }
        </Svg.G>
    )
}

export default Extra
