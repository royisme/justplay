// Cyberpunk Heist - Demo Story
// External functions (implemented in system-fns.ts)
EXTERNAL GetStat(key)
EXTERNAL AddStat(key, delta)
EXTERNAL Spend(key, amount)
EXTERNAL HasItem(id, qty)
EXTERNAL AddItem(id, qty)
EXTERNAL RemoveItem(id, qty)
EXTERNAL GetRep(faction)
EXTERNAL AddRep(faction, delta)
EXTERNAL GetFlag(id)
EXTERNAL SetFlag(id, value)
EXTERNAL Check(skill, dc)
EXTERNAL Toast(text)

VAR dummy = 0

=== start ===
#bg:alley:fade
#char:fixer:neutral:left:enter
雨夜，小巷里，一个中间人等你很久了。

* 付钱买情报（20）
  #sfx:coin
  { Spend("money", 20):
    ~ SetFlag("clue_dock_meeting", true)
    你得到一条关于"码头会面"的线索。
  - else:
    #ui:toast:钱不够
    对方冷笑一声。
  }
  -> after_deal

* 直接威胁他
  ~ AddStat("heat", 5)
  { Check("intimidate", 60):
    #fx:shake
    对方退让，但你感觉周围目光变多了。
  - else:
    #ui:toast:失败
    你失败了，对方招手叫来保安。
    -> caught
  }
  -> after_deal

=== after_deal ===
#bg:street:cut
#char:fixer:exit
你走出小巷，霓虹灯在雨水里碎成一片。
-> END

=== caught ===
#bg:security:cut
#music:tense:play
你被按倒在地，世界开始旋转。
-> END
