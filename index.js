;(function(isNode) {
	let merge = (() => {
	    var obj, name, copy,
	        target = arguments[0] || {},
	        i = 1,
	        length = arguments.length;

	    for (; i < length; i++) {
	        if ((obj = arguments[i]) != null) {
	            for (name in obj) {
	                copy = obj[name];

	                if (target === copy) {
	                    continue;
	                }
	                else if (copy !== undefined) {
	                    target[name] = copy;
	                }
	            }
	        }
	    }

	    return target;
	});

	function Mapfile() {
		this.createInstance = function() {
			return {
				sections: new Array(),
				modules: new Array(),
				entries: new Array(),
				common: {
					sectionsCount: 0,
					modulesCount: 0,
					entriesCount: 0,

					readOnlyCodeSize: 0,
					readOnlyDataSize: 0,
					readWriteDataSize: 0,
				},
				_moduleColumnsIndexes: {
					roCode: 0,
					roData: 0,
					rwData: 0
				},
				_analyzeFlags: {
					analyzeSections: true,
					analyzeModules: false,
					analyzeEntries: false
				},
				_tempEntry: {}
			};
		};

		this.analyzeSupportInfo = function(mapObj, line) {
			if(mapObj._moduleColumnsIndexes.roCode == 0) {
				let indexROCode = line.indexOf('ro code');
			    if(line.indexOf('Module') !== -1 && indexROCode !== -1) {
			        mapObj._moduleColumnsIndexes.roCode = indexROCode + 12;
			        mapObj._moduleColumnsIndexes.roData = line.indexOf('ro data') + 12;
			        mapObj._moduleColumnsIndexes.rwData = line.indexOf('rw data') + 12;
					mapObj._analyzeFlags.analyzeSections = false;
					mapObj._analyzeFlags.analyzeEntries = false;
					mapObj._analyzeFlags.analyzeModules = true;
			    }
			}

			if(line.match(/^Entry +Address +Size +Type +Object$/g)) {
				mapObj._analyzeFlags.analyzeSections = false;
				mapObj._analyzeFlags.analyzeEntries = true;
				mapObj._analyzeFlags.analyzeModules = false;
			}
		};

		this.analyzeSections = function(mapObj, line) {
		    let sectionNameTemp = line.match(/^"[a-zA-Z][0-9]"/);

		    if(sectionNameTemp && line.indexOf('place') == -1 && line.indexOf('part') == -1) {
		        let section = {};
		        let sectionSizeTemp = line.match(/0x[abcdef0-9]+$/);
		        section.name = sectionNameTemp[0].replace(/['"]/g,'');
		        section.size = sectionSizeTemp ? parseInt(sectionSizeTemp[0]) : 0;
		        mapObj.sections.push(section);
		        mapObj.common.sectionsCount++;
		    }

		    if(sectionNameTemp && line.indexOf('place') == -1 && line.indexOf('part') !== -1) {
		        let sectionName = sectionNameTemp[0].replace(/['"]/g,'');
		        let sectionFinded = false;
		        let sectionIndex = -1;
		        let sectionSizeTemp = line.match(/0x[abcdef0-9]+$/);
		        let sectionSize = sectionSizeTemp ? parseInt(sectionSizeTemp[0]) : 0;
		        mapObj.sections.forEach((value, index) => {
		            if(value.name.indexOf(sectionName) !== -1) {
		                sectionFinded = true;
		                sectionIndex = index;
		                return;
		            }
		        });

		        if(sectionFinded) {
		            mapObj.sections[sectionIndex].size += sectionSize;
		        } else {
		            let section = {
		                name: sectionName,
		                size: sectionSize
		            };
		            mapObj.sections.push(section);
		            mapObj.common.sectionsCount++;
		        }
		    }
		};

		this.analyzeModules = function(mapObj, line) {
		    let moduleNameTemp = line.match(/^[a-zA-Z0-9_]+\.o|^Gaps|^Linker created/g);
		    if(moduleNameTemp) {
		        let module = {};
		        module.name = moduleNameTemp[0];
		        module.type = module.name.endsWith('.o') == true ? 'binary' : 'support';
		        let foundedNumbersArr = line.match(/ \d+[ ]?\d+| \d+/g);
		        module.readOnlyCode = 0;
		        module.readOnlyData = 0;
		        module.readWriteData = 0;

		        let nextIndexSearchPosition = 0;

		        if(foundedNumbersArr) {
					for(let i = 0; i < foundedNumbersArr.length; ++i) {
						let number = foundedNumbersArr[i].trim();
						let index = line.indexOf(number, nextIndexSearchPosition) + number.length + 5;

						switch(index) {
						case mapObj._moduleColumnsIndexes.roCode:
							module.readOnlyCode = parseInt(number.replace(/ /g, ''));
							nextIndexSearchPosition = mapObj._moduleColumnsIndexes.roCode - 4;
							break;
						case mapObj._moduleColumnsIndexes.roData:
							module.readOnlyData = parseInt(number.replace(/ /g, ''));
							nextIndexSearchPosition = mapObj._moduleColumnsIndexes.roData - 4;
							break;
						case mapObj._moduleColumnsIndexes.rwData:
							module.readWriteData = parseInt(number.replace(/ /g, ''));
							nextIndexSearchPosition = mapObj._moduleColumnsIndexes.rwData - 4;
							break;
						}
					}
		        }
		        mapObj.modules.push(module);
				mapObj.common.modulesCount++;
				mapObj.common.readOnlyCodeSize += module.readOnlyCode;
				mapObj.common.readOnlyDataSize += module.readOnlyData;
				mapObj.common.readWriteDataSize += module.readWriteData;
		    }
		};

		this.analyzeEntries = function(mapObj, line) {
			let entryArr = line.match(/^([a-zA-Z0-9_&(),~*:<> \[\]\.\$\?]+\n?)?( +)?(0x[a-fA-F0-9]{8})? +(0x[a-fA-F0-9]+)? +([a-zA-Z_-]+  +[A-Za-z]{2})? +([a-zA-Z0-9_]+\.o|(- Linker created -))?/g);
			let entryName = line.match(/^([a-zA-Z0-9_&(),~*:<> \[\]\.\$\?]+)(?=$)/g);
			if((entryArr != null || entryName != null) && line.indexOf('=') == -1) {
				if(entryArr) {
					// set address
					let addressStr = entryArr[0].match(/0x[a-fA-F0-9]{8}/g)[0];
					mapObj._tempEntry.address = parseInt(addressStr);

					// set size
					let addreStrIndex = line.indexOf(addressStr);
					let sizeSubstr = line.substring(addreStrIndex + 10, addreStrIndex + 19);
					if(sizeSubstr) {
						mapObj._tempEntry.size = parseInt(sizeSubstr) || 0;
					} else {
						mapObj._tempEntry.size = 0;
					}

					// set type
					let typeSubstr = line.match(/ [a-zA-Z-]{2,4} {2,3}[a-zA-Z]{2}/g);
					if(typeSubstr) {
						mapObj._tempEntry.type = typeSubstr[0];
					}

					// set module
					let moduleStr = line.match(/([a-zA-Z_0-9]+\.o)|(Linker created)/g);
					if(moduleStr) {
						mapObj._tempEntry.module = moduleStr[0];
					}

					if(entryArr[0].indexOf('0x') == 0) {
						// data for entry in previous line
						mapObj.entries.push(mapObj._tempEntry);
						mapObj.common.entriesCount++;
						mapObj._tempEntry = {};
					} else {
						// normal line
						mapObj._tempEntry.name = entryArr[0].match(/^([a-zA-Z0-9_&(),~*:<> \[\]\.\$\?]+)(?=(\n)|( +(?:0x[a-fA-F0-9]{8})))/)[0].trim();

						mapObj.entries.push(mapObj._tempEntry);
						mapObj.common.entriesCount++;
						mapObj._tempEntry = {};
					}
				} else {
					// only entry name in line
					mapObj._tempEntry.name = entryName[0].trim();
				}
			}
		};

		this.nextLineHandler = function(mapObj, line) => {
			line = line.trim();
			if(line[0] != '#' && line[0] != '*' && line[0] != '-' && line.length > 0) {
				if(mapObj._analyzeFlags.analyzeSections == true) {
					this.analyzeSections(mapObj, line);
				}
				if(mapObj._analyzeFlags.analyzeModules == true) {
					this.analyzeModules(mapObj, line);
				}
				if(mapObj._analyzeFlags.analyzeEntries == true) {
					this.analyzeEntries(mapObj, line);
				}
				this.analyzeSupportInfo(mapObj, line);
			}
		};

		this.analyzeAsString = function(mapObj, str) {
			if(!mapObj) {
				console.log('No map object!'); return;
			}
			let stopIndex = 0;
			let startIndex = 0;
			for(let i = 0; i < str.length; ++i) {
				if(str[i] == '\n' || i == (str.length - 1)) {
					stopIndex = i;
					this.nextLineHandler(mapObj, str.substring(startIndex, stopIndex));
				}
				if( (stopIndex == (i - 1)) && (str[i-1] == '\n') ) {
					startIndex = i;
				}
			}
			this.endHandler(mapObj);
		};

		this.endHandler = function(mapObj) {
			delete mapObj._moduleColumnsIndexes;
			delete mapObj._analyzeFlags;
			delete mapObj._tempEntry;
		};

	    return this;
	}

	if(isNode) {
		module.exports = new Mapfile();
	} else {
		window['mapfile'] = new Mapfile();
	}
})(typeof module === 'object' && module && typeof module.exports === 'object' && module.exports);
