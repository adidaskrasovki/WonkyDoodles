var category = '';
var chk_save = document.getElementById('chk_save');
var result_list = [];

var canvas = document.getElementById("canvas");
var ctx = this.canvas.getContext("2d");

var hidden_canvas = document.getElementById("hidden_canvas");
var hidden_ctx = this.hidden_canvas.getContext("2d");

var curX, curY, prevX, prevY;
var hold = false;
var empty = true;

var stroke = [];
var strokelist = [];
var mapped_strokelist = [];
var boundaries = {'x_min': 0, 'x_max': 0, 'y_min': 0, 'y_max': 0};

function set_canvas_params(){
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	ctx.lineWidth = 4;
	ctx.strokeStyle = "white";

	hidden_canvas.style.top = '5rem';
	hidden_ctx.lineWidth = 1;
	hidden_ctx.strokeStyle = "white";
};


function pencil(){
        
    canvas.onmousedown = function(e){
		start_time = Date.now()
        curX = e.clientX - canvas.getBoundingClientRect().left;
        curY = e.clientY - canvas.getBoundingClientRect().top;
        hold = true;
        empty = false;
            
        prevX = curX;
        prevY = curY;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
    };

        
    canvas.onmousemove = function(e){
        if(hold){
            curX = e.clientX - canvas.getBoundingClientRect().left;
            curY = e.clientY - canvas.getBoundingClientRect().top;
            draw();
        }
    };

        
    canvas.onmouseup = function(e){
		draw();
		strokelist.push(stroke.map((x) => x));
		draw_hidden();
		hidden_pencil();
		stroke.length = 0;
        post_then_get(category);
        hold = false;
    };

        
    canvas.onmouseout = function(e){
        if(hold){
			draw();
			strokelist.push(stroke.map((x) => x));
			draw_hidden();
			hidden_pencil();
			stroke.length = 0;
            post_then_get(category);
			hold = false;
        }
    };

        
    function draw(){
        ctx.lineTo(curX, curY);
        ctx.stroke();
        stroke.push({"x": Math.round(curX), "y": Math.round(curY), "t": Date.now() - start_time});
    };


	function draw_hidden(){
		mapped_strokelist.length = 0;
		set_canvas_boundaries();

		if (boundaries['x_min'] == boundaries['x_max'] &&
			boundaries['y_min'] == boundaries['y_max']){
				len_strokelist = strokelist.length;
				strokelist[len_strokelist-1][0]['x'] = 0;
				strokelist[len_strokelist-1][0]['y'] = 0;
		} else if ((boundaries['x_max'] - boundaries['x_min']) > (boundaries['y_max'] - boundaries['y_min'])){
			mapped_strokelist = lin_transform(strokelist, -boundaries['x_min'], -boundaries['y_min'], 0, 0, ((255.)/(boundaries['x_max'] - boundaries['x_min'])) );
		} else {
			mapped_strokelist = lin_transform(strokelist, -boundaries['x_min'], -boundaries['y_min'], 0, 0, ((255.)/(boundaries['y_max'] - boundaries['y_min'])) );
		};
	};


	function hidden_pencil(){
		hidden_ctx.fillRect(0, 0, hidden_canvas.width, hidden_canvas.height);
		len_mapped_strokelist = mapped_strokelist.length;

		for (i=0; i<len_mapped_strokelist; i++){
			len_stroke = mapped_strokelist[i].length;
			hidden_ctx.beginPath();
			hidden_ctx.moveTo(mapped_strokelist[i][0]['x'], mapped_strokelist[i][0]['y']);
			for (j=1; j<len_stroke; j++){
				hidden_ctx.lineTo(mapped_strokelist[i][j]['x'], mapped_strokelist[i][j]['y']);
				hidden_ctx.stroke();
			};
		};
	};	


	function set_canvas_boundaries(){
		var len_stroke = stroke.length;
		
		if (strokelist.length == 1){
			boundaries['x_min'] = stroke[0]['x'];
			boundaries['x_max'] = stroke[0]['x'];
			boundaries['y_min'] = stroke[0]['y'];
			boundaries['y_max'] = stroke[0]['y'];
		};
	
		for (j=0; j<len_stroke; j++){
			if(stroke[j]['x'] < boundaries['x_min']){
				boundaries['x_min'] = stroke[j]['x'];
			} else if(stroke[j]['x'] > boundaries['x_max']){
				boundaries['x_max'] = stroke[j]['x'];
			};
			if(stroke[j]['y'] < boundaries['y_min']){
				boundaries['y_min'] = stroke[j]['y'];
			} else if(stroke[j]['y'] > boundaries['y_max']){
				boundaries['y_max'] = stroke[j]['y'];
			};
		};
	};
	
	
	function lin_transform(strokes, x, y, x_org, y_org, scaling){
	
		var new_strokes = translate(strokes, x, y);
		new_strokes = scale(new_strokes, x_org, y_org, scaling);
		new_strokes = remove_duplicates(new_strokes);
		new_strokes = round_to_int(new_strokes);
	
		return new_strokes;
	
	
		function translate(strokes, x, y){
			var len_strokes = strokes.length;
			var new_strokes = structuredClone(strokes);
			for (i=0; i<len_strokes; i++){
				var len_stroke = strokes[i].length;
				for (j=0; j<len_stroke; j++){
					new_strokes[i][j]['x'] = strokes[i][j]['x'] + x;
					new_strokes[i][j]['y'] = strokes[i][j]['y'] + y;
				};
			};
			return new_strokes;
		};
	
	
		function scale(strokes, x_org, y_org, scaling){
			var len_strokes = strokes.length;
			var new_strokes = structuredClone(strokes);
	
			for (i=0; i<len_strokes; i++){
				var len_stroke = strokes[i].length;
				for (j=0; j<len_stroke; j++){
					new_strokes[i][j]['x'] = (strokes[i][j]['x'] - x_org) * scaling + x_org;
					new_strokes[i][j]['y'] = (strokes[i][j]['y'] - y_org) * scaling + y_org;
				};
			};
			return new_strokes;
		};
	
	
		function remove_duplicates(strokes){
			var new_strokes = structuredClone(strokes);
			var len_strokes = new_strokes.length;
	
			for (i=0; i<len_strokes; i++){
				var len_stroke = new_strokes[i].length;
	
				if (len_stroke > 1){
					for (j=0; j<len_stroke-1 ;j++){
						if (new_strokes[i][j]['x'] == new_strokes[i][j+1]['x'] &&
							new_strokes[i][j]['y'] == new_strokes[i][j+1]['y']){
								new_strokes[i].splice(j, 1);
								j = j-1;
								len_stroke = len_stroke - 1;
						};
					};
				};
			};
			return new_strokes;
		};


		function round_to_int(strokes){
			var new_strokes = structuredClone(strokes);
			var len_strokes = new_strokes.length;
	
			for (i=0; i<len_strokes; i++){
				var len_stroke = new_strokes[i].length;

				for (j=0; j<len_stroke ;j++){
					new_strokes[i][j]['x'] = Math.round(new_strokes[i][j]['x']);
					new_strokes[i][j]['y'] = Math.round(new_strokes[i][j]['y']);
				};
			};
			return new_strokes;
		};

	};
	
	
	async function post_then_get(category){
		await send_to_eval();
		result_list = await get_results();
		populate_table(result_list, category);
	
		async function send_to_eval(){
			var base64 = hidden_canvas.toDataURL("image/png");
			base64 = base64.replace(/^data:image\/(png|jpg);base64,/, "");
		
			return fetch('/eval_img', {
				method: 'POST',
				body: base64
			})
			.then(response => {
				console.log(response)
			})
			.catch(error => {
				console.error(error)
			});
		};
		
		
		async function get_results(){
			const response = await fetch('/eval_img');
			return await response.json();
		};
	};


	function populate_table(results, category){
		for(i=0; i<=9; i++){
			for(j=0; j<=1; j++){
				if(j==0) { var unit = ''; }
				else { var unit = ' %'; };
				if(results[i][0] == category) { var color = 'text-success';}
				else { var color = 'text-light';};
				
				var doc = document.getElementById('cell' + i.toString() + j.toString());
				doc.innerHTML = `${results[i][j].toString() + unit}`;
				doc.setAttribute("class", color);
			};
		};
	};
	
};


async function set_category(){
    const response = await fetch('/stage_category');
    category = await response.text();
    document.getElementById("category").innerHTML = `Draw ${category} !`;
};


function next(){
    if (chk_save.checked == true && empty == false){
        post_img('/img_handler');
    };
	clearpage();
    set_category();


	async function post_img(target_route){
		var base64 = hidden_canvas.toDataURL("image/png");
		base64 = base64.replace(/^data:image\/(png|jpg);base64,/, "");
	
		return fetch(target_route, {
			method: 'POST',
			body: JSON.stringify({
				category: category,
				recognized: result_list[0][0] == category,
				countrycode: getCountry(),
				strokelist: mapped_strokelist,
				boundaries: get_post_boundaries(mapped_strokelist)
			}),
			headers: {
				"Content-type": "application/json; charset=UTF-8"
			}
		})
		.then((json) => console.log(json))
		.catch(error => {
			console.error(error)
		});
	
	};

	function get_post_boundaries(strokes){
		var len_strokes = strokes.length;
		var x_max = 0;
		var y_max = 0;
		for (i=0; i<len_strokes; i++){
			var len_stroke = strokes[i].length;
			for (j=0; j<len_stroke; j++){
				if (strokes[i][j]['x'] > x_max){
					x_max = strokes[i][j]['x'];
				};
				if (strokes[i][j]['y'] > y_max){
					y_max = strokes[i][j]['y'];
				};	
			};
		};
		return {'x_max': x_max, 'y_max': y_max};
	};

};


function clearpage(){
	// clear lists
	strokelist.length = 0;
	mapped_strokelist.length = 0;

    // clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);
    empty = true;

    // clear table
    for(i=0; i<=9; i++){
        for(j=0; j<=1; j++){            
            var cell = document.getElementById('cell' + i.toString() + j.toString());
            cell.innerHTML = '';
        };
    };
};


function unactive_btn(e){
	$(e.currentTarget).trigger("blur");
};


// WARNING!!! IF POSSIBLE, KEEP THIS FUNCTION MINIMIZED/CLOSED AT ALL TIMES IN YOUR IDE!!!!
// WIP
// unfortunately, .js does not have an easy way to import other .js files. This is the workaround.
function getCountry() {
	var timezones = {
		"Africa/Abidjan": {
			u: 0,
			c: ["CI", "BF", "GH", "GM", "GN", "ML", "MR", "SH", "SL", "SN", "TG"]
		},
		"Africa/Accra": {
			a: "Africa/Abidjan",
			c: ["GH"],
			r: 1
		},
		"Africa/Addis_Ababa": {
			a: "Africa/Nairobi",
			c: ["ET"],
			r: 1
		},
		"Africa/Algiers": {
			u: 60,
			c: ["DZ"]
		},
		"Africa/Asmara": {
			a: "Africa/Nairobi",
			c: ["ER"],
			r: 1
		},
		"Africa/Asmera": {
			a: "Africa/Nairobi",
			c: ["ER"],
			r: 1
		},
		"Africa/Bamako": {
			a: "Africa/Abidjan",
			c: ["ML"],
			r: 1
		},
		"Africa/Bangui": {
			a: "Africa/Lagos",
			c: ["CF"],
			r: 1
		},
		"Africa/Banjul": {
			a: "Africa/Abidjan",
			c: ["GM"],
			r: 1
		},
		"Africa/Bissau": {
			u: 0,
			c: ["GW"]
		},
		"Africa/Blantyre": {
			a: "Africa/Maputo",
			c: ["MW"],
			r: 1
		},
		"Africa/Brazzaville": {
			a: "Africa/Lagos",
			c: ["CG"],
			r: 1
		},
		"Africa/Bujumbura": {
			a: "Africa/Maputo",
			c: ["BI"],
			r: 1
		},
		"Africa/Cairo": {
			u: 120,
			c: ["EG"]
		},
		"Africa/Casablanca": {
			u: 60,
			d: 0,
			c: ["MA"]
		},
		"Africa/Ceuta": {
			u: 60,
			d: 120,
			c: ["ES"]
		},
		"Africa/Conakry": {
			a: "Africa/Abidjan",
			c: ["GN"],
			r: 1
		},
		"Africa/Dakar": {
			a: "Africa/Abidjan",
			c: ["SN"],
			r: 1
		},
		"Africa/Dar_es_Salaam": {
			a: "Africa/Nairobi",
			c: ["TZ"],
			r: 1
		},
		"Africa/Djibouti": {
			a: "Africa/Nairobi",
			c: ["DJ"],
			r: 1
		},
		"Africa/Douala": {
			a: "Africa/Lagos",
			c: ["CM"],
			r: 1
		},
		"Africa/El_Aaiun": {
			u: 60,
			d: 0,
			c: ["EH"]
		},
		"Africa/Freetown": {
			a: "Africa/Abidjan",
			c: ["SL"],
			r: 1
		},
		"Africa/Gaborone": {
			a: "Africa/Maputo",
			c: ["BW"],
			r: 1
		},
		"Africa/Harare": {
			a: "Africa/Maputo",
			c: ["ZW"],
			r: 1
		},
		"Africa/Johannesburg": {
			u: 120,
			c: ["ZA", "LS", "SZ"]
		},
		"Africa/Juba": {
			u: 120,
			c: ["SS"]
		},
		"Africa/Kampala": {
			a: "Africa/Nairobi",
			c: ["UG"],
			r: 1
		},
		"Africa/Khartoum": {
			u: 120,
			c: ["SD"]
		},
		"Africa/Kigali": {
			a: "Africa/Maputo",
			c: ["RW"],
			r: 1
		},
		"Africa/Kinshasa": {
			a: "Africa/Lagos",
			c: ["CD"],
			r: 1
		},
		"Africa/Lagos": {
			u: 60,
			c: ["NG", "AO", "BJ", "CD", "CF", "CG", "CM", "GA", "GQ", "NE"]
		},
		"Africa/Libreville": {
			a: "Africa/Lagos",
			c: ["GA"],
			r: 1
		},
		"Africa/Lome": {
			a: "Africa/Abidjan",
			c: ["TG"],
			r: 1
		},
		"Africa/Luanda": {
			a: "Africa/Lagos",
			c: ["AO"],
			r: 1
		},
		"Africa/Lubumbashi": {
			a: "Africa/Maputo",
			c: ["CD"],
			r: 1
		},
		"Africa/Lusaka": {
			a: "Africa/Maputo",
			c: ["ZM"],
			r: 1
		},
		"Africa/Malabo": {
			a: "Africa/Lagos",
			c: ["GQ"],
			r: 1
		},
		"Africa/Maputo": {
			u: 120,
			c: ["MZ", "BI", "BW", "CD", "MW", "RW", "ZM", "ZW"]
		},
		"Africa/Maseru": {
			a: "Africa/Johannesburg",
			c: ["LS"],
			r: 1
		},
		"Africa/Mbabane": {
			a: "Africa/Johannesburg",
			c: ["SZ"],
			r: 1
		},
		"Africa/Mogadishu": {
			a: "Africa/Nairobi",
			c: ["SO"],
			r: 1
		},
		"Africa/Monrovia": {
			u: 0,
			c: ["LR"]
		},
		"Africa/Nairobi": {
			u: 180,
			c: ["KE", "DJ", "ER", "ET", "KM", "MG", "SO", "TZ", "UG", "YT"]
		},
		"Africa/Ndjamena": {
			u: 60,
			c: ["TD"]
		},
		"Africa/Niamey": {
			a: "Africa/Lagos",
			c: ["NE"],
			r: 1
		},
		"Africa/Nouakchott": {
			a: "Africa/Abidjan",
			c: ["MR"],
			r: 1
		},
		"Africa/Ouagadougou": {
			a: "Africa/Abidjan",
			c: ["BF"],
			r: 1
		},
		"Africa/Porto-Novo": {
			a: "Africa/Lagos",
			c: ["BJ"],
			r: 1
		},
		"Africa/Sao_Tome": {
			u: 0,
			c: ["ST"]
		},
		"Africa/Timbuktu": {
			a: "Africa/Abidjan",
			c: ["ML"],
			r: 1
		},
		"Africa/Tripoli": {
			u: 120,
			c: ["LY"]
		},
		"Africa/Tunis": {
			u: 60,
			c: ["TN"]
		},
		"Africa/Windhoek": {
			u: 120,
			c: ["NA"]
		},
		"America/Adak": {
			u: -600,
			d: -540,
			c: ["US"]
		},
		"America/Anchorage": {
			u: -540,
			d: -480,
			c: ["US"]
		},
		"America/Anguilla": {
			a: "America/Puerto_Rico",
			c: ["AI"],
			r: 1
		},
		"America/Antigua": {
			a: "America/Puerto_Rico",
			c: ["AG"],
			r: 1
		},
		"America/Araguaina": {
			u: -180,
			c: ["BR"]
		},
		"America/Argentina/Buenos_Aires": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/Catamarca": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/ComodRivadavia": {
			a: "America/Argentina/Catamarca",
			r: 1
		},
		"America/Argentina/Cordoba": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/Jujuy": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/La_Rioja": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/Mendoza": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/Rio_Gallegos": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/Salta": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/San_Juan": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/San_Luis": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/Tucuman": {
			u: -180,
			c: ["AR"]
		},
		"America/Argentina/Ushuaia": {
			u: -180,
			c: ["AR"]
		},
		"America/Aruba": {
			a: "America/Puerto_Rico",
			c: ["AW"],
			r: 1
		},
		"America/Asuncion": {
			u: -240,
			d: -180,
			c: ["PY"]
		},
		"America/Atikokan": {
			a: "America/Panama",
			c: ["CA"],
			r: 1
		},
		"America/Atka": {
			a: "America/Adak",
			r: 1
		},
		"America/Bahia": {
			u: -180,
			c: ["BR"]
		},
		"America/Bahia_Banderas": {
			u: -360,
			d: -300,
			c: ["MX"]
		},
		"America/Barbados": {
			u: -240,
			c: ["BB"]
		},
		"America/Belem": {
			u: -180,
			c: ["BR"]
		},
		"America/Belize": {
			u: -360,
			c: ["BZ"]
		},
		"America/Blanc-Sablon": {
			a: "America/Puerto_Rico",
			c: ["CA"],
			r: 1
		},
		"America/Boa_Vista": {
			u: -240,
			c: ["BR"]
		},
		"America/Bogota": {
			u: -300,
			c: ["CO"]
		},
		"America/Boise": {
			u: -420,
			d: -360,
			c: ["US"]
		},
		"America/Buenos_Aires": {
			a: "America/Argentina/Buenos_Aires",
			r: 1
		},
		"America/Cambridge_Bay": {
			u: -420,
			d: -360,
			c: ["CA"]
		},
		"America/Campo_Grande": {
			u: -240,
			c: ["BR"]
		},
		"America/Cancun": {
			u: -300,
			c: ["MX"]
		},
		"America/Caracas": {
			u: -240,
			c: ["VE"]
		},
		"America/Catamarca": {
			a: "America/Argentina/Catamarca",
			r: 1
		},
		"America/Cayenne": {
			u: -180,
			c: ["GF"]
		},
		"America/Cayman": {
			a: "America/Panama",
			c: ["KY"],
			r: 1
		},
		"America/Chicago": {
			u: -360,
			d: -300,
			c: ["US"]
		},
		"America/Chihuahua": {
			u: -420,
			d: -360,
			c: ["MX"]
		},
		"America/Coral_Harbour": {
			a: "America/Panama",
			c: ["CA"],
			r: 1
		},
		"America/Cordoba": {
			a: "America/Argentina/Cordoba",
			r: 1
		},
		"America/Costa_Rica": {
			u: -360,
			c: ["CR"]
		},
		"America/Creston": {
			a: "America/Phoenix",
			c: ["CA"],
			r: 1
		},
		"America/Cuiaba": {
			u: -240,
			c: ["BR"]
		},
		"America/Curacao": {
			a: "America/Puerto_Rico",
			c: ["CW"],
			r: 1
		},
		"America/Danmarkshavn": {
			u: 0,
			c: ["GL"]
		},
		"America/Dawson": {
			u: -420,
			c: ["CA"]
		},
		"America/Dawson_Creek": {
			u: -420,
			c: ["CA"]
		},
		"America/Denver": {
			u: -420,
			d: -360,
			c: ["US"]
		},
		"America/Detroit": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Dominica": {
			a: "America/Puerto_Rico",
			c: ["DM"],
			r: 1
		},
		"America/Edmonton": {
			u: -420,
			d: -360,
			c: ["CA"]
		},
		"America/Eirunepe": {
			u: -300,
			c: ["BR"]
		},
		"America/El_Salvador": {
			u: -360,
			c: ["SV"]
		},
		"America/Ensenada": {
			a: "America/Tijuana",
			r: 1
		},
		"America/Fort_Nelson": {
			u: -420,
			c: ["CA"]
		},
		"America/Fort_Wayne": {
			a: "America/Indiana/Indianapolis",
			r: 1
		},
		"America/Fortaleza": {
			u: -180,
			c: ["BR"]
		},
		"America/Glace_Bay": {
			u: -240,
			d: -180,
			c: ["CA"]
		},
		"America/Godthab": {
			a: "America/Nuuk",
			r: 1
		},
		"America/Goose_Bay": {
			u: -240,
			d: -180,
			c: ["CA"]
		},
		"America/Grand_Turk": {
			u: -300,
			d: -240,
			c: ["TC"]
		},
		"America/Grenada": {
			a: "America/Puerto_Rico",
			c: ["GD"],
			r: 1
		},
		"America/Guadeloupe": {
			a: "America/Puerto_Rico",
			c: ["GP"],
			r: 1
		},
		"America/Guatemala": {
			u: -360,
			c: ["GT"]
		},
		"America/Guayaquil": {
			u: -300,
			c: ["EC"]
		},
		"America/Guyana": {
			u: -240,
			c: ["GY"]
		},
		"America/Halifax": {
			u: -240,
			d: -180,
			c: ["CA"]
		},
		"America/Havana": {
			u: -300,
			d: -240,
			c: ["CU"]
		},
		"America/Hermosillo": {
			u: -420,
			c: ["MX"]
		},
		"America/Indiana/Indianapolis": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Indiana/Knox": {
			u: -360,
			d: -300,
			c: ["US"]
		},
		"America/Indiana/Marengo": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Indiana/Petersburg": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Indiana/Tell_City": {
			u: -360,
			d: -300,
			c: ["US"]
		},
		"America/Indiana/Vevay": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Indiana/Vincennes": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Indiana/Winamac": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Indianapolis": {
			a: "America/Indiana/Indianapolis",
			r: 1
		},
		"America/Inuvik": {
			u: -420,
			d: -360,
			c: ["CA"]
		},
		"America/Iqaluit": {
			u: -300,
			d: -240,
			c: ["CA"]
		},
		"America/Jamaica": {
			u: -300,
			c: ["JM"]
		},
		"America/Jujuy": {
			a: "America/Argentina/Jujuy",
			r: 1
		},
		"America/Juneau": {
			u: -540,
			d: -480,
			c: ["US"]
		},
		"America/Kentucky/Louisville": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Kentucky/Monticello": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Knox_IN": {
			a: "America/Indiana/Knox",
			r: 1
		},
		"America/Kralendijk": {
			a: "America/Puerto_Rico",
			c: ["BQ"],
			r: 1
		},
		"America/La_Paz": {
			u: -240,
			c: ["BO"]
		},
		"America/Lima": {
			u: -300,
			c: ["PE"]
		},
		"America/Los_Angeles": {
			u: -480,
			d: -420,
			c: ["US"]
		},
		"America/Louisville": {
			a: "America/Kentucky/Louisville",
			r: 1
		},
		"America/Lower_Princes": {
			a: "America/Puerto_Rico",
			c: ["SX"],
			r: 1
		},
		"America/Maceio": {
			u: -180,
			c: ["BR"]
		},
		"America/Managua": {
			u: -360,
			c: ["NI"]
		},
		"America/Manaus": {
			u: -240,
			c: ["BR"]
		},
		"America/Marigot": {
			a: "America/Puerto_Rico",
			c: ["MF"],
			r: 1
		},
		"America/Martinique": {
			u: -240,
			c: ["MQ"]
		},
		"America/Matamoros": {
			u: -360,
			d: -300,
			c: ["MX"]
		},
		"America/Mazatlan": {
			u: -420,
			d: -360,
			c: ["MX"]
		},
		"America/Mendoza": {
			a: "America/Argentina/Mendoza",
			r: 1
		},
		"America/Menominee": {
			u: -360,
			d: -300,
			c: ["US"]
		},
		"America/Merida": {
			u: -360,
			d: -300,
			c: ["MX"]
		},
		"America/Metlakatla": {
			u: -540,
			d: -480,
			c: ["US"]
		},
		"America/Mexico_City": {
			u: -360,
			d: -300,
			c: ["MX"]
		},
		"America/Miquelon": {
			u: -180,
			d: -120,
			c: ["PM"]
		},
		"America/Moncton": {
			u: -240,
			d: -180,
			c: ["CA"]
		},
		"America/Monterrey": {
			u: -360,
			d: -300,
			c: ["MX"]
		},
		"America/Montevideo": {
			u: -180,
			c: ["UY"]
		},
		"America/Montreal": {
			a: "America/Toronto",
			c: ["CA"],
			r: 1
		},
		"America/Montserrat": {
			a: "America/Puerto_Rico",
			c: ["MS"],
			r: 1
		},
		"America/Nassau": {
			a: "America/Toronto",
			c: ["BS"],
			r: 1
		},
		"America/New_York": {
			u: -300,
			d: -240,
			c: ["US"]
		},
		"America/Nipigon": {
			u: -300,
			d: -240,
			c: ["CA"]
		},
		"America/Nome": {
			u: -540,
			d: -480,
			c: ["US"]
		},
		"America/Noronha": {
			u: -120,
			c: ["BR"]
		},
		"America/North_Dakota/Beulah": {
			u: -360,
			d: -300,
			c: ["US"]
		},
		"America/North_Dakota/Center": {
			u: -360,
			d: -300,
			c: ["US"]
		},
		"America/North_Dakota/New_Salem": {
			u: -360,
			d: -300,
			c: ["US"]
		},
		"America/Nuuk": {
			u: -180,
			d: -120,
			c: ["GL"]
		},
		"America/Ojinaga": {
			u: -420,
			d: -360,
			c: ["MX"]
		},
		"America/Panama": {
			u: -300,
			c: ["PA", "CA", "KY"]
		},
		"America/Pangnirtung": {
			u: -300,
			d: -240,
			c: ["CA"]
		},
		"America/Paramaribo": {
			u: -180,
			c: ["SR"]
		},
		"America/Phoenix": {
			u: -420,
			c: ["US", "CA"]
		},
		"America/Port-au-Prince": {
			u: -300,
			d: -240,
			c: ["HT"]
		},
		"America/Port_of_Spain": {
			a: "America/Puerto_Rico",
			c: ["TT"],
			r: 1
		},
		"America/Porto_Acre": {
			a: "America/Rio_Branco",
			r: 1
		},
		"America/Porto_Velho": {
			u: -240,
			c: ["BR"]
		},
		"America/Puerto_Rico": {
			u: -240,
			c: [
				"PR",
				"AG",
				"CA",
				"AI",
				"AW",
				"BL",
				"BQ",
				"CW",
				"DM",
				"GD",
				"GP",
				"KN",
				"LC",
				"MF",
				"MS",
				"SX",
				"TT",
				"VC",
				"VG",
				"VI"
			]
		},
		"America/Punta_Arenas": {
			u: -180,
			c: ["CL"]
		},
		"America/Rainy_River": {
			u: -360,
			d: -300,
			c: ["CA"]
		},
		"America/Rankin_Inlet": {
			u: -360,
			d: -300,
			c: ["CA"]
		},
		"America/Recife": {
			u: -180,
			c: ["BR"]
		},
		"America/Regina": {
			u: -360,
			c: ["CA"]
		},
		"America/Resolute": {
			u: -360,
			d: -300,
			c: ["CA"]
		},
		"America/Rio_Branco": {
			u: -300,
			c: ["BR"]
		},
		"America/Rosario": {
			a: "America/Argentina/Cordoba",
			r: 1
		},
		"America/Santa_Isabel": {
			a: "America/Tijuana",
			r: 1
		},
		"America/Santarem": {
			u: -180,
			c: ["BR"]
		},
		"America/Santiago": {
			u: -240,
			d: -180,
			c: ["CL"]
		},
		"America/Santo_Domingo": {
			u: -240,
			c: ["DO"]
		},
		"America/Sao_Paulo": {
			u: -180,
			c: ["BR"]
		},
		"America/Scoresbysund": {
			u: -60,
			d: 0,
			c: ["GL"]
		},
		"America/Shiprock": {
			a: "America/Denver",
			r: 1
		},
		"America/Sitka": {
			u: -540,
			d: -480,
			c: ["US"]
		},
		"America/St_Barthelemy": {
			a: "America/Puerto_Rico",
			c: ["BL"],
			r: 1
		},
		"America/St_Johns": {
			u: -150,
			d: -90,
			c: ["CA"]
		},
		"America/St_Kitts": {
			a: "America/Puerto_Rico",
			c: ["KN"],
			r: 1
		},
		"America/St_Lucia": {
			a: "America/Puerto_Rico",
			c: ["LC"],
			r: 1
		},
		"America/St_Thomas": {
			a: "America/Puerto_Rico",
			c: ["VI"],
			r: 1
		},
		"America/St_Vincent": {
			a: "America/Puerto_Rico",
			c: ["VC"],
			r: 1
		},
		"America/Swift_Current": {
			u: -360,
			c: ["CA"]
		},
		"America/Tegucigalpa": {
			u: -360,
			c: ["HN"]
		},
		"America/Thule": {
			u: -240,
			d: -180,
			c: ["GL"]
		},
		"America/Thunder_Bay": {
			u: -300,
			d: -240,
			c: ["CA"]
		},
		"America/Tijuana": {
			u: -480,
			d: -420,
			c: ["MX"]
		},
		"America/Toronto": {
			u: -300,
			d: -240,
			c: ["CA", "BS"]
		},
		"America/Tortola": {
			a: "America/Puerto_Rico",
			c: ["VG"],
			r: 1
		},
		"America/Vancouver": {
			u: -480,
			d: -420,
			c: ["CA"]
		},
		"America/Virgin": {
			a: "America/Puerto_Rico",
			c: ["VI"],
			r: 1
		},
		"America/Whitehorse": {
			u: -420,
			c: ["CA"]
		},
		"America/Winnipeg": {
			u: -360,
			d: -300,
			c: ["CA"]
		},
		"America/Yakutat": {
			u: -540,
			d: -480,
			c: ["US"]
		},
		"America/Yellowknife": {
			u: -420,
			d: -360,
			c: ["CA"]
		},
		"Antarctica/Casey": {
			u: 660,
			c: ["AQ"]
		},
		"Antarctica/Davis": {
			u: 420,
			c: ["AQ"]
		},
		"Antarctica/DumontDUrville": {
			a: "Pacific/Port_Moresby",
			c: ["AQ"],
			r: 1
		},
		"Antarctica/Macquarie": {
			u: 600,
			d: 660,
			c: ["AU"]
		},
		"Antarctica/Mawson": {
			u: 300,
			c: ["AQ"]
		},
		"Antarctica/McMurdo": {
			a: "Pacific/Auckland",
			c: ["AQ"],
			r: 1
		},
		"Antarctica/Palmer": {
			u: -180,
			c: ["AQ"]
		},
		"Antarctica/Rothera": {
			u: -180,
			c: ["AQ"]
		},
		"Antarctica/South_Pole": {
			a: "Pacific/Auckland",
			c: ["AQ"],
			r: 1
		},
		"Antarctica/Syowa": {
			a: "Asia/Riyadh",
			c: ["AQ"],
			r: 1
		},
		"Antarctica/Troll": {
			u: 0,
			d: 120,
			c: ["AQ"]
		},
		"Antarctica/Vostok": {
			u: 360,
			c: ["AQ"]
		},
		"Arctic/Longyearbyen": {
			a: "Europe/Oslo",
			c: ["SJ"],
			r: 1
		},
		"Asia/Aden": {
			a: "Asia/Riyadh",
			c: ["YE"],
			r: 1
		},
		"Asia/Almaty": {
			u: 360,
			c: ["KZ"]
		},
		"Asia/Amman": {
			u: 120,
			d: 180,
			c: ["JO"]
		},
		"Asia/Anadyr": {
			u: 720,
			c: ["RU"]
		},
		"Asia/Aqtau": {
			u: 300,
			c: ["KZ"]
		},
		"Asia/Aqtobe": {
			u: 300,
			c: ["KZ"]
		},
		"Asia/Ashgabat": {
			u: 300,
			c: ["TM"]
		},
		"Asia/Ashkhabad": {
			a: "Asia/Ashgabat",
			r: 1
		},
		"Asia/Atyrau": {
			u: 300,
			c: ["KZ"]
		},
		"Asia/Baghdad": {
			u: 180,
			c: ["IQ"]
		},
		"Asia/Bahrain": {
			a: "Asia/Qatar",
			c: ["BH"],
			r: 1
		},
		"Asia/Baku": {
			u: 240,
			c: ["AZ"]
		},
		"Asia/Bangkok": {
			u: 420,
			c: ["TH", "KH", "LA", "VN"]
		},
		"Asia/Barnaul": {
			u: 420,
			c: ["RU"]
		},
		"Asia/Beirut": {
			u: 120,
			d: 180,
			c: ["LB"]
		},
		"Asia/Bishkek": {
			u: 360,
			c: ["KG"]
		},
		"Asia/Brunei": {
			u: 480,
			c: ["BN"]
		},
		"Asia/Calcutta": {
			a: "Asia/Kolkata",
			r: 1
		},
		"Asia/Chita": {
			u: 540,
			c: ["RU"]
		},
		"Asia/Choibalsan": {
			u: 480,
			c: ["MN"]
		},
		"Asia/Chongqing": {
			a: "Asia/Shanghai",
			r: 1
		},
		"Asia/Chungking": {
			a: "Asia/Shanghai",
			r: 1
		},
		"Asia/Colombo": {
			u: 330,
			c: ["LK"]
		},
		"Asia/Dacca": {
			a: "Asia/Dhaka",
			r: 1
		},
		"Asia/Damascus": {
			u: 120,
			d: 180,
			c: ["SY"]
		},
		"Asia/Dhaka": {
			u: 360,
			c: ["BD"]
		},
		"Asia/Dili": {
			u: 540,
			c: ["TL"]
		},
		"Asia/Dubai": {
			u: 240,
			c: ["AE", "OM"]
		},
		"Asia/Dushanbe": {
			u: 300,
			c: ["TJ"]
		},
		"Asia/Famagusta": {
			u: 120,
			d: 180,
			c: ["CY"]
		},
		"Asia/Gaza": {
			u: 120,
			d: 180,
			c: ["PS"]
		},
		"Asia/Harbin": {
			a: "Asia/Shanghai",
			r: 1
		},
		"Asia/Hebron": {
			u: 120,
			d: 180,
			c: ["PS"]
		},
		"Asia/Ho_Chi_Minh": {
			u: 420,
			c: ["VN"]
		},
		"Asia/Hong_Kong": {
			u: 480,
			c: ["HK"]
		},
		"Asia/Hovd": {
			u: 420,
			c: ["MN"]
		},
		"Asia/Irkutsk": {
			u: 480,
			c: ["RU"]
		},
		"Asia/Istanbul": {
			a: "Europe/Istanbul",
			r: 1
		},
		"Asia/Jakarta": {
			u: 420,
			c: ["ID"]
		},
		"Asia/Jayapura": {
			u: 540,
			c: ["ID"]
		},
		"Asia/Jerusalem": {
			u: 120,
			d: 180,
			c: ["IL"]
		},
		"Asia/Kabul": {
			u: 270,
			c: ["AF"]
		},
		"Asia/Kamchatka": {
			u: 720,
			c: ["RU"]
		},
		"Asia/Karachi": {
			u: 300,
			c: ["PK"]
		},
		"Asia/Kashgar": {
			a: "Asia/Urumqi",
			r: 1
		},
		"Asia/Kathmandu": {
			u: 345,
			c: ["NP"]
		},
		"Asia/Katmandu": {
			a: "Asia/Kathmandu",
			r: 1
		},
		"Asia/Khandyga": {
			u: 540,
			c: ["RU"]
		},
		"Asia/Kolkata": {
			u: 330,
			c: ["IN"]
		},
		"Asia/Krasnoyarsk": {
			u: 420,
			c: ["RU"]
		},
		"Asia/Kuala_Lumpur": {
			u: 480,
			c: ["MY"]
		},
		"Asia/Kuching": {
			u: 480,
			c: ["MY"]
		},
		"Asia/Kuwait": {
			a: "Asia/Riyadh",
			c: ["KW"],
			r: 1
		},
		"Asia/Macao": {
			a: "Asia/Macau",
			r: 1
		},
		"Asia/Macau": {
			u: 480,
			c: ["MO"]
		},
		"Asia/Magadan": {
			u: 660,
			c: ["RU"]
		},
		"Asia/Makassar": {
			u: 480,
			c: ["ID"]
		},
		"Asia/Manila": {
			u: 480,
			c: ["PH"]
		},
		"Asia/Muscat": {
			a: "Asia/Dubai",
			c: ["OM"],
			r: 1
		},
		"Asia/Nicosia": {
			u: 120,
			d: 180,
			c: ["CY"]
		},
		"Asia/Novokuznetsk": {
			u: 420,
			c: ["RU"]
		},
		"Asia/Novosibirsk": {
			u: 420,
			c: ["RU"]
		},
		"Asia/Omsk": {
			u: 360,
			c: ["RU"]
		},
		"Asia/Oral": {
			u: 300,
			c: ["KZ"]
		},
		"Asia/Phnom_Penh": {
			a: "Asia/Bangkok",
			c: ["KH"],
			r: 1
		},
		"Asia/Pontianak": {
			u: 420,
			c: ["ID"]
		},
		"Asia/Pyongyang": {
			u: 540,
			c: ["KP"]
		},
		"Asia/Qatar": {
			u: 180,
			c: ["QA", "BH"]
		},
		"Asia/Qostanay": {
			u: 360,
			c: ["KZ"]
		},
		"Asia/Qyzylorda": {
			u: 300,
			c: ["KZ"]
		},
		"Asia/Rangoon": {
			a: "Asia/Yangon",
			r: 1
		},
		"Asia/Riyadh": {
			u: 180,
			c: ["SA", "AQ", "KW", "YE"]
		},
		"Asia/Saigon": {
			a: "Asia/Ho_Chi_Minh",
			r: 1
		},
		"Asia/Sakhalin": {
			u: 660,
			c: ["RU"]
		},
		"Asia/Samarkand": {
			u: 300,
			c: ["UZ"]
		},
		"Asia/Seoul": {
			u: 540,
			c: ["KR"]
		},
		"Asia/Shanghai": {
			u: 480,
			c: ["CN"]
		},
		"Asia/Singapore": {
			u: 480,
			c: ["SG", "MY"]
		},
		"Asia/Srednekolymsk": {
			u: 660,
			c: ["RU"]
		},
		"Asia/Taipei": {
			u: 480,
			c: ["TW"]
		},
		"Asia/Tashkent": {
			u: 300,
			c: ["UZ"]
		},
		"Asia/Tbilisi": {
			u: 240,
			c: ["GE"]
		},
		"Asia/Tehran": {
			u: 210,
			d: 270,
			c: ["IR"]
		},
		"Asia/Tel_Aviv": {
			a: "Asia/Jerusalem",
			r: 1
		},
		"Asia/Thimbu": {
			a: "Asia/Thimphu",
			r: 1
		},
		"Asia/Thimphu": {
			u: 360,
			c: ["BT"]
		},
		"Asia/Tokyo": {
			u: 540,
			c: ["JP"]
		},
		"Asia/Tomsk": {
			u: 420,
			c: ["RU"]
		},
		"Asia/Ujung_Pandang": {
			a: "Asia/Makassar",
			r: 1
		},
		"Asia/Ulaanbaatar": {
			u: 480,
			c: ["MN"]
		},
		"Asia/Ulan_Bator": {
			a: "Asia/Ulaanbaatar",
			r: 1
		},
		"Asia/Urumqi": {
			u: 360,
			c: ["CN"]
		},
		"Asia/Ust-Nera": {
			u: 600,
			c: ["RU"]
		},
		"Asia/Vientiane": {
			a: "Asia/Bangkok",
			c: ["LA"],
			r: 1
		},
		"Asia/Vladivostok": {
			u: 600,
			c: ["RU"]
		},
		"Asia/Yakutsk": {
			u: 540,
			c: ["RU"]
		},
		"Asia/Yangon": {
			u: 390,
			c: ["MM"]
		},
		"Asia/Yekaterinburg": {
			u: 300,
			c: ["RU"]
		},
		"Asia/Yerevan": {
			u: 240,
			c: ["AM"]
		},
		"Atlantic/Azores": {
			u: -60,
			d: 0,
			c: ["PT"]
		},
		"Atlantic/Bermuda": {
			u: -240,
			d: -180,
			c: ["BM"]
		},
		"Atlantic/Canary": {
			u: 0,
			d: 60,
			c: ["ES"]
		},
		"Atlantic/Cape_Verde": {
			u: -60,
			c: ["CV"]
		},
		"Atlantic/Faeroe": {
			a: "Atlantic/Faroe",
			r: 1
		},
		"Atlantic/Faroe": {
			u: 0,
			d: 60,
			c: ["FO"]
		},
		"Atlantic/Jan_Mayen": {
			a: "Europe/Oslo",
			c: ["SJ"],
			r: 1
		},
		"Atlantic/Madeira": {
			u: 0,
			d: 60,
			c: ["PT"]
		},
		"Atlantic/Reykjavik": {
			u: 0,
			c: ["IS"]
		},
		"Atlantic/South_Georgia": {
			u: -120,
			c: ["GS"]
		},
		"Atlantic/St_Helena": {
			a: "Africa/Abidjan",
			c: ["SH"],
			r: 1
		},
		"Atlantic/Stanley": {
			u: -180,
			c: ["FK"]
		},
		"Australia/ACT": {
			a: "Australia/Sydney",
			r: 1
		},
		"Australia/Adelaide": {
			u: 570,
			d: 630,
			c: ["AU"]
		},
		"Australia/Brisbane": {
			u: 600,
			c: ["AU"]
		},
		"Australia/Broken_Hill": {
			u: 570,
			d: 630,
			c: ["AU"]
		},
		"Australia/Canberra": {
			a: "Australia/Sydney",
			r: 1
		},
		"Australia/Currie": {
			a: "Australia/Hobart",
			r: 1
		},
		"Australia/Darwin": {
			u: 570,
			c: ["AU"]
		},
		"Australia/Eucla": {
			u: 525,
			c: ["AU"]
		},
		"Australia/Hobart": {
			u: 600,
			d: 660,
			c: ["AU"]
		},
		"Australia/LHI": {
			a: "Australia/Lord_Howe",
			r: 1
		},
		"Australia/Lindeman": {
			u: 600,
			c: ["AU"]
		},
		"Australia/Lord_Howe": {
			u: 630,
			d: 660,
			c: ["AU"]
		},
		"Australia/Melbourne": {
			u: 600,
			d: 660,
			c: ["AU"]
		},
		"Australia/NSW": {
			a: "Australia/Sydney",
			r: 1
		},
		"Australia/North": {
			a: "Australia/Darwin",
			r: 1
		},
		"Australia/Perth": {
			u: 480,
			c: ["AU"]
		},
		"Australia/Queensland": {
			a: "Australia/Brisbane",
			r: 1
		},
		"Australia/South": {
			a: "Australia/Adelaide",
			r: 1
		},
		"Australia/Sydney": {
			u: 600,
			d: 660,
			c: ["AU"]
		},
		"Australia/Tasmania": {
			a: "Australia/Hobart",
			r: 1
		},
		"Australia/Victoria": {
			a: "Australia/Melbourne",
			r: 1
		},
		"Australia/West": {
			a: "Australia/Perth",
			r: 1
		},
		"Australia/Yancowinna": {
			a: "Australia/Broken_Hill",
			r: 1
		},
		"Brazil/Acre": {
			a: "America/Rio_Branco",
			r: 1
		},
		"Brazil/DeNoronha": {
			a: "America/Noronha",
			r: 1
		},
		"Brazil/East": {
			a: "America/Sao_Paulo",
			r: 1
		},
		"Brazil/West": {
			a: "America/Manaus",
			r: 1
		},
		CET: {
			u: 60,
			d: 120
		},
		CST6CDT: {
			u: -360,
			d: -300
		},
		"Canada/Atlantic": {
			a: "America/Halifax",
			r: 1
		},
		"Canada/Central": {
			a: "America/Winnipeg",
			r: 1
		},
		"Canada/Eastern": {
			a: "America/Toronto",
			c: ["CA"],
			r: 1
		},
		"Canada/Mountain": {
			a: "America/Edmonton",
			r: 1
		},
		"Canada/Newfoundland": {
			a: "America/St_Johns",
			r: 1
		},
		"Canada/Pacific": {
			a: "America/Vancouver",
			r: 1
		},
		"Canada/Saskatchewan": {
			a: "America/Regina",
			r: 1
		},
		"Canada/Yukon": {
			a: "America/Whitehorse",
			r: 1
		},
		"Chile/Continental": {
			a: "America/Santiago",
			r: 1
		},
		"Chile/EasterIsland": {
			a: "Pacific/Easter",
			r: 1
		},
		Cuba: {
			a: "America/Havana",
			r: 1
		},
		EET: {
			u: 120,
			d: 180
		},
		EST: {
			u: -300
		},
		EST5EDT: {
			u: -300,
			d: -240
		},
		Egypt: {
			a: "Africa/Cairo",
			r: 1
		},
		Eire: {
			a: "Europe/Dublin",
			r: 1
		},
		"Etc/GMT": {
			u: 0
		},
		"Etc/GMT+0": {
			a: "Etc/GMT",
			r: 1
		},
		"Etc/GMT+1": {
			u: -60
		},
		"Etc/GMT+10": {
			u: -600
		},
		"Etc/GMT+11": {
			u: -660
		},
		"Etc/GMT+12": {
			u: -720
		},
		"Etc/GMT+2": {
			u: -120
		},
		"Etc/GMT+3": {
			u: -180
		},
		"Etc/GMT+4": {
			u: -240
		},
		"Etc/GMT+5": {
			u: -300
		},
		"Etc/GMT+6": {
			u: -360
		},
		"Etc/GMT+7": {
			u: -420
		},
		"Etc/GMT+8": {
			u: -480
		},
		"Etc/GMT+9": {
			u: -540
		},
		"Etc/GMT-0": {
			a: "Etc/GMT",
			r: 1
		},
		"Etc/GMT-1": {
			u: 60
		},
		"Etc/GMT-10": {
			u: 600
		},
		"Etc/GMT-11": {
			u: 660
		},
		"Etc/GMT-12": {
			u: 720
		},
		"Etc/GMT-13": {
			u: 780
		},
		"Etc/GMT-14": {
			u: 840
		},
		"Etc/GMT-2": {
			u: 120
		},
		"Etc/GMT-3": {
			u: 180
		},
		"Etc/GMT-4": {
			u: 240
		},
		"Etc/GMT-5": {
			u: 300
		},
		"Etc/GMT-6": {
			u: 360
		},
		"Etc/GMT-7": {
			u: 420
		},
		"Etc/GMT-8": {
			u: 480
		},
		"Etc/GMT-9": {
			u: 540
		},
		"Etc/GMT0": {
			a: "Etc/GMT",
			r: 1
		},
		"Etc/Greenwich": {
			a: "Etc/GMT",
			r: 1
		},
		"Etc/UCT": {
			a: "Etc/UTC",
			r: 1
		},
		"Etc/UTC": {
			u: 0
		},
		"Etc/Universal": {
			a: "Etc/UTC",
			r: 1
		},
		"Etc/Zulu": {
			a: "Etc/UTC",
			r: 1
		},
		"Europe/Amsterdam": {
			u: 60,
			d: 120,
			c: ["NL"]
		},
		"Europe/Andorra": {
			u: 60,
			d: 120,
			c: ["AD"]
		},
		"Europe/Astrakhan": {
			u: 240,
			c: ["RU"]
		},
		"Europe/Athens": {
			u: 120,
			d: 180,
			c: ["GR"]
		},
		"Europe/Belfast": {
			a: "Europe/London",
			c: ["GB"],
			r: 1
		},
		"Europe/Belgrade": {
			u: 60,
			d: 120,
			c: ["RS", "BA", "HR", "ME", "MK", "SI"]
		},
		"Europe/Berlin": {
			u: 60,
			d: 120,
			c: ["DE"]
		},
		"Europe/Bratislava": {
			a: "Europe/Prague",
			c: ["SK"],
			r: 1
		},
		"Europe/Brussels": {
			u: 60,
			d: 120,
			c: ["BE"]
		},
		"Europe/Bucharest": {
			u: 120,
			d: 180,
			c: ["RO"]
		},
		"Europe/Budapest": {
			u: 60,
			d: 120,
			c: ["HU"]
		},
		"Europe/Busingen": {
			a: "Europe/Zurich",
			c: ["DE"],
			r: 1
		},
		"Europe/Chisinau": {
			u: 120,
			d: 180,
			c: ["MD"]
		},
		"Europe/Copenhagen": {
			u: 60,
			d: 120,
			c: ["DK"]
		},
		"Europe/Dublin": {
			u: 60,
			d: 0,
			c: ["IE"]
		},
		"Europe/Gibraltar": {
			u: 60,
			d: 120,
			c: ["GI"]
		},
		"Europe/Guernsey": {
			a: "Europe/London",
			c: ["GG"],
			r: 1
		},
		"Europe/Helsinki": {
			u: 120,
			d: 180,
			c: ["FI", "AX"]
		},
		"Europe/Isle_of_Man": {
			a: "Europe/London",
			c: ["IM"],
			r: 1
		},
		"Europe/Istanbul": {
			u: 180,
			c: ["TR"]
		},
		"Europe/Jersey": {
			a: "Europe/London",
			c: ["JE"],
			r: 1
		},
		"Europe/Kaliningrad": {
			u: 120,
			c: ["RU"]
		},
		"Europe/Kiev": {
			u: 120,
			d: 180,
			c: ["UA"]
		},
		"Europe/Kirov": {
			u: 180,
			c: ["RU"]
		},
		"Europe/Lisbon": {
			u: 0,
			d: 60,
			c: ["PT"]
		},
		"Europe/Ljubljana": {
			a: "Europe/Belgrade",
			c: ["SI"],
			r: 1
		},
		"Europe/London": {
			u: 0,
			d: 60,
			c: ["GB", "GG", "IM", "JE"]
		},
		"Europe/Luxembourg": {
			u: 60,
			d: 120,
			c: ["LU"]
		},
		"Europe/Madrid": {
			u: 60,
			d: 120,
			c: ["ES"]
		},
		"Europe/Malta": {
			u: 60,
			d: 120,
			c: ["MT"]
		},
		"Europe/Mariehamn": {
			a: "Europe/Helsinki",
			c: ["AX"],
			r: 1
		},
		"Europe/Minsk": {
			u: 180,
			c: ["BY"]
		},
		"Europe/Monaco": {
			u: 60,
			d: 120,
			c: ["MC"]
		},
		"Europe/Moscow": {
			u: 180,
			c: ["RU"]
		},
		"Europe/Nicosia": {
			a: "Asia/Nicosia",
			r: 1
		},
		"Europe/Oslo": {
			u: 60,
			d: 120,
			c: ["NO", "SJ", "BV"]
		},
		"Europe/Paris": {
			u: 60,
			d: 120,
			c: ["FR"]
		},
		"Europe/Podgorica": {
			a: "Europe/Belgrade",
			c: ["ME"],
			r: 1
		},
		"Europe/Prague": {
			u: 60,
			d: 120,
			c: ["CZ", "SK"]
		},
		"Europe/Riga": {
			u: 120,
			d: 180,
			c: ["LV"]
		},
		"Europe/Rome": {
			u: 60,
			d: 120,
			c: ["IT", "SM", "VA"]
		},
		"Europe/Samara": {
			u: 240,
			c: ["RU"]
		},
		"Europe/San_Marino": {
			a: "Europe/Rome",
			c: ["SM"],
			r: 1
		},
		"Europe/Sarajevo": {
			a: "Europe/Belgrade",
			c: ["BA"],
			r: 1
		},
		"Europe/Saratov": {
			u: 240,
			c: ["RU"]
		},
		"Europe/Simferopol": {
			u: 180,
			c: ["RU", "UA"]
		},
		"Europe/Skopje": {
			a: "Europe/Belgrade",
			c: ["MK"],
			r: 1
		},
		"Europe/Sofia": {
			u: 120,
			d: 180,
			c: ["BG"]
		},
		"Europe/Stockholm": {
			u: 60,
			d: 120,
			c: ["SE"]
		},
		"Europe/Tallinn": {
			u: 120,
			d: 180,
			c: ["EE"]
		},
		"Europe/Tirane": {
			u: 60,
			d: 120,
			c: ["AL"]
		},
		"Europe/Tiraspol": {
			a: "Europe/Chisinau",
			r: 1
		},
		"Europe/Ulyanovsk": {
			u: 240,
			c: ["RU"]
		},
		"Europe/Uzhgorod": {
			u: 120,
			d: 180,
			c: ["UA"]
		},
		"Europe/Vaduz": {
			a: "Europe/Zurich",
			c: ["LI"],
			r: 1
		},
		"Europe/Vatican": {
			a: "Europe/Rome",
			c: ["VA"],
			r: 1
		},
		"Europe/Vienna": {
			u: 60,
			d: 120,
			c: ["AT"]
		},
		"Europe/Vilnius": {
			u: 120,
			d: 180,
			c: ["LT"]
		},
		"Europe/Volgograd": {
			u: 180,
			c: ["RU"]
		},
		"Europe/Warsaw": {
			u: 60,
			d: 120,
			c: ["PL"]
		},
		"Europe/Zagreb": {
			a: "Europe/Belgrade",
			c: ["HR"],
			r: 1
		},
		"Europe/Zaporozhye": {
			u: 120,
			d: 180,
			c: ["UA"]
		},
		"Europe/Zurich": {
			u: 60,
			d: 120,
			c: ["CH", "DE", "LI"]
		},
		Factory: {
			u: 0
		},
		GB: {
			a: "Europe/London",
			c: ["GB"],
			r: 1
		},
		"GB-Eire": {
			a: "Europe/London",
			c: ["GB"],
			r: 1
		},
		GMT: {
			a: "Etc/GMT",
			r: 1
		},
		"GMT+0": {
			a: "Etc/GMT",
			r: 1
		},
		"GMT-0": {
			a: "Etc/GMT",
			r: 1
		},
		GMT0: {
			a: "Etc/GMT",
			r: 1
		},
		Greenwich: {
			a: "Etc/GMT",
			r: 1
		},
		HST: {
			u: -600
		},
		Hongkong: {
			a: "Asia/Hong_Kong",
			r: 1
		},
		Iceland: {
			a: "Atlantic/Reykjavik",
			r: 1
		},
		"Indian/Antananarivo": {
			a: "Africa/Nairobi",
			c: ["MG"],
			r: 1
		},
		"Indian/Chagos": {
			u: 360,
			c: ["IO"]
		},
		"Indian/Christmas": {
			u: 420,
			c: ["CX"]
		},
		"Indian/Cocos": {
			u: 390,
			c: ["CC"]
		},
		"Indian/Comoro": {
			a: "Africa/Nairobi",
			c: ["KM"],
			r: 1
		},
		"Indian/Kerguelen": {
			u: 300,
			c: ["TF", "HM"]
		},
		"Indian/Mahe": {
			u: 240,
			c: ["SC"]
		},
		"Indian/Maldives": {
			u: 300,
			c: ["MV"]
		},
		"Indian/Mauritius": {
			u: 240,
			c: ["MU"]
		},
		"Indian/Mayotte": {
			a: "Africa/Nairobi",
			c: ["YT"],
			r: 1
		},
		"Indian/Reunion": {
			u: 240,
			c: ["RE", "TF"]
		},
		Iran: {
			a: "Asia/Tehran",
			r: 1
		},
		Israel: {
			a: "Asia/Jerusalem",
			r: 1
		},
		Jamaica: {
			a: "America/Jamaica",
			r: 1
		},
		Japan: {
			a: "Asia/Tokyo",
			r: 1
		},
		Kwajalein: {
			a: "Pacific/Kwajalein",
			r: 1
		},
		Libya: {
			a: "Africa/Tripoli",
			r: 1
		},
		MET: {
			u: 60,
			d: 120
		},
		MST: {
			u: -420
		},
		MST7MDT: {
			u: -420,
			d: -360
		},
		"Mexico/BajaNorte": {
			a: "America/Tijuana",
			r: 1
		},
		"Mexico/BajaSur": {
			a: "America/Mazatlan",
			r: 1
		},
		"Mexico/General": {
			a: "America/Mexico_City",
			r: 1
		},
		NZ: {
			a: "Pacific/Auckland",
			c: ["NZ"],
			r: 1
		},
		"NZ-CHAT": {
			a: "Pacific/Chatham",
			r: 1
		},
		Navajo: {
			a: "America/Denver",
			r: 1
		},
		PRC: {
			a: "Asia/Shanghai",
			r: 1
		},
		PST8PDT: {
			u: -480,
			d: -420
		},
		"Pacific/Apia": {
			u: 780,
			c: ["WS"]
		},
		"Pacific/Auckland": {
			u: 720,
			d: 780,
			c: ["NZ", "AQ"]
		},
		"Pacific/Bougainville": {
			u: 660,
			c: ["PG"]
		},
		"Pacific/Chatham": {
			u: 765,
			d: 825,
			c: ["NZ"]
		},
		"Pacific/Chuuk": {
			u: 600,
			c: ["FM"]
		},
		"Pacific/Easter": {
			u: -360,
			d: -300,
			c: ["CL"]
		},
		"Pacific/Efate": {
			u: 660,
			c: ["VU"]
		},
		"Pacific/Enderbury": {
			a: "Pacific/Kanton",
			r: 1
		},
		"Pacific/Fakaofo": {
			u: 780,
			c: ["TK"]
		},
		"Pacific/Fiji": {
			u: 720,
			d: 780,
			c: ["FJ"]
		},
		"Pacific/Funafuti": {
			u: 720,
			c: ["TV"]
		},
		"Pacific/Galapagos": {
			u: -360,
			c: ["EC"]
		},
		"Pacific/Gambier": {
			u: -540,
			c: ["PF"]
		},
		"Pacific/Guadalcanal": {
			u: 660,
			c: ["SB"]
		},
		"Pacific/Guam": {
			u: 600,
			c: ["GU", "MP"]
		},
		"Pacific/Honolulu": {
			u: -600,
			c: ["US", "UM"]
		},
		"Pacific/Johnston": {
			a: "Pacific/Honolulu",
			c: ["UM"],
			r: 1
		},
		"Pacific/Kanton": {
			u: 780,
			c: ["KI"]
		},
		"Pacific/Kiritimati": {
			u: 840,
			c: ["KI"]
		},
		"Pacific/Kosrae": {
			u: 660,
			c: ["FM"]
		},
		"Pacific/Kwajalein": {
			u: 720,
			c: ["MH"]
		},
		"Pacific/Majuro": {
			u: 720,
			c: ["MH"]
		},
		"Pacific/Marquesas": {
			u: -510,
			c: ["PF"]
		},
		"Pacific/Midway": {
			a: "Pacific/Pago_Pago",
			c: ["UM"],
			r: 1
		},
		"Pacific/Nauru": {
			u: 720,
			c: ["NR"]
		},
		"Pacific/Niue": {
			u: -660,
			c: ["NU"]
		},
		"Pacific/Norfolk": {
			u: 660,
			d: 720,
			c: ["NF"]
		},
		"Pacific/Noumea": {
			u: 660,
			c: ["NC"]
		},
		"Pacific/Pago_Pago": {
			u: -660,
			c: ["AS", "UM"]
		},
		"Pacific/Palau": {
			u: 540,
			c: ["PW"]
		},
		"Pacific/Pitcairn": {
			u: -480,
			c: ["PN"]
		},
		"Pacific/Pohnpei": {
			u: 660,
			c: ["FM"]
		},
		"Pacific/Ponape": {
			a: "Pacific/Pohnpei",
			r: 1
		},
		"Pacific/Port_Moresby": {
			u: 600,
			c: ["PG", "AQ"]
		},
		"Pacific/Rarotonga": {
			u: -600,
			c: ["CK"]
		},
		"Pacific/Saipan": {
			a: "Pacific/Guam",
			c: ["MP"],
			r: 1
		},
		"Pacific/Samoa": {
			a: "Pacific/Pago_Pago",
			c: ["WS"],
			r: 1
		},
		"Pacific/Tahiti": {
			u: -600,
			c: ["PF"]
		},
		"Pacific/Tarawa": {
			u: 720,
			c: ["KI"]
		},
		"Pacific/Tongatapu": {
			u: 780,
			c: ["TO"]
		},
		"Pacific/Truk": {
			a: "Pacific/Chuuk",
			r: 1
		},
		"Pacific/Wake": {
			u: 720,
			c: ["UM"]
		},
		"Pacific/Wallis": {
			u: 720,
			c: ["WF"]
		},
		"Pacific/Yap": {
			a: "Pacific/Chuuk",
			r: 1
		},
		Poland: {
			a: "Europe/Warsaw",
			r: 1
		},
		Portugal: {
			a: "Europe/Lisbon",
			r: 1
		},
		ROC: {
			a: "Asia/Taipei",
			r: 1
		},
		ROK: {
			a: "Asia/Seoul",
			r: 1
		},
		Singapore: {
			a: "Asia/Singapore",
			c: ["SG"],
			r: 1
		},
		Turkey: {
			a: "Europe/Istanbul",
			r: 1
		},
		UCT: {
			a: "Etc/UTC",
			r: 1
		},
		"US/Alaska": {
			a: "America/Anchorage",
			r: 1
		},
		"US/Aleutian": {
			a: "America/Adak",
			r: 1
		},
		"US/Arizona": {
			a: "America/Phoenix",
			c: ["US"],
			r: 1
		},
		"US/Central": {
			a: "America/Chicago",
			r: 1
		},
		"US/East-Indiana": {
			a: "America/Indiana/Indianapolis",
			r: 1
		},
		"US/Eastern": {
			a: "America/New_York",
			r: 1
		},
		"US/Hawaii": {
			a: "Pacific/Honolulu",
			c: ["US"],
			r: 1
		},
		"US/Indiana-Starke": {
			a: "America/Indiana/Knox",
			r: 1
		},
		"US/Michigan": {
			a: "America/Detroit",
			r: 1
		},
		"US/Mountain": {
			a: "America/Denver",
			r: 1
		},
		"US/Pacific": {
			a: "America/Los_Angeles",
			r: 1
		},
		"US/Samoa": {
			a: "Pacific/Pago_Pago",
			c: ["WS"],
			r: 1
		},
		UTC: {
			a: "Etc/UTC",
			r: 1
		},
		Universal: {
			a: "Etc/UTC",
			r: 1
		},
		"W-SU": {
			a: "Europe/Moscow",
			r: 1
		},
		WET: {
			u: 0,
			d: 60
		},
		Zulu: {
			a: "Etc/UTC",
			r: 1
		}
	};

	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	if (timezone === "" || !timezone) {
		return '??';
	}

	const country = timezones[timezone].c[0];
	return country;
};
