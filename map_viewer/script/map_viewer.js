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
	        };
	    });
	}
});

(()=>{
    createViewerRegion('mapfileForm');
})();
