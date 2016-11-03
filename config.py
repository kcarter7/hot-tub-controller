import json


class Config(object):

    def __init__(self):
        self.two_speed_pump = False
        self.second_pump = False
        self.poolModeLabel = ""
        self.poolModeTemp = 0
        self.spaModeLabel = ""
        self.spaModeTemp = 0 
        self.read()

    def read(self):
        try:
            with open('/home/pi/hot-tub-controller/config.json') as fd:
                config = json.loads(fd.read())
            self.two_speed_pump = config['two_speed_pump']
            self.second_pump = config['second_pump']
            self.poolModeLabel = config['poolModeLabel']
            self.poolModeTemp = config['poolModeTemp']
            self.spaModeLabel = config['spaModeLabel']
            self.spaModeTemp = config['spaModeTemp']
        except Exception as err:
            print err

    def write_config(self, jsontext):
        try:
            with open('/home/pi/hot-tub-controller/config.json','w') as fo:
                json.dump(jsontext,fo,indent=4)
        except Exception as err:
            print err

    def to_jsonable(self):
        return {'two_speed_pump': self.two_speed_pump,
            'second_pump': self.second_pump,
            'poolModeLabel': self.poolModeLabel,
            'poolModeTemp': self.poolModeTemp,
            'spaModeLabel': self.spaModeLabel,
            'spaModeTemp': self.spaModeTemp}
