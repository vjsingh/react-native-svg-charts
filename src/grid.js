import React from 'react'
import PropTypes from 'prop-types'
import { Svg } from 'expo'

const Horizontal = ({ ticks = [], y, svg }) => {
    return (
        <Svg.G>
            {
                ticks.map(tick => (
                    <Svg.Line
                        key={ tick }
                        x1={ '0%' }
                        x2={ '100%' }
                        y1={ y(tick) }
                        y2={ y(tick) }
                        strokeWidth={ 1 }
                        stroke={ 'rgba(0,0,0,0.2)' }
                        { ...svg }
                    />
                ))
            }
        </Svg.G>
    )
}

const Vertical = ({ ticks = [], x, svg }) => {
    return (
        <Svg.G>
            {
                ticks.map((tick, index) => (
                    <Svg.Line
                        key={ index }
                        y1={ '0%' }
                        y2={ '100%' }
                        x1={ x(tick) }
                        x2={ x(tick) }
                        strokeWidth={ 1 }
                        stroke={ 'rgba(0,0,0,0.2)' }
                        { ...svg }
                    />
                ))

            }
        </Svg.G>
    )
}

const Both = (props) => {
    return (
        <Svg.G>
            <Horizontal { ...props }/>
            <Vertical { ...props }/>
        </Svg.G>
    )
}

Vertical.propTypes = {
    x: PropTypes.func,
    dataPoints: PropTypes.array,
    svg: PropTypes.object,
}

Horizontal.propTypes = {
    y: PropTypes.func,
    ticks: PropTypes.array,
}

Both.propTypes = {
    ...Vertical.propTypes,
    ...Horizontal.propTypes,
}

const Direction = {
    VERTICAL: 'VERTICAL',
    HORIZONTAL: 'HORIZONTAL',
    BOTH: 'BOTH',
}

const Grid = ({ direction, ...props }) => {
    if (direction === Direction.VERTICAL) {
        return <Vertical { ...props } />
    } else if (direction === Direction.HORIZONTAL) {
        return <Horizontal { ...props } />
    } else if (direction === Direction.BOTH) {
        return <Both { ...props } />
    }

    return null
}

Grid.Direction = Direction

Grid.propTypes = {
    direction: PropTypes.oneOf(Object.values(Direction)),
    belowChart: PropTypes.bool,
    svg: PropTypes.object,
}

Grid.defaultProps = {
    direction: Direction.HORIZONTAL,
    belowChart: true,
}

export default Grid
