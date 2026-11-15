# MARSNAV – Interplanetary Survival Guide: Martian Map

**Team Name: Useless**

MARSNAV is a web-based project developed for the NASA Space Apps Challenge 2026. Our idea is to make exploring Mars easier by bringing together Martian maps, scientific information, surface hazards and route-planning features in one place.

Mars has a very challenging environment, and understanding its surface is important when planning future human exploration. Through MARSNAV, we aim to help users explore different regions of Mars, learn about important locations and understand some of the challenges astronauts may face during surface exploration.

## About the Project

MARSNAV provides an interactive map of Mars where users can explore different regions, view scientific points of interest and plan hypothetical exploration routes.

Instead of looking at different sources separately, users can access several types of Martian information through a single interface.

## Main Features

### 1. Interactive Mars Map

- Explore the Martian surface using an interactive map.
- Switch between available map layers.
- View important Martian regions and geographical features.
- Inspect locations and their coordinates.

### 2. Martian Locations and Scientific Information

The application includes information about several important Martian locations, such as:

- Jezero Crater – Perseverance rover landing region.
- Gale Crater – Curiosity rover exploration region.
- Arcadia Planitia – Region of interest for subsurface water ice.
- Utopia Planitia – Another region of interest for potential subsurface ice.
- Valles Marineris – One of the largest canyon systems on Mars.
- Olympus Mons – A major Martian volcano.

Users can explore location details such as coordinates, estimated elevation, geological information and potential hazards.

### 3. Surface Hazards

Mars exploration comes with several challenges. MARSNAV includes mapped hazard zones and information about potential surface risks, including steep slopes, rough terrain, canyon regions and areas with limited high-resolution imagery.

### 4. Marswalk Route Planner

One of the main features of MARSNAV is the route planner.

Users can:

- Add locations as route waypoints.
- Move or remove waypoints.
- Create their own exploration routes.
- Select predefined routes.
- Calculate the estimated distance between locations.
- Estimate travel time based on the selected speed.
- Estimate oxygen consumption based on crew size and travel duration.

### 5. Route Risk Assessment

After creating a route, MARSNAV evaluates it using four main factors:

- **Slope:** Estimates the steepness of the terrain between waypoints.
- **Hazard proximity:** Checks the distance from mapped hazard zones.
- **Distance and life support:** Considers route distance and estimated travel duration.
- **Data uncertainty:** Considers the availability of HiRISE imagery around the selected locations.

The application combines these factors into a risk score and displays a LOW, MODERATE, HIGH or NO-GO classification.

### 6. Elevation Profile and Mission Dashboard

The mission dashboard provides an overview of the planned route.

It displays:
- Total route distance.
- Estimated travel duration.
- Estimated oxygen consumption.
- Route risk score.
- Elevation profile.
- Safety warnings and risk-factor details.

## Data Sources

We used and referenced planetary data and resources from NASA missions and other planetary science organizations.

Some of the resources include:

| Resource | Purpose |
|---|---|
| MOLA – Mars Orbiter Laser Altimeter | Mars elevation and topography |
| Viking Mars Imagery | Mars surface basemap |
| THEMIS – Mars Odyssey | Thermal imaging information |
| HiRISE – Mars Reconnaissance Orbiter | High-resolution surface imagery |
| CRISM | Mineralogical information |
| Perseverance Mission | Jezero Crater exploration information |
| Curiosity Mission | Gale Crater exploration information |
| SWIM | Subsurface water ice mapping information |
| SHARAD | Subsurface radar information |
| InSight Mission | Mars environmental research |

Additional resources:

- [NASA Mars Trek](https://trek.nasa.gov/)
- [USGS Astrogeology](https://astrogeology.usgs.gov/)
- [USGS Planetary Nomenclature](https://planetarynames.wr.usgs.gov/)
- [HiRISE Image Archive](https://www.uahirise.org/)
- [OpenPlanetary](https://www.openplanetary.org/)

Note: The application uses a combination of map services and predefined scientific information. Not every dataset listed above is connected through a live API.

## Technologies Used

| Technology | How we used it |
|---|---|
| HTML5 | Structure of the website |
| CSS3 | Website design and styling |
| JavaScript | Application functionality and calculations |
| Leaflet.js | Interactive Mars map |
| Chart.js | Elevation and environmental charts |
| Font Awesome | Icons and interface elements |
| USGS WMS | Planetary map layers |
| NASA Mars Trek | Mars elevation map tiles |

## How to Use the Project

1. Open the MARSNAV application.
2. Explore the interactive Mars map.
3. Select different map layers to view available information.
4. Explore Martian locations and their details.
5. Open the Marswalk route planner.
6. Add waypoints or choose a predefined route.
7. Select the travel speed and crew size.
8. View the estimated distance, duration and oxygen consumption.
9. Check the route risk assessment and elevation profile.

## Future Improvements

We would like to improve MARSNAV further by adding:

- More live NASA data integrations.
- More detailed terrain and elevation information.
- Improved radiation and environmental hazard information.
- Better route optimization.
- Additional rover and orbiter observations.
- More detailed life-support and mission planning models.

## Project Limitations

MARSNAV is a conceptual exploration and mission-planning prototype. Its route distances, oxygen estimates and risk scores are simplified calculations based on predefined data and assumptions.

The results are intended for educational and demonstration purposes. They should not be considered validated for real astronaut missions or operational safety decisions.

## Our Goal

We developed MARSNAV to make Martian exploration information easier to access and understand. We hope this project demonstrates how mapping technology and planetary science data can be combined to support the planning and visualization of future human exploration of Mars.

## Project Information

**Challenge:** NASA Space Apps Challenge 2026  
**Project Name:** MARSNAV  
**Team Name:** Useless

**GitHub Repository:**  
https://github.com/trimoorthi/MARSNAV

**Project Demo:**  
https://github.com/trimoorthi/MARSNAV/blob/main/MARSNAV_Project_Demo_Presentation.pptx

---

*Exploring Mars today, preparing for tomorrow.*
