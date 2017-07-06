PV251 Project - Branislav Jenčo - 397519

URL: http://www.branislavjenco.com/satellites

The visualization uses D3.js to parse a csv table and show charts, and Three.js for the 3D view.

It must be run on a server (because of csv loading) and should be running well on the latest versions of Chrome, Firefox and Microsoft Edge. A working version can be found at http://www.fi.muni.cz/~x397519/PV251/ 

The table itself is a product of fusing two tables from the UCS Satellite Database website. First table was the collection of all ~2200 satellites orbiting earth, with lots of information about each one. The problem with this table was the fact that one last orbital element was missing from the data (the Right Ascension of the Ascending Node or RAAN). Without this element I couldn't construct proper orbits. I found a second table of satellites from the same source, which had all the elements needed, but this table only represents a subset of all satellites, namely a subset of satellites which performed some form of manuever to correct their trajectory. This second table also had very limited information above the needed orbital elements. 

Both tables had a field for the satellite's NORAD classification number, and that proved helpful. I used the online Google Fusion Table service to (inner) merge these two tables using the NORAD number. I have therefore created a table with around 400 satellites with their properties and orbital elements.

The resulting geometry is calculated from these orbital elements. 

The source csv table can be found in this folder. There is much more information about each satellite and my goal is develop this project further:
	- to be able to select arbitrary fields and filter accordingly
	- to create other types of charts, barcharts were also implemented, but not used
	- by clicking on an orbit, to show all the information about the corresponding satellite, because of time constraints I could not make this in time (raycasting a particular orbit is implemented)

Known bugs
	- the legend can overlap with the pie chart slightly on certain resolutions
