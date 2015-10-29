Meteor.startup(function () {

});

//create Collections
var trashesCollection = new Meteor.Collection('trashesCollection');
var fotoLocationsCollection = new Meteor.Collection('fotoLocationsCollection');
var fotoLocationsJulyCollection = new Meteor.Collection('fotoLocationsJulyCollection');
var fotoLocationsAugustCollection = new Meteor.Collection('fotoLocationsAugustCollection');

//if template "map" is renderd
Template.map.rendered = function () {
    var selector = function (selector) {
            return document.querySelector(selector);
        },
        selectors = function (selector) {
            return document.querySelectorAll(selector);
        };

    var toggleFilterImg = selector('.togglefilterimg'),
        toggleFilter = selector('.togglefilter'),
        filter = selector('.filter'),
        informotion = selector('.informotion'),
        crowdedness = selector('.crowdedness'),
        trashes = selector('.trashes'),
        cleaningIntensity = selector('.cleaning-intensity'),
        nextMonth = selector('.nextmonth'),
        previousMonth = selector('.previousmonth'),
        months = selector('.months'),
        month = selector('.month'),
        districts = selector('.districts'),
        districtsP = selector('.districts p'),
        closeButton = selector('.close'),
        statistic = selector('.statistic'),
        districtname = selector('.districtname'),
        navigationBar = selector('.navigationbar'),
        gradeMark = selector('.grade-mark'),
        amountTrashesMark = selector('.amount-trashes-mark'),
        cleaningintensity = selector('.cleaningintensity-label'),
        showMore = selector('.showmore'),
        previousDistrict = selector('.previousdistrict'),
        nextDistrict = selector('.nextdistrict');

    //subscribe to trashesCollection
    Meteor.subscribe('trashesCollection', function () {
        var trashesData = trashesCollection.find().fetch();
        //callback to setTrashes
        setTrashes(trashesData)
    });

    //subscribe to fotoLocationsCollection
    Meteor.subscribe('fotoLocationsJulyCollection', function () {
        var fotosDataJuly = fotoLocationsJulyCollection.find().fetch();
        setFotoLocationJuly(fotosDataJuly);
        Meteor.subscribe('fotoLocationsAugustCollection', function () {
            var fotosDataAugust = fotoLocationsAugustCollection.find().fetch();
            Meteor.subscribe('fotoLocationsCollection', function () {
                var fotosDataSeptember = fotoLocationsCollection.find().fetch();
                toggleMonths(fotosDataJuly, fotosDataAugust, fotosDataSeptember)
            });
        });
    });

    var layerIDs = [];       
    HTTP.get(Meteor.absoluteUrl("data/map.json"), function (err, result) {                
        geoData = result.data;
        var gData = geoData.features;
        var i = 0;
        for (i; i < gData.length; i++) {
            layerIDs.push(gData[i].properties.id);
        };            
        geoDatafunction(geoData);
    });   

    //    HTTP.get(Meteor.absoluteUrl("data/schoonmaakintensiteit.json"), function (err, result) {                
    //        heatmapLayer = result.data;                
    //        createheatmap(heatmapLayer);        
    //    });    

    var districtsData = null;
    HTTP.get(Meteor.absoluteUrl("data/districtsdata.json"), function (err, result) {                
        districtsData = result.data;
    });  

    //create leaflet map and start coordiates
    var map = L.map('map', {
        center: [52.376956, 4.902756],
        maxZoom: 20,
        minZoom: 14,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        maxBounds: [[52.345197800248926, 4.82025146484375],
                    [52.424825961602764, 4.967708587646484]]
    });

    //add bounds to map
    map.fitBounds([
    [52.35746570026433, 4.863853454589844],
     [52.391734853683936, 4.944705963134766]
   ]);

    var baseLayer = L.tileLayer(
        'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
            attribution: 'Informotion',
            subdomains: 'abcd',
            maxZoom: 19
        });

    L.tileLayer.provider('CartoDB.PositronNoLabels').addTo(map);

    //create div icon with class trash
    var trashIcon = L.divIcon({
        className: 'trashicon'
    });
    var fotoIconJuly = L.divIcon({
        className: 'foto-icon-july'
    });
    var fotoIconAugust = L.divIcon({
        className: 'foto-icon-august'
    }); 
    var fotoIconSeptember = L.divIcon({
        className: 'foto-icon-september'
    });

    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();

    //        set foto's july on map
    //    var setFotoLocationJuly = function (fotosDataJuly) {
    //        var Amountfotos = fotosDataJuly.length,
    //            f = 0;
    //        for (f; f < Amountfotos; f++) {
    //            var longitude = fotosDataJuly[f].log;
    //            var latitude = fotosDataJuly[f].lat;
    //            L.marker([latitude, longitude], {
    //                icon: fotoIconJuly,
    //            }).addTo(map);
    //        }
    //    };
    //set trashes on map
    var setTrashes = function (trashesData) {
        var markers = new L.FeatureGroup(),
            trashnumber = 0;

        function getLatLng(map) {
            var lngSpan = trashesData[trashnumber].log,
                latSpan = trashesData[trashnumber].lat;
            trashnumber++;
            return new L.LatLng(
                latSpan,
                lngSpan);
        }

        function trashes() {
            for (var i = 0; i < trashesData.length; i++) {
                var marker = L.marker(getLatLng(map), {
                    icon: trashIcon
                });
                markers.addLayer(marker);
            }
            return false;
        }
        map.addLayer(markers);
        trashes();
    };

    var geojson;

    //What happens on mouseover
    function highlightFeature(e) {
        var layer = e.target;
        var layerName = layer.feature.properties.name,
            layerID = layer.feature.properties.id,
            SvgMapPart = selector('.mappopup'),
            popup = selector('.popup'),
            overlayList = document.querySelectorAll(".overlay");

        var xPosition = event.clientX;
        var yPosition = event.clientY;

        //If there are elements with the "overlay" class, then hover will work and shows popup. Otherwise not.
        if (overlayList.length === 0) {
            SvgMapPart.classList.remove("none");
            if (layerName !== "rightgone" && layerName !== "leftgone") {
                showMore.setAttribute('class', 'showmore noselect ' + layerID)
                popup.innerHTML = layerName;
                SvgMapPart.style.position = "absolute";
                SvgMapPart.style.left = xPosition + -20 + 'px';
                SvgMapPart.style.top = yPosition + -90 + 'px';
                layer.setStyle({
                    //                weight: 5,
                    fillColor: '#D83E41',
                    dashArray: '',
                    fillOpacity: 1
                });
                if (!L.Browser.ie && !L.Browser.opera) {
                    layer.bringToFront();
                }
            } else {
                //adds class that hides the popup
                SvgMapPart.classList.add("none");
            };
        };
    };

    //reset on mouseout
    function resetHighlight(e) {
        geojson.resetStyle(e.target);
    };
    var zoomState = false;

    function clickFeature(e) {
        if (zoomState === false) {
            zoomState = true;
            var layertje = e.target,
                layerName = layertje.feature.properties.name,
                layerID = layertje.feature.properties.id,
                SvgMapPart = selector('.mappopup'),
                overlayList = document.querySelectorAll(".overlay");

            SvgMapPart.classList.add("none");
            closeButton.classList.remove("none");
            districts.classList.add("none");
            navigationBar.classList.remove("none");
            statistic.classList.remove("none");

            console.log(e.target)
            var getBoutdsOfDistrict = e.target.getBounds(),
                DistrictNorthEastlng = getBoutdsOfDistrict._northEast.lng + 0.008,
                DistrictNorthEastlat = getBoutdsOfDistrict._northEast.lat,
                DistrictSouthWestlng = getBoutdsOfDistrict._southWest.lng + 0.008,
                DistrictSouthWestlat = getBoutdsOfDistrict._southWest.lat,
                southWest = L.latLng(DistrictSouthWestlat, DistrictSouthWestlng),
                northEast = L.latLng(DistrictNorthEastlat, DistrictNorthEastlng),
                bounds = L.latLngBounds(southWest, northEast);

            map.fitBounds(bounds);
            districtname.innerHTML = layerName;
            setDistrictData(layerID)

            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();

            //If there are elements with the "overlay" class, then classes will be added to paths. Otherwise not.
            if (overlayList.length === 0) {
                //gives classes to paths, with which they can be styled
                if (layerName !== "rightgone" && layerName !== "leftgone") {
                    var j = 0;
                    for (j; j < layerIDs.length; j++) {
                        if (layerIDs[j] !== layerID) {
                            document.getElementById(layerIDs[j]).setAttribute('class', 'overlay');
                        } else {
                            document.getElementById(layerIDs[j]).setAttribute('class', 'transparent');
                        };
                    };
                };
            };
        };
    };


    var setDistrictData = function (layerID) {
        if (districtsData !== null && districtsData !== undefined) {
            var indexLayer = layerIDs.indexOf(layerID),
                districtData = districtsData[layerID],
                previousNumber = indexLayer - 1,
                nextNumber = indexLayer + 1,
                previousID, nextID;
            //funtion to give id to naviation buttons
            gradeMark.innerHTML = districtData.mark;
            amountTrashesMark.innerHTML = districtData.trashes;
            cleaningintensity.innerHTML = districtData.cleaningintensity;
            if (indexLayer === 0) {
                previousID = layerIDs[layerIDs.length - 3];
                nextID = layerIDs[nextNumber];
            }
            if (indexLayer === layerIDs.length - 3) {
                previousID = layerIDs[previousNumber];
                nextID = layerIDs[0];
            }
            if (indexLayer !== 0 && indexLayer !== layerIDs.length - 3) {
                previousID = layerIDs[previousNumber];
                nextID = layerIDs[nextNumber];
            }
            nextDistrict.setAttribute('id', nextID + "2");
            previousDistrict.setAttribute('id', previousID + "2");
        }
    };
    previousDistrict.addEventListener('click', function (e) {
        pDID = previousDistrict.getAttribute('id');
        var previousDistrictID = pDID.replace('2', '');
        var j = 0;
        for (j; j < layerIDs.length; j++) {
            if (layerIDs[j] !== previousDistrictID) {
                document.getElementById(layerIDs[j]).setAttribute('class', 'overlay');
                setDistrictData(previousDistrictID)
            } else {
                document.getElementById(layerIDs[j]).setAttribute('class', 'transparent');
                setDistrictData(previousDistrictID)
            };
        }
    });
    nextDistrict.addEventListener('click', function (e) {
        nDID = nextDistrict.getAttribute('id');
        var nextDistrictID = nDID.replace('2', '');
        var j = 0;
        for (j; j < layerIDs.length; j++) {
            if (layerIDs[j] !== nextDistrictID) {
                document.getElementById(layerIDs[j]).setAttribute('class', 'overlay');
                setDistrictData(nextDistrictID)
            } else {
                document.getElementById(layerIDs[j]).setAttribute('class', 'transparent');
                setDistrictData(nextDistrictID)
            };
        }
    });


    closeButton.addEventListener('click', function () {
        zoomState = false;
        districts.classList.remove("none");
        closeButton.classList.add("none");
        statistic.classList.add("none");
        navigationBar.classList.add("none");
        map.fitBounds([
            [52.35746570026433, 4.863853454589844],
            [52.391734853683936, 4.944705963134766]
        ]);

        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();

        var i = 0;
        for (i; i < layerIDs.length; i++) {
            document.getElementById(layerIDs[i]).removeAttribute('class', 'overlay');
            document.getElementById(layerIDs[i]).removeAttribute('class', 'transparent');
        };
    });

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: clickFeature
        });
    };

    //Create the map of Amsterdam Centrum and render it.
    var myStyle = {
        "fillColor": "#fff",
        "fillOpacity": 0.0,
        "color": "RGBA(255, 255, 255, 0)"
    }

    var geoDatafunction = function (geoData) {
        cleaningIntensity = L.geoJson(geoData, {
            style: function (feature) {
                    return {
                        "fillColor": feature.properties.fill,
                        "fillOpacity": 0.6,
                        "weight": 0
                    };
            }
        }).addTo(map) 

        geojson = L.geoJson(geoData, {
            style: myStyle,
            onEachFeature: onEachFeature
        }).addTo(map) 

        geojson.eachLayer(function (layer) {
            layer._path.id = layer.feature.properties.id;
        });
    };

    //filters
    var closed = false;
    var myMap = document.getElementById("map");
    var windowWidth = window.innerWidth; 
    var informotionWidth = windowWidth - 243 + "px";

    toggleFilter.addEventListener('click', function () {
        if (closed === false) {
            var windowWidth = window.innerHeight;
            closed = true;
            TweenMax.to(filter, 2, {
                x: -293
            });
            TweenMax.to(toggleFilterImg, 2, {
                rotation: -45
            });
            TweenMax.to(informotion, 2, {
                width: windowWidth,
                css: {
                    marginLeft: -293
                }
            });
            TweenMax.to(myMap, 2, {
                left: "100px"
            });
        } else {
            var informotionWidth = informotion.offsetWidth;
            closed = false;
            TweenMax.to(filter, 2, {
                x: 0
            });
            TweenMax.to(toggleFilterImg, 2, {
                rotation: 0
            });
            TweenMax.to(informotion, 2, {
                width: informotionWidth,
                css: {
                    marginLeft: -0
                }
            });
            TweenMax.to(myMap, 2, {
                left: 0
            });
        }
    });
    crowdedness.addEventListener('click', function () {
        crowdedness.classList.toggle('disabled');
        var fotoAugust = selectors('.foto-icon-august'),
            fotoJuly = selectors('.foto-icon-july'),
            fotoSeptember = selectors('.foto-icon-september'),
            a = 0,
            j = 0,
            s = 0;
        for (a; a < fotoAugust.length; a++) {
            fotoAugust[a].classList.toggle("none");
        };
        for (j; j < fotoJuly.length; j++) {
            fotoJuly[j].classList.toggle("none");
        }
        for (s; s < fotoSeptember.length; s++) {
            fotoSeptember[s].classList.toggle("none");
        }
    });

    //trashes
    var trashesfilter = false;
    trashes.addEventListener('click', function () {
        var trashIcons = selectors('.trashicon'),
            t = 0;
        for (t; t < trashIcons.length; t++) {
            trashIcons[t].classList.toggle("none");
        }
    });

    // month controllers
    TweenMax.to(previousMonth, 0.2, {
        opacity: 0.3
    });

    var slides = $('.slides');
    var $slideWrapper = $('.months');
    var width = [0, -44, -90, -185];
    var width2 = [0, 0, -90, -185];
    var currentImageCount = 1;

    var moveToNext = function () {
        if (currentImageCount !== 3) {
            currentImageCount++;
            TweenMax.to(slides, 0.5, {
                x: width[currentImageCount]
            });
            TweenMax.to(previousMonth, 0.2, {
                opacity: 1
            });
            if (currentImageCount === 3) {
                TweenMax.to(nextMonth, 0.2, {
                    opacity: 0.3
                });
            }
        } else {
            TweenMax.to(nextMonth, 0.2, {
                opacity: 0.3
            });
        }
    };

    var moveToPrevious = function () {
        if (currentImageCount !== 1) {
            currentImageCount--;
            TweenMax.to(slides, 0.5, {
                x: width2[currentImageCount]
            });
            TweenMax.to(nextMonth, 0.2, {
                opacity: 1
            });
            if (currentImageCount === 1) {
                TweenMax.to(previousMonth, 0.2, {
                    opacity: 0.3
                });
            }
        } else {
            TweenMax.to(previousMonth, 0.2, {
                opacity: 0.3
            });
        }
    };
    nextMonth.addEventListener('mouseover', function () {
        if (currentImageCount !== 3) {
            TweenMax.to(nextMonth, 0.2, {
                opacity: 0.60
            });
        }
    });
    nextMonth.addEventListener('mouseout', function () {
        if (currentImageCount !== 3) {
            TweenMax.to(nextMonth, 0.2, {
                opacity: 1
            });
        }

    });
    previousMonth.addEventListener('mouseover', function () {
        if (currentImageCount !== 1) {
            TweenMax.to(previousMonth, 0.2, {
                opacity: 0.60
            });
        }
    });
    previousMonth.addEventListener('mouseout', function () {
        if (currentImageCount !== 1) {
            TweenMax.to(previousMonth, 0.2, {
                opacity: 1
            });
        }
    });

    function toggleMonths(fotosDataJuly, fotosDataAugust, fotosDataSeptember) {
        nextMonth.addEventListener('click', function () {
            var juliIcons = selectors('.foto-icon-july');
            var augustIcons = selectors('.foto-icon-august');
            var sepemberIcons = selectors('.foto-icon-september');
            //            fotosDataJuly
            setTimeout(function () {
                crowdedness.classList.remove('disabled');
                if (currentImageCount === 2) {
                    var j = 0;
                    for (j; j < juliIcons.length; j++) {
                        juliIcons[j].parentNode.removeChild(juliIcons[j]);
                    }
                    // set foto's August on map
                    var AmountfotosAugust = fotosDataAugust.length,
                        f = 0;
                    for (f; f < AmountfotosAugust; f++) {
                        var longitude = fotosDataAugust[f].log;
                        var latitude = fotosDataAugust[f].lat;
                        L.marker([latitude, longitude], {
                            icon: fotoIconAugust,
                        }).addTo(map);
                    }
                }
                if (currentImageCount === 3) {
                    var s = 0;
                    for (s; s < augustIcons.length; s++) {
                        augustIcons[s].parentNode.removeChild(augustIcons[s]);
                    }
                    //set foto's september on map
                    var AmountfotosSeptember = fotosDataSeptember.length,
                        sf = 0;
                    for (sf; sf < AmountfotosSeptember; sf++) {
                        var longitude = fotosDataSeptember[sf].log;
                        var latitude = fotosDataSeptember[sf].lat;
                        L.marker([latitude, longitude], {
                            icon: fotoIconSeptember,
                        }).addTo(map);
                    }
                }
            }, 800);
            moveToNext()
        });
        previousMonth.addEventListener('click', function () {
            var juliIcons = selectors('.foto-icon-july');
            var augustIcons = selectors('.foto-icon-august');
            var sepemberIcons = selectors('.foto-icon-september');
            //            fotosDataJuly
            setTimeout(function () {
                crowdedness.classList.remove('disabled');
                if (currentImageCount === 1) {
                    var j = 0;
                    for (j; j < augustIcons.length; j++) {
                        augustIcons[j].parentNode.removeChild(augustIcons[j]);
                    }
                    // set foto's August on map
                    var AmountfotosJuly = fotosDataJuly.length,
                        f = 0;
                    for (f; f < AmountfotosJuly; f++) {
                        var longitude = fotosDataJuly[f].log;
                        var latitude = fotosDataJuly[f].lat;
                        L.marker([latitude, longitude], {
                            icon: fotoIconJuly,
                        }).addTo(map);
                    }
                }
                if (currentImageCount === 2) {
                    var j = 0;
                    for (j; j < sepemberIcons.length; j++) {
                        sepemberIcons[j].parentNode.removeChild(sepemberIcons[j]);
                    }
                    // set foto's August on map
                    var AmountfotosAugust = fotosDataAugust.length,
                        f = 0;
                    for (f; f < AmountfotosAugust; f++) {
                        var longitude = fotosDataAugust[f].log;
                        var latitude = fotosDataAugust[f].lat;
                        L.marker([latitude, longitude], {
                            icon: fotoIconAugust,
                        }).addTo(map);
                    }
                }
            }, 800);
            moveToPrevious()
        });
    }
    //close zoomed district
    closeButton.addEventListener('mouseover', function () {
        TweenMax.to(closeButton, 0.2, {
            opacity: 0.60
        });
    });
    closeButton.addEventListener('mouseout', function () {
        TweenMax.to(closeButton, 0.2, {
            opacity: 1
        });
    });
    //districts
    districts.addEventListener('mouseover', function () {
        TweenMax.to(districts, 0.2, {
            opacity: 0.60
        });
    });
    districts.addEventListener('mouseout', function () {
        TweenMax.to(districts, 0.2, {
            opacity: 1
        });
    });
    districts.addEventListener('click', function () {
        if (districtsP.innerHTML === "Verberg wijken") {
            districtsP.innerHTML = "Toon wijken"
            var i = 0;
            for (i; i < layerIDs.length; i++) {
                if (layerIDs[i] !== "left-gone" && layerIDs[i] !== "right-gone") {
                    document.getElementById(layerIDs[i]).removeAttribute('class');
                }
            };
        } else {
            districtsP.innerHTML = "Verberg wijken"
            var i = 0;
            for (i; i < layerIDs.length; i++) {
                if (layerIDs[i] !== "left-gone" && layerIDs[i] !== "right-gone") {
                    document.getElementById(layerIDs[i]).setAttribute('class', 'showdistrict');
                }
            };
        }
    });




};
