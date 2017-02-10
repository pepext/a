var timeDifference = function () {
    var laterdate = new Date(2017, 1, 5, 23, 30, 0, 0);
    var earlierdate = new Date();
    var difference = laterdate.getTime() - earlierdate.getTime();

    var daysDifference = Math.floor(difference/1000/60/60/24);
    difference -= daysDifference*1000*60*60*24;

    var hoursDifference = Math.floor(difference/1000/60/60);
    difference -= hoursDifference*1000*60*60;

    var minutesDifference = Math.floor(difference/1000/60);
    difference -= minutesDifference*1000*60;

    var secondsDifference = Math.floor(difference/1000);

    $('.countdown')[0].innerText = 'faltan  ' + daysDifference + ' día ' + hoursDifference + ' hoña ' + minutesDifference + ' mini ' + secondsDifference + ' segonder para superboulin';
    updateTime();
};

var updateTime = function() {
    window.setTimeout(timeDifference, 1000);
};

function CreateTimer() {
    updateTime();
}

function Tick() {
    TotalSeconds -= 1;
    updateTime();
}

updateTime();