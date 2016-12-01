from django.conf.urls import url
from django.contrib import admin

admin.autodiscover()

from . import views

urlpatterns = [
    # ex: /reservations
    url(r'^$', views.index, name='index'),
    # ex: /reservations/2016-05-08
    url(r'^(?P<date>[0-9]{4}-[0-9]{2}-[0-9]{2})$', views.index, name='index'),
    # ex: /reservations/reserve/
    url(r'^reserve', views.reserve, name='reserve')
]