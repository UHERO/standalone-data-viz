import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Parse the CSV data
const data_path = "../Sources.csv";
const data = await d3.csv(data_path);

data.forEach(d => {
    // removing the commas in the numbers
    for (let key in d) {
        d[key] = parseFloat(d[key].replace(/,/g, ''));
        d[key] = isNaN(d[key]) ? 0 : d[key];
    }
});
console.log(data)

// accessor functions
const xAccessor = d => d.Year;

// function for formatting floats
// https://stackoverflow.com/questions/2901102/how-to-format-a-number-with-commas-as-thousands-separators
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


const width = 800;
let dimensions = {
    width: width,
    height: width * 1.75 // https://stackoverflow.com/questions/26355243/x-axis-not-displaying-on-bar-chart-using-d3-js
}
dimensions.margin = {
    top: 20,
    right: 20,
    bottom: 300,
    left: 80
};
dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right;
dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom;

const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("class", "wrapper")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

const bounds = wrapper.append("g")
    .attr("transform", `translate(${dimensions.margin.left
        },${dimensions.margin.top
        })`)
    .attr("class", "bounds");

const xScale = d3.scaleBand()
    .range([0, dimensions.boundedWidth])
    .domain(data.map(xAccessor))
    .padding(0.00)


// https://d3js.org/d3-shape/stack
const keys = Object.keys(data[0])
    .filter(key => key !== 'Year' && key !== 'TotalRevenue');
const stack = d3.stack()
    .keys(keys)
    .offset(d3.stackOffsetDiverging); // https://d3js.org/d3-shape/stack#stackOffsetDiverging


const stackedData = stack(data);

const yScale = d3.scaleLinear()
    .range([dimensions.boundedHeight, 0])
    .domain([
        d3.min(stackedData, layer => d3.min(layer, d => d[0])),
        d3.max(stackedData, layer => d3.max(layer, d => d[1]))
    ])
    .nice();
console.log(stackedData);

let color = d3.scaleOrdinal()
    .range(d3.schemeSet3); // need to add in more colors, this isn't enough

// temp fix, need better colors 
// also negative numbers need to be red
function generateColors(n) {
    // https://using-d3js.com/04_05_sequential_scales.html
    console.log(d3.range(n).map(i => d3.interpolateRdYlGn(i / n)))
    return d3.range(n).map(i => d3.interpolateRdYlGn(i / n));
}
function generateColors2(n) {
    // https://using-d3js.com/04_05_sequential_scales.html
    console.log(d3.range(n).map(i => d3.interpolateRdYlGn(i / n + 2 / n)))
    return d3.range(n).map(i => d3.interpolateRainbow(i / n + 4 / n));
}


color = d3.scaleOrdinal()
    .range(generateColors(keys.length));
const color2 = d3.scaleOrdinal()
    .range(generateColors2(keys.length));

let colorDict = {}

let sortedStackedData = stackedData;

const xAxisGenerator = d3.axisBottom()
    .scale(xScale);

const yAxisGenerator = d3.axisLeft()
    .scale(yScale);

// drawing axes

const xAxis = bounds.append("g") // now this doesn't work
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${dimensions.boundedHeight})`)
    .call(xAxisGenerator)

const yAxis = bounds.append("g")
    .attr("class", "y-axis")
    .call(yAxisGenerator)

// const xAxisLabel = bounds.append("text") // i can't get it to work with xAxis
//     .attr("x", dimensions.boundedWidth / 2)
//     .attr("y", dimensions.boundedHeight + dimensions.margin.bottom - 10) // 10 px above the bottom of the bounded region  
//     .attr("text-anchor", "middle")
//     .style("font-size", "14px")
//     .text("Year")

const xAxisLabel = xAxis.append("text") // also not working
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Year");


const yAxisLabel = yAxis.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 20)
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .text("Total Revenue (Thousands of USD)")

const stackGroups = bounds.selectAll("g.stack")
    .data(sortedStackedData)
    .join("g")
    .attr("class", "stack") // these all get wiped out
    .attr("fill", d => d[0][0] < 0 ? color(d.key) : color2(d.key))
    .attr("class", d => d[0][0] < 0 ? "negative" : "positive")
    .attr("class", d => `stack ${d[0][0] < 0 ? "negative" : "positive"} ${d.key.replace(/\.|\/|\,/g, "")}`)

var tooltipCategory = "";
stackGroups.selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => xScale(d.data.Year))
    .attr("y", d => { // for the missing 2022-2023 values
        const y = Math.min(yScale(d[0]), yScale(d[1]));
        return isNaN(y) ? 0 : y;
    })
    .attr("height", d => { // same as above
        const height = Math.abs(yScale(d[0]) - yScale(d[1]));
        return isNaN(height) ? 0 : height;
    })
    .attr("width", xScale.bandwidth())
    .attr("stroke", "steelblue") // border
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
        d3.select("body").on("mousemove", () => null);
        mouseover(event, event.target.__data__);
        const value = d[1] - d[0];
        const displayValue = d[0] >= 0 ? value : -value;
        tooltipCategory = tooltipCategory.replace(/[A-Z]|and|on\s+W|w\//g, str => ' ' + str);
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(`${tooltipCategory}: \n$${numberWithCommas((Math.trunc(displayValue * 100) / 100).toFixed(1))} K`)
            .style("left", `${event.pageX}px`)
            .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", mouseout);

d3.selectAll("rect")
    .attr("opacity", 0.8)
function mouseover(event, d) {
    //console.log(d)
    // https://d3-graph-gallery.com/graph/barplot_stacked_highlight.html
    var subgroupName = d3.select(event.target.parentNode).datum().key;
    var subgroupValue = d.data[subgroupName];

    d3.selectAll("rect")
        .transition() // dimming out all rectangles
        .duration(1)
        .attr("opacity", 0.2);

    d3.selectAll(`.${subgroupName.replace(/\.|\/|\,/g, "")} rect`)
        .transition() // selecting all rectangles with the same classname
        .duration(1)
        .attr("opacity", 1);
    function showTooltip() {
        tooltipCategory = `${d3.select(event.target.parentNode).datum().key.replace(/\.|\/|\,/g, "")}`;
        let temp_key = d3.select(event.target.parentNode).datum().key.replace(/\.|\/|\,/g, "");
        d3.selectAll("span").style("opacity", 0.2);
        d3.selectAll(`.${temp_key} span`).style("opacity", 0.8);
    }
    showTooltip();
}

function mouseout(d) {
    d3.selectAll("span")
        .style("opacity", 0.8);
    d3.selectAll("rect")
        .transition().duration(100)
        // higher to prevent flickering 
        .attr("opacity", 0.8);
    function hideTooltip() {
        tooltip.style("opacity", 0);
    }
    hideTooltip();
    d3.select("body")
        .on("mousemove", () => tooltip.style("opacity", 0))

}
// total revenue line
const totalRevenueLine = d3.line()
    .x(d => {
        const x = xScale(d.Year) + xScale.bandwidth() / 2;
        return x;
    })
    .y(d => {
        const y = yScale(d.TotalRevenue);
        return isNaN(y) ? 0 : y; // 2022 and 2023 missing total revenue
    });


// line for x axis
const fakexAxis = bounds.append("line")
    .attr("x1", 0)
    .attr("y1", yScale(0)) // y is at 0 on y scale
    .attr("x2", dimensions.boundedWidth) // line goes from 0 to the end
    .attr("y2", yScale(0))
    .attr("stroke", "black")
    .attr("stroke-width", 2);

// const meanLine = bounds.append("path")
//     .datum(data)
//     .attr("fill", "none")
//     .attr("stroke", "darkblue")
//     .attr("stroke-width", 2)
//     .attr("d", totalRevenueLine);
// const meanLineTop = bounds.append("path")
//     .datum(data)
//     .attr("fill", "none")
//     .attr("stroke", "none")
//     .attr("stroke-width", 400)
//     .attr("d", totalRevenueLine)
//     .attr("transform", "translate(0, -2)");

// const meanLineBottom = bounds.append("path")
//     .datum(data)
//     .attr("fill", "none")
//     .attr("stroke", "none")
//     .attr("stroke-width", 4)
//     .attr("d", totalRevenueLine)
//     .attr("transform", "translate(0, 2)");

// tooltip section
const tooltip = d3.select("body")
    .append("div")
    .attr("id", "chart")
    .attr("class", "tooltip")
    .on("mousemove", () => tooltip.style("opacity", 0))

d3.select("body")
    .on("mousemove", () => tooltip.style("opacity", 0));
function updateTooltip(event, d) {
    tooltip
        .style("opacity", 0.8)
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
}

stackGroups
    .on("mouseout", () => tooltip.style("opacity", 0))
    .on("mousemove", updateTooltip);

// legend div
const legend = d3.select("#legend")
// .style("border", "10px solid red")
//.style("height", "300px")

// adding content to div
const legendKeys = Object.keys(data[0])
    .filter(key => key !== "Year" && key !== "TotalRevenue")
for (let key of legendKeys) {

    key = key.replace(/\.|\/|\,/g, "");
    if (document.getElementsByClassName(key).length > 0) {
        let classColor = document.getElementsByClassName(key)[0].attributes.fill.nodeValue;
        (d3.selectAll(`.${key} span`))
            .style("background-color", classColor)
            .on("mouseover", function (event, d) {
                d3.selectAll("rect")
                    .attr("opacity", 0.2)
                d3.selectAll(`.${key} rect`)
                    .attr("opacity", 0.8)
                d3.selectAll(`span`)
                    .style("opacity", 0.2)
                d3.selectAll(`.${key} span`)
                    .style("opacity", 0.8)
            })
            .on("mouseleave", function (event, d) {
                d3.selectAll("rect")
                    .attr("opacity", 0.8)
                d3.selectAll(`span`)
                    .style("opacity", 0.8)
            })
    }
}


yAxis
    .on("mousemove", () => tooltip.style("opacity", 0))
    .on("mouseleave", () => tooltip.style("opacity", 0))
    .on("mouseover", () => tooltip.style("opacity", 0));

// d3.selectAll(".legendCircle")
//     .style("background-color", "blue")


function tooltipInSvgCheck() { // fixes bug where tooltip stays up if you exit too quickly
    var inWrapper = document.querySelector("#wrapper:hover") != null;
    // checking to see if the mouse is hovered over the wrapper div
    if (!inWrapper) {
        d3.select(".tooltip")
            .style("opacity", 0);
    }
}
setInterval(tooltipInSvgCheck, 1);


// check box logic
let checkboxes = document.querySelectorAll("input[type=checkbox]");
console.log(checkboxes)
let currentCheckboxes = [];
let oldCheckboxes = [];

checkboxes.forEach(function (checkbox) {
    checkbox.checked = true;
}); // checking them all off at the start

oldCheckboxes = Array.from(checkboxes)
    .filter(i => i.checked)
    .map(i => i.parentNode.classList[1])

// spamming checkboxes makes floating spaces
let checkboxCooldown = false;

checkboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
        // if (checkboxCooldown) return;
        checkboxCooldown = true;
        // checkboxes.forEach(cb => cb.disabled = true);
        // setTimeout(() => {
        //     checkboxCooldown = false;
        //     checkboxes.forEach(cb => cb.disabled = false);
        // }, 1000); // 1 second cooldown

        currentCheckboxes = Array.from(checkboxes)
            .filter(i => i.checked) // only getting checked checkboxes
            .map(i => i.parentNode.classList[1]); // get classname from parent div
        deletedCheckboxes = Array.from(checkboxes)
            .filter(i => !i.checked) // only getting unchecked checkboxes
            .map(i => i.parentNode.classList[1]); // get classname from parent div

        checkboxAnimation(); // both break
    });
});

let deletedCheckboxes = [];
let tempData = data;

function checkboxAnimation() {
    // if (currentCheckboxes.length == 0) {
    //     return;
    // }
    tempData = JSON.parse(JSON.stringify(data)); // deep copying
    tempData.forEach(function (year, i) {
        for (let metric in year) {
            let temp_metric = metric.replace(/\.|\/|\,/g, "");
            if (deletedCheckboxes.includes(temp_metric)) {
                delete tempData[i][metric];
            }
        }
    });

    console.log(tempData);
    console.log(currentCheckboxes);
    let newStack = d3.stack()
        .keys(currentCheckboxes)
        .offset(d3.stackOffsetDiverging)(tempData);
    console.log(newStack);


    yScale.domain([
        d3.min(newStack, layer => d3.min(layer, d => d[0])),
        d3.max(newStack, layer => d3.max(layer, d => d[1]))
    ]).nice();

    yAxis.transition().duration(1000).call(yAxisGenerator);


    let stackGroups = bounds.selectAll("g.stack")
        .data(newStack, d => d.key);

    stackGroups.exit().selectAll("rect")
        .transition().duration(1000)
        .attr("height", 0)
        .attr("y", function (d) {
            console.log(d);
            return yScale(Math.max(0, d[0]));
        });

    stackGroups.exit().transition().duration(1000).remove();

    let newGroups = stackGroups.enter().append("g");
    stackGroups = newGroups.merge(stackGroups);

    stackGroups.attr("fill", d => d[0][0] < 0 ? color(d.key) : color2(d.key));

    let bars = stackGroups.selectAll("rect")
        .data(d => d);

    bars.enter().append("rect")
        .attr("x", d => xScale(d.data.Year))
        .attr("y", d => yScale(Math.max(0, d[0])))
        .attr("height", 0)
        .attr("width", xScale.bandwidth());

    bars.merge(bars.enter().selectAll("rect"))
        .transition().duration(1000)
        .attr("x", d => xScale(d.data.Year))
        .attr("y", d => { // for the missing 2022-2023 values
            const y = Math.min(yScale(d[0]), yScale(d[1]));
            return isNaN(y) ? 0 : y;
        })
        .attr("height", d => { // same as above
            const height = Math.abs(yScale(d[0]) - yScale(d[1]));
            return isNaN(height) ? 0 : height;
        })
        .attr("width", xScale.bandwidth())
        .attr("opacity", 0.8)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    fakexAxis
        .transition().duration(1000)
        .attr("y1", yScale(0))
        .attr("y2", yScale(0));

    stackGroups.selectAll("rect")
        .on("mouseover", function (event, d) {
            d3.select("body").on("mousemove", () => null);
            mouseover(event, event.target.__data__);
            const value = d[1] - d[0];
            const displayValue = d[0] >= 0 ? value : -value;
            tooltipCategory = tooltipCategory.replace(/[A-Z]|and|on\s+W|w\//g, str => ' ' + str);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${tooltipCategory}: \n$${numberWithCommas((Math.trunc(displayValue * 100) / 100).toFixed(1))} K`)
                .style("left", `${event.pageX}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", mouseout);
}




function checkboxAnimation2() {
    // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
    let symDifference = oldCheckboxes.filter(x => !currentCheckboxes.includes(x))
        .concat(currentCheckboxes.filter(x => !oldCheckboxes.includes(x)));
    tempData = JSON.parse(JSON.stringify(data)); // deep copying
    tempData.forEach(function (year, i) {
        for (let metric in year) {
            let temp_metric = metric.replace(/\.|\/|\,/g, "");
            if (deletedCheckboxes.includes(temp_metric)) {
                delete tempData[i][metric];
            }
        }
    });
    let newStack = d3.stack()
        .keys(currentCheckboxes)
        .offset(d3.stackOffsetDiverging);
    tempData = newStack(tempData);
    console.log(tempData);
    d3.selectAll(".stack rect")
        .transition().attr("height", 0)
        .remove()
    let stackGroups = bounds.selectAll("g.stack")
        .data(tempData)
        .join("g")
        .attr("class", "stack") // these all get wiped out
        .attr("fill", d => d[0][0] < 0 ? color(d.key) : color2(d.key))
        .attr("class", d => d[0][0] < 0 ? "negative" : "positive")
        .attr("class", d => `stack ${d[0][0] < 0 ? "negative" : "positive"} ${d.key.replace(/\.|\/|\,/g, "")}`)
    stackGroups.selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => xScale(d.data.Year))
        .attr("y", d => { // for the missing 2022-2023 values
            const y = Math.min(yScale(d[0]), yScale(d[1]));
            return isNaN(y) ? 0 : y;
        })
        .transition().duration(1000)
        .attr("height", d => { // same as above
            const height = Math.abs(yScale(d[0]) - yScale(d[1]));
            return isNaN(height) ? 0 : height;
        })
        .attr("width", xScale.bandwidth())
        .attr("opacity", 0.8)
        .attr("stroke", "steelblue") // border
        .attr("stroke-width", 2)
        .on("mouseover", function (event, d) {
            d3.select("body").on("mousemove", () => null);
            mouseover(event, event.target.__data__);
            const value = d[1] - d[0];
            const displayValue = d[0] >= 0 ? value : -value;
            tooltipCategory = tooltipCategory.replace(/[A-Z]|and|on\s+W|w\//g, str => ' ' + str);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${tooltipCategory}: \n$${numberWithCommas((Math.trunc(displayValue * 100) / 100).toFixed(1))} K`)
                .style("left", `${event.pageX}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", mouseout);
}


// todo:
// fix tooltip not disappearing when mouse leaves stack too quickly ! fixed
// fix colors / groupings ! fixed
// fix mean line tooltip ! removing for now
// add animations ! in progress
// add css to make thing look nice 
// add legend ! in progress
// add event listeners to checkboxes ! working
// add white years on fake x axis
// fix tooltip not working with updated animations (fix event handlers) ! fixed
// fix animation bug where the old graph is still kinda there
// data still has mistakes and missing values for years 2022-2023
// animations aren't going back to old heights
// adding white line that represents net profits for that year
// add gradient to legend border ! done
