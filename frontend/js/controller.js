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
            displayAppointments(response);
        },
    error: function (error) {
         console.error(error);
       }
    });
}

$("body").on("click", "#appointmentsView button", function(){
    let aid = $(this).data("aid");

    $("body").load("detailedView.html", function() {
        $('#detailedView').data("aid", aid);

        loadAppointment(aid);
    });
});

function loadAppointment(aid) {
    // query appointment and display basic information
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryAppointmentById", param: aid},
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

    // query termine and display them + create voting options
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryTermineByAppointmentId", param: aid},
        dataType: "json",
        success: function (response) {
            let table = $('<table></table>');
            let tbody = $('<tbody></tbody>');
            table.append(tbody);
            let tr = $('<tr><td></td></tr>');
            tbody.append(tr);

            $.each(response, function (index, termin) {
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

            // get prev votings and display them


            // create voting options
            tr = $('<tr id="selection"></tr>');
            let input = $('<td><input type="text" id="username"></td>');
            tr.append(input);

            $.each(response, function (index, termin) {
                let checkbox = $('<td><input type="checkbox" value="' + termin.tId + '"></td>');

                tr.append(checkbox);
            });
            
            tbody.append(tr);
            $('#voting').append(table);
        }
    });

    // query comments by aid and display them
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryCommentsByAppointment", param: aid},
        dataType: "json",
        success: function (response) {
            console.log(response);

            $.each(response, function (index, kommentar) { 
                let kommentarDiv = $('<div class="kommentar"> </div>');
                let nameSpan = $('<span>' + kommentar.name + '</span>');
                let commentP = $('<p>' + kommentar.kommentar + '</p>');

                kommentarDiv.append(nameSpan, commentP);
                $('#commentArea').append(kommentarDiv);
            });
        }
    });
}

$("body").on("click", "#detailedView #speichern", function () {
    let username = $('#selection #username');
    let comment = $('#comment');
    let checkboxen = $('#selection input[type="checkbox"]');

    if (username.val().length == 0) {
        showError("Bitte geben Sie Ihren Namen ein!");
        return;
    }

    let selection = [];
    $.each(checkboxen, function (index, checkbox) { 
        if ($(checkbox).is(":checked")) {
            selection.push($(checkbox).val());
        }
    });

    if (selection.length == 0 && comment.val() == "") {
        return;
    }

    // check if there is already a voting with the same name
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method:"queryAllVotingsByAppointmentId", param:$('#detailedView').data('aid')},
        dataType: "json",
        success: function (response) {
            let usernameExists = false;
            $.each(response, function (index, voting) { 
                if (voting.name === username.val()) {
                    usernameExists = true;
                }
            });
            
            if (usernameExists) {
                showError("Es existiert bereits ein Voting mit dem Namen!");
            } else {
                saveVoting(selection, comment.val(), username.val());

                let aid = $('#detailedView').data("aid");

                $("body").load("detailedView.html", function() {
                    loadAppointment(aid);
                });
            }
        }
    });
});

function saveVoting(selection, comment, username) {
    let toSave = {
        "aid": $('#detailedView').data("aid"),
        "name": username,
        "voting": selection,
        "comment": comment,
    };

    $.ajax({               // save voting
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method:"saveVoting", param:JSON.stringify(toSave)},
        dataType: "json",
        success: function (response) {
            // success Message
            showSuccess("Ihre Auswahl wurde gespeichert!");
        }
    });
}

function showError(message) {
    $('#errorMessage').text(message);
    $('#error').toggleClass("show");

    setTimeout(() => {
        $('#error').toggleClass("show");
    }, 4000);
}

function showSuccess(message) {
    $('#successMessage').text(message);
    $('#success').toggleClass("show");

    setTimeout(() => {
        $('#success').toggleClass("show");
    }, 4000);
}

// function sortByDate(a, b) {
//     var aDate = new Date(a.ablaufdatum);
//     var bDate = new Date(b.ablaufdatum);

//     if (aDate.getTime() < bDate.getTime()) {
//         // a läuft früher ab
//         return -1;
//     } else {
//         if (aDate.getTime() > bDate.getTime()) {
//             // b läuft früher ab
//             return 1;
//         } else {
//             // a und b laufen gleichzeitig ab
//             return 0;
//         }
//     }
// }

// function sortTerminByDateAndTime(a, b) {
//     var aDate = new Date(a.datum);
//     var bDate = new Date(b.datum);

//     if (aDate.getTime() != bDate.getTime()) {
//         if (aDate.getTime() < bDate.getTime()) {
//             // datum von a ist früher
//             return -1;
//         } else {
//             // datum von b ist früher
//             return 1;
//         }
//     } else {
//         var aVon = new Date(a.datum + ' ' + a.uhrzeitVon);
//         var bVon = new Date(b.datum + ' ' + b.uhrzeitVon);
//         if (aVon.getTime() < bVon.getTime()) {
//             // a beginnt früher
//             return -1;
//         } else {
//             if (aVon.getTime() == bVon.getTime()) {
//                 var aBis = new Date(a.datum + ' ' + a.uhrzeitBis);
//                 var bBis = new Date(b.datum + ' ' + b.uhrzeitBis);
                
//                 // a und b beginnen gleichzeitig
//                 // check auf endZeit
//                 if (aBis.getTime() < bBis.getTime()) {
//                     // a endet früher
//                     return -1;
//                 } else {
//                     // b endet früher oder ist gleich
//                     return 1;
//                 }
//             } else {
//                 // b beginnt früher
//                 return 1;
//             }
//         }
//     }
// }

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