const width = 700;
const height = width;
const margin = 20;
const color = d3.scaleLinear()
  .domain([0, 5])
  .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
  .interpolate(d3.interpolateHcl);
const pack = d3.pack()
  .size([width - margin, width - margin])
  .padding(2);
const svg = d3.select("svg");
const g = svg.append("g")
  .attr("transform", "translate(" + width / 2 + "," + width / 2 + ")");

d3.csv("clusters.csv").then((data) => {
  console.log(data);

  return(data);
}).then((data) =>  d3.nest()
  .key((d) => d.cluster)
  .key((d) => d.linea)
  .key((d) => d.sublinea)
  .key((d) => d.clase)
  .key((d) => d.subclase)
  .rollup((v) => d3.sum(v, (d) => d.term_count))
  .entries(data)
).then((data) => {
  // TODO: Change to sum term_count
  const root = d3.hierarchy({key: "clusters", values: data}, (d) => d.values)
    .count()
    .sort((a, b) => b.value - a.value);
  const nodes = pack(root).descendants();
  let focus = root;
  let view;

  const circle = g.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", (d) => d.parent ?
      d.children ? "node" : "node node--leaf" :
      "node node--root")
    .style("fill", (d) => d.children ? color(d.depth) : null)
    .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

  const text = g.selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .style("fill-opacity", (d) => d.parent === root ? 1 : 0)
    .style("display", (d) => d.parent === root ? "inline" : "none")
    .text((d) => d.data.key);

  const node = g.selectAll("circle,text");

  zoomTo([root.x, root.y, root.r * 2 + margin], width);

  svg.on("click", function() { zoom(root); });

  function zoomTo(v) {
    const k = width / v[2];
    view = v;

    circle.attr("r", (d) => d.r * k);
    node.attr("transform", (d) => "translate(" +
      (d.x - v[0]) * k + "," + (d.y - v[1]) * k +
    ")");

  }

  function zoom(d) {
    var focus0 = focus;
    focus = d;

    var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", function(d) {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) { zoomTo(i(t)); };
        });

    transition.selectAll("text")
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }
});
