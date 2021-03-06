import * as array from 'd3-array'
import * as scale from 'd3-scale'
import * as shape from 'd3-shape'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { View } from 'react-native'
import { Svg }  from 'expo'
import Path from './animated-path'

const CORNER_RADIUS = 4;

class BarChart extends PureComponent {
    static extractDataPoints(data, keys, order = shape.stackOrderNone, offset = shape.stackOffsetNone) {
        const series = shape
            .stack()
            .keys(keys)
            .order(order)
            .offset(offset)(data)

        //double merge arrays to extract just the values
        return array.merge(array.merge(series))
    }

    state = {
        width: 0,
        height: 0,
    }

    _onLayout(event) {
        const { nativeEvent: { layout: { height, width } } } = event
        this.setState({ height, width })
    }

    calcXScale(domain) {
        const { data } = this.props

        const { horizontal, contentInset: { left = 0, right = 0 }, spacingInner, spacingOuter } = this.props

        const { width } = this.state

        if (horizontal) {
            return scale
                .scaleLinear()
                .domain(domain)
                .range([ left, width - right ])
        }

        // use index as domain identifier instead of value since
        // domain must be same length as number of bars
        // same value can occur at several places in data
        return scale
            .scaleBand()
            .domain(data.map((_, index) => index))
            .range([ left, width - right ])
            .paddingInner([ spacingInner ])
            .paddingOuter([ spacingOuter ])
    }

    calcYScale(domain) {
        const { data } = this.props

        const { horizontal, contentInset: { top = 0, bottom = 0 }, spacingInner, spacingOuter } = this.props

        const { height } = this.state

        if (horizontal) {
            return scale
                .scaleBand()
                .domain(data.map((_, index) => index))
                .range([ top, height - bottom ])
                .paddingInner([ spacingInner ])
                .paddingOuter([ spacingOuter ])
        }

        return scale
            .scaleLinear()
            .domain(domain)
            .range([ height - bottom, top ])
    }


    makeCorner(x, y) {
      return `a${CORNER_RADIUS},${CORNER_RADIUS} 0 0 1 ${x * CORNER_RADIUS},${y * CORNER_RADIUS}`;
    }

    makeRoundedBar(xLeft, xRight, yBottom, yTop, dontRoundBottom, dontRoundTop, dontRoundLeft, dontRoundRight) {
      let topRightRound = ' h-' + CORNER_RADIUS + ' ' + this.makeCorner(1, 1);
      let bottomRightRound = ' v-' + CORNER_RADIUS + ' ' + this.makeCorner(-1, 1);
      let bottomLeftRound = ' h' + CORNER_RADIUS + ' ' + this.makeCorner(-1, -1);
      let topLeftRound = ' v' + CORNER_RADIUS + ' ' + this.makeCorner(1, -1);

      if (dontRoundTop) {
        topRightRound = '';
        topLeftRound = '';
      }
      if (dontRoundBottom) {
        bottomRightRound = '';
        bottomLeftRound = '';
      }
      if (dontRoundLeft) {
        bottomLeftRound = '';
        topLeftRound = '';
      }
      if (dontRoundRight) {
        bottomRightRound = '';
        topRightRound = '';
      }

      return 'M' + (xLeft + CORNER_RADIUS) + ',' + yTop +  // Start at top-left
        ' L' + xRight + ',' + yTop +  // Go to top-right
        topRightRound +  // round clockwise corner
        ' L' + xRight + ',' + yBottom +  // Go to bottom-right
        bottomRightRound +  // round clockwise corner
        ' L' + xLeft + ',' + yBottom +  // Go to bottom-left
        bottomLeftRound +  // round clockwise corner
        ' L' + xLeft + ',' + yTop +  // Go to top-left
        topLeftRound +  // round clockwise corner
        ' z';  // Return
    }

    calcAreas(x, y, series, roundBottom, roundTop) {
        const { horizontal, colors, specificColors, keys } = this.props

        if (horizontal) {
            return array.merge(
                series.map((serie, keyIndex) => {
                    return serie.map((entry, entryIndex) => {
                        let path = shape
                            .area()
                            .x0(d => x(d[0]))
                            .x1(d => x(d[1]))
                            .y((d, _index) => (_index === 0 ? y(entryIndex) : y(entryIndex) + y.bandwidth()))
                            .defined(d => !isNaN(d[0]) && !isNaN(d[1]))([ entry, entry ])

                        const xLeft= x(entry[0]);
                        const xRight= x(entry[1]);
                        const yTop = y(entryIndex);
                        const yBottom = y(entryIndex) + y.bandwidth();

                        // Return line on '0' value for the bar
                        if (xLeft === xRight) {
                          const HEIGHT_OF_BAR = 2;
                          const topOfBar = yBottom + HEIGHT_OF_BAR;
                          path = 'M' + xLeft + ',' + topOfBar +  // Start at top-left
                            ' L' + xRight + ',' + topOfBar +  // go to top-right
                            ' v-' + HEIGHT_OF_BAR +  // Go down one pixel
                            ' L' + xLeft + ',' + yBottom +  // go to bottom-left
                            ' z';  // Return
                        } else {
                          // Only round the top of the top bar
                          const numOfBars = series.length
                          if (numOfBars === 1) {
                            path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, false, false, true);
                          } else {
                            if (keyIndex < numOfBars - 1) {
                              path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop);
                            } else {
                              path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, false, false, true);
                            }
                          }

                          /*
                          // If only one bar, round both bottom and top
                          const numOfBars = series.length
                          if (series.length === 1) {
                            path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop);

                          /*
                          // Otherwise, if multiple bars, only round the bottom of the first bar and the
                          // top of the last bar
                          } else if (series.length > 1) {
                            if (keyIndex === 0) {
                              path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, false, false, false, true);
                            } else if (keyIndex === numOfBars - 1) {
                              path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, false, false, true);
                            }
                          }
                          */
                        }

                        return {
                            path,
                            color: colors[keyIndex],
                            key: keys[keyIndex],
                        }
                    })
                })
            )
        }

        return array.merge(
            series.map((serie, keyIndex) => {
                return serie.map((entry, entryIndex) => {
                    let color;
                    if (specificColors) {
                        color = specificColors(entryIndex, keyIndex);
                    } else {
                        color = colors[keyIndex];
                    }
                    let path = shape
                        .area()
                        .y0(d => y(d[0]))
                        .y1(d => y(d[1]))
                    .x((d, _index) => { return (_index === 0 ? x(entryIndex) : x(entryIndex) + x.bandwidth())})
                        .defined(d => !isNaN(d[0]) && !isNaN(d[1]))([ entry, entry ])

                    const xLeft = x(entryIndex);
                    const xRight = x(entryIndex) + x.bandwidth();
                    const yTop= y(entry[1]);
                    const yBottom= y(entry[0]);

                    // Determine whether this is the last bar with any value
                    // entry[1] is the current value, and the second term gets the end of the series value
                  const isLastBar = entry[1] === series[series.length -1][entryIndex][1];

                    // Return line on '0' value for the bar
                    if (yTop === yBottom) {
                      let HEIGHT_OF_BAR = 2;
                      if (this.props.dontShowZeroBars) {
                        HEIGHT_OF_BAR = 0;
                        // color = 'white';
                      }
                      const topOfBar = yBottom + HEIGHT_OF_BAR;
                      path = 'M' + xLeft + ',' + topOfBar +  // Start at top-left
                        ' L' + xRight + ',' + topOfBar +  // go to top-right
                        ' v-' + HEIGHT_OF_BAR +  // Go down one pixel
                        ' L' + xLeft + ',' + yBottom +  // go to bottom-left
                        ' z';  // Return
                    } else {
                        if (roundTop || roundBottom) {
                          console.log(entry[1]);
                          console.log(isLastBar);
                          // Only round the top of the top bar
                          if (isLastBar) {
                            // Round only the top.
                            path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, true);
                          } else {
                            // Round none.
                            path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, true, true, true, true);
                          }
                          /*
                          const numOfBars = series.length
                          if (numOfBars === 1) {
                            path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, true);
                          } else {
                            if (keyIndex < numOfBars - 1) {
                              path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, true, true, true, true);
                            } else {
                              path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, true);
                            }
                          }
                          */

                          /*

                          // If only one bar, round both bottom and top
                          const numOfBars = series.length
                          if (series.length === 1) {
                            path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, !roundBottom, !roundTop);

                          // Otherwise, if multiple bars, only round the bottom of the first bar and the
                          // top of the last bar
                          } else if (series.length > 1) {
                            if (keyIndex === 0 && roundBottom) {
                              path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, false, true);
                            } else if (keyIndex === numOfBars - 1 && roundTop) {
                              path = this.makeRoundedBar(xLeft, xRight, yBottom, yTop, true);
                            }
                          }
                          */
                      }
                    }

                    return {
                        path,
                        color,
                        key: keys[keyIndex],
                    }
                })
            })
        )
    }

    calcIndexes() {
        const { data } = this.props
        return data.map((_, index) => index)
    }

    render() {
        const {
            data,
            keys,
            order,
            offset,
            animate,
            animationDuration,
            style,
            numberOfTicks,
            gridMax,
            gridMin,
            children,
            horizontal,
            valueAccessor,
            roundBottom,
            roundTop,
        } = this.props

        const { height, width } = this.state

        if (data.length === 0) {
            return <View style={ style } />
        }

        const series = shape
            .stack()
            .keys(keys)
            .value((item, key) => valueAccessor({ item, key }))
            .order(order)
            .offset(offset)(data)

        //double merge arrays to extract just the values
        const values = array.merge(array.merge(series))
        const indexes = values.map((_, index) => index)

        const extent = array.extent([ ...values, gridMin, gridMax ])
        const ticks = array.ticks(extent[0], extent[1], numberOfTicks)

        const xDomain = horizontal ? extent : indexes
        const yDomain = horizontal ? indexes : extent

        const x = this.calcXScale(xDomain)
        const y = this.calcYScale(yDomain)

        const areas = this.calcAreas(x, y, series, roundBottom, roundTop)

        const extraProps = {
            x,
            y,
            width,
            height,
            ticks,
            data,
        }

        return (
            <View style={ style }>
                <View style={{ flex: 1 }} onLayout={ event => this._onLayout(event) }>
                    {
                        height > 0 && width > 0 &&
                        <Svg style={{ height, width }}>
                            {
                                React.Children.map(children, child => {
                                    if (child && child.props.belowChart) {
                                        return React.cloneElement(child, extraProps)
                                    }
                                    return null
                                })
                            }
                            {
                                areas.map((bar, index) => {
                                    const keyIndex = index % data.length
                                    const key = `${keyIndex}-${bar.key}`
                                    const { svg } = data[ keyIndex ][ bar.key ]

                                    return (
                                        <Path
                                            key={ key }
                                            fill={ bar.color }
                                            { ...svg }
                                            d={ bar.path }
                                            animate={ animate }
                                            animationDuration={ animationDuration }
                                        />
                                    )
                                })
                            }
                            {
                                React.Children.map(children, child => {
                                    if (child && !child.props.belowChart) {
                                        return React.cloneElement(child, extraProps)
                                    }
                                    return null
                                })
                            }
                        </Svg>
                    }
                </View>
            </View>
        )
    }
}

BarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    keys: PropTypes.arrayOf(PropTypes.string).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    specificColors: PropTypes.func,
    offset: PropTypes.func,
    order: PropTypes.func,
    style: PropTypes.any,
    spacingInner: PropTypes.number,
    spacingOuter: PropTypes.number,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    contentInset: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
    }),
    gridMin: PropTypes.number,
    gridMax: PropTypes.number,
    valueAccessor: PropTypes.func,
    roundBottom: PropTypes.bool,
    roundTop: PropTypes.bool,
    dontShowZeroBars: PropTypes.bool,
}

BarChart.defaultProps = {
    spacingInner: 0.05,
    spacingOuter: 0.05,
    offset: shape.stackOffsetNone,
    order: shape.stackOrderNone,
    width: 100,
    height: 100,
    showZeroAxis: true,
    contentInset: {},
    numberOfTicks: 10,
    showGrid: true,
    valueAccessor: ({ item, key }) => item[key],
    roundBottom: true,
    roundTop: true,
}

export default BarChart
