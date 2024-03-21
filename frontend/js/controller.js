loadAppointments();

function loadAppointments() {
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryAppointments"},
        dataType: "json",
        success: function (response) {
            console.log(response);
            displayAppointments(response.sort(sortByDate));
        },
        error: function (error) {
            console.error(error);
        }
    });
}


$("#appointmentsView").on("click", "button", function(){
    console.log($(this).data("aid"));
});

function sortByDate(a, b){
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
        let button = $('<button data-aid="' + this.aId + '">Zur Abstimmung</button>');
        card.append(title, row, hr, desc, button);

        if (now > new Date(this.ablaufdatum)) {
            $(card).addClass("abgelaufen");
            $("#abgelaufen").append(card);
        } else {
            $("#appointments-wrapper").append(card);
        }
        
    });
}