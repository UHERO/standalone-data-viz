import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/* major_all.csv data dictionary
    degfield: numeric code for college major
    degfield_desc: college major
    fips: Census state fips code
    state_name: name of state
    est_inc: estimated income ***this is what I'm interested in plotting
    eb: empirical bayes estimate (ignore this)
    libarts_mean: average income of a liberal arts major (also ignore this)
*/

// Constants and configurations
const data_dir = "../data/";
const dimensions = {
    width: window.innerWidth * 0.6,
    height: window.innerWidth * 0.6 * 0.7,
    margin: { top: 10, right: 10, bottom: 10, left: 10 }
};
dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

// Data loading
async function loadData() {
    const dataset = await d3.csv(data_dir + "major_all.csv");
    const mapData = await d3.json(data_dir + "gz_2010_us_040_00_20m.json");
    return { dataset, mapData };
}

// Accessors
const stateNameAccessor = d => d.properties["NAME"];
const incomeAccessor = d => +d.est_inc;
const stateIncomesByDegreeAccessor = (dataset, degField) => {
    return dataset.reduce((acc, d) => {
        if (d.degfield_desc === degField) {
            acc[d.state_name] = +d.est_inc;
        }
        return acc;
    }, {});
};

// Utility functions
function formatNumber(num) {
    return Number(num).toFixed().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Main application
class App {
    constructor() {
        this.data = null;
        this.state = null; //current state viewed
        this.major = null; // current major viewed
        this.datasetParam = null; // current state I think, unclear
        this.svg = null;
        this.bounds = null;
        this.projection = null;
        this.geoGenerator = null;
        this.colorScale = null;
        this.zoom = null;
        this.tooltip = null;
        this.legend = null;
        this.legendBar = null;
        this.legendAxis = null;
        this.legendScale = null;
        this.stateView = null; // displayed on zoom
        this.wheel = null; // unclear
    }

    async initialize() {
        this.data = await loadData();
        this.datasetParam = [...new Set(this.data.dataset.map(d => d.degfield_desc))][0];
        this.setupDOM();
        this.setupScales();
        this.setupMap();
        this.setupStateView();
        // this.setupLegend();
        this.drawLegend()
        this.setupTooltip();
        this.setupDropdown();
        this.setupRankings();
        this.drawMap();
        this.updateLabel();
        this.listRankings();
    }

    setupDOM() {
        const wrapper = d3.select("#wrapper")
            .style("width", dimensions.width)
            .style("height", dimensions.height);

        this.svg = wrapper.append("svg")
            .attr("width", dimensions.boundedWidth)
            .attr("height", dimensions.boundedHeight)
            .attr("viewBox", [0, 0, dimensions.boundedWidth, dimensions.boundedHeight])
            .attr("id", "map");

        this.bounds = this.svg.append("g")
            .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`)
            .attr("cursor", "pointer");
    }

    setupScales() {
        this.projection = d3.geoAlbersUsa().fitSize([dimensions.boundedWidth, dimensions.boundedHeight], this.data.mapData);
        this.geoGenerator = d3.geoPath().projection(this.projection);
        this.colorScale = d3.scaleSequential([0, 100], d3.interpolateRdYlGn);
        // this.colorScale = d3.scaleLinear().range(["#FF6961", "#77DD77"]);
    }

    setupMap() {
        this.zoom = d3.zoom()
            .extent([[0, 0], [dimensions.width, dimensions.height]])
            .scaleExtent([1, 8])
            .translateExtent([[10, 10], [dimensions.boundedWidth, dimensions.boundedHeight]])
            .on("zoom", (event) => this.zoomed(event));
        this.svg.call(this.zoom);
        this.svg.on("click", () => this.reset());
    }

    setupStateView() {
        this.stateView = d3.select('#state-view')
    }

    drawLegend({
        title,
        tickSize = 6,
        width = 320,
        height = 44 + tickSize,
        marginTop = 18,
        marginRight = 0,
        marginBottom = 16 + tickSize,
        marginLeft = 0,
        ticks = width / 64,
        tickFormat,
        tickValues
    } = {}) {
        const color = d3.scaleSequential([0, 100], d3.interpolateRdYlGn)

        function ramp(color, n = 256) {
            const canvas = document.createElement("canvas");
            canvas.width = n;
            canvas.height = 1;
            const context = canvas.getContext("2d");
            for (let i = 0; i < n; ++i) {
                context.fillStyle = color(i / (n - 1));
                context.fillRect(i, 0, 1, 1);
            }
            return canvas;
        }

        // Caleb's code
        const svg = d3.select("#wrapper").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("overflow", "visible")
            .style("display", "block");



        let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
        let x;

        // Nathan's code
        this.legendBar = svg.append("line")
            .attr("class", "legend-bar")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        // Continuous
        if (color.interpolate) {
            const n = Math.min(color.domain().length, color.range().length);

            x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

            svg.append("image")
                .attr("x", marginLeft)
                .attr("y", marginTop)
                .attr("width", width - marginLeft - marginRight)
                .attr("height", height - marginTop - marginBottom)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
        }

        // Sequential
        else if (color.interpolator) {
            x = Object.assign(color.copy()
                .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
                { range() { return [marginLeft, width - marginRight]; } });

            svg.append("image")
                .attr("x", marginLeft)
                .attr("y", marginTop)
                .attr("width", width - marginLeft - marginRight)
                .attr("height", height - marginTop - marginBottom)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.interpolator()).toDataURL());

            // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
            if (!x.ticks) {
                if (tickValues === undefined) {
                    const n = Math.round(ticks + 1);
                    tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
                }
                if (typeof tickFormat !== "function") {
                    tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
                }
            }
        }

        // Threshold
        else if (color.invertExtent) {
            const thresholds
                = color.thresholds ? color.thresholds() // scaleQuantize
                    : color.quantiles ? color.quantiles() // scaleQuantile
                        : color.domain(); // scaleThreshold

            const thresholdFormat
                = tickFormat === undefined ? d => d
                    : typeof tickFormat === "string" ? d3.format(tickFormat)
                        : tickFormat;

            x = d3.scaleLinear()
                .domain([-1, color.range().length - 1])
                .rangeRound([marginLeft, width - marginRight]);

            svg.append("g")
                .selectAll("rect")
                .data(color.range())
                .join("rect")
                .attr("x", (d, i) => x(i - 1))
                .attr("y", marginTop)
                .attr("width", (d, i) => x(i) - x(i - 1))
                .attr("height", height - marginTop - marginBottom)
                .attr("fill", d => d);

            tickValues = d3.range(thresholds.length);
            tickFormat = i => thresholdFormat(thresholds[i], i);
        }

        // Ordinal
        else {
            x = d3.scaleBand()
                .domain(color.domain())
                .rangeRound([marginLeft, width - marginRight]);

            svg.append("g")
                .selectAll("rect")
                .data(color.domain())
                .join("rect")
                .attr("x", x)
                .attr("y", marginTop)
                .attr("width", Math.max(0, x.bandwidth() - 1))
                .attr("height", height - marginTop - marginBottom)
                .attr("fill", color);

            tickAdjust = () => { };
        }

        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x)
                .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
                .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
                .tickSize(tickSize)
                .tickValues(tickValues))
            .call(tickAdjust)
            .call(g => g.select(".domain").remove())
            .call(g => g.append("text")
                .attr("x", marginLeft)
                .attr("y", marginTop + marginBottom - height - 6)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .attr("class", "title")
                .text(title));

        this.legend = svg;
    }

    setupLegend() {
        const red = "#FF6961";
        const green = "#77DD77";
        const legendSvg = d3.select("#wrapper").append("svg")
            .attr("width", dimensions.width * 0.9 + 60)
            .attr("height", 60);

        dimensions.legendWidth = dimensions.width * 0.9;
        dimensions.legendHeight = 20;

        this.legend = legendSvg.append("g")
            .attr("transform", `translate(50, 15)`);

        // https://www.freshconsulting.com/insights/blog/d3-js-gradients-the-easy-way/
        const gradient = this.legend.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr('class', 'start')
            .attr("offset", "0%")
            .attr("stop-color", red)
            .attr("stop-opacity", 1);

        gradient.append("stop")
            .attr('class', 'end')
            .attr("offset", "100%")
            .attr("stop-color", green)
            .attr("stop-opacity", 1);

        this.legend.append("rect") // actual legend
            .attr("width", dimensions.legendWidth)
            .attr("height", dimensions.legendHeight)
            .attr("fill", "url(#legend-gradient)");


        const incomes = this.data.dataset
            .filter(d => d.degfield_desc === this.datasetParam)
            .map(d => +d.est_inc);

        const [minIncome, maxIncome] = d3.extent(incomes);

        this.legend.append("text") // text on the ends
            .attr("y", 35)
            .attr("text-anchor", "start")
            .text("$" + formatNumber(minIncome));

        this.legend.append("text")
            .attr("x", dimensions.legendWidth)
            .attr("y", 35)
            .attr("text-anchor", "end")
            .text("$" + formatNumber(maxIncome));

        this.legendScale = d3
            .scaleSequential([0, 320], d3.interpolateRdYlGn)
            .domain([minIncome, maxIncome]);

        this.legendAxis = this.legend.append("g")
            .attr("transform", `translate(0, ${dimensions.legendHeight})`);

        // finding location on the legend on hover?
        this.legendBar = this.legend.append("line")
            .attr("class", "legend-bar")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "0%");
    }

    setupTooltip() {
        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("pointer-events", "none");
    }

    setupDropdown() {
        const dropDown = d3.select(".dropdown-menu");
        const degree_list = [...new Set(this.data.dataset.map(d => d.degfield_desc))];
        degree_list.forEach((d) => {
            dropDown.append("a")
                .attr("class", "dropdown-item")
                .on("click", () => {
                    this.datasetParam = d;
                    this.updateLabel();
                    this.listRankings();
                    this.updateLegend();
                    this.drawMap();
                })
                .html(d);
        });

        // adding dropdown search
        const searchBar = d3.select(".dropdown-menu")
            .insert("input", ":first-child") // making it on top
            .attr("type", "text")
            .attr("id", "dropDownSearch")
            .on("input", filterDropdown);

        function filterDropdown() {
            const searchTerm = (d3.select("#dropDownSearch").property("value"))
            // const searchTerm = d3.select("#dropDownSearch")._groups[0][0].value // idk
            dropDown.selectAll("a").remove() // removing all elements
            let temp_list = degree_list.filter(d => {
                return d.toLowerCase().replace(/\s/g, '').includes(searchTerm.toLowerCase().replace(/\s/g, ''));
            });
            temp_list.forEach((d) => {
                dropDown
                    .append("a")
                    .attr("class", "dropdown-item")
                    .on("click", function () {
                        this.datasetParam = d;
                        updateLabel();
                        listRankings();
                        updateLegend();
                        drawMap();
                    })
                    .html(d);
            });
        }
    }

    setupRankings() {
        // Rankings?
        const ranking = d3.select("body")
            .append("div")
            .text("Rankings")
            .style("margin-left", "30px");

        const wheel_container = d3.select("body")
            .append("div")
            .attr("class", "wheel-container");

        const box = wheel_container
            .append("div")
            .attr("class", "filter-box");

        this.wheel = wheel_container
            .append("div")
            .attr("class", "wheel");

        const search = box
            .append("input")
            .attr("id", "search-box")
            .attr("type", "text")
            .style("width", "200px")
            .style("height", "30px")
            .on("input", listRankings);

        function listRankings() {
            const textInput = d3.select("#search-box").node().value.toLowerCase();
            const filteredData = this.data.dataset.filter(d => d.degfield_desc === this.datasetParam && d.state_name.toLowerCase().includes(textInput));
            const sortedData = d3.sort(filteredData, d => -incomeAccessor(d));

            this.wheel.selectAll(".this.-item")
                .remove();

            sortedData.forEach((d, i) => {
                this.wheel
                    .append("div")
                    .attr("class", "wheel-item")
                    .text(`${i + 1}\t${d.state_name}\t$${formatNumber(incomeAccessor(d))}`)
                    .on("mouseover", function () {
                        d3.selectAll("path").attr("opacity", 0.3);
                        d3.select(`.${d.state_name.replace(/\s/g, '')}`).attr("opacity", 0.9);
                    })
                    .on("mouseleave", () => d3.selectAll("path").attr("opacity", 0.9));
            });
        }
    }

    drawMap() {
        d3.select("#college-major").text(this.datasetParam);

        const stateIncomes = stateIncomesByDegreeAccessor(this.data.dataset, this.datasetParam);
        this.colorScale.domain(d3.extent(Object.values(stateIncomes)));

        this.bounds.selectAll("path")
            .data(this.data.mapData.features)
            .join("path")
            .attr("d", this.geoGenerator)
            .attr("fill", d => {
                const income = stateIncomes[stateNameAccessor(d)];
                return income ? this.colorScale(income) : "#000000";
            })
            .attr("stroke", "transparent")
            .attr("class", d => stateNameAccessor(d).replace(/\s/g, '') + " state")
            .on("mouseover", (event, d) => this.showTooltip(event, d, stateIncomes))
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip())
            .on("click", (event, d) => this.clicked(event, d));
    }

    showTooltip(event, d, stateIncomes) {
        const stateName = stateNameAccessor(d);
        const income = stateIncomes[stateName];
        this.tooltip
            .style("opacity", 0.8)
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px")
            .html(`${stateName}: $${formatNumber(income)}`);

        let barColor = "#000";
        const incomes = this.data.dataset
            .filter(d => d.degfield_desc === this.datasetParam)
            .map(d => +d.est_inc);

        const [minIncome, maxIncome] = d3.extent(incomes);
        let percentage = (income - minIncome)
            / (maxIncome - minIncome);

        this.legendBar
            .attr("x1", `${percentage * dimensions.legendWidth}`)
            .attr("x2", `${percentage * dimensions.legendWidth}`)
            .attr("y1", "33%")
            .style("opacity", 1);
    }

    moveTooltip(event) {
        this.tooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
    }

    hideTooltip() {
        this.tooltip.style("opacity", 0);
        this.tooltip.style("opacity", 0);
        this.legendBar.attr("y1", "0%");
    }

    updateLabel() {
        d3.select("#datasetLabel").html(`Current Dataset: ${this.datasetParam}`);
        d3.select("#current-major").html(`${this.datasetParam}`);
    }
    /* 
        degfield: "99"
        degfield_desc: "Economics"
        eb: ".52379662"
        est_inc: "133521.72"
        fips: "47"
        libarts_mean: "87624.367"
        state_name: "Tennessee"
    */
    updateStateView(d) {
        const stateName = d.properties.NAME;
        const currentOcc = (d) => d.degfield_desc === this.datasetParam;
        const currentState = (d) => d.state_name === stateName
        const byIncome = (a, b) => b.est_inc - a.est_inc;
        /** All records for this state */
        const stateData = this.data.dataset.filter(d => d.state_name === stateName);
        stateData.sort(byIncome);
        console.log("State Data", stateData)
        /** All records for this major */
        const occupationData = this.data.dataset.filter(currentOcc);
        occupationData.sort(byIncome);

        const stateIdx = stateData.findIndex(currentOcc);
        const occIdx = occupationData.findIndex(currentState);

        const occupation = stateData[stateIdx];
        const estIncome = formatNumber(occupation.est_inc);
        const state = occupationData[occIdx];

        const stateTotal = occupationData.length;
        const stateRank = occIdx + 1;

        const occData = stateData.length;
        const occRank = stateIdx + 1

        console.log('param', this.datasetParam);
        console.log('occupation ', occupation);
        console.log('occRank ', occRank);

        d3.select('#state-name').text(stateName);
        d3.select('#major-value').text(this.datasetParam);
        d3.select('#earnings-value').text(`$${estIncome}`);
        d3.select('#major-rank-value').text(`${occRank} of ${occData}`);
        d3.select('#state-rank-value').text(`${stateRank} of ${stateTotal}`);

        const row = (rank, major, inc) => `<span>${major}</span><span>$${formatNumber(inc)}</span>`
        d3.select("#top-1").html(row(1, stateData[0].degfield_desc, stateData[0].est_inc))

        d3.select("#top-2").html(row(2, stateData[1].degfield_desc, stateData[1].est_inc))
        d3.select("#top-3").html(row(3, stateData[2].degfield_desc, stateData[2].est_inc))
        const len = stateData.length;
        d3.select("#bottom-1").html(row(len - 3, stateData[len - 3].degfield_desc, stateData[len - 3].est_inc))
        d3.select("#bottom-2").html(row(len - 2, stateData[len - 2].degfield_desc, stateData[len - 2].est_inc))
        d3.select("#bottom-3").html(row(len - 1, stateData[len - 1].degfield_desc, stateData[len - 1].est_inc))

    }

    hideStateView() {
        d3.select('#state-view').style('display', 'none')
    }

    listRankings() {
        const textInput = d3.select("#search-box").node().value.toLowerCase();
        const filteredData = this.data.dataset.filter(d => d.degfield_desc === this.datasetParam && d.state_name.toLowerCase().includes(textInput));
        const sortedData = d3.sort(filteredData, d => -incomeAccessor(d));

        this.wheel.selectAll(".wheel-item")
            .remove();
        sortedData.forEach((d, i) => {
            this.wheel
                .append("div")
                .attr("class", "wheel-item")
                .text(`${i + 1}\t${d.state_name}\t$${formatNumber(incomeAccessor(d))}`)
                .on("mouseover", function () {
                    d3.selectAll("path").attr("opacity", 0.3);
                    d3.select(`.${d.state_name.replace(/\s/g, '')}`).attr("opacity", 0.9);
                })
                .on("mouseleave", () => d3.selectAll("path").attr("opacity", 1));
        });
    }

    reset() {
        this.hideStateView();
        this.bounds.transition().style("fill", null);
        this.svg.transition().duration(750).call(
            this.zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(this.svg.node()).invert([dimensions.width / 2, dimensions.height / 2])
        );
    }

    clicked(event, d) {
        const [[x0, y0], [x1, y1]] = this.geoGenerator.bounds(d);
        const stateClicked = d.properties.NAME
        event.stopPropagation();
        if (this.state === null || this.state !== stateClicked) {

            this.state = stateClicked
            this.updateStateView(d);

            this.stateView.transition().style('display', 'block');
            this.svg.transition().duration(750).call(
                this.zoom.transform,
                d3.zoomIdentity
                    .translate(dimensions.width / 2, dimensions.height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / dimensions.width, (y1 - y0) / dimensions.height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, this.svg.node())
            );
        } else if (this.state === stateClicked) {
            this.state = null;
            this.reset();
        }
    }

    zoomed(event) {
        const { transform } = event;
        this.bounds.attr("transform", transform);
        this.bounds.attr("stroke-width", 1 / transform.k);
    }

    updateLegend() {
        const incomes = this.data.dataset
            .filter(d => d.degfield_desc === this.datasetParam)
            .map(incomeAccessor);

        // const [minIncome, maxIncome] = d3.extent(incomes);
        this.legendScale = d3
            .scaleSequential([0, 320], d3.interpolateRdYlGn)
            .domain(d3.extent(incomes));
    }
}

// Copyright 2021, Observable Inc. (mostly)
// Released under the ISC license.
// https://observablehq.com/@d3/color-legend
function Legend(color, {
    title,
    tickSize = 6,
    width = 320,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64,
    tickFormat,
    tickValues
} = {}) {

    function ramp(color, n = 256) {
        const canvas = document.createElement("canvas");
        canvas.width = n;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
            context.fillStyle = color(i / (n - 1));
            context.fillRect(i, 0, 1, 1);
        }
        return canvas;
    }

    // Caleb's code
    const svg = d3.select("#wrapper").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");

    this.legend = svg;

    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;

    // Nathan's code
    this.legendBar = this.legend.append("line")
        .attr("class", "legend-bar")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "0%");

    // Continuous
    if (color.interpolate) {
        const n = Math.min(color.domain().length, color.range().length);

        x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }

    // Sequential
    else if (color.interpolator) {
        x = Object.assign(color.copy()
            .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
            { range() { return [marginLeft, width - marginRight]; } });

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());

        // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
        if (!x.ticks) {
            if (tickValues === undefined) {
                const n = Math.round(ticks + 1);
                tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
            }
            if (typeof tickFormat !== "function") {
                tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
            }
        }
    }

    // Threshold
    else if (color.invertExtent) {
        const thresholds
            = color.thresholds ? color.thresholds() // scaleQuantize
                : color.quantiles ? color.quantiles() // scaleQuantile
                    : color.domain(); // scaleThreshold

        const thresholdFormat
            = tickFormat === undefined ? d => d
                : typeof tickFormat === "string" ? d3.format(tickFormat)
                    : tickFormat;

        x = d3.scaleLinear()
            .domain([-1, color.range().length - 1])
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.range())
            .join("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", marginTop)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", d => d);

        tickValues = d3.range(thresholds.length);
        tickFormat = i => thresholdFormat(thresholds[i], i);
    }

    // Ordinal
    else {
        x = d3.scaleBand()
            .domain(color.domain())
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.domain())
            .join("rect")
            .attr("x", x)
            .attr("y", marginTop)
            .attr("width", Math.max(0, x.bandwidth() - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", color);

        tickAdjust = () => { };
    }

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
            .tickSize(tickSize)
            .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("class", "title")
            .text(title));

    return svg.node();
}

// Initialize and run the application
const app = new App();
app.initialize();