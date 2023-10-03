img = document.getElementById('card_img')

async function get_image(){
    const response = await fetch('http://localhost:5000/img_handler');
    var image = await response.json();

    img.src = `data:image/png;base64,${image}`
}