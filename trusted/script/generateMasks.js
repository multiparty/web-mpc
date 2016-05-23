/***************************************************************
 *
 * trusted/script/generateMasks.js
 *
 * Boiler plate for trusted server mask generation.
 * Author: Eric Dunton 
 *
 */

//generates array of random numbers
function secureRandom(size){
	var array = new Uint32Array(size);
	var cryptoObj = window.crypto || window.msCrypto; // IE 11 fix
	cryptoObj.getRandomValues(array);
	return array;
}

//creates random mask
function genMask(keys){
	return _.object(keys, secureRandom(keys.length));
}

//adds the masks together to produce key
function addToAgg(agg,mask){
	for(var k in mask){
		agg[k] += mask[k]
	}
	return agg;
}

// creates table to generate numbers
function initTable(keys,divId,button){

	//initiate handson table
	var companies = new Handsontable(document.getElementById(divId), {
    	minSpareRows: 60,
    	columns: ['company'],
    	columnWidth: 50,
    	colHeaders: ['Company Names']
    });

	//define actions of download button 
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

/*eof*/