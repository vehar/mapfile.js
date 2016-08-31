let createViewerRegion = ((target, regionId, cssClass) => {
    let mapform = '<div ' + (cssClass ? ('class="' + cssClass + '"') : '') + (regionId ? (' id="' + regionId + '"') : '') + '>\n';
	mapform = mapform + '<form>\n';
	mapform = mapform + '<label>Открыть map файл: <input type="file" id="' + (regionId ? regionId : '') + 'fileForm' + '"></label>';
	mapform = mapform + '</form>\n';
    mapform = mapform + '</div>\n';
    let targetContainer = document.getElementById(target);
    if(targetContainer) {
        targetContainer.innerHTML = mapform;
    }

	let openFileForm = document.getElementById((regionId ? regionId : '') + 'fileForm');

	if(openFileForm) {
		openFileForm.addEventListener("change", (event) => {
	        var file = openFileForm.files[0];

	        let mapObj = mapfile.createInstance();

	        var reader = new FileReader();

	        reader.readAsText(file,"cp1251");
	        reader.onload = (e) => {
	            let mapStr = e.target.result;
	            mapfile.analyzeAsString(mapObj, mapStr);

				let roCodeValue = document.getElementById('mapfile_common_roCode');
			    let roDataValue = document.getElementById('mapfile_common_roData');
			    let rwDataValue = document.getElementById('mapfile_common_rwData');

				roCodeValue.textContent = mapObj.common.readOnlyCodeSize;
				roDataValue.textContent = mapObj.common.readOnlyDataSize;
				rwDataValue.textContent = mapObj.common.readWriteDataSize;

				let entriesCodeValue = document.getElementById('mapfile_entries_code');
				let entriesDataValue = document.getElementById('mapfile_entries_data');

				let entriesCode = 0;
				let entriesData = 0;

				for(let i = 0; i < mapObj.entries.length; ++i) {
					if(mapObj.entries[i].type.indexOf('Code') !== -1) {
						entriesCode += mapObj.entries[i].size;
					} else if(mapObj.entries[i].type.indexOf('Data') !== -1) {
						entriesData += mapObj.entries[i].size;
					}
				}

				entriesCodeValue.textContent = entriesCode;
				entriesDataValue.textContent = entriesData;

				let entr = mapObj.entries.map((item) => {
					if(item.type.indexOf('Code') != -1) {
						item.name = item.name.replace(/\(.*\)/g,'');
						return item;
					}
				});

				entr.sort((a,b) => {
					return b.size - a.size;
				});

				let res = entr.splice(0,30);

				if(entr.length > res.length) {
					let otherObj = {};
					otherObj.name = "Other",
					otherObj.type = "other",
					otherObj.size = 0;
					for(let i = 20; i < entr.length; ++i) {
						if(entr[i]) {
							if(entr[i].size) {
								otherObj.size += entr[i].size;
							}
						}
					}
					res[res.length] = otherObj;
					console.log(otherObj);
				}

				console.log(res);

				chart = new AmCharts.AmPieChart();

                // title of the chart
                chart.addTitle("Entries", 12);

                chart.dataProvider = res;
                chart.titleField = "name";
                chart.valueField = "size";
                chart.sequencedAnimation = true;
                chart.startEffect = "elastic";
                chart.innerRadius = "30%";
                chart.startDuration = 0.2;
                chart.labelRadius = 15;
				chart.pulledField = "pulled";
				chart.colors = [
					"#FF0F00",
					"#FF6600",
					"#FF9E01",
					"#FCD202",
					"#F8FF01",
					"#B0DE09",
					"#04D215",
					"#0D8ECF",
					"#0D52D1",
					"#2A0CD0",
					"#8A0CCF",
					"#CD0D74",
					"#754DEB",
					"#57032A",
					"#CA9726",
					"#990000",
					"#4B0C25"];
				chart.outlineAlpha = 1.0;
				chart.outlineColor = "#FFFFFF";
				chart.outlineThickness = 0.5;
				//chart.colorField = "color";
				chart.labelText = "[[name]] ([[percents]]%)";
                chart.balloonText = "[[title]]<br><span style='font-size:14px'><b>[[value]] B</b></span>";
				chart.pullOutDuration = 0.1;
                // the following two lines makes the chart 3D
                chart.depth3D = 20;
                chart.angle = 30;
				chart.export = { enabled: true };

                // WRITE
                chart.write("charts");
			};
	    });
	}
});

(()=>{
    createViewerRegion('mapfileForm');
})();
