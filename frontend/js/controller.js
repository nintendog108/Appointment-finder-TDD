$(document).ready(function () {
    $("body").load("appointments.html", function () {
        loadAppointments();
    });
});

function loadAppointments() {
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryAppointments"},
        dataType: "json",
        success: function (response) {
            displayAppointments(response.sort(sortByDate));
        },
        error: function (error) {
            console.error(error);
        }
    });
}

$("body").on("click", "#appointmentsView button", function(){
    console.log($(this).data("aid"));

    $("body").load("detailedView.html");

    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryAppointmentById", param: $(this).data("aid")},
        dataType: "json",
        success: function (response) {
            console.log(response);

            $("#title").text(response.title);
            $("#ort").text(response.ort);
            $("#ablaufdatum").text(new Date(response.ablaufdatum).toLocaleDateString());
            $("#desc").text(response.desc);
        },
        error: function(error) {
            console.error(error);
        }
    });

    
    
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryTermineByAppointmentId", param: $(this).data("aid")},
        dataType: "json",
        success: function (response) {
            console.log(response);

            $.each(response, function (index, termin) { 
                let terminDiv = $('<div class="termin"></div>');
                let dateDiv = $('<div class="date"></div>');
                let uhrzeitDiv = $('<div class="uhrzeit"></div>');
                let uhrzeitSeperator = $('<p>-</p>');
                let monatP = $('<p class="monat">' + + '</p>');
                let dayP = $('<p class="day">' + termin.datum + '</p>');
                let dayNameP = $('<p class="dayName">' +  + '</p>');
                let uhrzeitVonP = $('<p class="uhrzeitVon">' + termin.uhrzeitVon + '</p>');
                let uhrzeitBisP = $('<p class="uhrzeitBis">' + termin.uhrzeitBis + '</p>');
                let voteDiv = $('<div class="vote"><input type="checkbox" name="' + termin.tId + '"></div>');

                dateDiv.append(monatP, dayP, dayNameP);
                uhrzeitDiv.append(uhrzeitVonP, uhrzeitSeperator, uhrzeitBisP);
                terminDiv.append(dateDiv, uhrzeitDiv, voteDiv);

                $('#voting').append(terminDiv);
            });
        }
    });

    // <div class="termin">
    //     <div class="date">
    //          <p class="monat">Mär</p>
    //          <p class="day">23</p>
    //          <p class="dayName">DO</p>
    //     </div>
    //     <p class="date">12.03.2024</div>
    //     <div class="uhrzeit">
    //          <p class="uhrzeitVon">14:00</div>
    //          <p>-</p>
    //          <div class="uhrzeitBis">15:30</div>
    //     </div>
    //     
    //     <div class="vote">
    //         <input type="checkbox" name="tId" id="tId">
    //     </div>
    // </div>
});

function sortByDate(a, b) {
    var aDate = a.ablaufdatum;
    var bDate = b.ablaufdatum; 
    return ((aDate < bDate) ? -1 : ((aDate > bDate) ? 1 : 0));
}

function displayAppointments(appointments) {
    $(appointments).each(function() {
        let card = $('<div class="appointmentCard"></div>');
        var now = new Date();
        let title = $('<h3>' + this.title + '</h3>');
        let row = $('<div class="row spacebetween"></div>');
        let ort = $('<p class="ort">' + this.ort + '</p>');
        let datum = $('<p class="datum">' + new Date(this.ablaufdatum).toLocaleDateString() + '</p>');
        row.append(ort, datum);
        let hr = $('<hr>');
        let desc = $('<p class="desc">' + this.desc + '</p>'); 
        let button = $('<button class="cardBtn" data-aid="' + this.aId + '">Zur Abstimmung</button>');
        card.append(title, row, hr, desc, button);

        if (now > new Date(this.ablaufdatum)) {
            $(card).addClass("abgelaufen");
            $("#abgelaufen").prepend(card);
        } else {
            $("#appointments-wrapper").append(card);
        }
    });
}