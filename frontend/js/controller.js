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

            // sort by date and time
            let termine = response.sort(sortTerminByDateAndTime);

            let table = $('<table></table>');
            let tbody = $('<tbody></tbody>');
            table.append(tbody);
            let tr = $('<tr><td></td></tr>');
            tbody.append(tr);

            $.each(termine, function (index, termin) {
                let terminDiv = $('<td class="termin"></td>');
                let dateDiv = $('<div class="date"></div>');
                let uhrzeitDiv = $('<div class="uhrzeit"></div>');
                let uhrzeitSeperator = $('<p>-</p>');
                let monatP = $('<p class="monat">' + new Date (termin.datum).toString().substring(4, 7) + '</p>');
                let dayP = $('<p class="day">' + new Date (termin.datum).toString().substring(8, 10) + '</p>');
                let dayNameP = $('<p class="dayName">' + new Date (termin.datum).toString().substring(0, 3) + '</p>');
                let uhrzeitVonP = $('<p class="uhrzeitVon">' + termin.uhrzeitVon.substring(0, 5) + '</p>');
                let uhrzeitBisP = $('<p class="uhrzeitBis">' + termin.uhrzeitBis.substring(0, 5) + '</p>');
                
                dateDiv.append(monatP, dayP, dayNameP);
                uhrzeitDiv.append(uhrzeitVonP, uhrzeitSeperator, uhrzeitBisP);
                terminDiv.append(dateDiv, uhrzeitDiv);


                tr.append(terminDiv);
            });

            tr = $('<tr><td><input type="text"></td><td><input type="checkbox"></td></tr>');
            tbody.append(tr);
            $('#voting').append(table);
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
    var aDate = new Date(a.ablaufdatum);
    var bDate = new Date(b.ablaufdatum);

    if (aDate.getTime() < bDate.getTime()) {
        // a läuft früher ab
        return -1;
    } else {
        if (aDate.getTime() > bDate.getTime()) {
            // b läuft früher ab
            return 1;
        } else {
            // a und b laufen gleichzeitig ab
            return 0;
        }
    }
}

function sortTerminByDateAndTime(a, b) {
    var aDate = new Date(a.datum);
    var bDate = new Date(b.datum);

    if (aDate.getTime() != bDate.getTime()) {
        if (aDate.getTime() < bDate.getTime()) {
            // datum von a ist früher
            return -1;
        } else {
            // datum von b ist früher
            return 1;
        }
    } else {
        var aVon = new Date(a.datum + ' ' + a.uhrzeitVon);
        var bVon = new Date(b.datum + ' ' + b.uhrzeitVon);
        if (aVon.getTime() < bVon.getTime()) {
            // a beginnt früher
            return -1;
        } else {
            if (aVon.getTime() == bVon.getTime()) {
                var aBis = new Date(a.datum + ' ' + a.uhrzeitBis);
                var bBis = new Date(b.datum + ' ' + b.uhrzeitBis);
                
                // a und b beginnen gleichzeitig
                // check auf endZeit
                if (aBis.getTime() < bBis.getTime()) {
                    // a endet früher
                    return -1;
                } else {
                    // b endet früher oder ist gleich
                    return 1;
                }
            } else {
                // b beginnt früher
                return 1;
            }
        }
    }
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