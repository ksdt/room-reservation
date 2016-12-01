$(function() {
    var res = [];
    
    $('.reservation').each(function(i, e) {
        var reservation = $(e).data('reservation');
        res.push(reservation);
    });

    var reservations = res.map(
        function (reservation) {
            return [
                reservation.split('---')[0],
                moment(reservation.split('---')[1]),
                moment(reservation.split('---')[2])
            ];
        }
    );

    reservations.forEach(function(reservation) {
        /* find reservation slot in table */
        var col = $('th:contains(' + reservation[1].format('M / D') + ')').index();
        var row;
        $('tbody th').each(function(e) {
            var contents = $(this).text();
            var start = contents.split(' - ')[0];
            var end = contents.split(' - ')[1];

            var rangeMomentStart = moment(start, 'h:mmA');
           
            var rangeMomentEnd = moment(end, 'h:mmA');
            if (end == '12:00AM') {
                rangeMomentEnd.add(1, 'day')
            }
            
            if (moment(reservation[1].format('h:mmA'), 'h:mmA').isBetween(rangeMomentStart, rangeMomentEnd, null, '[]')) {
                row = $(this).parent().index();
            }
        })
        if (col == null || row == null) {
            //couldn't parse reservation
            console.log("couldn't parse!", reservation);
        } else {
            console.log(row, col);
            $('table tbody tr')
                .eq(row)
                .find('td')
                .eq(col - 1)
                .find('button')
                .text(reservation[0])
                .addClass('btn-danger');
        }
    });

    $('table button').click(function(e) {
        $(this).prop('disabled', true);
        var startTime = $(this).parents('table tbody tr').find('th').text().split(' - ')[0];
        var endTime = $(this).parents('table tbody tr').find('th').text().split(' - ')[1];

        var momentStart = moment(startTime, 'h:mmA');   
        var momentEnd = moment(endTime, 'h:mmA');

        var date = $('table thead th').eq($(this).parents('table tbody td').index()).text();

        var momentDate = moment(date, 'M / D');

        var url = window.location.pathname ?
            window.location.pathname.substring(1) : '';

        if (url) {
            var momentUrl = moment(url, 'YYYY-MM-DD');
            /* if user is reserving on a different year than current year */
            if (momentUrl.year() != momentDate.year()) {
                console.log("updating year to ", momentUrl.year())
                momentDate.year(momentUrl.year());
            }
            /* if user is viewing a 12 -> 1 rollover, add one to the year if selection is jan */
            if ($('table thead th:contains("12 /")').length &&
                    $('table thead th:contains("1 /")').length) {
                if (momentDate.month() == 0) {
                    momentDate.add(1, 'year');
                }
            }

        }

        console.log(startTime, endTime, date);

        var reservationDateStart = 
            moment()
                .hour(momentStart.hour())
                .minute(momentStart.minute())
                .seconds(1)
                .milliseconds(0)
                .year(momentDate.year())
                .month(momentDate.month())
                .date(momentDate.date())

        var reservationDateEnd = 
            moment()
                .hour(momentEnd.hour())
                .minute(momentEnd.minute())
                .seconds(0)
                .milliseconds(0)
                .year(momentDate.year())
                .month(momentDate.month())
                .date(momentDate.date())

        if (endTime == '12:00AM') {
            console.log('adding a day');
            reservationDateEnd.add(1, 'day')
        }

        console.log(reservationDateStart.calendar(), reservationDateEnd.calendar())

        var button = $(this);
        $.ajax({
            type: 'POST',
            headers: {
                'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').attr('value')
            },
            url: 'reserve',
            data: {
                start: reservationDateStart.unix(),
                end: reservationDateEnd.unix()
            },
            success: function(data) {
                console.log(data);
                button.prop('disabled', false)
                if (!data.success) {
                    $('.modal')
                        .find('.modal-body p')
                        .text(data.result);
                    $('.modal')
                        .modal('show');
                } else {
                    if (data.result == 'unreserved') {
                        button.text('Reserve');
                        button.removeClass('btn-danger')
                    } else if (data.result == 'reserved') {
                        button.text(data.user)
                        button.addClass('btn-danger');
                    }
                    
                }
            }
        });
        
    });
    $('html').ajaxSend(function(event, xhr, settings) {
        function getCookie(name) {
           return $('input[name=csrfmiddlewaretoken]').attr('value');
        }
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
            // Only send the token to relative URLs i.e. locally.
            xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        }
    });
    $('button.next-week').click(function() {
        var url = window.location.pathname ?
            window.location.pathname.substring(1) : '';
        var momentUrl;
        if (url) {
            momentUrl = moment(url, 'YYYY-MM-DD');
            momentUrl.add(1, 'week')
        } else {
            momentUrl = moment().add(1, 'week');
        }
        window.location.href = momentUrl.format('/YYYY-MM-DD');
    });


    $('button.prev-week').click(function() {
        var url = window.location.pathname ?
            window.location.pathname.substring(1) : '';
        var momentUrl;
        if (url) {
            momentUrl = moment(url, 'YYYY-MM-DD');
            momentUrl.subtract(1, 'week')
        } else {
            momentUrl = moment().subtract(1, 'week');
        }
        window.location.href = momentUrl.format('/YYYY-MM-DD');
    })
});