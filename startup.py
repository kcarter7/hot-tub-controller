#!/usr/bin/env python

import cherrypy
from cherrypy.lib.static import serve_file

import datetime
from pytz import timezone
import RPi.GPIO as GPIO
import json
from adc import ADCReader
from config import Config
from status import Status
import thermistor
from controller import Controller
import threading
from threading import Timer
import subprocess


def validate_password(realm, user, password):
    with open('/home/pi/hot-tub-controller/users.json') as fd:
        users = json.loads(fd.read())
    return unicode(user) in users and users[unicode(user)] == unicode(password)


class HotTubServer(object):

    def __init__(self):
        self.adc = ADCReader()
        self.config = Config()
        self.status = Status()
        self.controller = Controller()
        self.freeze_status = 0
        self.filter_status = 0
        self.last_alert = datetime.datetime.utcfromtimestamp(0)
        self.adclock = threading.Lock()
        Timer(5.0, self.filter_timer).start()

    @cherrypy.expose
    def index(self):
        return serve_file('/home/pi/hot-tub-controller/index.html',
                          'text/html')

    def filter_timer(self):
        self.current()
        self.config.read()
        with open('/home/pi/hot-tub-controller/filter.json') as fd:
            filter_settings = json.loads(fd.read())
        now = datetime.datetime.now()
        seconds = (now.hour * 3600) + (now.minute * 60) + now.second
        # freeze control checks
        self.filter_status = 1 if (filter_settings['start'] <= seconds and
              filter_settings['end'] >= seconds) else 0
        self.freeze_status = 1 if self.status.tempAir < 37.0 else 0
        if self.freeze_status == 1 and self.status.pump1 == 0:
            self.controller.pump1_low()
        elif self.filter_status == 1 and self.status.pump1 == 0:
            self.controller.pump1_low()
        elif self.status.pump1 == 0 and (not self.filter_status == 1) and (not self.freeze_status == 1):
            self.controller.pump1_off()
        if self.status.tempIn < 37.0 and self.freeze_status == 1 and \
            (datetime.datetime.now() - self.last_alert).total_seconds() > 3600:
            print "WARNING: WATER TEMPERATURE ALERT. POSSIBLE POWER OUTAGE."
            try:
                with open('/home/pi/hot-tub-controller/alerts.json') as fd:
                    alerts = json.loads(fd.read())
                if alerts['number']:
                    out = subprocess.check_output(["curl",
                        "http://textbelt.com/text",
                        "-d",
                        "number={}".format(alerts['number']),
                        "-d",
                        "message=WARNING: hot tub freeze alarm: {:.1f}F".format(
                            self.status.tempIn)])
                print 'SMS response: {}'.format(out)
                self.last_alert = datetime.datetime.now()
            except Exception as err: print "Error sending SMS alert: {}".format(err)
        # check for automatic tub turn off 
        if self.status.pump1 != 0 and (self.status.tempOut - self.status.tempIn) < 1.0 and \
            (self.status.heater == 0 and self.status.tempIn > self.config.poolModeTemp or self.status.heater == 1 and self.status.tempIn > self.config.spaModeTemp):
            self.pump1_off()
            self.heater_off()
            self.tub_off() 
        Timer(5.0, self.filter_timer).start()

    @cherrypy.expose
    def getconfig(self):
        return json.dumps(self.config.to_jsonable(), indent=4)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def setconfig(self):
        jsontext = cherrypy.request.json
        self.config.write_config(jsontext)
 
    @cherrypy.expose
    def getstatus(self):
        status = self.status.to_jsonable()
        status['freeze_status'] = self.freeze_status
        status['filter_status'] = self.filter_status
        return json.dumps(status, indent=4) 

    def current(self):
        try:
            self.adclock.acquire(True)
            self.status.tempAir = thermistor.adc_value_to_F(self.adc.readadc(7))
            self.status.tempIn = thermistor.adc_value_to_F(self.adc.readadc(3))
            self.status.tempOut = thermistor.adc_value_to_F(self.adc.readadc(5))
	    d_Local = datetime.datetime.now(timezone('America/Los_Angeles')) 
	    self.status.currentTime = d_Local.strftime('%-I:%M:%S %p') 
            status = self.status.to_jsonable()
            status['freeze_status'] = self.freeze_status
            status['filter_status'] = self.filter_status
            return json.dumps(status, indent=4)
        finally:
            self.adclock.release()

    @cherrypy.expose
    def tub_on(self):
        self.status.tubOnOff = 1 
        self.status.heater = 1
        self.controller.heater_spa()
        self.status.pump1 = 2
        self.controller.pump1_high()
        return json.dumps(self.status.to_jsonable())
    
    @cherrypy.expose
    def tub_off(self):
        self.status.tubOnOff = 0 
        self.status.heater = -1
        self.controller.heater_off()
        self.status.pump1 = 0
        self.controller.pump1_off()
        return json.dumps(self.status.to_jsonable())

    @cherrypy.expose
    def heater_pool(self):
        self.status.heater = 0 
        self.controller.heater_pool()
        return json.dumps(self.status.to_jsonable())

    @cherrypy.expose
    def heater_spa(self):
        self.status.heater = 1
        self.controller.heater_spa()
        return json.dumps(self.status.to_jsonable())

    @cherrypy.expose
    def heater_off(self):
        self.status.heater = -1
        self.controller.heater_off()
        return json.dumps(self.status.to_jsonable())

    @cherrypy.expose
    def pump1_low(self):
        self.status.pump1 = 1
        self.controller.pump1_low()
        return json.dumps(self.status.to_jsonable())

    @cherrypy.expose
    def pump1_high(self):
        self.status.pump1 = 2
        self.controller.pump1_high()
        return json.dumps(self.status.to_jsonable())

    @cherrypy.expose
    def pump1_off(self):
        self.status.pump1 = 0
        self.controller.pump1_off()
        return json.dumps(self.status.to_jsonable())

    @cherrypy.expose
    def pump2_off(self):
        self.status.pump2 = 0
        self.controller.pump2_off()
        return json.dumps(self.status.to_jsonable())

    @cherrypy.expose
    def pump2_on(self):
        self.status.pump2 = 1
        self.controller.pump2_on()
        return json.dumps(self.status.to_jsonable())


def ascii_encode_dict(data):
    ascii_encode = lambda x: x.encode('ascii') if isinstance(x, unicode) else x
    return dict(map(ascii_encode, pair) for pair in data.items())


if __name__ == '__main__':
    try:
        GPIO.cleanup()
    except:
        pass
    GPIO.setmode(GPIO.BOARD)
    with open('/home/pi/hot-tub-controller/server.conf') as fd:
        config = json.loads(fd.read(), object_hook=ascii_encode_dict)
    config['/']['tools.auth_basic.checkpassword'] = validate_password
    cherrypy.quickstart(HotTubServer(), '/', config)
