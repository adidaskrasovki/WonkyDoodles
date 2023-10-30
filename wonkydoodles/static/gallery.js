var pagenumber = 0;

var pagenumber_disp = document.getElementById('pagenumber');
var left_btn = document.getElementById('btn_left');
var right_btn = document.getElementById('btn_right');

var hidden_canvas = document.getElementById("hidden_canvas");
var hidden_ctx = this.hidden_canvas.getContext("2d");


function set_canvas_params(){
	hidden_canvas.style.top = '5rem';
	hidden_ctx.lineWidth = 3;
	hidden_ctx.strokeStyle = "white";
};


async function fill_page(){

    // Check if first image of the next page exists and
    // hide right_btn if not:
    is_in_range = await get_img(4 * (pagenumber + 1));
    if (is_in_range != 404){ right_btn.style = 'visibility:show'; }
    else { right_btn.style = 'visibility:hidden'; };

    // Fill page with images
    for(k = 0; k < 4; k++){
        var img = document.getElementById(`card_img_${k}`);
        var title = document.getElementById(`card_title_${k}`);
        var card = document.getElementById(`card_${k}`);
        var circle = document.getElementById(`circle_${k}`);

        dict = await get_img(4 * pagenumber + k);

        if (dict == 404){
            for(j = k; j < 4; j++){
                var img = document.getElementById(`card_img_${j}`);
                var title = document.getElementById(`card_title_${j}`);
                var card = document.getElementById(`card_${j}`);
                var circle = document.getElementById(`circle_${j}`);

                img.src = ``;
                title.innerHTML = '';
                card.style = 'visibility:hidden';
                circle.title = 'not Recognized';
                circle.setAttribute("class", 'rounded-circle bg-danger');
            };
            k = j;
        } else {
            var strokelist = dict.strokelist;
            var category = dict.category;
            var recognized = dict.recognized;

            if (dict.x_max == 255){
				var move_x = 0;
                var move_y = Math.round((255 - dict.y_max) / 2);
            } else {
                var move_x = Math.round((255 - dict.x_max) / 2);
				var move_y = 0;
            };

            new_strokelist = lin_transform(	strokelist,
                                            move_x,
                                            move_y,
                                            127, 127, .8);
            hidden_pencil(new_strokelist);

            img.src = hidden_canvas.toDataURL();
            title.innerHTML = category;
            card.style = 'visibility:show';
            if (recognized == true) {
                circle.title = 'Recognized'
                circle.setAttribute("class", 'rounded-circle bg-success');
            }
            else {
                circle.title = 'not Recognized'
                circle.setAttribute("class", 'rounded-circle bg-danger');
            };
        };
    };


    async function get_img(idx){
        const response = await fetch(`/img_handler?idx=${idx}`);
        return await response.json();
    };


    function hidden_pencil(strokelist){
		hidden_ctx.fillRect(0, 0, hidden_canvas.width, hidden_canvas.height);
		len_strokelist = strokelist.length;

		for (i=0; i<len_strokelist; i++){
			len_stroke = strokelist[i].length;
			hidden_ctx.beginPath();
			hidden_ctx.moveTo(strokelist[i][0]['x'], strokelist[i][0]['y']);
			for (j=1; j<len_stroke; j++){
				hidden_ctx.lineTo(strokelist[i][j]['x'], strokelist[i][j]['y']);
				hidden_ctx.stroke();
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

};


function click_left_btn(){
    if (pagenumber == 1){ left_btn.style = 'visibility:hidden'; };
    pagenumber = pagenumber - 1;
    pagenumber_disp.innerHTML = pagenumber + 1;
    fill_page();
};


function click_right_btn(){
    if (pagenumber == 0){ left_btn.style = 'visibility:show'; };
    pagenumber = pagenumber + 1;
    pagenumber_disp.innerHTML = pagenumber + 1;
    fill_page();
};