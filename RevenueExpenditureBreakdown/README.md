# Hawaii Revenue Expenditure Breakdown

## Coded by Dylan Yasuhara

### Description

This code creates a program that effectively helps users visualize Hawaii's Revenue Expenditure Breakdown from 2011 to 2021. Users can modify the graphs by selecting certain categories, choosing to view or hide negative values, or see the graph in its purely positive form or in percentage form.

### Data Collection

- Data gathered from the [UHERO Data Portal](https://data.uhero.hawaii.edu/#/category?id=31&data_list_id=34)
- Total Revenue Category ignored
- Corporate Income Tax Revenue Category ignored (composition of Corporate Income Tax sections)
- Individual Income Tax Revenue Category ignored (composition of Individual Income Tax sections)

### Documentation

1. Access Data: Accesses data from CSV file and creates a way to clone data
2. Create Chart Dimensions: Sets width, height and margin for chart
3. Draw Canvas: Creates a cavas upon which graphs will be drawn
4. Keys: Selects the keys to access data from (ignored categories taken out) and reorders data categories
5. Labels and Descriptions: Initializes labels that are properly spaced and punctuated
6. Calcs: Initial calculations to confirm data
7. Draw Peripherals: Drawing axes, ticks, headings, etc.
8. Scales: Creates spans for both axes and sets color for regions
9. Statics: Appends x and y axes
10. Toggles: Initializes buttons
11. Stacks, Stack Functions: Creates stacks and function to draw stacks from a dataset
12. Initialized Graph: Creates graph upon opening program
13. Net, Percent, and Negative Buttons: Allows user to see net values, negative values, and percentage of total revenue
14. Selection: Allows user to select categories and observe them at more precise scales
15. Tooltip: Creates a tooltip for accessibility
16. Legend: Creates a colored legend to read the graph, along with descriptions in an accordion

### Other Notes

- Nothing needs to be run to open this file.
- D3 already imported in chart.js