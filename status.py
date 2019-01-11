import datetime

class Status(object):

    def __init__(self):
       	self.tubOnOff = 0 
	self.heater = -1
        self.pump1 = 0
        self.pump2 = 0
        self.tempIn = 25
        self.tempOut = 25
        self.tempAir = 25
	self.currentTime = ""

    def to_jsonable(self):
        return {
            'tubOnOff': self.tubOnOff, 
	    'heater': self.heater,
            'pump1': self.pump1,
            'pump2': self.pump2,
            'tempIn': self.tempIn,
            'tempOut': self.tempOut,
            'tempAir': self.tempAir,
	    'currentTime': self.currentTime,
        }
