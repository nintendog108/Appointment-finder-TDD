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

            // get prev votings and display them
            $.ajax({
                type: "POST",
                url: ".././backend/serviceHandler.php",
                data: {method:"queryAllVotingsByAppointmentId", param: aid},
                dataType: "json",
                success: function (response) {
                    console.log(response);
                    // nothing in database
                    if (response == 1) return;
                    modifyAndPrintVotings(aid, response);    
                }
            });
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

function modifyAndPrintVotings(aid, response) {
    let newresponse = [];

    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryTermineByAppointmentId", param: aid},
        dataType: "json",
        success: function (termine) {
            let person = null;
            // markiert letztes Voting der person
            let letzterTermin = 0;
            // durchlauf alle votings, ein voting = {tId: 1, name: "Florian"}
            $.each(response, function (index, voting) {
                if (person == null) {
                    // initialisiere person am anfang, mit dem namen
                    person = {"name": voting.name, "votings": []};
                } else if (person.name != voting.name) {
                    // wenn das voting einer neuen person gehört
                    // setze alle nachfolgenden Termine ab dem letzten Voting der Person auf false
                    // beginne beim letzten Voting und lauf bis zum letzten
                    for (let i = letzterTermin; i < termine.length; i++) {
                        person.votings.push(0);
                    }
                    // letztes Voting für neue Person zurücksetzen
                    letzterTermin = 0;
                    // Person ins Array hinzufügen
                    newresponse.push(person);
                    // json für neue person neu mit namen initialisieren
                    person = {"name": voting.name, "votings": []};
                }
                // immer, fang vom letzten voting an (oder bei neuer person 0) und schau an welchem termin das aktuelle voting ist
                for (let j = letzterTermin; j < termine.length; j++) {
                    if (termine[j].tId == voting.tId) {
                        // wenn das voting gleich dem aktuellen termin ist setz auf true
                        person.votings.push(1);
                        // setz den letzten termin auf das aktuelle voting plus 1 und hör auf um zum nächsten voting zu kommen
                        letzterTermin = j + 1;
                        break;
                    } else {
                        // da die termine und votings nach datum sortiert sind können wir mit sicherheit sagen
                        // das die person nicht für diesen termin gevoted hat, daher false
                        person.votings.push(0);
                    }
                }
            });
            // für die letzte person alle nachfolgenden termine nach dem letzten voting auf false setzen
            for (let i = letzterTermin; i < termine.length; i++) {
                person.votings.push(0);
            }
            // letzte person ins array hinzufügen
            newresponse.push(person);
            printVotings(newresponse);
        }
    });
    /**
     * ALTE STRUKTUR
     * 
     * { vId: 7, tId: 5, name: "Fanni" }
     * { vId: 8, tId: 3, name: "Fanni" }
     * { vId: 9, tId: 3, name: "Florian" }
     *
     * NEUE STRUKTUR
     * [{
     *  "name": "Fanni",
     *  "votings": [1, 1]
     * },
     * {
     *  "name": "Florian",
     *  "votings": [0, 1]
     * }]
     */
}

function printVotings(votings) {
    console.log(votings);

    $.each(votings, function (index, person) { 
        let tr = $('<tr></tr>');
        let name = $('<td><p>' + person.name + '</p></td>');
        tr.append(name);
        console.log(person.votings);
        $.each(person.votings, function (i, termin) {
            console.log(termin);
            let checkbox = $('<td><input type="checkbox"' + (termin ? 'checked' : '') + '></td>');
            tr.append(checkbox);
        });

        $(tr).insertBefore('#selection');
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
            console.log(response);
            let usernameExists = false;

            if (response != 1) {
                $.each(response, function (index, voting) { 
                    if (voting.name === username.val()) {
                        usernameExists = true;
                    }
                });
            }

            if (usernameExists) {
                showError("Es existiert bereits ein Voting mit dem Namen!");
            } else {
                saveVoting(selection, comment.val(), username.val());    
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
            let aid = $('#detailedView').data("aid");

            $("body").load("detailedView.html", function() {
                loadAppointment(aid);
                setTimeout(() => {
                    showSuccess("Ihre Auswahl wurde gespeichert!");    
                }, 100);
            });
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