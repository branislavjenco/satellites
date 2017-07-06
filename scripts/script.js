(function (window, document, undefined) {
    //ensure strict mode
    'use strict';
    var canvas;
    var scene, camera, renderer, controls, manager, stats;
    var windowW = window.innerWidth;
    var sceneW = window.innerWidth / 1.8; //let it be a bit bigger than a half
    var windowH = window.innerHeight;
    var raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.1;
    var mouse = new THREE.Vector2();
    var parseDate = d3.time.format("%m/%d/%Y").parse;
    var sats = []; //the array holding all the satellite data after parsing csv
    function onMouseMove(event) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / sceneW) * 2 - 1;
        mouse.y = -(event.clientY / windowH) * 2 + 1;
    }
    // Three.js setup procedure
    function setupScene() {
        scene = new THREE.Scene();
        canvas = document.getElementById("scene");
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(sceneW, windowH);
        renderer.setClearColor(0xF1F1D4, 1);
        camera = new THREE.PerspectiveCamera(60, sceneW / windowH, 0.5, 10000);
        camera.position.z = 30;
        renderer.shadowMap.enabled = false;
        manager = new THREE.LoadingManager();
        manager.onLoad = function () {
            render();
        };
    }
    //Three.OrbitControls setup procedure
    function setupControls() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.rotateSpeed = 0.2;
        controls.enableDamping = true;
        controls.dampingFactor = 0.3;
        controls.enablePan = false;
    }
    //Create sphere geometry and put the earth outline image onto it
    function createEarth() {
        var planet = new THREE.SphereGeometry(10, 32, 32);
        planet.rotateX((-23.4 * Math.PI) / 180);
        var planetMat = new THREE.MeshBasicMaterial({ color: 0xF1F1D4 });
        var TextureLoader = new THREE.TextureLoader(manager);
        TextureLoader.load('img/outlines2.png', function (texture) {
            texture.anisotropy = 8;
            planetMat.map = texture;
            planetMat.needsUpdate = false;
        });
        var outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
        var outlineMesh = new THREE.Mesh(planet, outlineMaterial);
        outlineMesh.scale.multiplyScalar(1.005);
        var planetMesh = new THREE.Mesh(planet, planetMat);
        planetMesh.add(outlineMesh);
        // Axix helpers
        // var planetHelper = new THREE.AxisHelper( 50 );
        // planetHelper.rotateX((-23.4 * Math.PI)/180);
        // planetMesh.add( planetHelper );
        scene.add(planetMesh);
    }
    // Populate the sats array, calculate orbital elements, put into scene
    function createSatellites() {
        var color = d3.scale.category20c();
        for (var i = 0; i < sats.length; i++) {
            sats[i].xRad = sats[i].sma;
            sats[i].yRad = sats[i].sma * Math.sqrt(1 - (sats[i].ecc * sats[i].ecc));
            sats[i].mat = new THREE.LineBasicMaterial({ color: color(sats[i].Purpose), opacity: 0.5, transparent: true });
            sats[i].curve = new THREE.EllipseCurve(0, 0, 10 / 6378000 * sats[i].xRad, 10 / 6378000 * sats[i].yRad, 0, 2 * Math.PI, false, (sats[i].raan * Math.PI) / 180);
            sats[i].path = new THREE.Path(sats[i].curve.getPoints(50));
            sats[i].path.autoClose = true;
            sats[i].geo = sats[i].path.createPointsGeometry(50);
            sats[i].geo.rotateX((sats[i].incl * Math.PI) / 180);
            sats[i].geo.rotateZ((sats[i].raan * Math.PI) / 180);
            sats[i].geo.rotateX(Math.PI / 2);
            sats[i].geo.rotateX((-23.4 * Math.PI) / 180);
            sats[i].mesh = new THREE.Line(sats[i].geo, sats[i].mat);
            scene.add(sats[i].mesh);
            //console.log(sats);
        }
    }
    // Show FPS stats in the corner
    function createStats() {
        stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);
    }
    // Draw a line along the X axis, unused
    function createDistanceLine() {
        var lineMat = new THREE.LineBasicMaterial({
            color: 0xFFC400
        });
        var distanceGeo = new THREE.Geometry();
        distanceGeo.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(100, 0, 0));
        var line = new THREE.Line(distanceGeo, lineMat);
        scene.add(line);
    }
    // Hacky way of adding a gradient in the middle, using a canvas element
    function addGradient() {
        var gradientCanvas = document.getElementById("gradient");
        gradientCanvas.width = windowW;
        gradientCanvas.style.width = windowW + "px";
        gradientCanvas.height = windowH;
        gradientCanvas.style.height = windowH + "px";
        var ctx = gradientCanvas.getContext("2d");
        var my_gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        my_gradient.addColorStop(0.8, "rgba(241, 241, 212,0)");
        my_gradient.addColorStop(1, "rgba(241, 241, 212,1)");
        ctx.fillStyle = my_gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    function makePieChart(dataset, property) {
        var gw = windowW - sceneW - 20;
        var gh = windowH / 2 - 40;
        var radius = Math.min(gw, gh) / 2;
        var color = d3.scale.category20c();
        var svg = d3.select('.graphs')
            .append('h1')
            .html(property);
        var svg = d3.select('.graphs')
            .append('svg')
            .style("width", gw + "px")
            .style("height", gh + "px")
            .attr('width', gw)
            .attr('height', gh)
            .classed("pieChart", true)
            .classed(property, true)
            .append('g')
            .attr('transform', 'translate(' + (gw / 4 * 2.8) + ',' + (gh / 2) + ')');
        var arc = d3.svg.arc()
            .outerRadius(radius - 30);
        var pie = d3.layout.pie()
            .value(function (d) { return d.count; })
            .sort(null);
        var path = svg.selectAll('path')
            .data(pie(dataset))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr("id", function (d, i) {
            return d.data.name;
        })
            .attr('fill', function (d, i) {
            return color(d.data.name);
        })
            .attr("fill-opacity", 0.7);
        var legendRectSize = 18;
        var legendSpacing = 4;
        var legend = svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function (d, i) {
            var height = legendRectSize + legendSpacing;
            var offset = height * color.domain().length / 2;
            var horz = -20 * legendRectSize;
            var vert = i * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
        });
        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color);
        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .style("fill", "#333333")
            .text(function (d) { return d; });
        var chosenDatum;
        svg.selectAll("path")
        .on('click', function () {
            chosenDatum = this.getAttribute("id");
            console.log(chosenDatum);
            sats.forEach(function (e) {
                if (e[property] != chosenDatum) {
                    e.mat.visible = false;
                } 
            });
            addTag(property, chosenDatum);
            d3.select("body").select("svg." + property).selectAll('path')
                .classed("noClick", true);

        });
    }
    function setupCharts() {
        var purposes = {};
        var users = {};
        // Create arrays of key value pairs, value being the count of satellites with that property
        sats.forEach(function (el) {
            purposes[el.Purpose] = (purposes[el.Purpose] || 0) + 1;
            users[el.Users] = (users[el.Users] || 0) + 1;
        });
        d3.select(".graphs").style("left", sceneW + "px");
        function toArray(data) {
            var array = [];
            for (var key in data) {
                array.push({ name: key, count: data[key] });
            }
            return array;
        }
        makePieChart(toArray(users), "Users");
        makePieChart(toArray(purposes), "Purpose (corresponding color)");
    }
    function addTag(property, name) {
        d3.select(".tags")
            .append("div")
            .classed("tag", true)
            .style("float", "left")
            .style("padding", 3 + "px")
            .style("margin", 1 + "px")
            .style("background-color", "white")
            .style("cursor", "pointer")
            .html(property + ": " + name);
        d3.select(".reset")
            .style("opacity", 1)
            .on('mouseenter', function () {
            d3.select(this).style("color", "#ff0000");
        })
            .on('mouseleave', function () {
            d3.select(this).style("color", "#ffffff");
        })
            .on('click', function () {
            d3.selectAll(".tag").remove();
            sats.forEach(function (e) {
                e.mat.visible = true;
            });
            d3.select("body").selectAll("svg").selectAll("path").classed("noClick", false);
            d3.select(".reset").style("opacity", 0.1);
        });
    }
    function init() {
        window.addEventListener('mousemove', onMouseMove, false);
        window.onkeyup = function (e) {
            var key = e.keyCode ? e.keyCode : e.which;
            if (key == 32) {
                controls.autoRotate = !controls.autoRotate;
            }
        };
        setupScene();
        setupControls();
        createEarth();
        createSatellites();
        createStats();
        //createDistanceLine();
        setupCharts();
        addGradient();
        splash();
    }
    function splash() {
        d3.select(".btn")
            .on("click", function () {
            d3.select(".splash").remove();
        });
    }
    function checkForRaycasts() {
        raycaster.setFromCamera(mouse, camera);
        for (var i = 1; i < scene.children.length; i++) {
            scene.children[i].material.opacity = 0.5;
        }
        //calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(scene.children);
        //only first intersect
        if (intersects.length != 0) {
            if (print)
                console.log(intersects);
            print = false;
            if (intersects[0].object.type == "Line") {
                // intersects[0].object.material.color.set( 0xffff00 );
                intersects[0].object.material.opacity = 1.0;
            }
        }
    }
    function render() {
        requestAnimationFrame(render);
        controls.update();
        stats.begin();
        if (mouse.x < sceneW) {
            checkForRaycasts();
        }
        renderer.render(scene, camera);
        stats.end();
    }
    d3.csv('satellites.csv', function (d) {
        return {
            norad: d.norad,
            name: d.name,
            date: parseDate(d.launch_date),
            sma: +d.sma,
            ecc: +d.ecc,
            incl: +d.incl,
            raan: +d.raan,
            Country: d.country,
            owner: d.owner,
            Users: d.users,
            Purpose: d.purpose,
            apogee: +d.apogee,
            perigee: +d.perigee,
            mass: +d.mass,
            contractor: d.contractor,
            contractor_country: d.contractor_country,
            launch_site: d.launch_site,
            launch_vehicle: d.launch_vehicle
        };
    }, function (data) {
        sats = data.slice(); //copy 
        init();
    });
})(window, document);
