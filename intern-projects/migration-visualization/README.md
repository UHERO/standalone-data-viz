# Hawaii Migration Visualization

## Coded by Dylan Yasuhara

### Description

This code creates a program that effectively helps users visualize Hawaii's Migration from 2021 to 2022. Users can choose between three categories to view: amount of returns filed, amount of individuals accounted for, and the adjusted gross income. Change is represented by color, with orange representing a net outflow and blue representing a net inflow.

### Data Collection

- Map gathered from https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
    - Name: Admin - 2 Counties
- Data gathered from https://www.irs.gov/statistics/soi-tax-stats-migration-data-2021-2022
- For county to different state (e.g. From County of Honolulu to California), estimates were made, since not all counties from California were accounted for in the files. As such, the counties that corresponded to a specific Hawaii county were summed, divided by the numbers from all counties in a state were summed, and finally multiplied by the total sum reported on the state inflow sheet
- Ensure that if you are to run this program for other years with other csv files, you must delete other text and replace the headers with as such:
    - County-Inflow: DestinationStateCode,DestinationCountyCode,OriginStateCode,OriginCountyCode,OriginStateAbbr,OriginCountyName,Returns,Individuals,AdjustedGrossIncome
    - County-Outflow: OriginStateCode,OriginCountyCode,DestinationStateCode,DestinationCountyCode,DestinationStateAbbr,DestinationCountyName,Returns,Individuals,AdjustedGrossIncome
    - State-Inflow: DestinationStateCode,OriginStateCode,OriginStateAbbr,OriginStateName,Returns,Individuals,AdjustedGrossIncome
    - State-Outflow: OriginStateCode,DestinationStateCode,DestinationStateAbbr,DestinationStateName,Returns,Individuals,AdjustedGrossIncome

### Documentation

1. Data: Data is downloaded and organized
2. Orient Coordinates: Map data imported was backwards, ensures that islands are oriented the counterclockwise
3. Toggles: Accesses buttons calls functions that occur when toggles are pressed
4. Scales: Creates scales for each different categories
5. Data Manipulation: Creates summaries for both county and state data from the inflow and outflow datasets to get an inflow, outflow, and net change for each category
6. Draw Map: Creates a map
7. Draw Scale: Creates a gradient scale with tickmarks
8. Draw Circles: Creates circles for major states', other states', and foreign changes
9. Fill: Changes the fill for each of the shapes
10. Tooltip: Moves a tooltip and adds numeric details

### Other Notes

- To ensure that significant differences in color could be realized, a fourth root scale was used instead of a traditional linear scale, as there were several extraneous values that essentially voided miniscule interisland data.
- Nothing needs to be run to open this file
- D3 imported in script.js