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
            showError("Ein Fehler ist aufgetreten!");
            console.error(error);
       }
    });
}

$("body").on("click", "#appointmentsView .cardBtn", function(){
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
            $("#title").text(response.title);
            $("#ort").text(response.ort);
            $("#ablaufdatum").text(new Date(response.ablaufdatum).toLocaleDateString());
            $("#desc").text(response.desc);

            loadTermine(aid, response.ablaufdatum);
        },
        error: function(error) {
            console.error(error);

            showError("Ein Fehler ist aufgetreten!");
        }
    });

    // query comments by aid and display them
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryCommentsByAppointment", param: aid},
        dataType: "json",
        success: function (response) {
            // nothing in database
            if (response == 1) return;

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
    // query termine and display them + create voting options
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryTermineByAppointmentId", param: aid},
        dataType: "json",
        success: function (response) {
            // nothing in database
            if (response == 1) return;

            let table = $('<table class="table table-bordered"></table>');
            let tbody = $('<tbody></tbody>');
            table.append(tbody);
            let tr = $('<tr><td></td></tr>');
            tbody.append(tr);

            $.each(response, function (index, termin) {
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

            // create voting options
            let now = new Date();
            if (now.getTime() < new Date(ablaufdatum).getTime()) {
                tr = $('<tr id="selection"></tr>');
                let input = $('<td><input type="text" id="username"></td>');
                tr.append(input);

                $.each(response, function (index, termin) {
                    let checkbox = $('<td><input type="checkbox" value="' + termin.tId + '"></td>');

                    tr.append(checkbox);
                });

                let textarea = $('<textarea class="form-control mb-3" id="comment" placeholder="Kommentar hinzuf&uuml;gen"></textarea>');
                let button = $('<button class="btn btn-primary" id="speichern">Speichern</button>');
                $(textarea).insertBefore("#commentArea");
                $(button).insertBefore("#commentArea");
            }
            
            tbody.append(tr);
            $('#voting').append(table);

            // get prev votings and display them
            $.ajax({
                type: "POST",
                url: ".././backend/serviceHandler.php",
                data: {method:"queryAllVotingsByAppointmentId", param: aid},
                dataType: "json",
                success: function (response) {
                    // nothing in database
                    if (response == 1) return;
                    modifyAndPrintVotings(aid, response);    
                }
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
    $.each(votings, function (index, person) { 
        let tr = $('<tr></tr>');
        let name = $('<td><p>' + person.name + '</p></td>');
        tr.append(name);
        $.each(person.votings, function (i, termin) {
            let checkbox = $('<td class="' + (termin ? 'voted' : 'notVoted') + '">' + (termin ? '<i class="bi bi-check"></i>' : '<i class="bi bi-x"></i>') + '</td>');
            tr.append(checkbox);
        });

        $(tr).insertBefore('#selection');
    });
}

$('body').on('click', '#back', function() {
    $("body").load("appointments.html", function () {
        loadAppointments();
    });
});

$('body').on('click', '#appointmentsView #add', function() {
    $('body').load('newAppointment.html');
});

$('body').on('click', '#newAppointment #speichern', function(event) {
    event.preventDefault();
    saveNewAppointment();
});

$('body').on('click', '#detailedView #delete', function() {
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "deleteAppointment", param: $('#detailedView').data("aid")},
        dataType: "json",
        success: function (response) {
            $("body").load("appointments.html", function () {
                loadAppointments();

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
    $('#errorMessage').text(message);
    $('#error').addClass("show");

    setTimeout(() => {
        $('#error').removeClass("show");
    }, 3000);
}

function showSuccess(message) {
    $('#successMessage').text(message);
    $('#success').addClass("show");

    setTimeout(() => {
        $('#success').removeClass("show");
    }, 3000);
}

function displayAppointments(appointments) {
    $(appointments).each(function() {

        // <div class="card">
        //     <div class="card-body">
        //         <h5 class="card-title">Special title treatment</h5>
        //         <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>
        //         <a href="#" class="btn btn-primary">Go somewhere</a>
        //     </div>
        // </div>

        let col = $('<div class="col"></div>');
        let card = $('<div class="card h-100"></div>');
        let cardBody = $('<div class="card-body"></div>');
        var now = new Date();
        let title = $('<h5 class="card-title">' + this.title + '</h5>');
        let row = $('<div class="row d-flex justify-content-between"></div>');
        let ort = $('<p class="ort col-auto">' + this.ort + '</p>');
        let datum = $('<p class="datum col-auto">' + new Date(this.ablaufdatum).toLocaleDateString() + '</p>');
        row.append(ort, datum);
        let desc = $('<p class="card-text">' + this.desc + '</p>'); 
        let button = $('<button class="cardBtn btn ' + (now > new Date(this.ablaufdatum) ? 'btn-secondary' : 'btn-primary') + '" data-aid="' + this.aId + '">Zur Abstimmung</button>');
        
        card.append(cardBody);

        // <div class="card-footer text-body-secondary">
        //     2 days ago
        // </div>
        let ablauf = new Date(this.ablaufdatum);
        let diff = new Date(now - ablauf);
        diff = diff/1000/60/60/24;

        if (diff > 0) {
            let cardFooter = $('<div class="card-footer text-body-secondardy">vor ' + Math.floor(diff) + ' Tagen abgelaufen</div>');
            card.append(cardFooter);
        }
        
        cardBody.append(title, row, desc, button);
        
        col.append(card);

        if (now.getTime() > new Date(this.ablaufdatum).getTime()) {
            $("#abgelaufen").prepend(col);
        } else {
            $("#appointments-wrapper").append(col);
        }
    });
}

function saveNewAppointment() {    // save new appointment
    let title = $('#title').val();
    let desc = $('#desc').val();
    let ort = $('#ort').val();
    let ablaufdatum = $('#ablaufdatum').val();

    if (title.length == 0 || ort.length == 0 || ablaufdatum.length == 0 || desc.length == 0) {
        showError("Bitte füllen Sie alle Felder aus!");
        return;
    }

    let toSave = {
        "title": title,
        "desc": desc,
        "ort": ort,
        "ablaufdatum": ablaufdatum
    };

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
    let termine = $('#terminArea .termin');

    if (termine == null) {
        showError("Bitte geben Sie mindestens einen Termin an!");
        return;
    }

    let terminArray = [];

    $.each(termine, function (index, termin) { 
        console.log(termin);

        let date = $(termin).children('input[name="datum"]').val();
        let uhrzeitVon = $(termin).children('input[name="von"]').val();
        let uhrzeitBis = $(termin).children('input[name="bis"]').val();

        if (date == "" || uhrzeitVon == "" || uhrzeitBis == "") {
            showError("Bitte füllen Sie alle Felder aus!");
            return;
        }

        let terminJSON = {"aid":aid, "datum": date, "uhrzeitVon": uhrzeitVon, "uhrzeitBis": uhrzeitBis};
        terminArray.push(terminJSON);

        // <div class="termin row">
        //     <label class="col-auto">Datum:</label>
        //     <input class="col-auto" type="date" name="datum">
        //     <label class="col-auto">Uhrzeit:</label>
        //     <input class="col-auto" type="time" name="von">
        //     <p class="col-auto">-</p>
        //     <input class="col-auto" type="time" name="bis">
        //     <button class="delete col-auto"><i class="bi bi-x"></i></button>
        // </div>
    });

    if (terminArray.length == 0) return;
    
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "saveTermine", param:JSON.stringify(terminArray)},
        dataType: "json",
        success: function (response) {
            $("body").load("appointments.html", function () {
                loadAppointments();
                setTimeout(() => {
                    showSuccess("Appointment wurde erfolgreich erstellt!");
                }, 100);
            });
        },
        error: function (response) {
            showError("Ein Fehler ist aufgetreten!");
        }
    });
}

$('body').on('click', '#newAppointment #addTermin', function(event) {
    event.preventDefault();
    let termin = $('<div class="termin row"></div>');
    let datum = $('<label class="col-auto">Datum:</label>');
    let date = $('<input class="col-auto" type="date" name="datum">');
    let uhrzeit = $('<label class="col-auto">Uhrzeit:</label>')
    let von = $('<input class="col-auto" type="time" name="von">');
    let seperator = $('<p class="col-auto">-</p>');
    let bis = $('<input class="col-auto" type="time" name="bis">');
    let deleteBtn = $('<button class="delete col-auto"><i class="bi bi-x"></i></button>');

    termin.append(datum, date, uhrzeit, von, seperator, bis, deleteBtn);
    $('#terminArea').append(termin);
});

$('body').on('click', '#terminArea .delete', function(event) {
    event.preventDefault();
    $(this).closest(".termin").remove();
})