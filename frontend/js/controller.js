$(document).ready(function () {
    // beim aufruf der webseite wird appointments.html geladen und alle appointments reingeladen
    $("body").load("appointments.html", function () {
        loadAppointments();
    });
});

function loadAppointments() {
    // ladet alle Appointments
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryAppointments"},
        dataType: "json",
        success: function (response) {
            displayAppointments(response);
        },
        error: function (error) {
            showError("Ein Fehler ist aufgetreten!");
            console.error(error);
       }
    });
}

$("body").on("click", "#appointmentsView .cardBtn", function(){
    // click auf ein Appointment Button
    // hol id von button
    let aid = $(this).data("aid");

    // lade detailedView.html und lade das Appointment mit der id von button
    $("body").load("detailedView.html", function() {
        // setze die id um später drauf zuzugreifen
        $('#detailedView').data("aid", aid);
        loadAppointment(aid);
    });
});

function loadAppointment(aid) {
    // lade alle appointments zu aid
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryAppointmentById", param: aid},
        dataType: "json",
        success: function (response) {
            // infos anzeigen
            $("#title").text(response.title);
            $("#ort").html('<i class="bi bi-geo-alt-fill"></i>' + response.ort);
            $("#ablaufdatum").text(new Date(response.ablaufdatum).toLocaleDateString());
            $("#desc").text(response.desc);
            // lade termine zu aid
            loadTermine(aid, response.ablaufdatum);
        },
        error: function(error) {
            console.error(error);

            showError("Ein Fehler ist aufgetreten!");
        }
    });

    // lade all Kommentare zu aid
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryCommentsByAppointment", param: aid},
        dataType: "json",
        success: function (response) {
            // keine kommentare in der Datenbank
            if (response == 1) return;

            // alle kommentare werden durchlaufen, erstellt und an die commentArea angehängt 
            $.each(response, function (index, kommentar) { 
                let kommentarDiv = $('<div class="card mb-3"></div>');
                let cardHeader = $('<div class="card-header">' + kommentar.name + '</div>');
                let cardBody = $('<div class="card-body"></div>');
                let commentP = $('<p>' + kommentar.kommentar + '</p>');

                cardBody.append(commentP);
                kommentarDiv.append(cardHeader, cardBody);
                $('#commentArea').append(kommentarDiv);
            });
        }
    });
}

function loadTermine (aid, ablaufdatum) {
    // lade all Termine
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryTermineByAppointmentId", param: aid},
        dataType: "json",
        success: function (response) {
            // erstelle eine Tabelle
            let table = $('<table class="table table-bordered"></table>');
            let tbody = $('<tbody></tbody>');
            table.append(tbody);
            let tr = $('<tr><td></td></tr>');
            tbody.append(tr);

            // durchlauf alle Termine
            $.each(response, function (index, termin) {
                // erstelle für jeden Termin eine Zelle in der Tabelle
                let terminDiv = $('<td class="termin"></td>');
                let dateDiv = $('<div class="date"></div>');
                let uhrzeitDiv = $('<div class="uhrzeit"></div>');
                let uhrzeitSeperator = $('<p class="seperator">-</p>');

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

            // nur wenn Appointment nicht abgelaufen
            let now = new Date();
            if (now.getTime() < new Date(ablaufdatum).getTime()) {
                // erstelle input feld für name
                tr = $('<tr id="selection"></tr>');
                let input = $('<td><div class="row my-0 mx-0"><input class="form-control col-auto" type="text" id="username" placeholder="Name"></div></td>');
                tr.append(input);

                // erstelle für jeden Termin eine Checkbox mit value = tId
                $.each(response, function (index, termin) {
                    let checkbox = $('<td><input type="checkbox" value="' + termin.tId + '"></td>');

                    tr.append(checkbox);
                });

                // erstelle Textarea für kommentare und Senden Button
                let textarea = $('<textarea class="form-control mb-3" id="comment" placeholder="Kommentar hinzuf&uuml;gen"></textarea>');
                let button = $('<button class="btn btn-primary" id="speichern">Speichern</button>');
                $(textarea).insertBefore("#commentArea");
                $(button).insertBefore("#commentArea");
            }
            
            tbody.append(tr);
            $('#voting').append(table);

            // lade alle bisherigen Votings
            $.ajax({
                type: "POST",
                url: ".././backend/serviceHandler.php",
                data: {method:"queryAllVotingsByAppointmentId", param: aid},
                dataType: "json",
                success: function (response) {
                    // keine Votings in der Datenbank
                    if (response == 1) return;
                    // bearbeite response und zeig Votings an
                    modifyAndPrintVotings(aid, response);    
                }
            });
        }
    });
}
// bearbeitet die Struktur des response damit wir die Votings leichter anzeigen können
function modifyAndPrintVotings(aid, response) {
    /**
     * ALTE STRUKTUR
     * 
     * { vId: 7, tId: 5, name: "Fanni" }
     * { vId: 8, tId: 3, name: "Fanni" }
     * { vId: 9, tId: 3, name: "Florian" }
     *
     * GEWÜNSCHTE STRUKTUR
     * [
        * {
            * "name": "Fanni",
            * "votings": [1, 1]
        * },
        * {
            * "name": "Florian",
            * "votings": [0, 1]
        * }
     * ]
     */
    let newresponse = [];
    // lade alle Termine
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
            // zeige alle votings mit neuer struktur an
            printVotings(newresponse);
        }
    });
}

function printVotings(votings) {
    // durchlauf alle person mit deren Votings
    $.each(votings, function (index, person) {
        // erstelle für jede person eine zeile in der tabelle
        let tr = $('<tr></tr>');
        let name = $('<td><p>' + person.name + '</p></td>');
        tr.append(name);
        // erstelle für jede person die votings
        $.each(person.votings, function (i, termin) {
            let checkbox = $('<td class="' + (termin ? 'voted' : 'notVoted') + '">' + (termin ? '<i class="bi bi-check"></i>' : '<i class="bi bi-x"></i>') + '</td>');
            tr.append(checkbox);
        });

        $(tr).insertBefore('#selection');
    });
}

$('body').on('click', '#back', function() {
    // click auf zurück pfeil auf allen seiten führt zu appointments.html
    $("body").load("appointments.html", function () {
        loadAppointments();
    });
});

$('body').on('click', '#appointmentsView #add', function() {
    // click auf + Button auf startseite führt zu newAppointment.html
    $('body').load('newAppointment.html');
});

$('body').on('click', '#newAppointment #speichern', function(event) {
    // click auf Speichern Button beim erstellen eines Appointments
    event.preventDefault();
    // speicher Appointment
    saveNewAppointment();
});

$('body').on('click', '#detailedView #delete', function() {
    // click auf delete in einzelner Appointmentansicht
    // lösche appointment zu aid
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "deleteAppointment", param: $('#detailedView').data("aid")},
        dataType: "json",
        success: function (response) {
            // lade appointments.html um auf die startseite zurückzukehren
            $("body").load("appointments.html", function () {
                loadAppointments();

                // kurz warten damit animation richtig funktioniert
                setTimeout(() => {
                    showSuccess("Appointment wurde erfolgreich gelöscht!");     
                }, 100);
            });
        },
        error: function (error) {
            console.error(error);
            showError("Ein Fehler ist aufgetreten!");
        }
    });
})


$("body").on("click", "#detailedView #speichern", function () {
    // click auf Speichern Button in einzelner Appointmentansicht
    // hol username, votings, und kommentar
    let username = $('#selection #username');
    let comment = $('#comment');
    let checkboxen = $('#selection input[type="checkbox"]');

    if (username.val().length == 0) {
        showError("Bitte geben Sie Ihren Namen ein!");
        return;
    }

    // füge votings in einer array zusammen
    let selection = [];
    $.each(checkboxen, function (index, checkbox) { 
        if ($(checkbox).is(":checked")) {
            selection.push($(checkbox).val());
        }
    });

    if (selection.length == 0 && comment.val() == "") {
        return;
    }

    // lade alle bisherigen Votings
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method:"queryAllVotingsByAppointmentId", param:$('#detailedView').data('aid')}, 
        dataType: "json",
        success: function (response) {
            let usernameExists = false;

            // wenn 1 dann gibt es keine Votings
            if (response != 1) {
                // durchlauf alle votings und schau ob name bereits gevoted hat
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
    // json erstellen mit daten die gespeichert werden müssen
    let toSave = {
        "aid": $('#detailedView').data("aid"),
        "name": username,
        "voting": selection,
        "comment": comment,
    };

    // speicher voting
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method:"saveVoting", param:JSON.stringify(toSave)},
        dataType: "json",
        success: function (response) {
            // lade einzelne Appointmentansicht neu um neues voting/kommentar anzuzeigen
            let aid = $('#detailedView').data("aid");

            $("body").load("detailedView.html", function() {
                $('#detailedView').data("aid", aid);
                loadAppointment(aid);
                setTimeout(() => {
                    showSuccess("Ihre Auswahl wurde gespeichert!");    
                }, 100);
            });
        }
    });
}

function showError(message) {
    // error alert
    $('#errorMessage').text(message);
    $('#error').addClass("show");

    setTimeout(() => {
        $('#error').removeClass("show");
    }, 3000);
}

function showSuccess(message) {
    // success alert
    $('#successMessage').text(message);
    $('#success').addClass("show");

    setTimeout(() => {
        $('#success').removeClass("show");
    }, 3000);
}

function displayAppointments(appointments) {
    // lauf alle appointments durch
    $(appointments).each(function() {
        // erstelle col und card für jedes appointment
        let col = $('<div class="col"></div>');
        let card = $('<div class="card h-100"></div>');
        let cardBody = $('<div class="card-body"></div>');
        var now = new Date();
        let ablauf = new Date(this.ablaufdatum);
        let title = $('<h5 class="card-title">' + this.title + '</h5>');
        let row = $('<div class="row d-flex justify-content-between"></div>');
        let ort = $('<p class="ort col-auto">' + this.ort + '</p>');
        let datum = $('<p class="datum col-auto">' + ablauf.toLocaleDateString() + '</p>');
        row.append(ort, datum);
        let desc = $('<p class="card-text">' + this.desc + '</p>'); 
        let button = $('<button class="cardBtn btn ' + (now > ablauf ? 'btn-secondary' : 'btn-primary') + '" data-aid="' + this.aId + '">Zur Abstimmung</button>');
        cardBody.append(title, row, desc, button);
        card.append(cardBody);

        let diff = new Date(now - ablauf);
        diff = diff/1000/60/60/24;

        // wenn bereits abgelaufen zeig an vor wievielen tagen 
        if (diff > 0) {
            let cardFooter = $('<div class="card-footer text-body-secondardy">vor ' + Math.floor(diff) + (Math.floor(diff) == 1 ? ' Tag' : ' Tagen') + ' abgelaufen</div>');
            card.append(cardFooter);
        }
        col.append(card);

        // wenn bereits abgelaufen füg sie in den #abgelaufen Wrapper ein
        if (diff > 0) {
            // prepend damit das was am längsten abgelaufen ist ganz unten ist
            $("#abgelaufen").prepend(col);
        } else {
            // append damit das was als nächstes abläuft ganz oben ist
            $("#appointments-wrapper").append(col);
        }
    });
}

function saveNewAppointment() {
    // hol title, beschreibung, ort und ablaufdatum
    let title = $('#title').val();
    let desc = $('#desc').val();
    let ort = $('#ort').val();
    let ablaufdatum = $('#ablaufdatum').val();

    if (title.length == 0 || ort.length == 0 || ablaufdatum.length == 0 || desc.length == 0) {
        showError("Bitte füllen Sie alle Felder aus!");
        return;
    }

    // json aus daten die gespeichert werden sollen zusammenstellen
    let toSave = {
        "title": title,
        "desc": desc,
        "ort": ort,
        "ablaufdatum": ablaufdatum
    };

    // appointment speichern
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "saveAppointment", param: JSON.stringify(toSave)},
        dataType: "json",
        success: function (aid) {
            saveTermine(aid);
        }
    });
}

function saveTermine(aid) {    
    // hol alle termine
    let termine = $('#terminArea .termin');
    
    let terminArray = [];

    // alle termine durchlaufen
    $.each(termine, function (index, termin) {
        // für jeden termin datum, uhrzeit Von und Uhrzeit Bis holen
        let date = $(termin).children('div').children('input[name="datum"]').val();
        let uhrzeitVon = $(termin).children('div').children('input[name="von"]').val();
        let uhrzeitBis = $(termin).children('div').children('input[name="bis"]').val();

        if (date == "" || uhrzeitVon == "" || uhrzeitBis == "") {
            showError("Bitte füllen Sie alle Felder aus!");
            return;
        }

        // json erstellen mit daten des Termins
        let terminJSON = {"aid":aid, "datum": date, "uhrzeitVon": uhrzeitVon, "uhrzeitBis": uhrzeitBis};
        // alle jsons in array zusammenfügen
        terminArray.push(terminJSON);
    });

    console.log(terminArray);
    if (terminArray.length == 0) return;
    
    // termine speichern
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "saveTermine", param:JSON.stringify(terminArray)},
        dataType: "json",
        success: function (response) {
            // appointments.html laden um auf startseite zu kommen
            $("body").load("appointments.html", function () {
                loadAppointments();
                // kurz warten damit animation nach seitenwechsel richtig funktioniert
                setTimeout(() => {
                    showSuccess("Appointment wurde erfolgreich erstellt!");
                }, 100);
            });
        },
        error: function (response) {
            console.error(response);

            showError("Ein Fehler ist aufgetreten!");
        }
    });
}

$('body').on('click', '#newAppointment #addTermin', function(event) {
    // click auf + für einen neuen Termin
    event.preventDefault();
    // erstelle ein neues Termin Div
    let termin = $('<div class="termin row d-flex align-items-center"></div>');
    let datum = $('<label class="col-auto col-form-label">Datum:</label>');
    let date = $('<div class="col-auto"><input class="form-control" type="date" name="datum"></div>');
    let uhrzeit = $('<label class="col-auto col-form-label">Uhrzeit:</label>')
    let von = $('<div class="col-auto"><input class="form-control" type="time" name="von"></div>');
    let seperator = $('<p class="col-auto">-</p>');
    let bis = $('<div class="col-auto"><input class="form-control" type="time" name="bis"></div>');
    let deleteBtn = $('<button class="delete btn btn-outline-danger col-auto"><i class="bi bi-trash3-fill"></i></button>');

    termin.append(datum, date, uhrzeit, von, seperator, bis, deleteBtn);
    $('#terminArea').append(termin);
});

$('body').on('click', '#terminArea .delete', function(event) {
    // click auf x bei termin
    event.preventDefault();
    // termin Div löschen
    $(this).closest(".termin").remove();
})