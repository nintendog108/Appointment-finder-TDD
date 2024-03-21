loadAppointments();

function loadAppointments() {
    $.ajax({
        type: "POST",
        url: ".././backend/serviceHandler.php",
        data: {method: "queryAppointments"},
        dataType: "json",
        success: function (response) {
            console.log(response);
            $(response).each(function() {
                let card = $('<div class="card"></div>');
                let title = $('<h2>' + this.title + '</h2>');
                let button = $('<button data-aid="' + this.aId + '">Zur Abstimmung</button>');
                card.append(title);
                card.append(button);
                $("#appointments-wrapper").append(card);
            });
        },
        error: function (error) {
            console.error(error);
        }
    });
}


$("#appointments-wrapper").on("click", "button", function(){
    console.log($(this).data("aid"));
});