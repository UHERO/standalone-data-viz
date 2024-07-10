import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

async function drawStackChart() {

  //#region Access Data
  const data = await d3.csv("./Sources of Revenue_State of Hawaii-Annual.csv");
  function deepClone(data) {
    const newData = data.map(a => Object.assign({}, a));
    return newData;
  }
  const posData = deepClone(data);
  //#endregion

  //#region Create Chart Dimensions
  const width = 600;
  let dimensions = {
    width: width,
    height: width * 0.6,
    margin: {
      top: 30,
      right: 20,
      bottom: 50,
      left: 100,
    },
  };
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
  //#endregion

  //#region Draw Canvas
  const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper.append("g")
    .style("transform", `translate(${dimensions.margin.left
      }px, ${dimensions.margin.top
      }px)`);
  //#endregion

  //#region Keys
  // const keys = data.columns.slice(1)
  // keys.splice(0, 1)
  // keys.splice(7, 3)
  // keys.splice(8, 4)
  const keys = data.columns.slice(1);
  keys.splice(0, 1);
  keys.splice(7, 1);
  keys.splice(10, 1);
  keys.splice(0, 0, keys[9]);
  keys.splice(10, 1);
  keys.splice(1, 0, keys[13]);
  keys.splice(14, 1);
  const orderedKeys = data.columns.slice(1);
  orderedKeys.splice(0, 1);
  orderedKeys.splice(7, 1);
  orderedKeys.splice(10, 1);
  for (let i = 0; i < 12; i++) {
    posData[i].CorporateIncomeTaxRefundsRevenue = 0;
    posData[i].IndividualIncomeTaxRefundsRevenue = 0;
  }
  //#endregion

  //#region Labels and Descriptions
  const labels = [
    "Banks/Financial Corporate Tax Revenue",
    "Conveyance Tax Revenue",
    "Employment Security Control Tax Revenue",
    "Fuel Tax Revenue",
    "General Excise License/Fees Tax Revenue",
    "General Excise and Use Tax Revenue",
    "Honolulu County Surcharge Revenue",
    "Corporate Income Tax Declaration Estimated Taxes Revenue",
    "Corporate Income Tax Payment with Returns Revenue",
    "Corporate Income Tax Refunds Revenue",
    "Individual Income Tax Declaration Estimated Taxes Revenue",
    "Individual Income Tax Payment with Returns Revenue",
    "Individual Income Tax Withholding Tax on Wages Revenue",
    "Individual Income Tax Refunds Revenue",
    "Inheritance Estate Tax Revenue",
    "Insurance Premiums Tax Revenue",
    "Liquor and Permits Tax Revenue",
    "Motor Vehicle Tax/Fees, Etc. Tax Revenue",
    "Public Service Company Tax Revenue",
    "Tobacco and Licenses Tax Revenue",
    "Transient Accommodation Fees Revenue",
    "Transient Accommodation Tax Revenue",
    "All Others Tax Revenue",
  ]

  const descriptions = [
    "Taxes on banks to discourage unnecessary risks, providing a counterbalance to the various ways in which banks are currently not subject to the tax system; taxes levied on corporations' profits.",
    "Taxes on the transfer of realty at the state, county, or municipal level, also known as a real estate transfer tax. Paid by the purchaser.",
    "A tax withheld from employees' wages for social security and Medicare",
    "A tax on distributors for each gallon of liquid fuel refined, manufactured, produced, or compounded by the distributor and sold or used by the distributor in the State, also imposed on imported or acquired fuel. Environmental response, energy, and food security tax also included in the fuel tax law.",
    "A tax on the General Excise Tax Licenses for anyone who receives income from conducting business activities in the State of Hawaii.",
    "A privilege tax imposed on all business activity in the State of Hawaii. The state GET rates are 0.15% on commisions from insurance sales, 0.5% on manufacturing or producing, 0.5% on wholesaling activities in which a business sells goods or sercices to another business for resale, and 4.0% on all other activites.",
    "A surcharge added to activities taxed at the 4.0% rate to fund the county and its endeavors. ",
    "An estimate tax payment paid by corporations if they expect to owe tax of $500 or more when their return is filed.",
    "Taxes filed by corporations when filing an income tax return.",
    "An income tax refund paid by the government to taxpayers based on several factors.",
    "An estimate tax payment paid by individuals on taxable income that is not subject to federal withholding. ",
    "Taxes filed by individuals when filing an income tax return.",
    "The amount of federal income tax withheld from one's paycheck. THe amount of fincome tax one's employer withholds from their regular pay depends on the amount you earn and the information on Form W-4.",
    "An income tax refund paid by the government if one paid more through the year than owed in tax.",
    "A tax on one's right to transfer property at one's death.",
    "A refundable credit that helps eligible individuals and families cover the premiums for their health insurance purchased through the Health Insurance Marketplace.",
    "A tax on liquor and the permit to sell it.",
    "Taxes and fees on motor vehicles.",
    "A tax imposed in lieu of state general excise and county real property taxes.",
    "A tax on tobacco and the license to sell it.",
    "A fee on the gross rental or rental proceeds dervied from furnishing transient accommodations.",
    "A tax levied on the gross rental or rental proceeds dervied from furnishing transient accommodations.",
    "Miscellaneous other tax sources.",
  ]
  //#endregion

  //#region Calcs
  // for(let i = 0; i < 11; i++) {
  //   let sum = 0;
  //   for (let key of detailedKeys) {
  //     sum+=Number(data[i][key])
  //   }
  //   console.log(`${2011+i} Prediction: ${sum}`)
  //   console.log(`${2011+i} Actual:     ${data[i]['TotalRevenue']}`)
  // }
  //#endregion

  //#region Draw Peripherals
  function drawPeripherals() {
    let tickFormat = d3.format(",.0f")
    if (showPercent) {
      tickFormat = d3.format(".0%")
    } else {
      tickFormat = d3.format(",.0f")
    }

    let yAxisGenerator = d3.axisLeft()
      .scale(yScale)
      .tickFormat(tickFormat);

    let yAxis = bounds.select(".y-axis")
      .transition().duration(800).ease(d3.easeCubicInOut)
      .call(yAxisGenerator);

    let yAxisLabel = bounds.select(".y-axis-label")
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("y", -dimensions.margin.left + 30)
      .attr("fill", "black")
      .style("font-size", "1.2em")
      .text(() => {
        if (showPercent) {
          return "Revenue (percent)"
        } else {
          return "Revenue (thousands of dollars)"
        }
      })
      .style("transform", "rotate(-90deg)")
      .style("text-anchor", "middle");

    const xAxisGenerator = d3.axisBottom()
      .scale(xScale)
      .tickFormat(d3.format("d"));

    const xAxis = bounds.select(".x-axis")
      .transition().duration(800).ease(d3.easeCubicInOut)
      .call(xAxisGenerator);

    const xAxisLabel = bounds.select(".x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .attr("fill", "black")
      .style("font-size", "1.2em")
      .text("Year");

    let zeroLine = bounds.select(".zero-line")
      .transition().duration(800).ease(d3.easeCubicInOut)
      .attr("y1", dimensions.boundedHeight + yScale(0) - yScale(yScale.invert(dimensions.boundedHeight)))
      .attr("y2", dimensions.boundedHeight + yScale(0) - yScale(yScale.invert(dimensions.boundedHeight)));
  }
  //#endregion

  //#region Scales
  const timeSpan = [2011, 2021];
  const moneySpan = [-800000, 9000000];

  const xScale = d3.scaleLinear()
    .domain(timeSpan)
    .range([0, dimensions.boundedWidth])
    .nice();

  let yScale = linearScale(moneySpan);

  function linearScale(moneySpan) {
    const linearScale = d3.scaleLinear()
      .domain(moneySpan)
      .range([dimensions.boundedHeight, 0])
      .nice();
    return linearScale;
  }

  const colorScale = d3.scaleOrdinal()
    .domain(orderedKeys)
    .range([
      '#c1c9e8', // Banks Financial Corporate Tax
      '#14380a', // Conveyance Tax
      '#aed9a0', // Employment Security Control Tax
      '#96a4d6', // Fuel Tax
      '#3E7B75', // General Excise License Fees Tax
      '#38A69B', // General Excise and Use Tax
      '#70b85a', // Honolulu County Surcharge
      '#50ad78', // Corporate Income Tax Declaration Estimated Taxes
      '#206e41', // Corporate Income Tax Payment w/ Returns
      '#F2695C', // Corporate Income Tax Refunds
      '#1d4c63', // Individual Income Tax Declaration Estimated Taxes
      '#4e8dad', // Individual Income Tax Payment w/ Returns
      '#acd1e3', // Individual Income Tax Withholding Tax on Wages
      '#F28B66', // Individual Income Tax Refunds
      '#8dc77b', // Inheritance Estate Tax
      '#697cc2', // Insurance Premiums Tax
      '#c1c9e8', // Liquor and Permits Tax
      '#314799', // Motor Vehicle Tax Fees Etc.
      '#438a2d', // Public Service Company Tax
      '#112159', // Tobacco and Licenses Tax
      '#2a6318', // Transient Accomodation Fees
      '#d1e8ca', // Transient Accommodation Tax
      'turquoise', // All Others Tax
    ]);

  const legendTextColor = ["black", "white", "black", "black", "white", "black", "black", "black", "white", "black", "white", "black", "black", "black", "black", "black", "black", "white", "white", "white", "white", "black", "black"]

  //#endregion

  //#region Statics
  bounds.append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .append("text")
    .attr("class", "x-axis-label");
  bounds.append("g")
    .attr("class", "y-axis")
    .append("text")
    .attr("class", "y-axis-label");
  // #endregion

  //#region Toggles
  let showNegative = false;
  let showNet = false;
  let showSelected = false;
  let showPercent = false;
  //#endregion

  //#region Stacks, Stack Functions
  let posStackedData = d3.stack()
    .keys(keys)
    (posData.slice(timeSpan[0] - 2011, timeSpan[1] - 2010));

  let stackedData = d3.stack()
    .keys(keys)
    (data.slice(timeSpan[0] - 2011, timeSpan[1] - 2010));

  let posPercentStackedData = d3.stack()
    .keys(keys)
    .offset(d3.stackOffsetExpand)
    (posData.slice(timeSpan[0] - 2011, timeSpan[1] - 2010));

  let percentStackedData = d3.stack()
    .keys(keys)
    .offset(d3.stackOffsetExpand)
    (data.slice(timeSpan[0] - 2011, timeSpan[1] - 2010));

  posStackedData = posStackedData.reverse();
  stackedData = stackedData.reverse();
  posPercentStackedData = posPercentStackedData.reverse();
  percentStackedData = percentStackedData.reverse();

  const stacks = bounds.selectAll("mylayers")
    .data(stackedData)
    .join("path")
    .attr("id", d => d.key)
    .style("fill", d => colorScale(d.key))
    .style("opacity", 1)
    .attr("d", d3.area()
      .x(d => xScale(Number(d.data.Year)))
      .y0(dimensions.boundedHeight + yScale(0) - yScale(yScale.invert(dimensions.boundedHeight)))
      .y1(dimensions.boundedHeight + yScale(0) - yScale(yScale.invert(dimensions.boundedHeight)))
    )
    .on("mouseover", mouseOver)
    .on("mouseleave", mouseLeave);

  function drawStacks(dataset) {
    stacks
      .data(dataset)
      .attr("id", d => d.key)
      .style("fill", d => colorScale(d.key))
      .style("stroke", "black")
      .style("stroke-width", 0.4)
      .transition().duration(800).ease(d3.easeCubicInOut)
      .attr("d", d3.area()
        .x(d => xScale(Number(d.data.Year)))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
      )
      .style("opacity", d => {
        if ((d.key == 'CorporateIncomeTaxRefundsRevenue' || d.key == 'IndividualIncomeTaxRefundsRevenue')) {
          if (showNegative) {
            return 0.8;
          } else {
            return 0;
          }
        } else {
          return 1;
        }
      });
  }
  //#endregion

  //#region Initialized Graph
  drawStacks(posStackedData);
  bounds.append("line")
    .attr("class", "zero-line")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .style("stroke-dasharray", ("4, 2"))
    .style("opacity", 0.5)
    .attr("x1", 0)
    .attr("x2", dimensions.boundedWidth)
    .attr("y1", dimensions.boundedHeight + yScale(0) - yScale(yScale.invert(dimensions.boundedHeight)))
    .attr("y2", dimensions.boundedHeight + yScale(0) - yScale(yScale.invert(dimensions.boundedHeight)));
  drawPeripherals();
  //#endregion

  //#region Net, Percent, and Negative Buttons
  const buttonWrapper = d3.select("#toggle-wrapper")
  const showNetDiv = buttonWrapper.append("div")
    .attr("class", "form-check form-switch")
  const showNegDiv = buttonWrapper.append("div")
    .attr("class", "form-check form-switch")
  const showPercentDiv = buttonWrapper.append("div")
    .attr("class", "form-check form-switch")
  const buttonShowNet = showNetDiv
    .append("input")
    .attr("class", "form-check-input")
    .attr("type", "checkbox")
    .attr("role", "switch")
    .attr("id", "button-show-net")

  const buttonShowNetLabel = showNetDiv
    .append("label")
    .attr("class", "form-check-label")
    .attr("for", "button-show-net")
    .text("Show Total Net Revenue");

  const buttonShowNeg = showNegDiv
    .append("input")
    .attr("class", "form-check-input")
    .attr("type", "checkbox")
    .attr("role", "switch")
    .attr("id", "button-show-net")

  const buttonShowNegLabel = showNegDiv
    .append("label")
    .attr("class", "form-check-label")
    .attr("for", "button-show-net")
    .text("Show Negative Values");

  const buttonShowPercent = showPercentDiv
    .append("input")
    .attr("class", "form-check-input")
    .attr("type", "checkbox")
    .attr("role", "switch")
    .attr("id", "button-show-percent")

  const buttonShowPercentLabel = showPercentDiv
    .append("label")
    .attr("class", "form-check-label")
    .attr("for", "button-show-percent")
    .text("Show Percentage Values");

  function drawWhichStacks() {
    if (showSelected) {
      return selectedStackedData
    } else if (showNet) {
      if (showPercent) {
        yScale = linearScale([-0.1, 1]);
        return percentStackedData
      } else {
        yScale = linearScale([-100000, 9000000]);
        return stackedData
      }
    } else {
      if (showPercent) {
        yScale = linearScale([0, 1])
        return posPercentStackedData
      } else {
        yScale = linearScale([-100000, 9000000]);
        return posStackedData
      }
    }
  }

  buttonShowNet.node().addEventListener("click", netOnClick);
  buttonShowNeg.node().addEventListener("click", negOnClick);
  buttonShowPercent.node().addEventListener("click", percentOnClick);
  function netOnClick() {
    if (showSelected) {
      showNet = false
    }
    showNet = !showNet
    showSelected = false;
    drawStacks(drawWhichStacks())
    drawPeripherals();
  }
  function negOnClick() {
    showNegative = !showNegative;
    const CorporateIncomeTaxRefundsRevenueArea = bounds.selectAll("#CorporateIncomeTaxRefundsRevenue")
    const IndividualIncomeTaxRefundsRevenueArea = bounds.selectAll("#IndividualIncomeTaxRefundsRevenue")
    if (showNegative) {
      CorporateIncomeTaxRefundsRevenueArea.style("pointer-events", "all")
      IndividualIncomeTaxRefundsRevenueArea.style("pointer-events", "all")
    } else {
      CorporateIncomeTaxRefundsRevenueArea.style("pointer-events", "none")
      IndividualIncomeTaxRefundsRevenueArea.style("pointer-events", "none")
    }
    drawStacks(drawWhichStacks())
    drawPeripherals()
  }
  function percentOnClick() {
    if (showSelected) {
      showNet = false
    }
    showPercent = !showPercent;
    showSelected = false;
    drawStacks(drawWhichStacks())
    drawPeripherals()
  }
  //#endregion

  //#region Selection
  const selectionDropdown = d3.select("#selection-collapse")
  const checkboxWrapper = selectionDropdown.append("div")
    .attr("id", "checkbox-wrapper")
    .attr("class", "checkbox-wrapper")
  let buttonSelection = [];
  let buttonSelectionLabel = [];
  let buttonSelectionBreak = [];
  for (let i = 0; i < keys.length; i++) {
    buttonSelection[i] = checkboxWrapper
      .append("input")
      .attr("class", "selectionCheckbox")
      .attr("class", "form-check-input")
      .attr("id", `${orderedKeys[i]}Checkbox`)
      .attr("type", "checkbox")
    buttonSelectionLabel[i] = checkboxWrapper
      .append("label")
      .attr("class", "form-check-label")
      .attr("for", `${orderedKeys[i]}Checkbox`)
      .html(`&nbsp${labels[i]}`);
    buttonSelectionBreak[i] = checkboxWrapper
      .append("br");
  }
  selectionDropdown.append("br");
  const buttonSelectAll = selectionDropdown
    .append("button")
    .attr("class", "btn btn-outline-primary")
    .text("Select All");
  const buttonDeselectAll = selectionDropdown
    .append("button")
    .attr("class", "btn btn-outline-primary")
    .text("Deselect All");
    selectionDropdown.append("br");
  const buttonConfirmSelection = selectionDropdown
    .append("button")
    .attr("class", "btn btn-outline-primary")
    .text("Confirm Selection");

  let selectedStackedData = [];

  buttonConfirmSelection.node().addEventListener("click", confirmOnClick);
  buttonSelectAll.node().addEventListener("click", checkAll);
  buttonDeselectAll.node().addEventListener("click", uncheckAll);
  function confirmOnClick() {
    showNet = false;
    showPercent = false;
    showSelected = true;
    buttonShowNet.property('checked', false);
    buttonShowPercent.property('checked', false);
    const selectedData = deepClone(data);
    let buttons = [];
    let selectedKeys = [];
    let max = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let min = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < keys.length; i++) {
      buttons[i] = d3.select(`#${keys[i]}Checkbox`);
      for (let j = 0; j < timeSpan[1] - timeSpan[0] + 1; j++) {
        if (!buttons[i].property("checked")) {
          selectedData[j][`${keys[i]}`] = 0;
        } else {
          if (selectedData[j][`${keys[i]}`] < 0) {
            min[j] += Number(selectedData[j][`${keys[i]}`]);
          }
          max[j] += Number(selectedData[j][`${keys[i]}`]);
        }
      }
    }
    selectedStackedData = d3.stack()
      .keys(keys)
      (selectedData.slice(timeSpan[0] - 2011, timeSpan[1] - 2010));
    selectedStackedData = selectedStackedData.reverse();
    yScale = linearScale([d3.min(min), d3.max(max)]);
    drawStacks(drawWhichStacks())
    drawPeripherals();
  }
  function checkAll() {
    checkboxWrapper.selectAll('input').property('checked', 'true');
  }
  function uncheckAll() {
    checkboxWrapper.selectAll('input').property('checked', false);
  }
  //#endregion

  //#region Tooltip
  const tooltip = d3.select("#tooltip")

  function mouseOver(d) {
    tooltip
      .style("opacity", 1);

    const datapoint = d.srcElement.__data__;
    const areaEndpoints = datapoint[timeSpan[1] - 2011];
    const y = yScale((areaEndpoints[1] + areaEndpoints[0]) / 2) + dimensions.margin.top;
    const x = xScale(timeSpan[1]) + dimensions.margin.left;

    tooltip.select("#label")
      .text(labels[datapoint.index]);

    const dot = bounds.append("circle")
      .attr("class", "tooltip-dot")
      .attr("cx", xScale(timeSpan[1]))
      .attr("cy", yScale((areaEndpoints[1] + areaEndpoints[0]) / 2))
      .attr("r", 6)
      .attr("stroke", "black")
      .style("stroke-width", 0.4)
      .style("fill", colorScale(datapoint.key))
      .style("pointer-events", "none");

    tooltip.style("transform", `translate(${1.015*x}px, calc(-50% + ${y + 96}px))`);
  }
  function mouseLeave(d) {
    tooltip
      .style("opacity", 0);

    d3.selectAll(".tooltip-dot")
      .remove();
  }
  //#endregion

  //#region Legend
  const legendItems = d3.select("#legend-accordion")
  let legendItem = []
  for (let i = 0; i < labels.length; i++) {
    legendItem[i] = legendItems.append("div")
      .attr("class", "accordion-item")

    legendItem[i]
      .append("h2")
        .attr("class", "accordion-header")
        .append("button")
          .attr("class", "accordion-button collapsed")
          .attr("type", "button")
          .attr("data-bs-toggle", "collapse")
          .attr("data-bs-target", `#legendItem${i}`)
          .attr("aria-expanded", "false")
          .attr("aria-control", `legendItem${i}`)
          .text(labels[i])
          .style("color", legendTextColor[i])
          .style("background-color", colorScale(labels[i]))

    legendItem[i]
      .append("div")
        .attr("id", `legendItem${i}`)
        .attr("class", "accordion-collapse collapse")
        .attr("data-bs-parent", "#legend-accordion")
        .append("div")
          .attr("class", "accordion-body")
          .text(descriptions[i])
  }
  //#endregion
}

drawStackChart();