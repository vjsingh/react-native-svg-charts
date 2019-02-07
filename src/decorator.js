import React from 'react'
import { Svg } from 'expo'

const Decorator = ({ children, data, ...props }) => {
    return (
        <Svg.G>
            {
                React.Children.map(children, child => {
                    return data.map((value, index) => React.cloneElement(child, { value, index, ...props }))
                })
            }
        </Svg.G>
    )
}

export default Decorator
