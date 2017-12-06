from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.utils import timezone



from datetime import datetime, timedelta
from collections import namedtuple

from .models import Reservation

# Create your views here.
@login_required
def index(request, date=datetime.now()):

    if type(date) is not datetime:
        date = datetime.strptime(date, '%Y-%m-%d')

    # find week start and end from given date
    wkstart = (date - timedelta(days=date.weekday())).replace(hour=0, minute=0, second=0)
    wkend = (wkstart + timedelta(days=6)).replace(hour=23, minute=59, second=59)

    print(wkstart, wkend)

    reservations = Reservation.objects.filter(start__range=[wkstart, wkend])

    print('reservations for week which holds date', date, reservations)
    print(wkstart, wkend)

    context = {
        'reservations': reservations,
        'days': map(lambda d: wkstart + timedelta(days=d), range(7)),
        'slots': map(lambda d: (datetime.strptime('8:00AM', '%I:%M%p') + timedelta(minutes=30*d), 
        datetime.strptime('8:00AM', '%I:%M%p') + timedelta(minutes=30*(d+1))), range(32))
    }

    return render(request, 'reserve/index.html', context)

@login_required
def reserve(request):
    start = datetime.fromtimestamp(int(request.POST.get('start')))
    end = datetime.fromtimestamp(int(request.POST.get('end')))

    if not request.user.is_staff and start < datetime.now():
        return JsonResponse({
                'success': False,
                'result': 'sorry, you cannot reserve in the past'
            })
    
    if not request.user.is_staff and start > datetime.now() + timedelta(days=14):
        return JsonResponse({
                'success': False,
                'result': 'sorry, you cannot reserve more than 2 weeks in advance'
            })

    wkstart = (start - timedelta(days=start.weekday())).replace(hour=0, minute=0, second=0)
    wkend = (wkstart + timedelta(days=6)).replace(hour=23, minute=59, second=59)

    reservations = Reservation.objects.filter(start__range=[wkstart, wkend])

    print(reservations)

    Range = namedtuple('Range', ['start', 'end'])

    requestedRange = Range(start=start, end=end)

    overlap = False

    for reservation in reservations:
        reservationRange = Range(start=reservation.start, end=reservation.end)
        overlap = (requestedRange.start <= reservationRange.end) and (requestedRange.end >= reservationRange.start)
        if overlap:
            break
            print('requested reservation overlaps with existing reservation', reservation)

    if overlap: #time has already been reserved
        #do not use 'is' for comparisons
        if reservation.user == request.user: #users are allowed to remove their reservation
            if start > datetime.now() + timedelta(hours=1): #users can only unreserve times not within an hour
                reservation.delete()
                return JsonResponse({
                    'success': True,
                    'result': 'unreserved'
                })
            else:
                print ("in else")
                return JsonResponse({
                    'success': False,
                    'result': 'you cannot unreserve within an hour of your slot'
                })
        elif request.user.is_staff: #staff are allowed to remove reservations
            reservation.delete()
            return JsonResponse({
                'success': True,
                'result': 'unreserved'
            })
        else:
            return JsonResponse({
                'success': False,
                'result': 'sorry, this slot has been reserved by ' + reservation.user.get_username()
            })
    elif not overlap:
        Reservation.objects.create(start=requestedRange.start, end=requestedRange.end, user=request.user)
        return JsonResponse({
                'success': True,
                'result': 'reserved',
                'user': request.user.get_username()
            })
            
    return HttpResponse('yes')
