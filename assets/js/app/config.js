angular.module('app.config', [])
  .service('APP_CONFIG', function() {
    return {
      'PROJECT_NAME': 'Midway-Islands',
      'FIREBASE':{
        'URL': 'https://midway-islands.firebaseio.com'
      },
      'DEFAULT_WORDS':"\
blizzard/大風雪\n\
autopilot/自動駕駛\n\
hand cream/護手霜\n\
bunny/兔子\n\
foam/泡沫\n\
outlier/局外人\n\
pitfall/陰謀, 陷阱\n\
ritual/儀式\n\
blinker/信號燈\n\
levers/槓桿、手段\n\
plagues/瘟疫\n\
party/派對、舞會、黨派\n\
bear/熊、空頭、承擔、忍受\n\
shriek/尖叫\n\
fictitious/虛擬的\n\
melee/亂鬥\n\
petition/請願\n\
gin/琴酒、杜松子酒\n\
Ankara/安卡拉（土耳其首都）\n\
degree/度、程度、學位、等級\n\
throne/王座\n\
novel/小說、新穎的\n\
ruler/尺, 統治者\n\
cold-blooded/冷血的\n\
snuggle/依偎\n\
cheesy/俗氣的\n\
hype/炒作\n"
    };
  });
