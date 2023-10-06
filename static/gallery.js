var pagenumber = document.getElementById('pagenumber')
var left_btn = document.getElementById('btn_left')
var right_btn = document.getElementById('btn_right')


async function fill_page(){
    for(i = 1; i <= 4; i++){
            var img = document.getElementById(`card_img_${i}`);

            const response = await fetch('http://localhost:5000/img_handler');
            base64 = await response.text();
            img.src = `data:image/png;base64, ${base64}`;
    };
}

function click_left_btn(){
    if (pagenumber.innerHTML == 2){ left_btn.style = 'visibility:hidden'; };
    pagenumber.innerHTML = pagenumber.innerHTML - 1;
    fill_page();  
}

function click_right_btn(){
    if (pagenumber.innerHTML == 1){ left_btn.style = 'visibility:show'; };
    pagenumber.innerHTML = parseInt(pagenumber.innerHTML) + 1;
    fill_page();  
}