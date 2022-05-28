let marginWidth = 0;
let count = 0;

function setNewMarginForward(){
    if(count <= 2){
        document.getElementById("slider-list").style.transitionDuration = "0.5s";
        document.getElementById("slider-list").style.marginLeft = `${marginWidth-40}px`;
        marginWidth -= 40;
    }
}

function setOldMarginForward(){
    if(count <= 2){
        document.getElementById("slider-list").style.marginLeft = `${marginWidth + 40}px`;
        marginWidth += 40;
    }
}

function moveForward(){
    if(count < 3){
        if(count < 2){
            document.getElementById("slider-list").style.marginLeft = `${marginWidth-540}px`;
            document.getElementById("swiper-backward").style.backgroundColor = "rgba(251,108,39, 0.9)";
            marginWidth -= 540;
        }
        else {
            document.getElementById("slider-list").style.marginLeft = `${marginWidth-50}px`;
            document.getElementById("slider-list").disabled = true;
            document.getElementById("swiper-forward").style.backgroundColor = "rgba(51,51,51, 0.9)";
        }
        count++;
    }
    document.getElementById(`bullet-${count-1}`).style.backgroundColor = "rgba(0,0,0,0.2)";
    document.getElementById(`bullet-${count}`).style.backgroundColor = "rgba(251,108,39,1)";
}

function setNewMarginBackward(){
    document.getElementById("swiper-backward").style.transitionDuration = "0.5s";
    document.getElementById("swiper-backward").style.left = "0px";

    if(count > 1) {
        document.getElementById("slider-list").style.transitionDuration = "0.5s";
        document.getElementById("slider-list").style.marginLeft = `${marginWidth+40}px`;
        document.getElementById("swiper-backward").style.backgroundColor = "rgba(251,108,39, 0.9)";
        marginWidth += 40;
    }
}

function setOldMarginBackward(){
    document.getElementById("swiper-backward").style.transitionDuration = "0.5s";
    document.getElementById("swiper-backward").style.left = "-35px";

    if(count > 1) {
        document.getElementById("slider-list").style.transitionDuration = "0.5s";
        document.getElementById("slider-list").style.marginLeft = `${marginWidth-40}px`;
        document.getElementById("swiper-backward").style.backgroundColor = "rgba(251,108,39, 0.9)";
        marginWidth -= 40;
    }
}

function moveBackward(){
    if(count > 0){
        if(count == 1) {
            document.getElementById("slider-list").style.marginLeft = `${marginWidth + 540}px`;
            document.getElementById("swiper-backward").style.backgroundColor = "rgba(51,51,51, 0.9)";
            marginWidth += 540;
            count--;
        }
        else if (count == 2){
            document.getElementById("slider-list").style.marginLeft = `${marginWidth + 500}px`;
            marginWidth += 500;
            count--;
        }
        else {
            document.getElementById("slider-list").style.marginLeft = `${marginWidth + 540}px`;
            document.getElementById("swiper-forward").style.backgroundColor = "rgba(251,108,39, 0.9)";
            marginWidth += 540;
            count-=2;
        }
        document.getElementById(`bullet-${count}`).style.backgroundColor = "rgba(251,108,39,1)";
        document.getElementById(`bullet-${count+1}`).style.backgroundColor = "rgba(0,0,0,0.2)";
        document.getElementById(`bullet-${count+2}`).style.backgroundColor = "rgba(0,0,0,0.2)";
    }
    
    console.log(count + ' move back')
}

function viewBackwardBtn(){
    document.getElementById("swiper-backward").style.transitionDuration = "0.5s";
    document.getElementById("swiper-backward").style.left = "0px";
}

function hideBackwardBtn(){
    document.getElementById("swiper-backward").style.transitionDuration = "0.5s";
    document.getElementById("swiper-backward").style.left = "-35px";
}

function moreOver(){
    document.getElementById("more-icon-img").src = "./images/header/exit.png";
    document.getElementById("more-icon-img").style.width = "30px";
    document.getElementById("extend-menu").style.visibility = "visible";
}

function moreOut(){
    document.getElementById("more-icon-img").src = "./images/header/more-icon.png";
    document.getElementById("more-icon-img").style.width = "30px";
    document.getElementById("extend-menu").style.visibility = "hidden";
}
