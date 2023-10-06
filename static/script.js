var category = JSON.parse(document.getElementById("paint").dataset.category);

var canvas = document.getElementById("paint");
var ctx = this.canvas.getContext("2d");
var curX, curY, prevX, prevY;
var hold = false;
ctx.lineWidth = 1;
ctx.strokeStyle = "white";
ctx.rect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "black";
ctx.fill();


function pencil(){
        
    canvas.onmousedown = function(e){
        curX = e.clientX - canvas.getBoundingClientRect().left;
        curY = e.clientY - canvas.getBoundingClientRect().top;
        hold = true;
            
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
        hold = false;
        post_then_get(category);
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

        // !!! Use below in the future to send vector-lists to server !!!
        // canvas_data.pencil.push({ "startx": prevX, "starty": prevY, "endx": curX, "endy": curY, "thick": ctx.lineWidth, "color": ctx.strokeStyle });
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

async function post_img(target_route){
    var data = canvas.toDataURL("image/png");
    var data = data.replace(/^data:image\/(png|jpg);base64,/, "");

    return fetch(target_route, {
        method: 'POST',
        body: data
    })
    .then(response => {
        console.log(response)
    })
    .catch(error => {
        console.error(error)
    })
}


async function get_results(){
    const response = await fetch('http://localhost:5000/eval_img');
    return await response.json();
}


function populate_table(results, category){
    for(i=0; i<=9; i++){
        for(j=0; j<=1; j++){
            if(j==0) { var unit = ''; }
            else { var unit = ' %'; }
            if(results[i][0] == category) { var color = 'text-success';}
            else { var color = 'text-light';}
            
            var doc = document.getElementById('cell' + i.toString() + j.toString());
            doc.innerHTML = `${results[i][j].toString() + unit}`;
            doc.setAttribute("class", color);
        }
    }
}


async function post_then_get(category){
    await post_img('/eval_img');
    populate_table(await get_results(), category);
}
