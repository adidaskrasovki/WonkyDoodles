var pagenumber = 0;

var pagenumber_disp = document.getElementById('pagenumber');
var left_btn = document.getElementById('btn_left');
var right_btn = document.getElementById('btn_right');


async function get_img(idx){
    const response = await fetch(`/img_handler?idx=${idx}`);
    return await response.json();
};


async function fill_page(){

    // Check if first image of the next page exists and
    // hide right_btn if not:
    is_in_range = await get_img(4 * (pagenumber + 1));
    console.log(typeof is_in_range);
    if (is_in_range != 404){ right_btn.style = 'visibility:show'; }
    else { right_btn.style = 'visibility:hidden'; };

    // Fill page with images
    for(i = 0; i < 4; i++){
            var img = document.getElementById(`card_img_${i}`);
            var title = document.getElementById(`card_title_${i}`);
            var card = document.getElementById(`card_${i}`);
            var circle = document.getElementById(`circle_${i}`);

            dict = await get_img(4 * pagenumber + i);
            var base64 = dict.base64;
            var category = dict.category;
            var recognized = dict.recognized;

            if (dict == 404){
                for(j = i; j < 4; j++){
                    var img = document.getElementById(`card_img_${j}`);
                    var title = document.getElementById(`card_title_${i}`);
                    var card = document.getElementById(`card_${j}`);
                    var circle = document.getElementById(`circle_${i}`);

                    img.src = ``;
                    title.innerHTML = '';
                    card.style = 'visibility:hidden';
                    circle.title = 'not Recognized'
                    circle.setAttribute("class", 'rounded-circle bg-danger');
                };
                i = j;
            }
            else {
                img.src = `data:image/png;base64, ${base64}`;
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
}


function click_left_btn(){
    if (pagenumber == 1){ left_btn.style = 'visibility:hidden'; };
    pagenumber = pagenumber - 1;
    pagenumber_disp.innerHTML = pagenumber + 1;
    fill_page();
}


function click_right_btn(){
    if (pagenumber == 0){ left_btn.style = 'visibility:show'; };
    pagenumber = pagenumber + 1;
    pagenumber_disp.innerHTML = pagenumber + 1;
    fill_page();
}