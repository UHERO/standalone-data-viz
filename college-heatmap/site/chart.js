import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Parse the CSV data
const data_dir = "../data/";
const dataset = await d3.csv(data_dir + "major_all.csv");
console.log(dataset)

// Creating list of valid degrees
let degree_list = [...new Set(dataset.map(d => d.degfield_desc))];
let datasetParam = degree_list[0];

const dropDown = d3.select(".dropdown-menu")
// Setting up dropdown menu
degree_list.forEach((d) => {
	dropDown
		.append("a")
		.attr("class", "dropdown-item")
		.on("click", function () {
			datasetParam = d;
			updateLabel();
			listRankings();
			updateLegend();
			drawMap();
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
				datasetParam = d;
				updateLabel();
				listRankings();
				updateLegend();
				drawMap();
			})
			.html(d);
	});
}

// Parse the map data
// https://eric.clst.org/tech/usgeojson/
const mapData = await d3.json(data_dir + "gz_2010_us_040_00_20m.json");

// Accessors
const stateNameAccessor = d => d.properties["NAME"];
const incomeAccessor = d => +d.est_inc;
const stateIncomesByDegreeAccessor = degField => {
	return dataset.reduce((acc, d) => {
		if (d.degfield_desc === degField) {
			acc[d.state_name] = +d.est_inc;
		}
		return acc;
	}, {});
};

const zoom = d3.zoom()
	.scaleExtent([1, 8])
	.on("zoom", zoomed);

// Other Functions
// found this on stack overflow somewhere
function formatNumber(num) {
	return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Defining dimensions
const dimensions = {
	width: window.innerWidth * 0.8,
	height: window.innerWidth * 0.8 * 0.7,
	margin: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 10
	}
};
dimensions.boundedWidth = dimensions.width
	- dimensions.margin.left
	- dimensions.margin.right;
dimensions.boundedHeight = dimensions.height
	- dimensions.margin.top
	- dimensions.margin.bottom;

// Main body
const wrapper = d3.select("body")
	.append("div")
	.attr("id", "wrapper")
	.attr("width", dimensions.width)
	.attr("height", dimensions.height);

const svg = wrapper.append("svg")
	.attr("width", dimensions.width)
	.attr("height", dimensions.height)
	.attr("style", "max-width: 100%; height: auto;")
	.on("click", reset);

const bounds = svg.append("g")
	.style("transform",
		`translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)
	.attr("cursor", "pointer")


// Colors

// const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
//     .domain(d3.extent(dataset, incomeAccessor));

const red = "#FF6961";
const green = "#77DD77";

// we'll set the domain later
let colorScale = d3.scaleLinear()
	.range([red, green]);


// Tooltip 
const tooltip = d3.select("body")
	.append("div")
	.attr("class", "tooltip")
	.style("opacity", 0)
	.style("position", "absolute")
	.style("pointer-events", "none");

// Map 

// https://d3js.org/d3-geo/conic#geoAlbersUsa
function drawMap() {

	let projection = d3.geoAlbersUsa()
		.fitSize([dimensions.boundedWidth, dimensions.boundedHeight], mapData);
	let geoGenerator = d3.geoPath()
		.projection(projection);


	const stateIncomes = stateIncomesByDegreeAccessor(datasetParam);
	// now we set domain
	colorScale.domain(d3.extent(Object.values(stateIncomes)));

	const map = bounds.selectAll("path")
		.data(mapData.features)
		.join("path")
		.attr("d", geoGenerator)
		.attr("fill", d => {
			const income = stateIncomes[stateNameAccessor(d)];
			return income ? colorScale(income) : "#000000";
		})
		.attr("stroke", "#fff")
		.attr("class", d => stateNameAccessor(d).replace(/\s/g, '')) // removing spaces
		// Event Listeners For Tooltip
		.on("mouseover", function (event, d) {
			const stateName = stateNameAccessor(d);
			const income = stateIncomes[stateName];
			tooltip
				.style("opacity", 0.8)
				.style("top", (event.pageY - 10) + "px")
				.style("left", (event.pageX + 10) + "px")
				.html(`${stateName}: $${formatNumber(income)}`);

			let barColor = "#000";
			const incomes = dataset
				.filter(d => d.degfield_desc === datasetParam)
				.map(d => +d.est_inc);

			const [minIncome, maxIncome] = d3.extent(incomes);
			let percentage = (income - minIncome)
				/ (maxIncome - minIncome);
			console.log(percentage);
			legendBar
				.attr("x1", `${percentage * legendWidth}`)
				.attr("x2", `${percentage * legendWidth}`)
				.attr("y1", "33%")
				.style("opacity", 1);
		})
		.on("mousemove", function (event, d) {
			tooltip
				.style("opacity", 0.8)
				.style("top", (event.pageY - 10) + "px")
				.style("left", (event.pageX + 10) + "px");
		})
		.on("mouseleave", function () {
			tooltip.style("opacity", 0);
			legendBar.attr("y1", "0%");
		})
		.on("click", clicked);

	svg.call(zoom);

	function reset() {
	bounds.transition().style("fill", null);
	svg.transition().duration(750).call(
		zoom.transform,
		d3.zoomIdentity,
		d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
	);
}

function clicked(event, d) {
	const [[x0, y0], [x1, y1]] = geoGenerator.bounds(d);
	event.stopPropagation();
	bounds.transition().style("fill", null);
	d3.select(this).transition().style("fill", "red");
	svg.transition().duration(750).call(
		zoom.transform,
		d3.zoomIdentity
			.translate(width / 2, height / 2)
			.scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
			.translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
		d3.pointer(event, svg.node())
	);
}

function zoomed(event) {
    const {transform} = event;
    bounds.attr("transform", transform);
    bounds.attr("stroke-width", 1 / transform.k);
  }
}


drawMap();

// Legend Stuff

const legendSvg = d3.select("body").append("svg")
	.attr("width", dimensions.width * 0.9 + 60)
	.attr("height", 60);

const legendWidth = dimensions.width * 0.9;
const legendHeight = 20;

const legend = legendSvg.append("g")
	.attr("transform", `translate(50, 15)`);

// https://www.freshconsulting.com/insights/blog/d3-js-gradients-the-easy-way/
const gradient = legend.append("linearGradient")
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

legend.append("rect") // actual legend
	.attr("width", legendWidth)
	.attr("height", legendHeight)
	.attr("fill", "url(#legend-gradient)");


const incomes = dataset
	.filter(d => d.degfield_desc === datasetParam)
	.map(d => +d.est_inc);

const [minIncome, maxIncome] = d3.extent(incomes);

legend.append("text") // text on the ends
	.attr("y", 35)
	.attr("text-anchor", "start")
	.text("$" + formatNumber(minIncome));

legend.append("text")
	.attr("x", legendWidth)
	.attr("y", 35)
	.attr("text-anchor", "end")
	.text("$" + formatNumber(maxIncome));


const legendScale = d3.scaleLinear()
	.range([0, legendWidth]);

const legendAxis = legend.append("g")
	.attr("transform", `translate(0, ${legendHeight})`);

// finding location on the legend on hover?

const legendBar = legend.append("line")
	.attr("class", "legend-bar")
	.attr("stroke", "steelblue")
	.attr("stroke-width", 2)
	.attr("x1", "0%")
	.attr("y1", "0%")
	.attr("x2", "0%")
	.attr("y2", "0%");


function updateLegend() {
	const incomes = dataset
		.filter(d => d.degfield_desc === datasetParam)
		.map(d => +d.est_inc);

	const [minIncome, maxIncome] = d3.extent(incomes);
	legendScale.domain([minIncome, maxIncome]);
}

// Misc

function updateLabel() {
	d3.select("#datasetLabel")
		.html(`Current Dataset: ${datasetParam}`);
}

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

const wheel = wheel_container
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
	const filteredData = dataset.filter(d => d.degfield_desc === datasetParam && d.state_name.toLowerCase().includes(textInput));
	const sortedData = d3.sort(filteredData, d => -incomeAccessor(d));

	wheel.selectAll(".wheel-item")
		.remove();
	sortedData.forEach((d, i) => {
		wheel
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

listRankings();



