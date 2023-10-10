var category = '';
var chk_save = document.getElementById('chk_save');
var result_list = [];

var canvas = document.getElementById("canvas");
var ctx = this.canvas.getContext("2d");
var curX, curY, prevX, prevY;
var hold = false;
var empty = true;
ctx.lineWidth = 1;
ctx.strokeStyle = "white";
ctx.rect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "black";
ctx.fill();
var vectorlist = []


function pencil(){
        
    canvas.onmousedown = function(e){
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
        post_then_get(category);
        hold = false;
    };
        
    canvas.onmouseout = function(e){
        if(hold){
            post_then_get(category);
        }
        hold = false;
    };
        
    function draw(){
        ctx.lineTo(curX, curY);
        ctx.stroke();
        vectorlist.push({"x": Math.floor(curX), "y": Math.floor(curY) });
    }
}


// function dataURLtoBlob(dataURL) {
//     let array, binary, i, len;
//     binary = atob(dataURL.split(',')[1]);
//     array = [];
//     i = 0;
//     len = binary.length;
//     while (i < len) {
//       array.push(binary.charCodeAt(i));
//       i++;
//     }
//     return new Blob([new Uint8Array(array)], {
//       type: 'image/png'
//     });
// };

async function send_to_eval(){
    var base64 = canvas.toDataURL("image/png");
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


async function post_img(target_route){
    var base64 = canvas.toDataURL("image/png");
    base64 = base64.replace(/^data:image\/(png|jpg);base64,/, "");

    return fetch(target_route, {
        method: 'POST',
        body: JSON.stringify({
            category: category,
            recognized: result_list[0][0] == category,
            timestamp: Date.now(),
            vectorlist: vectorlist,
            base64: base64
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then((response) => response.json())
    .then((json) => console.log(json))
    .catch(error => {
        console.error(error)
    });

};


async function get_results(){
    const response = await fetch('http://localhost:5000/eval_img');
    return await response.json();
};


async function post_then_get(category){
    await send_to_eval();
    result_list = await get_results();
    populate_table(result_list, category);
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


async function set_category(){
    const response = await fetch('http://localhost:5000/stage_category');
    category = await response.text();
    document.getElementById("category").innerHTML = `Draw ${category} !`;
};


function next(){
    if (chk_save.checked == true && empty == false){
        post_img('/img_handler');
    };
    set_category();
    clearpage();
    empty = true;
};


function clearpage(){
    // clear canvas
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    empty = true;

    // clear table
    for(i=0; i<=9; i++){
        for(j=0; j<=1; j++){            
            var cell = document.getElementById('cell' + i.toString() + j.toString());
            cell.innerHTML = '';
        }
    };
};