import { SpaceX } from "./api/spacex";
import * as d3 from "d3";
import * as Geo from './geo.json';

const MAP_FILL = "#d0e3f0";
const R = 6;
const R_ACTIVE = 12;

document.addEventListener("DOMContentLoaded", setup);

let dots = d3.selectAll(null);
let labels = d3.selectAll(null);

async function setup() {
    const spaceX = new SpaceX();
    const pads = await spaceX.launchpads();
    renderList(pads, document.getElementById("listContainer"));
    drawMap(pads);
}

function renderList(pads, container) {
    const ul = document.createElement("ul");
    for (const pad of pads) {
        for (const name of pad.launches) {
            const li = document.createElement("li");
            li.className = "launch";
            li.textContent = name;
            li.dataset.launchpadId = pad.id;
            li.addEventListener("mouseenter", () => highlight(pad.id, true));
            li.addEventListener("mouseleave", () => highlight(pad.id, false));
            ul.appendChild(li);
        }
    }
    container.replaceChildren(ul);
}

function drawMap(pads) {
    const W = 640, H = 480;
    const margin = { top: 20, right: 10, bottom: 40, left: 100 };

    const svg = d3.select("#map").append("svg")
        .attr("width", W + margin.left + margin.right)
        .attr("height", H + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const projection = d3.geoMercator()
        .scale(70)
        .center([0, 20])
        .translate([W / 2 - margin.left, H / 2]);

    svg.append("g")
        .selectAll("path")
        .data(Geo.features)
        .join("path")
        .attr("class", "topo")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", MAP_FILL)
        .style("opacity", 0.7);

    const features = pads.map(p => ({
        type: "Feature",
        id: p.id,
        name: p.name,
        geometry: { type: "Point", coordinates: [p.longitude, p.latitude] }
    }));

    const xy = f => projection(f.geometry.coordinates) ?? [0, 0];

    dots = svg.append("g")
        .selectAll("circle")
        .data(features)
        .join("circle")
        .attr("class", "launchpad")
        .attr("cx", f => xy(f)[0])
        .attr("cy", f => xy(f)[1])
        .attr("r", 0)
        .attr("fill", "#e63946");

    dots.append("title").text(f => f.name);
    dots.transition().duration(600).attr("r", R);

    labels = svg.append("g")
        .selectAll("text")
        .data(features)
        .join("text")
        .attr("class", "launchpad-label")
        .attr("x", f => xy(f)[0] + 8)
        .attr("y", f => xy(f)[1] + 4)
        .text(f => f.name);
}

function highlight(id, on) {
    d3.selectAll(".launch")
        .classed("active", function () {
            return on && this.dataset.launchpadId === id;
        });

    dots
        .classed("launchpad--active", d => d.id === id && on)
        .transition().duration(150)
        .attr("r", d => d.id === id && on ? R_ACTIVE : R);

    labels
        .classed("launchpad-label--active", d => d.id === id && on);
}