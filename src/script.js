import * as d3 from "@types/d3";
import * as topojson from "@types/topojson";


const educationUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const geoUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

document.addEventListener("DOMContentLoaded", function () {
    Promise.all([d3.json(educationUrl), d3.json(geoUrl)]).then(setData)
});


const h = 600, w = 960;

d3.select('.container')
    .append('svg')
    .attr('width', w)
    .attr('height', h);

/**
 * Api Education object from FCC
 * @typedef {Object} Education
 * @property {String} area_name         - County Name
 * @property {Number} bachelorsOrHigher - Percentage of adults age 25 and older with a bachelor's degree or higher
 * @property {Number} fips              - county Id
 * @property {String} state             - State code (two letter)
 */


/**
 *
 * @param {[Education]} educationData
 * @param {UsAtlas} topology
 */
function setData([educationData, topology]) {

    const path = d3.geoPath();

    /**
     *
     * @type {Map<String,Education>}
     * @property {Number} min
     * @property {Number} max
     */
    const map = educationData.reduce((acc, x) => {
        acc[x.fips] = x;
        acc["min"] = Math.min(x.bachelorsOrHigher, acc["min"]);
        acc["max"] = Math.max(x.bachelorsOrHigher, acc["max"]);
        return acc
    }, {min: 100, max: 0});


    const counties = topojson.feature(topology, topology.objects.counties);
    // const states = topojson.feature(topology, topology.objects.states);

    const colors = d3.schemeGreens[8];
    const colorScale = d3.scaleThreshold().domain(d3.range(map.min, map.max, 9)).range(colors);

    const tooltip = d3.select('#tooltip');

    d3.select('svg').call(svg => {


        svg.selectAll('path')
            .data(counties.features)
            .enter()
            .append('path')
            .attr("d", path)
            .attr('data-fips', d => d.id)
            .attr('data-education', d => map[d.id].bachelorsOrHigher)
            .attr('class', "county")
            .style('fill', d => colorScale(map[d.id].bachelorsOrHigher))
            .on('mouseover', (county) => {

                /**
                 * @type {Education}
                 */
                const d = map[county.id];
                const {pageX: x, pageY: y} = d3.event;
                tooltip.style("display", "inline-block");
                tooltip.style("left", `${x}px`);
                tooltip.html(`${d.area_name}, ${d.state}: ${d.bachelorsOrHigher}%`);
                tooltip.style("top", `${y}px`);
                tooltip.attr('data-education', d.bachelorsOrHigher);
            })
            .on('mouseout', () => {
                tooltip.style("display", "none");
            });
        //
        // svg.selectAll('path2')
        //     .data(states.features)
        //     .enter()
        //     .append('path')
        //     .attr("d", path)
        //     .attr('class', "state");

        svg.append("path")
            .attr("class", "state")
            .attr("d", path(topojson.mesh(topology, topology.objects.states, function(a, b) { return a !== b; })));


        svg.append('g')
            .attr("id", "legend")
            .attr('transform', `translate(${600},${30})`)
            .call((g) => {
                const width = 250;
                const height = 10;
                const min = map.min;
                const max = map.max;
                const step = (max - min) / colors.length;

                const range = d3.range(min, max, step).map(x => x);
                console.log(range);


                const legendScale = d3.scaleLinear()
                    .domain([min, max])
                    .range([0, width]);

                const values = range;
                const axis = d3.axisBottom(legendScale)
                    .tickSizeOuter(0)
                    .tickFormat(d3.format(".1f"))
                    .tickValues(range.slice(1))
                ;
                g.selectAll('rect')
                    .data(values)
                    .enter()
                    .append('rect')
                    .style('fill', d => colorScale(d + 0.1))
                    .attr('width', (x, i) => (legendScale(range[i + 1]) || width) - legendScale(x))
                    .attr('height', height)
                    .attr('x', x => legendScale(x))
                    .attr('y', 0)
                ;
                g.append('g')
                    .attr("transform", `translate(-0.5,${height})`)
                    .call(axis)
            });

    });


}
