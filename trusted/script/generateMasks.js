//generates array of random numbers
function secureRandom(size){
    var array = new Uint32Array(size);
    window.crypto.getRandomValues(array);
    return array;
}

function genMask(keys){
	return _.object(keys, secureRandom(keys.length));
}

function addToAgg(agg,mask){
	for(var k in mask){
		agg[k] += mask[k]
	}
	return agg;
}

function initTable(keys,divId,button){
	var companies = new Handsontable(document.getElementById(divId), {
    	minSpareRows: 60,
    	columns: ['company'],
    	columnWidth: 50,
    	colHeaders: ['Company Names']
    });

    Handsontable.Dom.addEvent(document.body, 'click', function (e) {
    	var element = e.target || e.srcElement;
    	if (element.nodeName == "BUTTON" && element.name == button) {

    		var cmps = _.without(
    			_.map(_.flatten(companies.getData()), function(x){
    				if(_.isString(x)) return x.trim();
    				return null;
    			}), 
    			null, ""),
    			keyslen = keys.length,
    			zipfile = new JSZip(),
    			keyfolder = zipfile.folder("KEY"),
    			aggObj = _.object(keys, _.map(_.range(keyslen), 
    											function (x) { return 0;}));

    		_.map(cmps, function(company){
    			var mask = genMask(keys);
    			zipfile.file(company + ".txt", JSON.stringify(mask, null, 4));
    			aggObj = addToAgg(aggObj, mask);
    		});

    		keyfolder.file("agg_key.txt", JSON.stringify(aggObj, null, 4));

    		saveAs(zipfile.generate({type:"blob"}), "masks.zip");

    		console.log('data: ', aggObj);
    	}
    });
}
